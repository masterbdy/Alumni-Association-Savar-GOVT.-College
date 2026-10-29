export type UserRole = 'super_admin' | 'admin' | 'moderator' | 'member' | 'restricted_member';

export type UserStatus = 'approved' | 'pending' | 'suspended' | 'rejected';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  username?: string;
  headline?: string;
  avatarUrl: string;
  coverPhotoUrl?: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
  approvedAt?: string | null;
  approvedBy?: string | null;
  bio?: string;
  phone?: string;
  location?: string;
  occupation?: string;
  chapter?: string;
  interests?: string[];
  website?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  githubUrl?: string;
  showEmailPublicly?: boolean;
  showPhonePublicly?: boolean;
  allowDirectMessages?: boolean;
  passwordHash?: string;
  passwordLastChanged?: string;
  twoFactorEnabled?: boolean;
  activeSessions?: number;
  isEmailVerified?: boolean;
  sessionsRevokedAt?: string;
  postingRestrictedUntil?: string;
  activeWarningsCount?: number;
  lastLoginAt?: string;
  isAccountDisabled?: boolean;
  lastModerationNotice?: {
    actionType: ModerationActionType;
    reason: string;
    timestamp: string;
    moderatorName: string;
    appealId?: string;
    appealStatus?: 'pending' | 'approved' | 'rejected';
  };
}

export type PostCategory = 'announcement' | 'general' | 'discussion' | 'event';

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: UserRole;
  content: string;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatar: string;
  content: string;
  imageUrl?: string;
  images?: string[]; // Multiple direct uploaded images
  category: PostCategory;
  isPinned: boolean;
  likes: string[]; // user UIDs
  bookmarks?: string[]; // user UIDs who bookmarked
  reports?: {
    reportedBy: string;
    reporterName: string;
    reason: string;
    reportedAt: string;
  }[];
  reactions: {
    like: number;
    celebrate: number;
    heart: number;
  };
  comments: PostComment[];
  createdAt: string;
  updatedAt?: string;
  // Canonical Donation Campaign integration
  isDonationCampaign?: boolean;
  campaignId?: string;
  campaignTitle?: string;
  campaignTarget?: number;
  campaignCollected?: number;
  campaignCategory?: CampaignCategory;
  campaignStatus?: CampaignStatus;
}

// ==========================================
// Community Moderation & Reports System
// ==========================================
export type ReportCategory = 
  | 'harassment'
  | 'obscene'
  | 'spam'
  | 'threat'
  | 'fake_account'
  | 'other';

export type ReportTargetType = 'post' | 'comment' | 'message';

export type ReportStatus = 'pending' | 'under_review' | 'action_taken' | 'dismissed';

export type ModerationActionType = 
  | 'content_removal' 
  | 'warning' 
  | 'temporary_restriction' 
  | 'account_suspension' 
  | 'dismiss';

export interface CommunityReport {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  targetContentSnippet: string;
  targetAuthorId: string;
  targetAuthorName: string;
  targetAuthorRole?: UserRole;
  reporterId: string;
  reporterName: string;
  reporterRole?: UserRole;
  category: ReportCategory;
  reason: string;
  details?: string;
  evidenceContext?: string; // Isolated evidence snapshot (avoids arbitrary browsing of members' private chats)
  status: ReportStatus;
  reportedAt: string;
  assignedModeratorId?: string;
  assignedModeratorName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  resolutionAction?: ModerationActionType;
  resolutionActionId?: string;
}

export interface ModerationAction {
  id: string;
  reportId?: string;
  targetType: ReportTargetType | 'user';
  targetId: string;
  targetUserId: string;
  targetUserName: string;
  actionType: ModerationActionType;
  reason: string;
  moderatorId: string;
  moderatorName: string;
  moderatorRole: UserRole;
  timestamp: string;
  durationHours?: number;
  expiresAt?: string;
  hasAppeal?: boolean;
  appealId?: string;
}

export interface ModerationAppeal {
  id: string;
  actionId: string;
  reportId?: string;
  appellantId: string;
  appellantName: string;
  appellantEmail: string;
  penaltyType: ModerationActionType;
  penaltyReason: string;
  appealStatement: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  imageUrl?: string;
  createdAt: string;
  status?: 'sending' | 'sent' | 'failed';
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string;
  participants: string[];
  lastMessage: string;
  lastMessageSenderId: string;
  lastMessageAt: string;
  unreadCount: number;
}

export type CampaignCategory = 'community' | 'club' | 'picnic' | 'event' | 'relief' | 'general';
export type CampaignStatus = 'active' | 'completed' | 'paused' | 'closed' | 'archived' | 'expired';

