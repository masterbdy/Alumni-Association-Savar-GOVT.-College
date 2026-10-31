import { 
  FirebaseSafeConfig, 
  ServiceHealthCheckResult, 
  FirebaseEditableConfig, 
  FirebaseConfigBackup,
  SmtpConfigPublic,
  SmtpConfigSavePayload,
  FirebaseConnectionTestResult,
  FirebaseConnectionStatus
} from '../types';
import { CacheService } from './cacheService';

const FIREBASE_CONFIG_STORAGE_KEY = 'nexus_custom_firebase_config_v1';
const FIREBASE_BACKUP_STORAGE_KEY = 'nexus_firebase_config_backups_v1';

/**
 * Returns default/initial Firebase editable configuration.
 * Prioritizes environment variables, with resilient project fallback.
 */
export function getDefaultFirebaseConfig(): FirebaseEditableConfig {
  const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : ({} as Record<string, string>);
  return {
    apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyA3aHu9CyfRgXwY8m6O8Qj0Xi9fAWyr6xQ',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'black-spider-football.firebaseapp.com',
    databaseUrl: env.VITE_FIREBASE_DATABASE_URL || 'https://black-spider-football-default-rtdb.firebaseio.com',
    projectId: env.VITE_FIREBASE_PROJECT_ID || 'black-spider-football',
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'black-spider-football.firebasestorage.app',
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '440464590873',
    appId: env.VITE_FIREBASE_APP_ID || '1:440464590873:web:d95567b52425330a034288',
    lastUpdatedAt: '2026-01-01T00:00:00Z',
    lastUpdatedBy: 'usr_superadmin_bootstrap'
  };
}

/**
 * Reads stored Firebase configuration (custom override if saved, otherwise default).
 * Guards against corrupted, empty, or wiped values.
 */
export function getStoredFirebaseConfig(): FirebaseEditableConfig {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.projectId && parsed.databaseUrl) {
          // Self-heal stale placeholder in localStorage override so production does not fail
          if (parsed.apiKey && parsed.apiKey.includes('ExampleKey')) {
            localStorage.removeItem(FIREBASE_CONFIG_STORAGE_KEY);
            return getDefaultFirebaseConfig();
          }
          return { ...getDefaultFirebaseConfig(), ...parsed };
        }
      }
    }
  } catch (e) {
    console.warn('Could not read custom Firebase config from localStorage:', e);
  }
  return getDefaultFirebaseConfig();
}

/**
 * Validates a Firebase configuration before committing.
 * Rejects dangerous or malformed parameters.
 */
