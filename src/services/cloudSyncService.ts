import { ref, set, get, onValue, off, Database } from 'firebase/database';
import { getFirebaseDatabaseInstance } from './firebaseService';
import { CloudSyncState, CloudSyncStatus } from '../types';

const SYNC_QUEUE_KEY = 'nexus_sync_pending_queue_v1';
const LAST_SYNC_KEY = 'nexus_last_cloud_sync_timestamp';

export interface PendingSyncItem {
  id: string;
  path: string;
  data: any;
  action: 'set' | 'update' | 'remove';
  queuedAt: string;
}

/**
 * Retrieves the local offline sync queue.
 */
export function getPendingSyncQueue(): PendingSyncItem[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(SYNC_QUEUE_KEY);
      if (stored) return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Could not read pending sync queue:', e);
  }
  return [];
}

/**
 * Saves the local offline sync queue.
 */
export function savePendingSyncQueue(queue: PendingSyncItem[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    }
  } catch (e) {
    console.warn('Could not persist pending sync queue:', e);
  }
}

/**
 * Enqueues a write operation to be synchronized to Firebase RTDB.
 */
export function enqueueCloudSync(path: string, data: any, action: 'set' | 'update' | 'remove' = 'set'): void {
  const queue = getPendingSyncQueue();
  const item: PendingSyncItem = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    path,
    data,
    action,
    queuedAt: new Date().toISOString()
  };
  // Replace if same path is already queued, otherwise append
  const filtered = queue.filter(q => q.path !== path);
  filtered.push(item);
  savePendingSyncQueue(filtered);
}

/**
 * Runs an authentic write-and-read test on Firebase Realtime Database.
 * Accurately confirms whether cloud storage is accessible and whether rules permit operations.
 */
export async function testDatabaseWriteRead(
  userSession?: { uid: string; email: string }
): Promise<{
  success: boolean;
  status: CloudSyncStatus;
  latencyMs: number;
  message: string;
  error?: string;
  errorCode?: string;
  endpoint?: string;
}> {
  const startTime = performance.now();
  const { db, safeLogs, error: initError } = await getFirebaseDatabaseInstance();

  if (!db) {
    return {
      success: false,
      status: 'sync_failed',
      latencyMs: Math.round(performance.now() - startTime),
      message: 'Database initialization failed.',
      error: initError || 'Firebase Realtime Database instance unavailable'
    };
  }

  const endpoint = db.app.options.databaseURL || 'Unknown';

  // Fast check for HTTP 423 Deactivated status
  try {
    const resp = await fetch(`${endpoint.replace(/\/$/, '')}/.json?shallow=true`, { method: 'GET' });
    if (resp.status === 423) {
      const data: any = await resp.json().catch(() => null);
      const errMsg = data?.error || 'Database has been deactivated.';
      return {
        success: false,
        status: 'sync_failed',
        latencyMs: Math.round(performance.now() - startTime),
        message: `Database Deactivated in Firebase Console: ${errMsg}`,
        error: errMsg,
        errorCode: 'DATABASE_DEACTIVATED',
        endpoint
      };
    }
  } catch {}

  const testId = `probe_${Date.now()}`;
  // Use authorized user path if session active; unauthenticated fallback to root
  const testPath = userSession?.uid 
    ? `users/${userSession.uid}/__sync_probe__/${testId}`
    : `__sync_probes__/${testId}`;

  try {
    const probeRef = ref(db, testPath);
    const testPayload = {
      ping: 'ok',
      timestamp: new Date().toISOString(),
      clientPlatform: 'Alumni Association Web',
      tester: userSession?.email || 'Anonymous'
    };

    // 1. Write Probe
    await set(probeRef, testPayload);

    // 2. Read Probe
    const snapshot = await get(probeRef);
    const latencyMs = Math.round(performance.now() - startTime);

    if (snapshot.exists() && snapshot.val()?.ping === 'ok') {
      // Clean up probe record immediately
      try {
        await set(probeRef, null);
      } catch {}

      return {
        success: true,
        status: 'synced',
        latencyMs,
        message: `Cloud write and readback verified successfully (${latencyMs}ms). Probe cleaned up.`,
        endpoint
      };
    } else {
      return {
        success: false,
        status: 'sync_failed',
        latencyMs,
        message: 'Write succeeded but readback verification returned empty data.',
        endpoint
      };
    }
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    const errCode = err?.code || 'UNKNOWN';
    const errMsg = err?.message || String(err);

    if (errCode === 'PERMISSION_DENIED' || errMsg.includes('Permission denied')) {
      return {
        success: false,
        status: 'sync_failed',
        latencyMs,
        message: 'Database Security Rules Active: Write to RTDB rejected by database.rules.json (Permission Denied). Local changes are safely queued.',
        error: errMsg,
        errorCode: 'PERMISSION_DENIED',
        endpoint
      };
    }

    if (errMsg.toLowerCase().includes('network') || errMsg.toLowerCase().includes('timeout')) {
      return {
        success: false,
        status: 'offline',
        latencyMs,
        message: 'Network offline or Firebase server unreachable. Local cache active.',
        error: errMsg,
        errorCode: 'NETWORK_ERROR',
        endpoint
      };
    }

    return {
      success: false,
      status: 'sync_failed',
      latencyMs,
      message: `Sync probe failed: ${errMsg}`,
      error: errMsg,
      errorCode: errCode,
      endpoint
    };
  }
}