export interface DonationCampaign {
  id: string;
  title: string;
  description: string;
  category: CampaignCategory;
  organizerId: string;
  organizerName: string;
  organizerAvatar?: string;
  organizerRole?: UserRole;
  targetAmount?: number;
  collectedAmount: number; // Strictly computed from confirmed payments
  bkashNumber: string;
  nagadNumber: string;
  deadline?: string;
  startDate?: string;
  isActive: boolean;
  status: CampaignStatus;
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
  lastEditNote?: string;
  closedAt?: string;
  closedBy?: string;
  closedReason?: string;
  archivedAt?: string;
  archivedBy?: string;
  archivedReason?: string;
  reopenedAt?: string;
  reopenedBy?: string;
  reopenedReason?: string;
  imageUrl?: string;
  images?: string[];
  instructions?: string;
}

export type DonationMethod = 'bKash' | 'Nagad' | 'Rocket' | 'Bank';
export type DonationStatus = 'pending' | 'confirmed' | 'rejected' | 'disputed' | 'verified';

export interface DonationRecord {
  id: string;
  campaignId: string;
  campaignTitle: string;
  userId: string;
  donorName: string;
  donorMobile: string;
  method: DonationMethod;
  amount: number;
  transactionId: string;
  paymentDate?: string;
  notes?: string;
  paymentEvidenceUrl?: string;
  status: DonationStatus;
  submittedAt: string;
  reviewedBy?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  rejectionReason?: string | null;
  disputeReason?: string | null;
  reversedAt?: string | null;
  reversedBy?: string | null;
  reversedByName?: string | null;
  reversalReason?: string | null;
}

export interface ActivityLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: 
    | 'MEMBER_APPROVED' 
    | 'MEMBER_REJECTED' 
    | 'MEMBER_SUSPENDED' 
    | 'ROLE_UPDATED' 
    | 'DONATION_VERIFIED' 
    | 'DONATION_CONFIRMED'
    | 'DONATION_REJECTED' 
    | 'DONATION_DISPUTED'
    | 'DONATION_REVERSED'
    | 'POST_PINNED' 
    | 'POST_DELETED'
    | 'CAMPAIGN_CREATED'
    | 'CAMPAIGN_UPDATED'
    | 'CAMPAIGN_CLOSED'
    | 'CAMPAIGN_REOPENED'
    | 'CAMPAIGN_ARCHIVED'
    | 'CAMPAIGN_DELETED'
    | 'PROFILE_UPDATED'
    | 'PASSWORD_CHANGED'
    | 'ADMIN_ACCESS_INITIATED'
    | 'ADMIN_ACCESS_TERMINATED'
    | 'EMERGENCY_RESTRICTION_UPDATED'
    | 'PERMISSION_LIMITS_UPDATED'
    | 'ADMIN_LIMITS_UPDATED'
    | 'SYSTEM_BOOTSTRAP_EXECUTED'
    | 'LOGO_UPDATED'
    | 'LOGO_REMOVED'
    | 'OTP_DISPATCHED'
    | 'OTP_VERIFIED'
    | 'PASSWORD_RESET_OTP'
    | 'EMAIL_SETTINGS_UPDATED'
    | 'FIREBASE_CONFIG_UPDATED'
    | 'SMTP_CONFIG_UPDATED'
    | 'SMTP_TEST_EXECUTED'
    | 'REPORT_FILED'
    | 'REPORT_STATUS_UPDATED'
    | 'REPORT_DISMISSED'
    | 'CONTENT_REMOVED'
    | 'MODERATION_WARNING_ISSUED'
    | 'POSTING_RESTRICTED'
    | 'ACCOUNT_SUSPENDED'
    | 'ACCOUNT_RESTORED'
    | 'SESSIONS_REVOKED'
    | 'APPEAL_SUBMITTED'
    | 'APPEAL_APPROVED'
    | 'APPEAL_REJECTED';
  targetType: 'user' | 'donation' | 'post' | 'campaign' | 'system' | 'settings' | 'report' | 'appeal' | 'comment' | 'message';

  targetId: string;
  details: string;
  timestamp: string;
  outcome?: 'success' | 'failure' | 'denied';

  reason?: string;
}

export interface AdminAccessSession {
  sessionId: string;
  adminUid: string;
  adminEmail: string;
  adminName: string;
  targetUid: string;
  targetEmail: string;
  targetName: string;
  targetRole: UserRole;
  reason: string;
  startedAt: string;
  expiresAt: string;
  isActive: boolean;
}

// Configurable Permission Limits for Admins
export interface AdminPermissionLimits {
  canAddRemoveModerators: boolean;
  canApproveSuspendMembers: boolean;
  canDeleteModeratePosts: boolean;
  canManageAnnouncements: boolean;
  canReviewVerifyDonations: boolean;
  canViewAdminReports: boolean;
  canChangeAppSettings: boolean;
  canAccessSensitiveMemberInfo: boolean;
}