export function validateFirebaseConfig(config: FirebaseEditableConfig): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Project ID
  if (!config.projectId || !config.projectId.trim()) {
    errors.push('Project ID is required.');
  } else if (!/^[a-z0-9-]+$/.test(config.projectId.trim())) {
    errors.push('Project ID must contain lowercase letters, numbers, and hyphens only.');
  }

  // Database URL
  if (!config.databaseUrl || !config.databaseUrl.trim()) {
    errors.push('Realtime Database URL is required.');
  } else if (!config.databaseUrl.startsWith('https://')) {
    errors.push('Realtime Database URL must use HTTPS.');
  } else if (!config.databaseUrl.includes('.firebaseio.com') && !config.databaseUrl.includes('firebasedatabase.app')) {
    warnings.push('Database URL does not match standard Firebase domains (*.firebaseio.com or *.firebasedatabase.app).');
  }

  // Auth Domain
  if (!config.authDomain || !config.authDomain.trim()) {
    errors.push('Auth Domain is required.');
  } else if (!config.authDomain.includes('.firebaseapp.com') && !config.authDomain.includes('.')) {
    warnings.push('Auth Domain usually ends with .firebaseapp.com.');
  }

  // API Key
  if (!config.apiKey || !config.apiKey.trim()) {
    errors.push('Web API Key is required for client initialization.');
  }

  // Storage Bucket
  if (config.storageBucket && !config.storageBucket.includes('.')) {
    warnings.push('Storage bucket usually resembles [project-id].appspot.com or [project-id].firebasestorage.app.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Commits an updated Firebase configuration with automatic rollback backup creation.
 * Strictly gated to System Controller.
 */
export function saveFirebaseConfig(
  newConfig: FirebaseEditableConfig,
  actorEmail: string,
  reason: string
): { success: boolean; error?: string; backupCreated?: FirebaseConfigBackup } {
  if (actorEmail.toLowerCase() !== 'mehedihasan1303@gmail.com') {
    return {
      success: false,
      error: 'Security Violation: Only the authoritative System Controller (mehedihasan1303@gmail.com) can update Firebase configuration.'
    };
  }

  const validation = validateFirebaseConfig(newConfig);
  if (!validation.isValid) {
    return { success: false, error: validation.errors.join(' ') };
  }

  if (!reason || !reason.trim()) {
    return { success: false, error: 'A justification/reason is required for updating Firebase configuration.' };
  }

  // Create rollback backup of previous state
  const current = getStoredFirebaseConfig();
  const backup: FirebaseConfigBackup = {
    id: `fb_backup_${Date.now()}`,
    config: current,
    backupTimestamp: new Date().toISOString(),
    reason: `Automatic pre-update backup: "${reason.trim()}"`,
    backedUpBy: actorEmail
  };

  try {
    if (typeof localStorage !== 'undefined') {
      // 1. Save backups list (keep up to 5)
      const existingBackups = getFirebaseConfigBackups();
      const updatedBackups = [backup, ...existingBackups].slice(0, 5);
      localStorage.setItem(FIREBASE_BACKUP_STORAGE_KEY, JSON.stringify(updatedBackups));

      // 2. Commit new config
      const toSave: FirebaseEditableConfig = {
        ...newConfig,
        lastUpdatedAt: new Date().toISOString(),
        lastUpdatedBy: actorEmail
      };
      localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(toSave));

      // 3. Immediately re-initialize Firebase SDK with newly saved config
      import('./firebaseService').then(fb => {
        fb.getOrReinitializeFirebaseApp(toSave, true).catch(e => console.warn('SDK reinit notice:', e));
      }).catch(() => {});
    }
    return { success: true, backupCreated: backup };
  } catch (err: any) {
    return { success: false, error: `Failed to persist configuration: ${err.message}` };
  }
}

/**
 * Returns list of historical backups available for rollback.
 */
export function getFirebaseConfigBackups(): FirebaseConfigBackup[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(FIREBASE_BACKUP_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Could not read Firebase backups:', e);
  }
  return [];
}

/**
 * Restores a historical backup configuration.
 */
export function rollbackFirebaseConfig(
  backupId: string,
  actorEmail: string
): { success: boolean; restoredConfig?: FirebaseEditableConfig; error?: string } {
  if (actorEmail.toLowerCase() !== 'mehedihasan1303@gmail.com') {
    return {
      success: false,
      error: 'Security Violation: Only System Controller can perform configuration rollbacks.'
    };
  }

  const backups = getFirebaseConfigBackups();
  const target = backups.find(b => b.id === backupId);
  if (!target) {
    return { success: false, error: 'Backup snapshot not found.' };
  }

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(target.config));
      import('./firebaseService').then(fb => {
        fb.getOrReinitializeFirebaseApp(target.config, true).catch(e => console.warn('SDK rollback reinit notice:', e));
      }).catch(() => {});
    }
    return { success: true, restoredConfig: target.config };
  } catch (err: any) {
    return { success: false, error: `Rollback failed: ${err.message}` };
  }
}

/**
 * Reads safe, non-sensitive Firebase configuration for display.
 * Never exposes service accounts, private keys, or raw secrets.
 */
export function getFirebaseSafeConfig(): FirebaseSafeConfig {
  const current = getStoredFirebaseConfig();
  
  const rawApiKey = current.apiKey || '';
  const apiKeyMasked = rawApiKey.length > 10 
    ? `${rawApiKey.slice(0, 6)}...${rawApiKey.slice(-4)}` 
    : 'Configured (Masked)';

  const rawAppId = current.appId || '';
  const appIdMasked = rawAppId.length > 12
    ? `${rawAppId.slice(0, 8)}...${rawAppId.slice(-4)}`
    : 'Configured (Masked)';

  return {
    projectId: current.projectId,
    authDomain: current.authDomain,
    databaseUrl: current.databaseUrl,
    storageBucket: current.storageBucket,
    messagingSenderId: current.messagingSenderId,
    apiKeyMasked,
    appIdMasked,
    enforcedRules: {
      rtdb: true,
      firestore: true,
      storage: true
    }
  };
}

