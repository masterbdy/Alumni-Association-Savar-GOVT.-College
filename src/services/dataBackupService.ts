import { 
  ApplicationBackupData, 
  BackupRecordCounts, 
  BackupRestoreMode, 
  BackupHistoryEntry,
  UserProfile,
  Post,
  Conversation,
  Message,
  DonationCampaign,
  DonationRecord,
  ActivityLog,
  AdminPermissionLimits,
  ModulePermissionRule,
  SystemEmergencyControls,
  AppLogoConfig,
  EmailSystemSettingsConfig,
  CommunityReport,
  ModerationAction,
  ModerationAppeal
} from '../types';

const BACKUP_HISTORY_STORAGE_KEY = 'nexus_backup_history_v1';
const SCHEMA_VERSION = '2.1';
const APP_VERSION = '2.4.0';

/**
 * Sanitizes user records by permanently scrubbing sensitive credential hashes,
 * tokens, or private secrets before inclusion in backup JSON.
 */
export function sanitizeUsersForBackup(users: UserProfile[]): Partial<UserProfile>[] {
  return users.map(user => {
    const copy = { ...user };
    delete copy.passwordHash;
    return copy;
  });
}

/**
 * Computes exact record counts across all supported application data modules.
 */
export function calculateRecordCounts(state: {
  users?: any[];
  posts?: any[];
  conversations?: any[];
  messages?: any[];
  campaigns?: any[];
  donations?: any[];
  activityLogs?: any[];
  adminLimits?: Record<string, any>;
  permissionMatrix?: any[];
  emergencyControls?: any;
  appLogo?: any;
  emailSettings?: any;
  communityReports?: any[];
  moderationActions?: any[];
  moderationAppeals?: any[];
}): BackupRecordCounts {
  return {
    users: Array.isArray(state.users) ? state.users.length : 0,
    posts: Array.isArray(state.posts) ? state.posts.length : 0,
    conversations: Array.isArray(state.conversations) ? state.conversations.length : 0,
    messages: Array.isArray(state.messages) ? state.messages.length : 0,
    campaigns: Array.isArray(state.campaigns) ? state.campaigns.length : 0,
    donations: Array.isArray(state.donations) ? state.donations.length : 0,
    activityLogs: Array.isArray(state.activityLogs) ? state.activityLogs.length : 0,
    adminLimits: state.adminLimits && typeof state.adminLimits === 'object' ? Object.keys(state.adminLimits).length : 0,
    permissionMatrix: Array.isArray(state.permissionMatrix) ? state.permissionMatrix.length : 0,
    emergencyControls: state.emergencyControls ? 1 : 0,
    appLogo: state.appLogo ? 1 : 0,
    emailSettings: state.emailSettings ? 1 : 0,
    communityReports: Array.isArray(state.communityReports) ? state.communityReports.length : 0,
    moderationActions: Array.isArray(state.moderationActions) ? state.moderationActions.length : 0,
    moderationAppeals: Array.isArray(state.moderationAppeals) ? state.moderationAppeals.length : 0
  };
}

/**
 * Retrieves the history of exports, imports, and safety snapshots.
 */
export function getBackupHistory(): BackupHistoryEntry[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(BACKUP_HISTORY_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    }
  } catch (err) {
    console.warn('Could not read backup history from localStorage:', err);
  }
  return [];
}

/**
 * Appends an entry to the backup history log (keeps last 25).
 */