/**
 * Attempts to flush the offline queue to Firebase RTDB.
 */
export async function flushPendingSyncQueue(): Promise<{
  flushedCount: number;
  remainingCount: number;
  lastError?: string;
}> {
  const queue = getPendingSyncQueue();
  if (queue.length === 0) {
    return { flushedCount: 0, remainingCount: 0 };
  }

  const { db } = await getFirebaseDatabaseInstance();
  if (!db) {
    return { flushedCount: 0, remainingCount: queue.length, lastError: 'Database unavailable' };
  }

  const successfulIds: string[] = [];
  let lastError: string | undefined;

  for (const item of queue) {
    try {
      const targetRef = ref(db, item.path);
      if (item.action === 'remove') {
        await set(targetRef, null);
      } else {
        await set(targetRef, item.data);
      }
      successfulIds.push(item.id);
    } catch (e: any) {
      lastError = e?.message || String(e);
      break; // Stop on first error to preserve order
    }
  }

  const remaining = queue.filter(q => !successfulIds.includes(q.id));
  savePendingSyncQueue(remaining);

  if (successfulIds.length > 0 && typeof localStorage !== 'undefined') {
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
  }

  return {
    flushedCount: successfulIds.length,
    remainingCount: remaining.length,
    lastError
  };
}

/**
 * Prepares a migration preview of local records vs cloud database.
 * Does not overwrite or clear local storage.
 */
export function prepareLocalDataMigrationPreview(localState: {
  users?: any[];
  posts?: any[];
  campaigns?: any[];
  donations?: any[];
  activityLogs?: any[];
}): {
  totalLocalRecords: number;
  moduleBreakdown: Record<string, number>;
  hasPendingChanges: boolean;
  safeForMigration: boolean;
} {
  const breakdown: Record<string, number> = {
    users: Array.isArray(localState.users) ? localState.users.length : 0,
    posts: Array.isArray(localState.posts) ? localState.posts.length : 0,
    campaigns: Array.isArray(localState.campaigns) ? localState.campaigns.length : 0,
    donations: Array.isArray(localState.donations) ? localState.donations.length : 0,
    activityLogs: Array.isArray(localState.activityLogs) ? localState.activityLogs.length : 0
  };

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const queue = getPendingSyncQueue();

  return {
    totalLocalRecords: total,
    moduleBreakdown: breakdown,
    hasPendingChanges: queue.length > 0,
    safeForMigration: total > 0
  };
}