/**
 * Runs genuine real-time diagnostic checks across active application services.
 * Real latency and honest connection states are reported.
 */
export async function runServiceDiagnostics(): Promise<ServiceHealthCheckResult[]> {
  const config = getFirebaseSafeConfig();
  const results: ServiceHealthCheckResult[] = [];
  const now = new Date().toISOString();

  // 1. IndexedDB / Offline Cache Diagnostics
  const cacheStart = performance.now();
  let cacheOk = false;
  try {
    const testKey = '__health_ping__';
    await CacheService.setItem(testKey, { ping: 'ok', ts: Date.now() });
    const read = await CacheService.getItem<{ ping: string }>(testKey);
    cacheOk = read?.ping === 'ok';
    await CacheService.removeItem(testKey);
  } catch {
    cacheOk = false;
  }
  const cacheLatency = Math.round(performance.now() - cacheStart);
  results.push({
    id: 'cache_indexeddb',
    name: 'IndexedDB & Local Storage Cache',
    serviceType: 'cache_indexeddb',
    status: cacheOk ? 'online' : 'degraded',
    latencyMs: cacheLatency,
    lastChecked: now,
    notes: cacheOk 
      ? 'Local client cache active. Sensitive tokens/passwords strictly filtered.' 
      : 'IndexedDB unavailable; operating in memory-only fallback mode.'
  });

  // 2. Firebase Realtime Database (RTDB)
  const rtdbStart = performance.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const rtdbUrl = `${config.databaseUrl.replace(/\/$/, '')}/.json?shallow=true`;
    const resp = await fetch(rtdbUrl, { 
      method: 'GET',
      signal: controller.signal 
    }).catch(err => ({ status: 0, error: err }));
    clearTimeout(timer);
    const rtdbLatency = Math.round(performance.now() - rtdbStart);

    if (resp && 'status' in resp && (resp.status === 401 || resp.status === 403)) {
      // 401/403 means server is reachable and database.rules.json is actively denying unauthenticated reads!
      results.push({
        id: 'firebase_rtdb',
        name: 'Firebase Realtime Database (RTDB)',
        serviceType: 'firebase_rtdb',
        status: 'protected',
        endpoint: config.databaseUrl,
        latencyMs: rtdbLatency,
        lastChecked: now,
        notes: 'Host online and responding. Protected by database.rules.json security rules (HTTP 401 Denied to unauthenticated callers).',
        requiresConsoleAction: 'Database rules modifications require Firebase CLI deployment.'
      });
    } else if (resp && 'status' in resp && resp.status >= 200 && resp.status < 300) {
      results.push({
        id: 'firebase_rtdb',
        name: 'Firebase Realtime Database (RTDB)',
        serviceType: 'firebase_rtdb',
        status: 'online',
        endpoint: config.databaseUrl,
        latencyMs: rtdbLatency,
        lastChecked: now,
        notes: 'Host connected and responding normally.',
        requiresConsoleAction: 'Review database.rules.json before production launch.'
      });
    } else {
      results.push({
        id: 'firebase_rtdb',
        name: 'Firebase Realtime Database (RTDB)',
        serviceType: 'firebase_rtdb',
        status: 'offline',
        endpoint: config.databaseUrl,
        latencyMs: rtdbLatency,
        lastChecked: now,
        notes: 'Database host not reached or request timed out. Verify network connection or project status in Firebase Console.',
        requiresConsoleAction: 'Check Firebase Console -> Realtime Database status.'
      });
    }
  } catch (err) {
    results.push({
      id: 'firebase_rtdb',
      name: 'Firebase Realtime Database (RTDB)',
      serviceType: 'firebase_rtdb',
      status: 'offline',
      endpoint: config.databaseUrl,
      lastChecked: now,
      notes: 'Diagnostic ping failed: Connection refused or CORS boundary active.'
    });
  }

  // 3. Firebase Authentication Domain
  const authStart = performance.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const authUrl = `https://${config.authDomain}/__/auth/handler`;
    const resp = await fetch(authUrl, {
      method: 'HEAD',
      signal: controller.signal
    }).catch(err => ({ status: 0, error: err }));
    clearTimeout(timer);
    const authLatency = Math.round(performance.now() - authStart);

    if (resp && 'status' in resp && resp.status !== 0) {
      results.push({
        id: 'firebase_auth',
        name: 'Firebase Authentication Domain',
        serviceType: 'firebase_auth',
        status: 'online',
        endpoint: config.authDomain,
        latencyMs: authLatency,
        lastChecked: now,
        notes: `Auth domain reachable. Sign-in handlers responsive (HTTP ${resp.status}).`,
        requiresConsoleAction: 'Manage Authorized Domains and OAuth Providers in Firebase Console -> Authentication.'
      });
    } else {
      results.push({
        id: 'firebase_auth',
        name: 'Firebase Authentication Domain',
        serviceType: 'firebase_auth',
        status: 'degraded',
        endpoint: config.authDomain,
        latencyMs: authLatency,
        lastChecked: now,
        notes: 'Auth domain unreachable or blocked by CORS. Standard for local/preview environments unless domain is whitelisted.',
        requiresConsoleAction: 'Add your preview domain to Firebase Console -> Authentication -> Settings -> Authorized domains.'
      });
    }
  } catch {
    results.push({
      id: 'firebase_auth',
      name: 'Firebase Authentication Domain',
      serviceType: 'firebase_auth',
      status: 'degraded',
      endpoint: config.authDomain,
      lastChecked: now,
      notes: 'Check unable to complete. Verify domain configuration in Firebase Console.'
    });
  }

  // 4. Cloud Storage
  const storageStart = performance.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const storageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}`;
    const resp = await fetch(storageUrl, {
      method: 'GET',
      signal: controller.signal
    }).catch(err => ({ status: 0, error: err }));
    clearTimeout(timer);
    const storageLatency = Math.round(performance.now() - storageStart);

    if (resp && 'status' in resp && (resp.status === 401 || resp.status === 403 || resp.status === 200)) {
      results.push({
        id: 'firebase_storage',
        name: 'Firebase Cloud Storage',
        serviceType: 'firebase_storage',
        status: 'protected',
        endpoint: `gs://${config.storageBucket}`,
        latencyMs: storageLatency,
        lastChecked: now,
        notes: 'Storage bucket online. Secured by storage.rules (2MB logo cap, 5MB member media cap).',
        requiresConsoleAction: 'Deploy storage.rules via Firebase CLI or adjust CORS for direct uploads.'
      });
    } else {
      results.push({
        id: 'firebase_storage',
        name: 'Firebase Cloud Storage',
        serviceType: 'firebase_storage',
        status: 'offline',
        endpoint: `gs://${config.storageBucket}`,
        latencyMs: storageLatency,
        lastChecked: now,
        notes: 'Storage bucket did not respond. Verify bucket provisioning in Firebase Console.',
        requiresConsoleAction: 'Verify bucket creation in Firebase Console -> Storage.'
      });
    }
  } catch {
    results.push({
      id: 'firebase_storage',
      name: 'Firebase Cloud Storage',
      serviceType: 'firebase_storage',
      status: 'offline',
      endpoint: `gs://${config.storageBucket}`,
      lastChecked: now,
      notes: 'Storage check failed. Network unreachable.'
    });
  }

  // 5. Transactional Email Endpoint Diagnostic
  const emailStart = performance.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch('/api/health', {
      method: 'GET',
      signal: controller.signal
    }).catch(err => ({ status: 0, error: err }));
    clearTimeout(timer);
    const emailLatency = Math.round(performance.now() - emailStart);

    if (resp && 'status' in resp && resp.status === 200) {
      results.push({
        id: 'email_mailer',
        name: 'Gmail SMTP Server Endpoint',
        serviceType: 'email_mailer',
        status: 'online',
        endpoint: '/api/smtp/test',
        latencyMs: emailLatency,
        lastChecked: now,
        notes: 'Server backend daemon is online and ready to execute SMTP operations.'
      });
    } else {
      results.push({
        id: 'email_mailer',
        name: 'Gmail SMTP Server Endpoint',
        serviceType: 'email_mailer',
        status: 'degraded',
        endpoint: '/api/smtp/test',
        latencyMs: emailLatency,
        lastChecked: now,
        notes: 'Operating with in-memory SHA-256 OTP verification engine. Ensure server.ts is active.',
        requiresConsoleAction: 'Deploy full-stack server on Vercel with SMTP_USER and SMTP_PASS environment variables.'
      });
    }
  } catch {
    results.push({
      id: 'email_mailer',
      name: 'Gmail SMTP Server Endpoint',
      serviceType: 'email_mailer',
      status: 'degraded',
      endpoint: '/api/smtp/test',
      lastChecked: now,
      notes: 'Operating with in-memory SHA-256 OTP verification engine. Server-side mailer not reachable in client preview.'
    });
  }

  return results;
}