// Centralized Permission Matrix Rule per Module
export interface ModulePermissionRule {
  moduleId: 'feed' | 'directory' | 'messages' | 'donations' | 'admin' | 'settings';
  moduleName: string;
  description: string;
  allowedRoles: {
    view: UserRole[];
    create: UserRole[];
    edit: UserRole[];
    delete: UserRole[];
    approve: UserRole[];
  };
}

// System Emergency & Maintenance Controls
export interface SystemEmergencyControls {
  maintenanceMode: boolean;
  freezeDonations: boolean;
  pauseRegistrations: boolean;
  restrictedPostingMode: boolean;
  reason?: string;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}

// Official Application Logo Config (Managed exclusively by System Controller)
export interface AppLogoConfig {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  updatedAt: string;
  updatedBy: string;
  updatedByName: string;
}

// Secure Transactional Email OTP System Types
export type OtpPurpose = 'email_verification' | 'password_reset';

export interface EmailOtpRecord {
  email: string;
  hashedCode: string;
  purpose: OtpPurpose;
  expiresAt: number;
  createdAt: number;
  attempts: number;
  maxAttempts: number;
  verified: boolean;
}

// Role-Based Control Center & System Controller Section Navigation
export type AdminSectionTab = 
  | 'overview'
  | 'roles' 
  | 'matrix' 
  | 'limits' 
  | 'emergency' 
  | 'logo'
  | 'donations' 
  | 'members' 
  | 'reports' 
  | 'moderation'
  | 'audit'
  | 'settings';

export type AppTab = 'feed' | 'directory' | 'messages' | 'donations' | 'profile' | 'admin';

export type SystemSettingsTab = 'firebase' | 'email' | 'security' | 'health';

export interface EmailSystemSettingsConfig {
  senderDisplayName: string;
  supportEmail: string;
  enforceRegistrationOtp: boolean;
  enforcePasswordResetOtp: boolean;
  allowedEmailDomainFilter: string;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}

export type HealthStatusType = 'online' | 'protected' | 'degraded' | 'offline' | 'checking';

export interface ServiceHealthCheckResult {
  id: string;
  name: string;
  serviceType: 'firebase_auth' | 'firebase_rtdb' | 'firebase_firestore' | 'firebase_storage' | 'cache_indexeddb' | 'email_mailer' | 'emergency_system';
  status: HealthStatusType;
  endpoint?: string;
  latencyMs?: number;
  lastChecked: string;
  notes: string;
  requiresConsoleAction?: string;
}

export interface FirebaseSafeConfig {
  projectId: string;
  authDomain: string;
  databaseUrl: string;
  storageBucket: string;
  messagingSenderId: string;
  appIdMasked: string;
  apiKeyMasked: string;
  enforcedRules: {
    rtdb: boolean;
    firestore: boolean;
    storage: boolean;
  };
}

export interface FirebaseEditableConfig {
  apiKey: string;
  authDomain: string;
  databaseUrl: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  lastUpdatedAt?: string;
  lastUpdatedBy?: string;
}

export interface FirebaseConfigBackup {
  id: string;
  config: FirebaseEditableConfig;
  backupTimestamp: string;
  reason: string;
  backedUpBy: string;
}

export type SmtpSecurityMode = 'SSL' | 'STARTTLS';

export interface SmtpConfigPublic {
  service: 'gmail' | 'custom';
  host: string;
  port: number;
  securityMode: SmtpSecurityMode;
  senderEmail: string;
  senderDisplayName: string;
  replyToEmail?: string;
  isPasswordConfigured: boolean;
  lastTestStatus: 'success' | 'failed' | 'untested';
  lastTestTimestamp?: string;
  lastTestError?: string;
  lastTestLatencyMs?: number;
}

export interface SmtpConfigSavePayload {
  host: string;
  port: number;
  securityMode: SmtpSecurityMode;
  senderEmail: string;
  senderDisplayName: string;
  replyToEmail?: string;
  appPassword?: string;
}

export type FirebaseConnectionStatus = 
  | 'checking'
  | 'connected'
  | 'disconnected'
  | 'permission_denied'
  | 'configuration_error'
  | 'network_error'
  | 'error';

export interface FirebaseConnectionTestResult {
  status: FirebaseConnectionStatus;
  rtdbStatus: 'reachable' | 'protected' | 'unreachable';
  authStatus: 'reachable' | 'unreachable';
  latencyMs: number;
  message: string;
  details: string;
  testedAt: string;
  endpoint: string;
  configOrigin?: 'vercel_env' | 'local_storage_override' | 'fallback_template';
  safeLogs?: string[];
  safeLog?: string[];
}

export type EmailServiceStatus = 'configured' | 'connected' | 'error' | 'not_configured';