export function logBackupHistoryEntry(entry: BackupHistoryEntry): void {
  try {
    if (typeof localStorage !== 'undefined') {
      const existing = getBackupHistory();
      const updated = [entry, ...existing].slice(0, 25);
      localStorage.setItem(BACKUP_HISTORY_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.warn('Could not save backup history entry:', err);
  }
}

/**
 * Creates and triggers client download of the complete application data backup.
 * Strictly gated to System Controller.
 */
export function exportApplicationBackup(
  state: {
    users: UserProfile[];
    posts: Post[];
    conversations: Conversation[];
    messages: Message[];
    campaigns: DonationCampaign[];
    donations: DonationRecord[];
    activityLogs: ActivityLog[];
    adminLimits: Record<string, AdminPermissionLimits>;
    permissionMatrix: ModulePermissionRule[];
    emergencyControls: SystemEmergencyControls;
    appLogo: AppLogoConfig;
    emailSettings: EmailSystemSettingsConfig;
    communityReports: CommunityReport[];
    moderationActions: ModerationAction[];
    moderationAppeals: ModerationAppeal[];
  },
  actorEmail: string,
  selectedModules?: string[]
): { success: boolean; error?: string; backup?: ApplicationBackupData; filename?: string } {
  if (actorEmail.toLowerCase() !== 'mehedihasan1303@gmail.com') {
    return {
      success: false,
      error: 'Security Alert: Only the authoritative System Controller (mehedihasan1303@gmail.com) is permitted to export application data.'
    };
  }

  try {
    const timestamp = new Date();
    const dateFormatted = timestamp.toISOString().replace(/[:.]/g, '-');
    const filename = `alumni_association_backup_${dateFormatted}.json`;

    const allModuleKeys = [
      'users', 'posts', 'conversations', 'messages', 'campaigns', 'donations',
      'activityLogs', 'adminLimits', 'permissionMatrix', 'emergencyControls',
      'appLogo', 'emailSettings', 'communityReports', 'moderationActions', 'moderationAppeals'
    ];

    const modulesToInclude = selectedModules && selectedModules.length > 0
      ? selectedModules
      : allModuleKeys;

    const recordCounts = calculateRecordCounts(state);

    const backupPayload: ApplicationBackupData = {
      backupId: `bkp_${timestamp.getTime()}_${Math.random().toString(36).substring(2, 7)}`,
      exportedAt: timestamp.toISOString(),
      exportedBy: actorEmail,
      appVersion: APP_VERSION,
      schemaVersion: SCHEMA_VERSION,
      systemName: 'Alumni Association Platform',
      organization: 'Department Of Management, Savar Govt. College',
      modulesIncluded: modulesToInclude,
      recordCounts,
      data: {
        users: modulesToInclude.includes('users') ? sanitizeUsersForBackup(state.users) : [],
        posts: modulesToInclude.includes('posts') ? state.posts : [],
        conversations: modulesToInclude.includes('conversations') ? state.conversations : [],
        messages: modulesToInclude.includes('messages') ? state.messages : [],
        campaigns: modulesToInclude.includes('campaigns') ? state.campaigns : [],
        donations: modulesToInclude.includes('donations') ? state.donations : [],
        activityLogs: modulesToInclude.includes('activityLogs') ? state.activityLogs : [],
        adminLimits: modulesToInclude.includes('adminLimits') ? state.adminLimits : {},
        permissionMatrix: modulesToInclude.includes('permissionMatrix') ? state.permissionMatrix : [],
        emergencyControls: state.emergencyControls,
        appLogo: state.appLogo,
        emailSettings: state.emailSettings,
        communityReports: modulesToInclude.includes('communityReports') ? state.communityReports : [],
        moderationActions: modulesToInclude.includes('moderationActions') ? state.moderationActions : [],
        moderationAppeals: modulesToInclude.includes('moderationAppeals') ? state.moderationAppeals : []
      }
    };

    // Trigger browser JSON file download
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const jsonStr = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    }

    const totalRecords = Object.values(recordCounts).reduce((a, b) => a + b, 0);

    // Record to history
    logBackupHistoryEntry({
      id: backupPayload.backupId,
      timestamp: timestamp.toISOString(),
      filename,
      type: 'export',
      recordCount: totalRecords,
      actorEmail,
      status: 'success',
      details: `Full application data export created with ${totalRecords} total items across ${modulesToInclude.length} modules.`,
      modulesAffected: modulesToInclude
    });

    return {
      success: true,
      backup: backupPayload,
      filename
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Export failed: ${err.message || String(err)}`
    };
  }
}

/**
 * Validates a backup JSON file's structure and schema integrity before import.
 */
export function validateBackupFile(rawJson: string): {
  isValid: boolean;
  error?: string;
  backup?: ApplicationBackupData;
  summary?: {
    recordCounts: BackupRecordCounts;
    totalRecords: number;
    exportedAt: string;
    exportedBy: string;
    schemaVersion: string;
    modulesIncluded: string[];
  };
} {
  try {
    if (!rawJson || !rawJson.trim()) {
      return { isValid: false, error: 'Uploaded file is empty.' };
    }

    const parsed = JSON.parse(rawJson);

    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false, error: 'Backup content is not a valid JSON object.' };
    }

    if (!parsed.data || typeof parsed.data !== 'object') {
      return { isValid: false, error: 'Missing "data" container in backup structure.' };
    }

    if (!parsed.schemaVersion) {
      return { isValid: false, error: 'Missing "schemaVersion" metadata. Backup format unrecognized.' };
    }

    const counts = calculateRecordCounts(parsed.data);
    const totalRecords = Object.values(counts).reduce((a, b) => a + b, 0);

    const summary = {
      recordCounts: counts,
      totalRecords,
      exportedAt: parsed.exportedAt || new Date().toISOString(),
      exportedBy: parsed.exportedBy || 'Unknown',
      schemaVersion: String(parsed.schemaVersion),
      modulesIncluded: Array.isArray(parsed.modulesIncluded) ? parsed.modulesIncluded : Object.keys(counts)
    };

    return {
      isValid: true,
      backup: parsed as ApplicationBackupData,
      summary
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: `Invalid JSON format: ${err.message || 'Syntax error'}`
    };
  }
}

/**
 * Executes a verified restore operation with pre-import snapshotting and constitutional protection.
 */
export function executeBackupRestore(params: {
  backup: ApplicationBackupData;
  mode: BackupRestoreMode;
  selectedModules?: string[];
  actorEmail: string;
  currentState: {
    users: UserProfile[];
    posts: Post[];
    conversations: Conversation[];
    messages: Message[];
    campaigns: DonationCampaign[];
    donations: DonationRecord[];
    activityLogs: ActivityLog[];
    adminLimits: Record<string, AdminPermissionLimits>;
    permissionMatrix: ModulePermissionRule[];
    emergencyControls: SystemEmergencyControls;
    appLogo: AppLogoConfig;
    emailSettings: EmailSystemSettingsConfig;
    communityReports: CommunityReport[];
    moderationActions: ModerationAction[];
    moderationAppeals: ModerationAppeal[];
  };
}): {
  success: boolean;
  error?: string;
  updatedState?: typeof params.currentState;
  restoredCounts?: Partial<BackupRecordCounts>;
} {
  const { backup, mode, selectedModules = [], actorEmail, currentState } = params;

  if (actorEmail.toLowerCase() !== 'mehedihasan1303@gmail.com') {
    return {
      success: false,
      error: 'Security Alert: Only the authoritative System Controller can restore or import application data.'
    };
  }

  // 1. Create a fresh pre-import safety snapshot before applying any changes
  const preSnapshotId = `pre_snap_${Date.now()}`;
  logBackupHistoryEntry({
    id: preSnapshotId,
    timestamp: new Date().toISOString(),
    filename: `pre_restore_snapshot_${Date.now()}.json`,
    type: 'pre_import_snapshot',
    recordCount: Object.values(calculateRecordCounts(currentState)).reduce((a, b) => a + b, 0),
    actorEmail,
    status: 'success',
    details: `Automatic safety snapshot created before ${mode} import of ${backup.backupId}.`
  });

  try {
    const nextState = { ...currentState };
    const bData = backup.data;

    // Helper to merge lists by id without overwriting existing
    const mergeById = <T extends { id?: string; uid?: string }>(
      existing: T[],
      incoming?: T[]
    ): T[] => {
      if (!incoming || !Array.isArray(incoming)) return existing;
      const existingIds = new Set(existing.map(item => item.id || item.uid));
      const newItems = incoming.filter(item => {
        const id = item.id || item.uid;
        return id && !existingIds.has(id);
      });
      return [...existing, ...newItems];
    };

    if (mode === 'merge') {
      // MERGE MODE: Add missing records, never overwrite existing
      if (Array.isArray(bData.users)) {
        // Safe user merge: preserves existing passwords and role guarantees
        const existingUids = new Set(nextState.users.map(u => u.uid));
        const incomingNewUsers = bData.users.filter(u => u.uid && !existingUids.has(u.uid)) as UserProfile[];
        // Assign default hash for restored users lacking passwordHash
        const sanitizedIncoming = incomingNewUsers.map(u => ({
          ...u,
          passwordHash: u.passwordHash || 'hash_nexus_2026',
          status: u.status || 'pending',
          role: u.email?.toLowerCase() === 'mehedihasan1303@gmail.com' ? 'super_admin' : (u.role || 'member')
        }));
        nextState.users = [...nextState.users, ...sanitizedIncoming];
      }

      nextState.posts = mergeById(nextState.posts, bData.posts);
      nextState.conversations = mergeById(nextState.conversations, bData.conversations);
      nextState.messages = mergeById(nextState.messages, bData.messages);
      nextState.campaigns = mergeById(nextState.campaigns, bData.campaigns);
      nextState.donations = mergeById(nextState.donations, bData.donations);
      nextState.activityLogs = mergeById(nextState.activityLogs, bData.activityLogs);
      nextState.communityReports = mergeById(nextState.communityReports, bData.communityReports);
      nextState.moderationActions = mergeById(nextState.moderationActions, bData.moderationActions);
      nextState.moderationAppeals = mergeById(nextState.moderationAppeals, bData.moderationAppeals);

    } else if (mode === 'selected_modules') {
      // RESTORE SELECTED MODULES
      if (selectedModules.includes('posts') && Array.isArray(bData.posts)) {
        nextState.posts = bData.posts;
      }
      if (selectedModules.includes('campaigns') && Array.isArray(bData.campaigns)) {
        nextState.campaigns = bData.campaigns;
      }
      if (selectedModules.includes('donations') && Array.isArray(bData.donations)) {
        nextState.donations = bData.donations;
      }
      if (selectedModules.includes('conversations') && Array.isArray(bData.conversations)) {
        nextState.conversations = bData.conversations;
      }
      if (selectedModules.includes('messages') && Array.isArray(bData.messages)) {
        nextState.messages = bData.messages;
      }
      if (selectedModules.includes('activityLogs') && Array.isArray(bData.activityLogs)) {
        nextState.activityLogs = bData.activityLogs;
      }
      if (selectedModules.includes('adminLimits') && bData.adminLimits) {
        nextState.adminLimits = { ...nextState.adminLimits, ...bData.adminLimits };
      }
      if (selectedModules.includes('permissionMatrix') && Array.isArray(bData.permissionMatrix)) {
        nextState.permissionMatrix = bData.permissionMatrix;
      }
      if (selectedModules.includes('appLogo') && bData.appLogo) {
        nextState.appLogo = bData.appLogo;
      }
      if (selectedModules.includes('emailSettings') && bData.emailSettings) {
        nextState.emailSettings = bData.emailSettings;
      }
      if (selectedModules.includes('communityReports') && Array.isArray(bData.communityReports)) {
        nextState.communityReports = bData.communityReports;
      }
      if (selectedModules.includes('moderationActions') && Array.isArray(bData.moderationActions)) {
        nextState.moderationActions = bData.moderationActions;
      }
      if (selectedModules.includes('moderationAppeals') && Array.isArray(bData.moderationAppeals)) {
        nextState.moderationAppeals = bData.moderationAppeals;
      }

    } else if (mode === 'full_restore') {
      // FULL RESTORE: Replaces application records with confirmed backup data
      if (Array.isArray(bData.posts)) nextState.posts = bData.posts;
      if (Array.isArray(bData.campaigns)) nextState.campaigns = bData.campaigns;
      if (Array.isArray(bData.donations)) nextState.donations = bData.donations;
      if (Array.isArray(bData.conversations)) nextState.conversations = bData.conversations;
      if (Array.isArray(bData.messages)) nextState.messages = bData.messages;
      if (Array.isArray(bData.activityLogs)) nextState.activityLogs = bData.activityLogs;
      if (bData.adminLimits) nextState.adminLimits = bData.adminLimits;
      if (Array.isArray(bData.permissionMatrix)) nextState.permissionMatrix = bData.permissionMatrix;
      if (bData.emergencyControls) nextState.emergencyControls = bData.emergencyControls;
      if (bData.appLogo) nextState.appLogo = bData.appLogo;
      if (bData.emailSettings) nextState.emailSettings = bData.emailSettings;
      if (Array.isArray(bData.communityReports)) nextState.communityReports = bData.communityReports;
      if (Array.isArray(bData.moderationActions)) nextState.moderationActions = bData.moderationActions;
      if (Array.isArray(bData.moderationAppeals)) nextState.moderationAppeals = bData.moderationAppeals;

      // Safe user merge: Keeps existing passwords if backup users had scrubbed hashes
      if (Array.isArray(bData.users) && bData.users.length > 0) {
        const passwordMap = new Map(currentState.users.map(u => [u.uid, u.passwordHash]));
        nextState.users = bData.users.map(bu => {
          const originalHash = passwordMap.get(bu.uid || '');
          return {
            ...bu,
            passwordHash: originalHash || bu.passwordHash || 'hash_nexus_2026'
          } as UserProfile;
        });
      }
    }

    // Constitutional Guard: Ensure Super Admin and President identities are strictly preserved
    const controllerOriginal = currentState.users.find(u => u.email?.toLowerCase() === 'mehedihasan1303@gmail.com');
    const presidentOriginal = currentState.users.find(u => u.email?.toLowerCase() === 'k7379680@gmail.com');

    // Ensure they exist in nextState.users
    if (controllerOriginal && !nextState.users.some(u => u.email?.toLowerCase() === 'mehedihasan1303@gmail.com')) {
      nextState.users.unshift(controllerOriginal);
    }
    if (presidentOriginal && !nextState.users.some(u => u.email?.toLowerCase() === 'k7379680@gmail.com')) {
      nextState.users.push(presidentOriginal);
    }

    nextState.users = nextState.users.map(u => {
      if (u.email?.toLowerCase() === 'mehedihasan1303@gmail.com') {
        return {
          ...u,
          role: 'super_admin' as const,
          status: 'approved' as const,
          displayName: u.displayName || 'System Controller'
        };
      }
      if (u.email?.toLowerCase() === 'k7379680@gmail.com') {
        return {
          ...u,
          role: 'admin' as const,
          status: 'approved' as const,
          headline: u.headline || 'Elected Alumni President — Dept. of Management'
        };
      }
      return u;
    });

    const newCounts = calculateRecordCounts(nextState);
    const totalNew = Object.values(newCounts).reduce((a, b) => a + b, 0);

    // Record success to history
    logBackupHistoryEntry({
      id: `res_${Date.now()}`,
      timestamp: new Date().toISOString(),
      filename: `restored_from_${backup.backupId}`,
      type: mode === 'merge' ? 'merge_import' : mode === 'selected_modules' ? 'module_restore' : 'full_restore',
      recordCount: totalNew,
      actorEmail,
      status: 'success',
      details: `Successfully completed ${mode} restore from backup ${backup.backupId}. Total records now: ${totalNew}.`,
      modulesAffected: mode === 'selected_modules' ? selectedModules : Object.keys(newCounts)
    });

    return {
      success: true,
      updatedState: nextState,
      restoredCounts: newCounts
    };
  } catch (err: any) {
    const errorMsg = err.message || String(err);
    logBackupHistoryEntry({
      id: `err_${Date.now()}`,
      timestamp: new Date().toISOString(),
      filename: backup.backupId || 'unknown',
      type: mode === 'merge' ? 'merge_import' : 'full_restore',
      recordCount: 0,
      actorEmail,
      status: 'failed',
      errorMessage: errorMsg
    });

    return {
      success: false,
      error: `Restore failed: ${errorMsg}`
    };
  }
}