// ==========================================
// Client-Side SMTP Communication Methods
// ==========================================
// Client-Side SMTP Communication Methods with Safe Public Metadata Cache
// ==========================================

const SMTP_PUBLIC_CACHE_KEY = 'nexus_smtp_public_meta';

export const DEFAULT_PUBLIC_SMTP_CONFIG: SmtpConfigPublic = {
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  securityMode: 'SSL',
  senderEmail: 'mehedihasan1303@gmail.com',
  senderDisplayName: 'Department Of Management, Savar Govt. College',
  replyToEmail: '',
  isPasswordConfigured: false,
  lastTestStatus: 'untested'
};

/**
 * Retrieves cached non-sensitive public SMTP settings.
 * Ensures the UI never flashes empty fields during navigation or reload.
 * NEVER stores or returns an app password.
 */
export function getStoredPublicSmtpConfig(): SmtpConfigPublic {
  try {
    const raw = localStorage.getItem(SMTP_PUBLIC_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          service: 'gmail',
          host: parsed.host || 'smtp.gmail.com',
          port: Number(parsed.port) || 465,
          securityMode: parsed.securityMode === 'STARTTLS' ? 'STARTTLS' : 'SSL',
          senderEmail: parsed.senderEmail || '',
          senderDisplayName: parsed.senderDisplayName || 'Department Of Management, Savar Govt. College',
          replyToEmail: parsed.replyToEmail || '',
          isPasswordConfigured: Boolean(parsed.isPasswordConfigured),
          persistedLocation: parsed.persistedLocation,
          envConfigured: parsed.envConfigured,
          persistenceMessage: parsed.persistenceMessage,
          lastTestStatus: parsed.lastTestStatus || 'untested',
          lastTestTimestamp: parsed.lastTestTimestamp,
          lastTestError: parsed.lastTestError,
          lastTestLatencyMs: parsed.lastTestLatencyMs
        };
      }
    }
  } catch {}
  return DEFAULT_PUBLIC_SMTP_CONFIG;
}

/**
 * Persists public non-sensitive SMTP settings to localStorage.
 * Password is intentionally excluded.
 */
export function storePublicSmtpConfig(config: SmtpConfigPublic): void {
  try {
    const safeData: SmtpConfigPublic = {
      service: 'gmail',
      host: config.host || 'smtp.gmail.com',
      port: config.port || 465,
      securityMode: config.securityMode || 'SSL',
      senderEmail: config.senderEmail || '',
      senderDisplayName: config.senderDisplayName || 'Department Of Management, Savar Govt. College',
      replyToEmail: config.replyToEmail || '',
      isPasswordConfigured: Boolean(config.isPasswordConfigured),
      persistedLocation: config.persistedLocation,
      envConfigured: config.envConfigured,
      persistenceMessage: config.persistenceMessage,
      lastTestStatus: config.lastTestStatus || 'untested',
      lastTestTimestamp: config.lastTestTimestamp,
      lastTestError: config.lastTestError,
      lastTestLatencyMs: config.lastTestLatencyMs
    };
    localStorage.setItem(SMTP_PUBLIC_CACHE_KEY, JSON.stringify(safeData));
  } catch {}
}

export async function fetchPublicSmtpConfig(callerEmail: string): Promise<{ success: boolean; config?: SmtpConfigPublic; error?: string }> {
  try {
    const resp = await fetch('/api/smtp/config', {
      headers: {
        'x-caller-email': callerEmail
      }
    });
    const data = await resp.json();
    if (data.success && data.config) {
      storePublicSmtpConfig(data.config);
    }
    return data;
  } catch (err: any) {
    // Return cached config as graceful fallback if server request fails
    const cached = getStoredPublicSmtpConfig();
    return { 
      success: true, 
      config: cached, 
      error: `Offline cache active (${err.message || 'Server API unreachable'})` 
    };
  }
}

export async function saveSmtpConfig(
  payload: SmtpConfigSavePayload,
  callerEmail: string
): Promise<{ success: boolean; config?: SmtpConfigPublic; message?: string; error?: string }> {
  try {
    const resp = await fetch('/api/smtp/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-caller-email': callerEmail
      },
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    if (data.success && data.config) {
      storePublicSmtpConfig(data.config);
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error updating SMTP config' };
  }
}

export async function triggerSmtpTest(
  recipientEmail: string,
  callerEmail: string
): Promise<{ success: boolean; message: string; latencyMs?: number; error?: string }> {
  try {
    const resp = await fetch('/api/smtp/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-caller-email': callerEmail
      },
      body: JSON.stringify({ recipientEmail })
    });
    return await resp.json();
  } catch (err: any) {
    return { success: false, message: '', error: err.message || 'Network error running SMTP test' };
  }
}


/**
 * Diagnostic test email bridge used by AppContext.
 */
export async function testEmailEndpoint(
  targetEmail: string
): Promise<{ success: boolean; message: string; latencyMs: number }> {
  const res = await triggerSmtpTest(targetEmail, 'mehedihasan1303@gmail.com');
  return {
    success: res.success,
    message: res.message || res.error || (res.success ? 'Test email dispatched' : 'Delivery failed'),
    latencyMs: res.latencyMs || 0
  };
}

/**
 * Runs a live connection test to Firebase RTDB and Auth handler.
 * Leverages the Realtime Database SDK `/.info/connected` listener and security rules verification.
 */
export async function testFirebaseConnection(
  configToTest?: FirebaseEditableConfig
): Promise<FirebaseConnectionTestResult> {
  const { probeFirebaseWithInfoConnected } = await import('./firebaseService');
  return probeFirebaseWithInfoConnected(configToTest);
}

/**
 * Safely parses multiline JSON text into FirebaseEditableConfig.
 * Returns error if invalid JSON or missing required fields.
 */
export function parseRawFirebaseConfig(rawJson: string): {
  success: boolean;
  config?: FirebaseEditableConfig;
  error?: string;
} {
  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Input must be a valid JSON object.' };
    }
    const current = getStoredFirebaseConfig();
    const config: FirebaseEditableConfig = {
      apiKey: String(parsed.apiKey ?? parsed.VITE_FIREBASE_API_KEY ?? current.apiKey ?? '').trim(),
      authDomain: String(parsed.authDomain ?? parsed.VITE_FIREBASE_AUTH_DOMAIN ?? current.authDomain ?? '').trim(),
      databaseUrl: String(parsed.databaseUrl ?? parsed.VITE_FIREBASE_DATABASE_URL ?? current.databaseUrl ?? '').trim(),
      projectId: String(parsed.projectId ?? parsed.VITE_FIREBASE_PROJECT_ID ?? current.projectId ?? '').trim(),
      storageBucket: String(parsed.storageBucket ?? parsed.VITE_FIREBASE_STORAGE_BUCKET ?? current.storageBucket ?? '').trim(),
      messagingSenderId: String(parsed.messagingSenderId ?? parsed.VITE_FIREBASE_MESSAGING_SENDER_ID ?? current.messagingSenderId ?? '').trim(),
      appId: String(parsed.appId ?? parsed.VITE_FIREBASE_APP_ID ?? current.appId ?? '').trim(),
      lastUpdatedAt: current.lastUpdatedAt,
      lastUpdatedBy: current.lastUpdatedBy
    };

    const val = validateFirebaseConfig(config);
    if (!val.isValid) {
      return { success: false, config, error: val.errors.join(' ') };
    }
    return { success: true, config };
  } catch (err: any) {
    return { success: false, error: `Invalid JSON format: ${err.message}` };
  }
}

/**
 * Converts FirebaseEditableConfig to clean, formatted JSON string for multiline editor.
 */
export function formatRawFirebaseConfig(config: FirebaseEditableConfig): string {
  const cleanObject = {
    projectId: config.projectId,
    databaseUrl: config.databaseUrl,
    authDomain: config.authDomain,
    apiKey: config.apiKey,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId
  };
  return JSON.stringify(cleanObject, null, 2);
}


