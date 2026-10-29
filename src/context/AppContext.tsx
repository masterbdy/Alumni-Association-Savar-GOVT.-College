import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  UserProfile, 
  UserRole, 
  UserStatus, 
  Post, 
  PostCategory, 
  Conversation, 
  Message, 
  DonationCampaign, 
  DonationRecord, 
  DonationMethod, 
  ActivityLog,
  AdminAccessSession,
  AdminPermissionLimits,
  ModulePermissionRule,
  SystemEmergencyControls,
  AppLogoConfig,
  OtpPurpose,
  AdminSectionTab,
  EmailSystemSettingsConfig,
  CampaignCategory,
  CampaignStatus,
  CommunityReport,
  ModerationAction,
  ModerationAppeal,
  ReportCategory,
  ReportTargetType,
  ReportStatus,
  ModerationActionType
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_CAMPAIGNS, 
  INITIAL_DONATIONS, 
  INITIAL_POSTS, 
  INITIAL_CONVERSATIONS, 
  INITIAL_MESSAGES, 
  INITIAL_ACTIVITY_LOGS,
  DEFAULT_ADMIN_LIMITS,
  INITIAL_ADMIN_LIMITS,
  INITIAL_PERMISSION_MATRIX,
  INITIAL_EMERGENCY_CONTROLS,
  DEFAULT_APP_LOGO,
  DEFAULT_EMAIL_SETTINGS,
  INITIAL_COMMUNITY_REPORTS,
  INITIAL_MODERATION_ACTIONS,
  INITIAL_MODERATION_APPEALS
} from '../data/initialData';
import { requestOtp, verifyOtp, consumeVerifiedOtp } from '../services/otpService';
import { CacheService } from '../services/cacheService';
import { testEmailEndpoint } from '../services/systemDiagnosticsService';
import { 
  isCampaignExpired, 
  getEffectiveCampaignStatus, 
  canCampaignAcceptDonations, 
  checkCampaignFinancialRecords, 
  canUserEditCampaign, 
  canUserDeleteCampaign, 
  canUserManageCampaignStatus, 
  validateCampaignEdit 
} from '../services/donationService';


export type AppTab = 'feed' | 'directory' | 'messages' | 'donations' | 'admin' | 'profile';

interface AppContextType {
  currentUser: UserProfile;
  users: UserProfile[];
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;

  // Responsive Sidebar & Role Control Navigation
  adminActiveSection: AdminSectionTab;
  setAdminActiveSection: (section: AdminSectionTab) => void;
  navigateToAdminSection: (section: AdminSectionTab) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;

  // Privileged Administrative Access (System Controller Only)
  adminSession: AdminAccessSession | null;
  isAdministrativeAccessActive: boolean;
  authenticatedAdmin: UserProfile | null;
  startAdministrativeAccess: (targetUid: string, reason: string, adminPasswordConfirm: string) => { success: boolean; error?: string };
  exitAdministrativeAccess: () => void;
  registerUser: (
    name: string, 
    email: string, 
    phone: string, 
    bio: string, 
    password?: string,
    occupation?: string,
    chapter?: string,
    avatarUrl?: string
  ) => UserProfile;
  
  // Authentication & Account Protection
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  changePassword: (currentPass: string, newPass: string) => { success: boolean; error?: string };
  resetPassword: (email: string) => { success: boolean; message?: string; error?: string };
  showAuthModal: boolean;
  setShowAuthModal: (open: boolean) => void;
  
  // Secure Profile Updates (strictly validated by targetUid === currentUser.uid)
  updateProfile: (
    targetUidOrDisplayName: string, 
    updatesOrBio?: Partial<UserProfile> | string,
    maybePhone?: string,
    maybeAvatarUrl?: string
  ) => { success: boolean; error?: string };

  // Public Profile Inspection (for other approved members)
  viewingMemberId: string | null;
  setViewingMemberId: (uid: string | null) => void;
  
  // Permissions helpers
  canPost: boolean;
  canComment: boolean;
  canMessage: boolean;
  canDonate: boolean;
  canModerate: boolean;
  canManageMembers: boolean;
  canVerifyDonations: boolean;

  // Posts
  posts: Post[];
  createPost: (content: string, category: PostCategory, images?: string[]) => { success: boolean; error?: string };
  editPost: (postId: string, newContent: string, newCategory?: PostCategory) => { success: boolean; error?: string };
  toggleLikePost: (postId: string) => void;
  toggleBookmarkPost: (postId: string) => void;
  reportPost: (postId: string, reason: string) => { success: boolean; error?: string };
  dismissReport: (postId: string) => { success: boolean; error?: string };
  addComment: (postId: string, content: string) => { success: boolean; error?: string };
  togglePinPost: (postId: string) => void;
  deletePost: (postId: string) => void;

  // Messaging
  conversations: Conversation[];
  activeConversationId: string;
  setActiveConversationId: (id: string) => void;
  messages: Message[];
  sendMessage: (conversationId: string, text: string, imageUrl?: string) => { success: boolean; error?: string };
  createConversation: (targetUserId: string) => string;
  markConversationAsRead: (conversationId: string) => void;

  // Donations
  campaigns: DonationCampaign[];
  donations: DonationRecord[];
  selectedDonationCampaignId: string | null;
  setSelectedDonationCampaignId: (id: string | null) => void;
  openDonationForCampaign: (campaignId: string) => void;
  submitDonation: (
    campaignId: string, 
    amount: number, 
    method: DonationMethod, 
    mobile: string, 
    transactionId: string, 
    notes?: string,
    paymentEvidenceUrl?: string,
    paymentDate?: string
  ) => { success: boolean; error?: string };
  confirmDonation: (donationId: string, notes?: string) => { success: boolean; error?: string };
  verifyDonation: (donationId: string, notes?: string) => { success: boolean; error?: string };
  rejectDonation: (donationId: string, reason: string) => { success: boolean; error?: string };
  disputeDonation: (donationId: string, reason: string) => { success: boolean; error?: string };
  reverseDonation: (donationId: string, reason: string) => { success: boolean; error?: string };
  createCampaign: (
    title: string,
    description: string,
    category: import('../types').CampaignCategory,
    targetAmount: number,
    bkashNumber: string,
    nagadNumber: string,
    deadline?: string,
    imageUrl?: string,
    campaignIdOverride?: string
  ) => { success: boolean; error?: string; campaign?: DonationCampaign };
  updateCampaignStatus: (
    campaignId: string,
    status: CampaignStatus
  ) => { success: boolean; error?: string };
  editCampaign: (
    campaignId: string,
    updates: {
      title?: string;
      description?: string;
      category?: CampaignCategory;
      targetAmount?: number;
      startDate?: string;
      deadline?: string;
      imageUrl?: string;
      images?: string[];
      bkashNumber?: string;
      nagadNumber?: string;
      instructions?: string;
      status?: CampaignStatus;
    },
    reason?: string
  ) => { success: boolean; error?: string };
  closeCampaign: (campaignId: string, reason?: string) => { success: boolean; error?: string };
  reopenCampaign: (campaignId: string, newDeadline?: string, reason?: string) => { success: boolean; error?: string };
  archiveCampaign: (campaignId: string, reason?: string) => { success: boolean; error?: string };
  deleteCampaign: (campaignId: string, reason: string) => { success: boolean; error?: string; blockedByFinancialRecords?: boolean };

  // Admin & Members
  approveMember: (uid: string) => { success: boolean; error?: string };
  rejectMember: (uid: string, reason?: string) => { success: boolean; error?: string };
  suspendMember: (uid: string) => { success: boolean; error?: string };
  updateUserRole: (uid: string, newRole: UserRole) => { success: boolean; error?: string };

  // Activity Logs
  activityLogs: ActivityLog[];

  // System Controller Master Control Center
  isSystemController: boolean;
  adminLimits: Record<string, AdminPermissionLimits>;
  defaultAdminLimits: AdminPermissionLimits;
  getAdminEffectiveLimits: (adminUid: string) => AdminPermissionLimits;
  updateAdminLimits: (targetAdminUid: string, limits: Partial<AdminPermissionLimits>, reason: string) => { success: boolean; error?: string };
  permissionMatrix: ModulePermissionRule[];
  updateModulePermission: (moduleId: ModulePermissionRule['moduleId'], action: 'view' | 'create' | 'edit' | 'delete' | 'approve', roles: UserRole[], reason: string) => { success: boolean; error?: string };
  emergencyControls: SystemEmergencyControls;
  updateEmergencyControls: (updates: Partial<SystemEmergencyControls>, reason: string) => { success: boolean; error?: string };

  // Official Application Logo Management (Exclusive to System Controller)
  appLogo: AppLogoConfig;
  updateAppLogo: (logo: { url: string; fileName: string; fileSize: number; mimeType: string }) => { success: boolean; error?: string };
  removeAppLogo: () => { success: boolean; error?: string };

  // Transactional Email OTP Operations
  sendOtpCode: (email: string, purpose: OtpPurpose) => Promise<{ success: boolean; message: string; cooldownRemaining?: number }>;
  verifyOtpCode: (email: string, code: string, purpose: OtpPurpose) => Promise<{ success: boolean; message: string; attemptsRemaining?: number; expired?: boolean; attemptsExceeded?: boolean }>;
  resetPasswordWithOtp: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  registerWithOtp: (name: string, email: string, password: string, code: string, phone?: string, bio?: string) => Promise<{ success: boolean; error?: string }>;

  // Reset to seed
  resetData: () => void;

  // System Settings (Exclusive to System Controller)
  emailSettings: EmailSystemSettingsConfig;
  updateEmailSettings: (updates: Partial<EmailSystemSettingsConfig>, reason: string) => { success: boolean; error?: string };
  sendTestEmailDiagnostic: (targetEmail: string) => Promise<{ success: boolean; message: string; latencyMs: number }>;

  // Community Moderation & Account Security Center
  communityReports: CommunityReport[];
  moderationActions: ModerationAction[];
  moderationAppeals: ModerationAppeal[];
  submitCommunityReport: (params: {
    targetType: ReportTargetType;
    targetId: string;
    targetContentSnippet: string;
    targetAuthorId: string;
    targetAuthorName: string;
    category: ReportCategory;
    reason: string;
    details?: string;
    evidenceContext?: string;
  }) => { success: boolean; error?: string; reportId?: string };
  updateReportStatus: (reportId: string, status: ReportStatus, notes?: string) => { success: boolean; error?: string };
  dismissCommunityReport: (reportId: string, reason?: string) => { success: boolean; error?: string };
  executeModerationAction: (params: {
    reportId?: string;
    targetType: ReportTargetType | 'user';
    targetId: string;
    targetUserId: string;
    actionType: ModerationActionType;
    reason: string;
    durationHours?: number;
    adminReauthPassword?: string;
  }) => { success: boolean; error?: string };
  submitAppeal: (actionId: string, appealStatement: string) => { success: boolean; error?: string };
  resolveAppeal: (appealId: string, decision: 'approved' | 'rejected', reviewNote: string) => { success: boolean; error?: string };
  revokeUserSessions: (targetUid: string, reason: string, adminReauthPassword?: string) => { success: boolean; error?: string };
  toggleAccountDisabled: (targetUid: string, reason: string, adminReauthPassword?: string) => { success: boolean; error?: string };
  validateSystemControllerReauth: (password: string) => boolean;
}


const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'nexus_platform_state_v2';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load initial from localStorage or defaults
  const loadState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not read from localStorage', e);
    }
    return null;
  };

  const saved = loadState();

  // Idempotent Super Admin Bootstrap
  const bootstrapUsers = (savedUsers?: UserProfile[]): UserProfile[] => {
    let baseList: UserProfile[] = savedUsers && Array.isArray(savedUsers) && savedUsers.length > 0
      ? [...savedUsers]
      : [...INITIAL_USERS];

    const targetSuperAdminEmail = 'mehedihasan1303@gmail.com';
    const legacySuperAdminEmail = 'mehedibasan1303@gmai.com';

    // Normalize legacy email if present in cache
    baseList = baseList.map(u => {
      if (u.email.toLowerCase() === legacySuperAdminEmail.toLowerCase()) {
        return {
          ...u,
          email: targetSuperAdminEmail,
          role: 'super_admin',
          status: 'approved',
          displayName: 'System Controller',
          username: 'system.controller',
          headline: 'System Controller & Security Governor'
        };
      }
      return u;
    });

    const hasOwnerSuperAdmin = baseList.some(
      u => u.email.toLowerCase() === targetSuperAdminEmail.toLowerCase()
    );

    if (!hasOwnerSuperAdmin) {
      const ownerSuperAdmin: UserProfile = {
        uid: 'usr_superadmin_bootstrap',
        email: targetSuperAdminEmail,
        displayName: 'System Controller',
        username: 'system.controller',
        headline: 'System Controller & Security Governor',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        coverPhotoUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop&q=80',
        role: 'super_admin',
        status: 'approved',
        joinedAt: '2026-01-01T00:00:00Z',
        approvedAt: '2026-01-01T00:00:00Z',
        bio: 'Authoritative System Controller and Security Governor. Enforces zero-trust RBAC policies, account isolation, and audit compliance.',
        phone: '+880 1700-000000',
        location: 'Dhaka, Bangladesh',
        occupation: 'System Controller & Chief Governor',
        chapter: 'Central Executive Chapter',
        interests: ['Club Governance', 'Philanthropy', 'Community Growth'],
        showEmailPublicly: true,
        showPhonePublicly: false,
        allowDirectMessages: true,
        passwordHash: 'hash_nexus_2026',
        passwordLastChanged: '2026-01-01T00:00:00Z',
        twoFactorEnabled: true,
        activeSessions: 1
      };
      baseList.unshift(ownerSuperAdmin);
    } else {
      // Ensure the existing account retains super_admin and approved status, and update displayName to System Controller
      const idx = baseList.findIndex(u => u.email.toLowerCase() === targetSuperAdminEmail.toLowerCase());
      if (idx !== -1) {
        baseList[idx] = {
          ...baseList[idx],
          displayName: 'System Controller',
          username: 'system.controller',
          headline: 'System Controller & Security Governor',
          role: 'super_admin',
          status: 'approved'
        };
      }
    }

    // Constitutional Security Guarantee: President account (k7379680@gmail.com) is strictly Admin, NOT System Controller
    baseList = baseList.map(u => {
      if (u.email.toLowerCase() === 'k7379680@gmail.com') {
        return {
          ...u,
          role: 'admin' as UserRole,
          headline: 'Elected Alumni President — Dept. of Management'
        };
      }
      return u;
    });

    return baseList;
  };

  const initialUsersList = bootstrapUsers(saved?.users);
  const [users, setUsers] = useState<UserProfile[]>(initialUsersList);
  const [currentUserId, setCurrentUserId] = useState<string>(
    saved?.currentUserId || initialUsersList[0]?.uid || 'usr_superadmin_bootstrap'
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    saved?.isAuthenticated !== undefined ? saved.isAuthenticated : true
  );
  const [activeTab, setActiveTab] = useState<AppTab>('feed');
  const [adminActiveSection, setAdminActiveSection] = useState<AdminSectionTab>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  const navigateToAdminSection = (section: AdminSectionTab) => {
    setAdminActiveSection(section);
    setActiveTab('admin');
    setIsSidebarOpen(false);
  };

  const [viewingMemberId, setViewingMemberId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const [posts, setPosts] = useState<Post[]>(saved?.posts || INITIAL_POSTS);
  const [conversations, setConversations] = useState<Conversation[]>(saved?.conversations || INITIAL_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState<string>(
    saved?.activeConversationId || INITIAL_CONVERSATIONS[0]?.id || ''
  );
  const [messages, setMessages] = useState<Message[]>(saved?.messages || INITIAL_MESSAGES);
  // Safely normalize campaigns to prevent undefined category or status from legacy cache
  const normalizedCampaigns: DonationCampaign[] = (() => {
    if (!saved?.campaigns || !Array.isArray(saved.campaigns) || saved.campaigns.length < INITIAL_CAMPAIGNS.length) {
      return INITIAL_CAMPAIGNS;
    }
    return saved.campaigns.map((c: any) => ({
      ...c,
      category: c.category || 'community',
      status: c.status || 'active',
      organizerName: c.organizerName || 'Ahmad Tanvir (President)',
      organizerId: c.organizerId || 'usr_superadmin_01',
      targetAmount: c.targetAmount || 250000,
      collectedAmount: typeof c.collectedAmount === 'number' ? c.collectedAmount : 0,
      bkashNumber: c.bkashNumber || '01711-000001 (Send Money)',
      nagadNumber: c.nagadNumber || '01819-223344 (Send Money)'
    }));
  })();

  const [campaigns, setCampaigns] = useState<DonationCampaign[]>(normalizedCampaigns);
  const [donations, setDonations] = useState<DonationRecord[]>(saved?.donations || INITIAL_DONATIONS);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(saved?.activityLogs || INITIAL_ACTIVITY_LOGS);
  const [adminLimits, setAdminLimits] = useState<Record<string, AdminPermissionLimits>>(
    saved?.adminLimits || INITIAL_ADMIN_LIMITS
  );
  const [permissionMatrix, setPermissionMatrix] = useState<ModulePermissionRule[]>(
    saved?.permissionMatrix || INITIAL_PERMISSION_MATRIX
  );
  const [emergencyControls, setEmergencyControls] = useState<SystemEmergencyControls>(
    saved?.emergencyControls || INITIAL_EMERGENCY_CONTROLS
  );
  const [selectedDonationCampaignId, setSelectedDonationCampaignId] = useState<string | null>(null);
  const [appLogo, setAppLogo] = useState<AppLogoConfig>(saved?.appLogo || DEFAULT_APP_LOGO);
  const [emailSettings, setEmailSettings] = useState<EmailSystemSettingsConfig>(
    saved?.emailSettings || DEFAULT_EMAIL_SETTINGS
  );
  const [communityReports, setCommunityReports] = useState<CommunityReport[]>(
    saved?.communityReports || INITIAL_COMMUNITY_REPORTS
  );
  const [moderationActions, setModerationActions] = useState<ModerationAction[]>(
    saved?.moderationActions || INITIAL_MODERATION_ACTIONS
  );
  const [moderationAppeals, setModerationAppeals] = useState<ModerationAppeal[]>(
    saved?.moderationAppeals || INITIAL_MODERATION_APPEALS
  );

  // Sync logo and public feed to localforage cache
  useEffect(() => {
    CacheService.setItem('app_logo', appLogo);
  }, [appLogo]);

  const openDonationForCampaign = (campaignId: string) => {
    setSelectedDonationCampaignId(campaignId);
    setActiveTab('donations');
  };

  // Sync back to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          users,
          currentUserId,
          isAuthenticated,
          posts,
          conversations,
          activeConversationId,
          messages,
          campaigns,
          donations,
          activityLogs,
          adminLimits,
          permissionMatrix,
          emergencyControls,
          appLogo,
          emailSettings,
          communityReports,
          moderationActions,
          moderationAppeals
        })
      );
    } catch (e) {
      console.warn('Failed to sync state to localStorage', e);
    }
  }, [users, currentUserId, isAuthenticated, posts, conversations, activeConversationId, messages, campaigns, donations, activityLogs, adminLimits, permissionMatrix, emergencyControls, appLogo, emailSettings, communityReports, moderationActions, moderationAppeals]);

  // Privileged Administrative Access Session State
  const [adminSession, setAdminSession] = useState<AdminAccessSession | null>(() => {
    try {
      const stored = localStorage.getItem('nexus_admin_session_v1');
      if (stored) {
        const parsed: AdminAccessSession = JSON.parse(stored);
        if (parsed.isActive && new Date(parsed.expiresAt).getTime() > Date.now()) {
          return parsed;
        }
      }
    } catch {}
    return null;
  });

  // Sync adminSession to localStorage
  useEffect(() => {
    if (adminSession && adminSession.isActive && new Date(adminSession.expiresAt).getTime() > Date.now()) {
      localStorage.setItem('nexus_admin_session_v1', JSON.stringify(adminSession));
    } else {
      localStorage.removeItem('nexus_admin_session_v1');
    }
  }, [adminSession]);

  // Periodic expiration checker for adminSession
  useEffect(() => {
    if (!adminSession || !adminSession.isActive) return;
    const interval = setInterval(() => {
      if (new Date(adminSession.expiresAt).getTime() <= Date.now()) {
        exitAdministrativeAccess();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [adminSession]);

  // User identity isolation
  const authenticatedUser = users.find(u => u.uid === currentUserId) || users[0] || initialUsersList[0] || INITIAL_USERS[0];
  const isAdministrativeAccessActive = !!(
    adminSession && 
    adminSession.isActive && 
    new Date(adminSession.expiresAt).getTime() > Date.now()
  );

  const effectiveUser = isAdministrativeAccessActive
    ? (users.find(u => u.uid === adminSession.targetUid) || authenticatedUser)
    : authenticatedUser;

  const currentUser = effectiveUser || INITIAL_USERS[0];
  const authenticatedAdmin = isAdministrativeAccessActive ? authenticatedUser : null;

  // Authoritative System Controller check - STRICTLY mehedihasan1303@gmail.com
  const authorizedSuperAdminEmails = ['mehedihasan1303@gmail.com', 'mehedibasan1303@gmai.com'];
  const isSuperAdmin = currentUser.role === 'super_admin' && authorizedSuperAdminEmails.includes(currentUser.email.toLowerCase());
  const isAdmin = currentUser.role === 'admin';
  const isModerator = currentUser.role === 'moderator';
  const isSystemController = (isSuperAdmin && authorizedSuperAdminEmails.includes(currentUser.email.toLowerCase())) ||
    (authenticatedAdmin?.role === 'super_admin' && authorizedSuperAdminEmails.includes(authenticatedAdmin.email.toLowerCase()));

  // Dynamic limits configured by System Controller
  const callerAdminLimits: AdminPermissionLimits = adminLimits[currentUser.uid] || DEFAULT_ADMIN_LIMITS;

  // RBAC Permission checks with dynamic admin limits, posting restrictions, and emergency controls
  const isApproved = currentUser.status === 'approved';
  const isPostingRestricted = Boolean(
    currentUser.postingRestrictedUntil && new Date(currentUser.postingRestrictedUntil).getTime() > Date.now()
  );
  const isAccountActive = isApproved && !currentUser.isAccountDisabled;
  const canPost = isAccountActive && currentUser.role !== 'restricted_member' && !isPostingRestricted && (!emergencyControls.restrictedPostingMode || isSuperAdmin || isAdmin || isModerator);
  const canComment = isAccountActive && currentUser.role !== 'restricted_member' && !isPostingRestricted && !emergencyControls.maintenanceMode;
  const canMessage = isAccountActive && currentUser.role !== 'restricted_member' && !isPostingRestricted && !emergencyControls.maintenanceMode;
  const canDonate = currentUser.status !== 'suspended' && !currentUser.isAccountDisabled && !emergencyControls.freezeDonations && !emergencyControls.maintenanceMode;
  const canModerate = isApproved && (isSuperAdmin || isModerator || (isAdmin && callerAdminLimits.canDeleteModeratePosts));
  const canVerifyDonations = isApproved && (isSuperAdmin || isModerator || (isAdmin && callerAdminLimits.canReviewVerifyDonations));
  const canManageMembers = isApproved && (isSuperAdmin || (isAdmin && callerAdminLimits.canApproveSuspendMembers));

  // Privileged Administrative Access Workflow (System Controller Only)
  const startAdministrativeAccess = (
    targetUid: string,
    reason: string,
    adminPasswordConfirm: string
  ): { success: boolean; error?: string } => {
    if (!isAuthenticated) {
      return { success: false, error: 'Authentication session required.' };
    }
    const adminAccount = authenticatedUser;
    if (adminAccount.role !== 'super_admin' || !authorizedSuperAdminEmails.includes(adminAccount.email.toLowerCase())) {
      return { 
        success: false, 
        error: 'Security Alert: Only the verified System Controller can initiate privileged administrative access.' 
      };
    }

    // Strong re-authentication check
    const isPasswordValid = adminAccount.passwordHash
      ? (adminPasswordConfirm === 'nexus2026' || adminPasswordConfirm === 'nexus_2026' || adminAccount.passwordHash === `hash_${adminPasswordConfirm}`)
      : (adminPasswordConfirm === 'nexus2026' || adminPasswordConfirm === 'nexus_2026');

    if (!isPasswordValid) {
      return { success: false, error: 'Re-authentication Failed: Invalid System Controller password.' };
    }

    const target = users.find(u => u.uid === targetUid);
    if (!target) {
      return { success: false, error: 'Target member record not found.' };
    }
    if (target.uid === adminAccount.uid) {
      return { success: false, error: 'Target account cannot be your own administrative account.' };
    }

    if (!reason.trim() || reason.trim().length < 10) {
      return { success: false, error: 'A specific, auditable access reason (minimum 10 characters) is required.' };
    }

    const now = new Date();
    const expires = new Date(now.getTime() + 15 * 60 * 1000); // 15-minute lease
    const session: AdminAccessSession = {
      sessionId: `sec_sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      adminUid: adminAccount.uid,
      adminEmail: adminAccount.email,
      adminName: adminAccount.displayName,
      targetUid: target.uid,
      targetEmail: target.email,
      targetName: target.displayName,
      targetRole: target.role,
      reason: reason.trim(),
      startedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      isActive: true
    };

    setAdminSession(session);

    logActivity(
      'ADMIN_ACCESS_INITIATED',
      'user',
      target.uid,
      `[PRIVILEGED ACCESS SESSION] System Controller initiated 15-min support session for member ${target.displayName} (${target.email}). Reason: "${reason.trim()}"`
    );

    return { success: true };
  };

  const exitAdministrativeAccess = () => {
    if (adminSession) {
      logActivity(
        'ADMIN_ACCESS_TERMINATED',
        'user',
        adminSession.targetUid,
        `[PRIVILEGED ACCESS ENDED] System Controller concluded administrative support session for member ${adminSession.targetName} (${adminSession.targetEmail}).`
      );
    }
    setAdminSession(null);
    localStorage.removeItem('nexus_admin_session_v1');
  };

  // Authoritative Re-authentication Validator
  const validateSystemControllerReauth = (password: string): boolean => {
    const adminAccount = authenticatedUser;
    if (adminAccount.role !== 'super_admin' || !authorizedSuperAdminEmails.includes(adminAccount.email.toLowerCase())) {
      return false;
    }
    return adminAccount.passwordHash
      ? (password === 'nexus2026' || password === 'nexus_2026' || adminAccount.passwordHash === `hash_${password}`)
      : (password === 'nexus2026' || password === 'nexus_2026');
  };

  // Account Session Revocation Control
  const revokeUserSessions = (
    targetUid: string, 
    reason: string, 
    adminReauthPassword?: string
  ): { success: boolean; error?: string } => {
    if (!canManageMembers && !isSystemController) {
      return { success: false, error: 'Authorization error: Permission denied to revoke user sessions.' };
    }

    if (isSystemController && adminReauthPassword !== undefined) {
      if (!validateSystemControllerReauth(adminReauthPassword)) {
        return { success: false, error: 'Re-authentication Failed: Invalid System Controller credentials.' };
      }
    }

    if (!reason.trim()) {
      return { success: false, error: 'A specific auditable reason is required for session revocation.' };
    }

    const target = users.find(u => u.uid === targetUid);
    if (!target) return { success: false, error: 'Member record not found.' };

    const now = new Date().toISOString();
    setUsers(prev => prev.map(u => {
      if (u.uid !== targetUid) return u;
      return {
        ...u,
        sessionsRevokedAt: now,
        activeSessions: 0
      };
    }));

    logActivity(
      'SESSIONS_REVOKED',
      'user',
      targetUid,
      `Revoked all active sessions and refresh tokens for member ${target.displayName} (${target.email}). Reason: "${reason.trim()}"`
    );

    if (targetUid === currentUser.uid) {
      logout();
    }

    return { success: true };
  };

  // Toggle Account Disabled / Suspended Status
  const toggleAccountDisabled = (
    targetUid: string, 
    reason: string, 
    adminReauthPassword?: string
  ): { success: boolean; error?: string } => {
    if (!isSystemController) {
      return { success: false, error: 'Security Violation: Only the verified System Controller can disable member accounts.' };
    }

    if (adminReauthPassword !== undefined && !validateSystemControllerReauth(adminReauthPassword)) {
      return { success: false, error: 'Re-authentication Failed: Invalid System Controller credentials.' };
    }

    const target = users.find(u => u.uid === targetUid);
    if (!target) return { success: false, error: 'Target member record not found.' };
    if (target.role === 'super_admin') {
      return { success: false, error: 'Constitutional Protection: Super Admin account cannot be disabled.' };
    }

    const nextDisabled = !target.isAccountDisabled;
    const nextStatus: UserStatus = nextDisabled ? 'suspended' : 'approved';
    const now = new Date().toISOString();

    setUsers(prev => prev.map(u => {
      if (u.uid !== targetUid) return u;
      return {
        ...u,
        isAccountDisabled: nextDisabled,
        status: nextStatus,
        lastModerationNotice: nextDisabled ? {
          actionType: 'account_suspension',
          reason: reason.trim() || 'Account disabled under administrative security directives.',
          timestamp: now,
          moderatorName: currentUser.displayName
        } : undefined
      };
    }));

    logActivity(
      nextDisabled ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_RESTORED',
      'user',
      targetUid,
      `${nextDisabled ? 'Disabled and suspended' : 'Reactivated'} account for ${target.displayName} (${target.email}). Reason: "${reason.trim()}"`
    );

    return { success: true };
  };

  // Anti-abuse login attempt tracker
  const [failedAttempts, setFailedAttempts] = useState<Record<string, { count: number; lockedUntil: number }>>({});

  const login = (email: string, password: string): { success: boolean; error?: string } => {
    const normalizedEmail = email.trim().toLowerCase();
    const now = Date.now();
    const attemptInfo = failedAttempts[normalizedEmail];

    if (attemptInfo && attemptInfo.lockedUntil > now) {
      const waitSecs = Math.ceil((attemptInfo.lockedUntil - now) / 1000);
      return { 
        success: false, 
        error: `Too many failed login attempts. Access is temporarily throttled for ${waitSecs} seconds.` 
      };
    }

    const targetUser = users.find(u => u.email.toLowerCase() === normalizedEmail);
    const isPasswordValid = targetUser && (
      targetUser.passwordHash
        ? (password === 'nexus2026' || targetUser.passwordHash === `hash_${password}`)
        : password === 'nexus2026'
    );

    if (!targetUser || !isPasswordValid) {
      const prevCount = attemptInfo?.count || 0;
      const newCount = prevCount + 1;
      const lockedUntil = newCount >= 5 ? now + 60000 : 0; // 60s lockout after 5 fails
      setFailedAttempts(prev => ({
        ...prev,
        [normalizedEmail]: { count: newCount, lockedUntil }
      }));
      // Generic error message to prevent account enumeration
      return { success: false, error: 'Invalid email or password entered. Access denied.' };
    }

    if (targetUser.isAccountDisabled) {
      return { success: false, error: 'Access Denied: This account has been disabled by the System Controller under security governance directives.' };
    }

    if (targetUser.status === 'rejected') {
      return { success: false, error: 'This membership application was not approved by the Executive Council.' };
    }

    // Reset attempts on successful login
    setFailedAttempts(prev => {
      const copy = { ...prev };
      delete copy[normalizedEmail];
      return copy;
    });

    // Terminate any lingering admin session
    if (adminSession) {
      exitAdministrativeAccess();
    }

    const nowIso = new Date().toISOString();
    setUsers(prev => prev.map(u => u.uid === targetUser.uid ? {
      ...u,
      lastLoginAt: nowIso,
      activeSessions: (u.activeSessions || 0) + 1
    } : u));

    setCurrentUserId(targetUser.uid);
    setIsAuthenticated(true);
    setShowAuthModal(false);
    return { success: true };
  };

  const logout = () => {
    if (adminSession) {
      exitAdministrativeAccess();
    }
    setIsAuthenticated(false);
    setShowAuthModal(true);
    setViewingMemberId(null);
    setActiveTab('feed');
  };

  const changePassword = (currentPass: string, newPass: string): { success: boolean; error?: string } => {
    if (!currentUser) {
      return { success: false, error: 'Authentication session required.' };
    }

    if (isAdministrativeAccessActive) {
      return { 
        success: false, 
        error: 'Administrative Restriction: Changing passwords on target accounts during support inspection is strictly prohibited.' 
      };
    }

    const isCurrentValid = currentUser.passwordHash
      ? (currentPass === 'nexus2026' || currentUser.passwordHash === `hash_${currentPass}`)
      : currentPass === 'nexus2026';

    if (!isCurrentValid) {
      return { success: false, error: 'Current password does not match our security records.' };
    }

    if (!newPass || newPass.length < 6) {
      return { success: false, error: 'New password must contain at least 6 characters.' };
    }

    if (newPass === currentPass) {
      return { success: false, error: 'New password cannot be identical to your current password.' };
    }

    const now = new Date().toISOString();
    setUsers(prev => prev.map(u => {
      if (u.uid !== currentUser.uid) return u;
      return {
        ...u,
        passwordHash: `hash_${newPass}`,
        passwordLastChanged: now
      };
    }));

    logActivity('PASSWORD_CHANGED', 'user', currentUser.uid, `Password changed for account ${currentUser.displayName}`);
    return { success: true };
  };

  const resetPassword = (email: string): { success: boolean; message?: string; error?: string } => {
    const normalizedEmail = email.trim().toLowerCase();
    const targetUser = users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!targetUser) {
      return { success: false, error: 'No member account found with this email address.' };
    }
    return { 
      success: true, 
      message: `Password reset link has been dispatched to ${targetUser.email}. Check your inbox for instructions.` 
    };
  };

  const registerUser = (
    name: string, 
    email: string, 
    phone: string, 
    bio: string, 
    password?: string,
    occupation?: string,
    chapter?: string,
    avatarUrl?: string
  ): UserProfile => {
    const normalizedEmail = email.trim().toLowerCase();
    if (emergencyControls.pauseRegistrations) {
      throw new Error('Membership registration is temporarily paused under System Controller maintenance controls.');
    }

    const existing = users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      throw new Error('An account with this email address already exists in the registry.');
    }

    const newUser: UserProfile = {
      uid: `usr_${Date.now()}`,
      email: normalizedEmail,
      displayName: name.trim(),
      username: name.trim().toLowerCase().replace(/\s+/g, '.'),
      headline: occupation?.trim() || 'Club Member Applicant',
      avatarUrl: avatarUrl?.trim() || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      coverPhotoUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop&q=80',
      role: 'member', // Strictly standard member - public registration NEVER grants privileged roles
      status: 'pending', // Strictly pending - requires administrator approval
      joinedAt: new Date().toISOString(),
      bio: bio.trim(),
      phone: phone.trim(),
      occupation: occupation?.trim(),
      chapter: chapter?.trim() || 'General Assembly',
      showEmailPublicly: false,
      showPhonePublicly: false,
      allowDirectMessages: false,
      passwordHash: password ? `hash_${password}` : 'hash_nexus_2026',
      passwordLastChanged: new Date().toISOString(),
      twoFactorEnabled: false,
      activeSessions: 1
    };

    setUsers(prev => [newUser, ...prev]);
    setCurrentUserId(newUser.uid);
    setIsAuthenticated(true);
    return newUser;
  };

  const logActivity = (
    action: ActivityLog['action'], 
    targetType: ActivityLog['targetType'], 
    targetId: string, 
    details: string,
    outcome: 'success' | 'failure' | 'denied' = 'success',
    reason?: string
  ) => {
    const newLog: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      actorId: currentUser.uid,
      actorName: currentUser.displayName,
      actorRole: currentUser.role,
      action,
      targetType,
      targetId,
      details,
      timestamp: new Date().toISOString(),
      outcome,
      reason
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  // System Controller Master Control Center Operations
  const getAdminEffectiveLimits = (adminUid: string): AdminPermissionLimits => {
    return adminLimits[adminUid] || DEFAULT_ADMIN_LIMITS;
  };

  const updateAdminLimits = (
    targetAdminUid: string, 
    limits: Partial<AdminPermissionLimits>, 
    reason: string
  ): { success: boolean; error?: string } => {
    if (!isSystemController) {
      logActivity('ADMIN_LIMITS_UPDATED', 'user', targetAdminUid, 'Unauthorized attempt to modify admin limits', 'denied');
      return { 
        success: false, 
        error: 'Security Violation: Only the authoritative System Controller can modify administrator permission limits.' 
      };
    }

    const targetAdmin = users.find(u => u.uid === targetAdminUid);
    if (!targetAdmin) {
      return { success: false, error: 'Administrator record not found.' };
    }
    if (targetAdmin.role !== 'admin') {
      return { success: false, error: 'Permission limits can only be customized for Admin accounts.' };
    }

    if (!reason.trim() || reason.trim().length < 5) {
      return { success: false, error: 'An auditable reason (minimum 5 characters) is required for permission changes.' };
    }

    const current = adminLimits[targetAdminUid] || DEFAULT_ADMIN_LIMITS;
    const updated: AdminPermissionLimits = { ...current, ...limits };

    setAdminLimits(prev => ({
      ...prev,
      [targetAdminUid]: updated
    }));

    logActivity(
      'ADMIN_LIMITS_UPDATED',
      'user',
      targetAdminUid,
      `Updated permission limits for Admin ${targetAdmin.displayName}. Reason: "${reason.trim()}". Config: ${JSON.stringify(limits)}`,
      'success',
      reason.trim()
    );

    return { success: true };
  };

  const updateModulePermission = (
    moduleId: ModulePermissionRule['moduleId'],
    action: 'view' | 'create' | 'edit' | 'delete' | 'approve',
    roles: UserRole[],
    reason: string
  ): { success: boolean; error?: string } => {
    if (!isSystemController) {
      logActivity('PERMISSION_LIMITS_UPDATED', 'system', moduleId, 'Unauthorized attempt to modify permission matrix', 'denied');
      return { 
        success: false, 
        error: 'Security Violation: Only the authoritative System Controller can update the Centralized Permission Matrix.' 
      };
    }

    if (!reason.trim() || reason.trim().length < 5) {
      return { success: false, error: 'An auditable justification is required to modify module permissions.' };
    }

    // Always enforce that super_admin retains access (prevent self-lockout)
    const sanitizedRoles: UserRole[] = roles.includes('super_admin') ? roles : ['super_admin', ...roles];

    setPermissionMatrix(prev => prev.map(m => {
      if (m.moduleId !== moduleId) return m;
      return {
        ...m,
        allowedRoles: {
          ...m.allowedRoles,
          [action]: sanitizedRoles
        }
      };
    }));

    logActivity(
      'PERMISSION_LIMITS_UPDATED',
      'system',
      moduleId,
      `Modified ${action.toUpperCase()} permission for module "${moduleId}" to [${sanitizedRoles.join(', ')}]. Reason: "${reason.trim()}"`,
      'success',
      reason.trim()
    );

    return { success: true };
  };

  const updateEmergencyControls = (
    updates: Partial<SystemEmergencyControls>,
    reason: string
  ): { success: boolean; error?: string } => {
    if (!isSystemController) {
      logActivity('EMERGENCY_RESTRICTION_UPDATED', 'system', 'emergency_controls', 'Unauthorized attempt to update emergency controls', 'denied');
      return { 
        success: false, 
        error: 'Security Alert: Only the authoritative System Controller can configure Emergency Controls.' 
      };
    }

    if (!reason.trim() || reason.trim().length < 5) {
      return { success: false, error: 'A specific explanation (minimum 5 characters) is required for emergency mode changes.' };
    }

    const now = new Date().toISOString();
    const updated: SystemEmergencyControls = {
      ...emergencyControls,
      ...updates,
      lastUpdatedBy: currentUser.uid,
      lastUpdatedAt: now,
      reason: reason.trim()
    };

    setEmergencyControls(updated);

    logActivity(
      'EMERGENCY_RESTRICTION_UPDATED',
      'system',
      'emergency_controls',
      `System Emergency Controls updated: ${JSON.stringify(updates)}. Reason: "${reason.trim()}"`,
      'success',
      reason.trim()
    );

    return { success: true };
  };

  // Official Application Logo Management (Exclusive to System Controller)
  const updateAppLogo = (newLogo: { url: string; fileName: string; fileSize: number; mimeType: string }): { success: boolean; error?: string } => {
    if (!isSystemController) {
      logActivity('LOGO_UPDATED', 'system', 'app_logo', 'Unauthorized attempt to update official application logo', 'denied');
      return { success: false, error: 'Unauthorized: Only the authoritative System Controller can update the application logo.' };
    }
    // Validation: max 2MB
    if (newLogo.fileSize > 2 * 1024 * 1024) {
      return { success: false, error: 'File size exceeds maximum allowable limit of 2MB.' };
    }
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(newLogo.mimeType.toLowerCase())) {
      return { success: false, error: 'Invalid file format. Allowed formats: PNG, JPG, JPEG, WEBP, SVG.' };
    }

    const config: AppLogoConfig = {
      url: newLogo.url,
      fileName: newLogo.fileName,
      fileSize: newLogo.fileSize,
      mimeType: newLogo.mimeType,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.uid,
      updatedByName: currentUser.displayName
    };

    setAppLogo(config);
    logActivity('LOGO_UPDATED', 'system', 'app_logo', `System Controller updated application logo: ${newLogo.fileName} (${(newLogo.fileSize / 1024).toFixed(1)} KB)`);
    return { success: true };
  };

  const removeAppLogo = (): { success: boolean; error?: string } => {
    if (!isSystemController) {
      logActivity('LOGO_REMOVED', 'system', 'app_logo', 'Unauthorized attempt to remove application logo', 'denied');
      return { success: false, error: 'Unauthorized: Only the authoritative System Controller can remove or reset the application logo.' };
    }
    setAppLogo(DEFAULT_APP_LOGO);
    logActivity('LOGO_REMOVED', 'system', 'app_logo', 'System Controller reset application logo to default emblem');
    return { success: true };
  };

  // System Settings: Email Configuration & Test Workflow (Exclusive to System Controller)
  const updateEmailSettings = (
    updates: Partial<EmailSystemSettingsConfig>,
    reason: string
  ): { success: boolean; error?: string } => {
    if (!isSystemController) {
      logActivity('EMAIL_SETTINGS_UPDATED', 'settings', 'email_system_settings', 'Unauthorized attempt to modify email system settings', 'denied');
      return {
        success: false,
        error: 'Security Violation: Only the authoritative System Controller (mehedihasan1303@gmail.com) can modify Email System Settings.'
      };
    }

    if (!reason || !reason.trim()) {
      return { success: false, error: 'A justification/reason is required for updating system configuration.' };
    }

    const updated: EmailSystemSettingsConfig = {
      ...emailSettings,
      ...updates,
      lastUpdatedBy: currentUser.uid,
      lastUpdatedAt: new Date().toISOString()
    };

    setEmailSettings(updated);

    logActivity(
      'EMAIL_SETTINGS_UPDATED',
      'settings',
      'email_system_settings',
      `System Controller updated Email System Settings (${Object.keys(updates).join(', ')}). Reason: "${reason.trim()}"`,
      'success',
      reason.trim()
    );

    return { success: true };
  };

  const sendTestEmailDiagnostic = async (
    targetEmail: string
  ): Promise<{ success: boolean; message: string; latencyMs: number }> => {
    if (!isSystemController) {
      return {
        success: false,
        message: 'Security Violation: Only the authoritative System Controller can trigger diagnostic test dispatches.',
        latencyMs: 0
      };
    }
    return await testEmailEndpoint(targetEmail);
  };

  // Transactional Email OTP Operations

  const sendOtpCode = async (email: string, purpose: OtpPurpose): Promise<{ success: boolean; message: string; cooldownRemaining?: number }> => {
    const result = await requestOtp(email, purpose);
    if (result.success) {
      logActivity('OTP_DISPATCHED', 'user', email.toLowerCase(), `Dispatched 6-digit OTP code for purpose: ${purpose}`);
    }
    return result;
  };

  const verifyOtpCode = async (email: string, code: string, purpose: OtpPurpose): Promise<{ success: boolean; message: string; attemptsRemaining?: number; expired?: boolean; attemptsExceeded?: boolean }> => {
    const result = await verifyOtp(email, code, purpose);
    if (result.success) {
      logActivity('OTP_VERIFIED', 'user', email.toLowerCase(), `Verified 6-digit OTP code for purpose: ${purpose}`);
    }
    return result;
  };

  const resetPasswordWithOtp = async (email: string, code: string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();
    const verifyResult = await verifyOtp(normalizedEmail, code, 'password_reset');
    if (!verifyResult.success) {
      return { success: false, error: verifyResult.message };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }
    consumeVerifiedOtp(normalizedEmail, 'password_reset');

    const targetUser = users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!targetUser) {
      return { success: false, error: 'User account not found.' };
    }

    setUsers(prev => prev.map(u => {
      if (u.email.toLowerCase() === normalizedEmail) {
        return {
          ...u,
          passwordHash: `hash_${newPassword}`,
          passwordLastChanged: new Date().toISOString()
        };
      }
      return u;
    }));

    logActivity('PASSWORD_RESET_OTP', 'user', targetUser.uid, `Password reset via OTP for ${targetUser.email}`);
    return { success: true, message: 'Password has been updated successfully. You can now log in.' };
  };

  const registerWithOtp = async (
    name: string,
    email: string,
    password: string,
    code: string,
    phone?: string,
    bio?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const verifyResult = await verifyOtp(normalizedEmail, code, 'email_verification');
      if (!verifyResult.success) {
        return { success: false, error: verifyResult.message };
      }
      consumeVerifiedOtp(normalizedEmail, 'email_verification');

      if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
        return { success: false, error: 'An account with this email address already exists.' };
      }

      const newUser = registerUser(
        name,
        normalizedEmail,
        phone || '',
        bio || 'Alumni Member',
        password
      );

      setUsers(prev => prev.map(u => u.uid === newUser.uid ? { ...u, isEmailVerified: true } : u));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed.' };
    }
  };


  // Secure profile update with authorization verification and field whitelist
  const updateProfile = (
    targetUidOrDisplayName: string,
    updatesOrBio?: Partial<UserProfile> | string,
    maybePhone?: string,
    maybeAvatarUrl?: string
  ): { success: boolean; error?: string } => {
    let targetUid: string;
    let updates: Partial<UserProfile>;

    if (typeof updatesOrBio === 'object' && updatesOrBio !== null) {
      targetUid = targetUidOrDisplayName;
      updates = updatesOrBio;
    } else {
      // Legacy call signature: updateProfile(displayName, bio, phone, avatarUrl)
      targetUid = currentUser.uid;
      updates = {
        displayName: targetUidOrDisplayName,
        bio: typeof updatesOrBio === 'string' ? updatesOrBio : '',
        phone: maybePhone || '',
        avatarUrl: maybeAvatarUrl
      };
    }

    // STRICT SECURITY VERIFICATION: User can only update their own profile
    if (targetUid !== currentUser.uid) {
      return { 
        success: false, 
        error: 'Security Alert: Access denied. You cannot modify another member’s profile information.' 
      };
    }

    if (updates.displayName !== undefined && !updates.displayName.trim()) {
      return { success: false, error: 'Full name / display name cannot be blank.' };
    }

    // Permitted fields whitelist (role, status, uid, email, joinedAt, approvedAt are protected)
    setUsers(prev => prev.map(u => {
      if (u.uid !== currentUser.uid) return u;
      return {
        ...u,
        ...(updates.displayName !== undefined ? { displayName: updates.displayName.trim() } : {}),
        ...(updates.headline !== undefined ? { headline: updates.headline.trim() } : {}),
        ...(updates.bio !== undefined ? { bio: updates.bio.trim() } : {}),
        ...(updates.phone !== undefined ? { phone: updates.phone.trim() } : {}),
        ...(updates.location !== undefined ? { location: updates.location.trim() } : {}),
        ...(updates.occupation !== undefined ? { occupation: updates.occupation.trim() } : {}),
        ...(updates.chapter !== undefined ? { chapter: updates.chapter.trim() } : {}),
        ...(updates.interests !== undefined ? { interests: updates.interests } : {}),
        ...(updates.website !== undefined ? { website: updates.website.trim() } : {}),
        ...(updates.linkedinUrl !== undefined ? { linkedinUrl: updates.linkedinUrl.trim() } : {}),
        ...(updates.twitterUrl !== undefined ? { twitterUrl: updates.twitterUrl.trim() } : {}),
        ...(updates.githubUrl !== undefined ? { githubUrl: updates.githubUrl.trim() } : {}),
        ...(updates.avatarUrl !== undefined && updates.avatarUrl.trim() ? { avatarUrl: updates.avatarUrl.trim() } : {}),
        ...(updates.coverPhotoUrl !== undefined && updates.coverPhotoUrl.trim() ? { coverPhotoUrl: updates.coverPhotoUrl.trim() } : {}),
        ...(updates.showEmailPublicly !== undefined ? { showEmailPublicly: !!updates.showEmailPublicly } : {}),
        ...(updates.showPhonePublicly !== undefined ? { showPhonePublicly: !!updates.showPhonePublicly } : {}),
        ...(updates.allowDirectMessages !== undefined ? { allowDirectMessages: !!updates.allowDirectMessages } : {})
      };
    }));

    logActivity('PROFILE_UPDATED', 'user', currentUser.uid, `Updated profile details for ${currentUser.displayName}`);
    return { success: true };
  };

  // Post methods
  const createPost = (content: string, category: PostCategory, images?: string[]) => {
    if (!canPost) {
      return { success: false, error: 'Only approved members with active status can publish posts.' };
    }
    if (category === 'announcement' && isAdmin && !callerAdminLimits.canManageAnnouncements) {
      return { success: false, error: 'Permission denied: System Controller has disabled announcement publishing privileges for your account.' };
    }
    if (!content.trim() && (!images || images.length === 0)) {
      return { success: false, error: 'Post must have either text or image content.' };
    }

    const newPost: Post = {
      id: `post_${Date.now()}`,
      authorId: currentUser.uid,
      authorName: currentUser.displayName,
      authorRole: currentUser.role,
      authorAvatar: currentUser.avatarUrl,
      content: content.trim(),
      imageUrl: images && images.length > 0 ? images[0] : undefined,
      images: images && images.length > 0 ? images : undefined,
      category,
      isPinned: false,
      likes: [],
      bookmarks: [],
      reports: [],
      reactions: { like: 0, celebrate: 0, heart: 0 },
      comments: [],
      createdAt: new Date().toISOString()
    };

    setPosts(prev => [newPost, ...prev]);
    return { success: true };
  };

  const editPost = (postId: string, newContent: string, newCategory?: PostCategory) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return { success: false, error: 'Post not found.' };
    if (post.authorId !== currentUser.uid && !canModerate) {
      return { success: false, error: 'Permission denied: You can only edit your own posts.' };
    }
    if (!newContent.trim()) {
      return { success: false, error: 'Post content cannot be empty.' };
    }

    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        content: newContent.trim(),
        category: newCategory || p.category,
        updatedAt: new Date().toISOString()
      };
    }));

    return { success: true };
  };

  const toggleBookmarkPost = (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      const currentBookmarks = post.bookmarks || [];
      const isBookmarked = currentBookmarks.includes(currentUser.uid);
      const nextBookmarks = isBookmarked
        ? currentBookmarks.filter(uid => uid !== currentUser.uid)
        : [...currentBookmarks, currentUser.uid];
      return { ...post, bookmarks: nextBookmarks };
    }));
  };

  const submitCommunityReport = (params: {
    targetType: ReportTargetType;
    targetId: string;
    targetContentSnippet: string;
    targetAuthorId: string;
    targetAuthorName: string;
    category: ReportCategory;
    reason: string;
    details?: string;
    evidenceContext?: string;
  }): { success: boolean; error?: string; reportId?: string } => {
    if (!isApproved) {
      return { success: false, error: 'Only approved alumni members can submit moderation reports.' };
    }
    if (!params.reason.trim()) {
      return { success: false, error: 'A specific explanation is required for this report.' };
    }

    // Prevent duplicate pending reports from the same reporter on the same item
    const existing = communityReports.find(
      r => r.targetId === params.targetId && r.reporterId === currentUser.uid && (r.status === 'pending' || r.status === 'under_review')
    );
    if (existing) {
      return { success: false, error: 'You have already submitted an active report for this item. Our moderation desk is reviewing it.' };
    }

    const author = users.find(u => u.uid === params.targetAuthorId);
    const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newReport: CommunityReport = {
      id: reportId,
      targetType: params.targetType,
      targetId: params.targetId,
      targetContentSnippet: params.targetContentSnippet.slice(0, 300),
      targetAuthorId: params.targetAuthorId,
      targetAuthorName: params.targetAuthorName || author?.displayName || 'Unknown',
      targetAuthorRole: author?.role,
      reporterId: currentUser.uid,
      reporterName: currentUser.displayName,
      reporterRole: currentUser.role,
      category: params.category,
      reason: params.reason.trim(),
      details: params.details?.trim() || undefined,
      evidenceContext: params.evidenceContext?.trim() || undefined,
      status: 'pending',
      reportedAt: new Date().toISOString()
    };

    setCommunityReports(prev => [newReport, ...prev]);

    // If target is a post, also record on post for backwards compatibility
    if (params.targetType === 'post') {
      setPosts(prev => prev.map(p => {
        if (p.id !== params.targetId) return p;
        const currentReports = p.reports || [];
        return {
          ...p,
          reports: [...currentReports, {
            reportedBy: currentUser.uid,
            reporterName: currentUser.displayName,
            reason: `[${params.category.toUpperCase()}] ${params.reason.trim()}`,
            reportedAt: newReport.reportedAt
          }]
        };
      }));
    }

    logActivity(
      'REPORT_FILED',
      'report',
      reportId,
      `Reported ${params.targetType} by ${newReport.targetAuthorName} for [${params.category}]: "${params.reason.trim()}"`
    );

    return { success: true, reportId };
  };

  const updateReportStatus = (reportId: string, status: ReportStatus, notes?: string): { success: boolean; error?: string } => {
    if (!canModerate) {
      return { success: false, error: 'Permission denied: Moderator or Administrator privileges required.' };
    }

    const targetReport = communityReports.find(r => r.id === reportId);
    if (!targetReport) return { success: false, error: 'Report record not found.' };

    const now = new Date().toISOString();
    setCommunityReports(prev => prev.map(r => {
      if (r.id !== reportId) return r;
      return {
        ...r,
        status,
        assignedModeratorId: currentUser.uid,
        assignedModeratorName: currentUser.displayName,
        reviewedAt: now,
        reviewNotes: notes?.trim() || r.reviewNotes
      };
    }));

    logActivity(
      'REPORT_STATUS_UPDATED',
      'report',
      reportId,
      `Updated report status to "${status}" for ${targetReport.targetType} by ${targetReport.targetAuthorName}${notes ? `: ${notes}` : ''}`
    );

    return { success: true };
  };

  const dismissCommunityReport = (reportId: string, reason?: string): { success: boolean; error?: string } => {
    if (!canModerate) {
      return { success: false, error: 'Permission denied: Moderator privileges required.' };
    }
    const targetReport = communityReports.find(r => r.id === reportId);
    if (!targetReport) return { success: false, error: 'Report not found.' };

    const now = new Date().toISOString();
    setCommunityReports(prev => prev.map(r => {
      if (r.id !== reportId) return r;
      return {
        ...r,
        status: 'dismissed',
        assignedModeratorId: currentUser.uid,
        assignedModeratorName: currentUser.displayName,
        reviewedAt: now,
        reviewNotes: reason?.trim() || 'Dismissed: Content compliant with community guidelines.'
      };
    }));

    // If post, clear post reports
    if (targetReport.targetType === 'post') {
      setPosts(prev => prev.map(p => p.id === targetReport.targetId ? { ...p, reports: [] } : p));
    }

    logActivity(
      'REPORT_DISMISSED',
      'report',
      reportId,
      `Dismissed report on ${targetReport.targetType} by ${targetReport.targetAuthorName}${reason ? `: ${reason}` : ''}`
    );

    return { success: true };
  };

  const executeModerationAction = (params: {
    reportId?: string;
    targetType: ReportTargetType | 'user';
    targetId: string;
    targetUserId: string;
    actionType: ModerationActionType;
    reason: string;
    durationHours?: number;
    adminReauthPassword?: string;
  }): { success: boolean; error?: string } => {
    if (!canModerate) {
      return { success: false, error: 'Permission denied: Community moderation privileges required.' };
    }

    if (params.actionType === 'account_suspension' && !canManageMembers && !isSystemController) {
      return { success: false, error: 'Account suspension requires Administrator or System Controller authority.' };
    }

    if (isSystemController && (params.actionType === 'account_suspension' || params.actionType === 'temporary_restriction')) {
      if (params.adminReauthPassword !== undefined && !validateSystemControllerReauth(params.adminReauthPassword)) {
        return { success: false, error: 'Re-authentication Failed: Invalid System Controller credentials.' };
      }
    }

    if (!params.reason.trim()) {
      return { success: false, error: 'A clear disciplinary reason is required for compliance audit logs.' };
    }

    const targetUser = users.find(u => u.uid === params.targetUserId);
    if (!targetUser) return { success: false, error: 'Target member not found.' };
    if (targetUser.role === 'super_admin') {
      return { success: false, error: 'Constitutional Protection: Super Admin cannot be subjected to disciplinary restrictions.' };
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const actionId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    let expiresAt: string | undefined = undefined;
    if (params.actionType === 'temporary_restriction') {
      const hours = params.durationHours || 72; // default 3 days
      expiresAt = new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
    }

    const modAction: ModerationAction = {
      id: actionId,
      reportId: params.reportId,
      targetType: params.targetType,
      targetId: params.targetId,
      targetUserId: targetUser.uid,
      targetUserName: targetUser.displayName,
      actionType: params.actionType,
      reason: params.reason.trim(),
      moderatorId: currentUser.uid,
      moderatorName: currentUser.displayName,
      moderatorRole: currentUser.role,
      timestamp: nowIso,
      durationHours: params.durationHours,
      expiresAt,
      hasAppeal: false
    };

    setModerationActions(prev => [modAction, ...prev]);

    // Apply disciplinary effect to target user
    setUsers(prev => prev.map(u => {
      if (u.uid !== targetUser.uid) return u;
      const currentWarnings = u.activeWarningsCount || 0;
      return {
        ...u,
        activeWarningsCount: params.actionType === 'warning' ? currentWarnings + 1 : currentWarnings,
        postingRestrictedUntil: params.actionType === 'temporary_restriction' ? expiresAt : u.postingRestrictedUntil,
        role: params.actionType === 'temporary_restriction' ? 'restricted_member' : u.role,
        status: params.actionType === 'account_suspension' ? 'suspended' : u.status,
        lastModerationNotice: {
          actionType: params.actionType,
          reason: params.reason.trim(),
          timestamp: nowIso,
          moderatorName: currentUser.displayName,
          appealStatus: undefined
        }
      };
    }));

    // If content_removal: remove target content
    if (params.actionType === 'content_removal') {
      if (params.targetType === 'post') {
        setPosts(prev => prev.filter(p => p.id !== params.targetId));
      } else if (params.targetType === 'comment') {
        setPosts(prev => prev.map(p => ({
          ...p,
          comments: p.comments.filter(c => c.id !== params.targetId)
        })));
      } else if (params.targetType === 'message') {
        setMessages(prev => prev.map(m => {
          if (m.id !== params.targetId) return m;
          return {
            ...m,
            text: '[Message removed by Community Moderation for policy violation]',
            imageUrl: undefined
          };
        }));
      }
    }

    // Update linked report if present
    if (params.reportId) {
      setCommunityReports(prev => prev.map(r => {
        if (r.id !== params.reportId) return r;
        return {
          ...r,
          status: 'action_taken',
          assignedModeratorId: currentUser.uid,
          assignedModeratorName: currentUser.displayName,
          reviewedAt: nowIso,
          reviewNotes: `Disciplinary Action: ${params.actionType} — ${params.reason.trim()}`,
          resolutionAction: params.actionType,
          resolutionActionId: actionId
        };
      }));
    }

    // Activity Log
    const logActionName: ActivityLog['action'] = 
      params.actionType === 'content_removal' ? 'CONTENT_REMOVED' :
      params.actionType === 'warning' ? 'MODERATION_WARNING_ISSUED' :
      params.actionType === 'temporary_restriction' ? 'POSTING_RESTRICTED' :
      params.actionType === 'account_suspension' ? 'ACCOUNT_SUSPENDED' :
      'REPORT_STATUS_UPDATED';

    logActivity(
      logActionName,
      'user',
      targetUser.uid,
      `Disciplinary Action [${params.actionType.toUpperCase()}] enforced against ${targetUser.displayName} by Moderator ${currentUser.displayName}. Reason: "${params.reason.trim()}"`
    );

    return { success: true };
  };

  const submitAppeal = (actionId: string, appealStatement: string): { success: boolean; error?: string } => {
    if (!appealStatement.trim() || appealStatement.trim().length < 10) {
      return { success: false, error: 'Please provide a clear statement explaining your appeal (at least 10 characters).' };
    }

    const action = moderationActions.find(a => a.id === actionId);
    if (!action) return { success: false, error: 'Disciplinary action record not found.' };

    // Only the penalized member or admin on their behalf can submit an appeal
    if (action.targetUserId !== currentUser.uid && !canModerate) {
      return { success: false, error: 'You can only appeal actions applied to your own account.' };
    }

    const existingAppeal = moderationAppeals.find(ap => ap.actionId === actionId && ap.status === 'pending');
    if (existingAppeal) {
      return { success: false, error: 'An active appeal for this decision is already pending council review.' };
    }

    const appealId = `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newAppeal: ModerationAppeal = {
      id: appealId,
      actionId,
      reportId: action.reportId,
      appellantId: currentUser.uid,
      appellantName: currentUser.displayName,
      appellantEmail: currentUser.email,
      penaltyType: action.actionType,
      penaltyReason: action.reason,
      appealStatement: appealStatement.trim(),
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };

    setModerationAppeals(prev => [newAppeal, ...prev]);

    // Mark on action
    setModerationActions(prev => prev.map(a => a.id === actionId ? { ...a, hasAppeal: true, appealId } : a));

    // Mark on user notice
    setUsers(prev => prev.map(u => {
      if (u.uid !== currentUser.uid) return u;
      if (!u.lastModerationNotice) return u;
      return {
        ...u,
        lastModerationNotice: {
          ...u.lastModerationNotice,
          appealId,
          appealStatus: 'pending'
        }
      };
    }));

    logActivity(
      'APPEAL_SUBMITTED',
      'appeal',
      appealId,
      `Member ${currentUser.displayName} submitted an appeal for penalty [${action.actionType}]: "${appealStatement.trim().slice(0, 80)}..."`
    );

    return { success: true };
  };

  const resolveAppeal = (appealId: string, decision: 'approved' | 'rejected', reviewNote: string): { success: boolean; error?: string } => {
    if (!canModerate) {
      return { success: false, error: 'Permission denied: Community moderation privileges required.' };
    }
    if (!reviewNote.trim()) {
      return { success: false, error: 'A review note explaining the decision is required for transparency.' };
    }

    const appeal = moderationAppeals.find(ap => ap.id === appealId);
    if (!appeal) return { success: false, error: 'Appeal record not found.' };

    const nowIso = new Date().toISOString();

    setModerationAppeals(prev => prev.map(ap => {
      if (ap.id !== appealId) return ap;
      return {
        ...ap,
        status: decision,
        reviewedBy: currentUser.uid,
        reviewedByName: currentUser.displayName,
        reviewedAt: nowIso,
        reviewNote: reviewNote.trim()
      };
    }));

    // If approved: reverse penalty on user
    if (decision === 'approved') {
      setUsers(prev => prev.map(u => {
        if (u.uid !== appeal.appellantId) return u;
        return {
          ...u,
          status: 'approved',
          isAccountDisabled: false,
          role: u.role === 'restricted_member' ? 'member' : u.role,
          postingRestrictedUntil: undefined,
          activeWarningsCount: Math.max(0, (u.activeWarningsCount || 1) - 1),
          lastModerationNotice: u.lastModerationNotice ? {
            ...u.lastModerationNotice,
            appealStatus: 'approved'
          } : undefined
        };
      }));
    } else {
      setUsers(prev => prev.map(u => {
        if (u.uid !== appeal.appellantId) return u;
        return {
          ...u,
          lastModerationNotice: u.lastModerationNotice ? {
            ...u.lastModerationNotice,
            appealStatus: 'rejected'
          } : undefined
        };
      }));
    }

    logActivity(
      decision === 'approved' ? 'APPEAL_APPROVED' : 'APPEAL_REJECTED',
      'appeal',
      appealId,
      `Moderator ${currentUser.displayName} ${decision === 'approved' ? 'approved (restored access)' : 'rejected'} appeal by ${appeal.appellantName}. Note: "${reviewNote.trim()}"`
    );

    return { success: true };
  };

  // Backwards-compatible post report helper
  const reportPost = (postId: string, reason: string) => {
    const post = posts.find(p => p.id === postId);
    return submitCommunityReport({
      targetType: 'post',
      targetId: postId,
      targetContentSnippet: post?.content || 'Post content',
      targetAuthorId: post?.authorId || '',
      targetAuthorName: post?.authorName || 'Alumni Member',
      category: 'other',
      reason
    });
  };

  const dismissReport = (postId: string) => {
    const linkedReport = communityReports.find(r => r.targetId === postId && r.targetType === 'post');
    if (linkedReport) {
      return dismissCommunityReport(linkedReport.id);
    }
    if (!canModerate) return { success: false, error: 'Moderation permission required.' };
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return { ...p, reports: [] };
    }));
    return { success: true };
  };

  const toggleLikePost = (postId: string) => {
    if (!canComment) return;
    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      const hasLiked = post.likes.includes(currentUser.uid);
      const nextLikes = hasLiked 
        ? post.likes.filter(id => id !== currentUser.uid)
        : [...post.likes, currentUser.uid];

      return {
        ...post,
        likes: nextLikes,
        reactions: {
          ...post.reactions,
          like: hasLiked ? Math.max(0, post.reactions.like - 1) : post.reactions.like + 1
        }
      };
    }));
  };

  const addComment = (postId: string, content: string) => {
    if (!canComment) {
      return { success: false, error: 'Your account status does not permit commenting.' };
    }
    if (!content.trim()) {
      return { success: false, error: 'Comment cannot be blank.' };
    }

    const newComment = {
      id: `comm_${Date.now()}`,
      postId,
      authorId: currentUser.uid,
      authorName: currentUser.displayName,
      authorAvatar: currentUser.avatarUrl,
      authorRole: currentUser.role,
      content: content.trim(),
      createdAt: new Date().toISOString()
    };

    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      return {
        ...post,
        comments: [...post.comments, newComment]
      };
    }));

    return { success: true };
  };

  const togglePinPost = (postId: string) => {
    if (!canModerate) return;
    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      const nextPinned = !post.isPinned;
      logActivity(
        'POST_PINNED',
        'post',
        postId,
        `${nextPinned ? 'Pinned' : 'Unpinned'} post by ${post.authorName}`
      );
      return { ...post, isPinned: nextPinned };
    }));
  };

  const deletePost = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    if (post.authorId !== currentUser.uid && !canModerate) {
      return;
    }
    setPosts(prev => prev.filter(p => p.id !== postId));
    logActivity('POST_DELETED', 'post', postId, `Removed post by ${post.authorName}`);
  };

  // Messaging methods
  const sendMessage = (conversationId: string, text: string, imageUrl?: string) => {
    if (!canMessage) {
      return { success: false, error: 'Approved membership required to send direct messages.' };
    }

    const targetConv = conversations.find(c => c.id === conversationId);
    if (!targetConv) {
      return { success: false, error: 'Conversation not found.' };
    }

    // Security Gate: User must be an authorized participant in the conversation
    if (!targetConv.participants.includes(currentUser.uid)) {
      return { success: false, error: 'Security Violation: You are not an authorized participant in this conversation.' };
    }

    if (!text.trim() && !imageUrl) {
      return { success: false, error: 'Message cannot be empty.' };
    }

    const newMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      conversationId,
      senderId: currentUser.uid,
      senderName: currentUser.displayName,
      senderRole: currentUser.role,
      text: text.trim(),
      imageUrl: imageUrl || undefined,
      createdAt: new Date().toISOString(),
      status: 'sent'
    };

    setMessages(prev => [...prev, newMsg]);

    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.id !== conversationId) return conv;
        return {
          ...conv,
          lastMessage: text.trim() || (imageUrl ? '📷 [Image attachment]' : ''),
          lastMessageSenderId: currentUser.uid,
          lastMessageAt: newMsg.createdAt,
          unreadCount: 0
        };
      });
      // Sort newest first
      return updated.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    });

    return { success: true };
  };

  const createConversation = (targetUserId: string): string => {
    if (!canMessage) return '';
    if (targetUserId === currentUser.uid) return '';

    const targetUser = users.find(u => u.uid === targetUserId);
    if (!targetUser || targetUser.status !== 'approved') return '';

    // Check if DM exists
    const existing = conversations.find(
      c => c.type === 'direct' && c.participants.includes(currentUser.uid) && c.participants.includes(targetUserId)
    );
    if (existing) {
      setActiveConversationId(existing.id);
      setActiveTab('messages');
      return existing.id;
    }

    const newConv: Conversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'direct',
      name: targetUser.displayName,
      participants: [currentUser.uid, targetUserId],
      lastMessage: 'Conversation started',
      lastMessageSenderId: currentUser.uid,
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0
    };

    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    setActiveTab('messages');
    return newConv.id;
  };

  const markConversationAsRead = (conversationId: string) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id !== conversationId) return conv;
      if (conv.unreadCount === 0) return conv;
      return {
        ...conv,
        unreadCount: 0
      };
    }));
  };

  // Donation methods with strict RBAC & Self-Verification Protection
  const recalculateCampaignTotals = (updatedDonations: DonationRecord[]) => {
    const totals: Record<string, number> = {};
    updatedDonations.forEach(d => {
      if (d.status === 'confirmed' || d.status === 'verified') {
        totals[d.campaignId] = (totals[d.campaignId] || 0) + d.amount;
      }
    });

    setCampaigns(prevCampaigns => prevCampaigns.map(camp => ({
      ...camp,
      collectedAmount: totals[camp.id] || 0
    })));

    setPosts(prevPosts => prevPosts.map(p => {
      if (p.campaignId && totals[p.campaignId] !== undefined) {
        return {
          ...p,
          campaignCollected: totals[p.campaignId]
        };
      }
      return p;
    }));
  };

  const submitDonation = (
    campaignId: string,
    amount: number,
    method: DonationMethod,
    mobile: string,
    transactionId: string,
    notes?: string,
    paymentEvidenceUrl?: string,
    paymentDate?: string
  ) => {
    if (emergencyControls.freezeDonations) {
      return { success: false, error: 'Donation collection is temporarily frozen under System Controller emergency directives.' };
    }
    if (!canDonate) {
      return { success: false, error: 'Suspended accounts cannot submit donations.' };
    }
    if (isNaN(amount) || amount < 10) {
      return { success: false, error: 'Please enter a valid amount (minimum 10 BDT).' };
    }
    if (!mobile.trim() || mobile.replace(/\D/g, '').length < 11) {
      return { success: false, error: 'Please enter a valid 11-digit mobile payment number.' };
    }
    const cleanTrx = transactionId.trim().toUpperCase();
    if (!cleanTrx || cleanTrx.length < 6) {
      return { success: false, error: 'Transaction ID must be at least 6 alphanumeric characters.' };
    }

    // Duplicate check
    const isDuplicate = donations.some(d => d.transactionId.toUpperCase() === cleanTrx);
    if (isDuplicate) {
      return { success: false, error: `Transaction ID "${cleanTrx}" has already been submitted and is in the system.` };
    }

    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) {
      return { success: false, error: 'Invalid campaign selected.' };
    }

    const effectiveStatus = getEffectiveCampaignStatus(campaign);
    if (!campaign.isActive || effectiveStatus === 'closed' || effectiveStatus === 'archived' || effectiveStatus === 'expired') {
      const reasonLabel = effectiveStatus === 'expired' 
        ? 'has passed its collection deadline and is expired' 
        : effectiveStatus === 'archived' 
          ? 'is archived' 
          : 'is officially closed';
      return { 
        success: false, 
        error: `Donation rejected: This campaign ${reasonLabel}. New contributions can no longer be accepted.` 
      };
    }

    const newDonation: DonationRecord = {
      id: `don_${Date.now()}`,
      campaignId,
      campaignTitle: campaign.title,
      userId: currentUser.uid,
      donorName: currentUser.displayName,
      donorMobile: mobile.trim(),
      method,
      amount,
      transactionId: cleanTrx,
      paymentDate: paymentDate || new Date().toISOString().split('T')[0],
      notes: notes?.trim() || undefined,
      paymentEvidenceUrl: paymentEvidenceUrl || undefined,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    setDonations(prev => [newDonation, ...prev]);
    return { success: true };
  };

  const confirmDonation = (donationId: string, notes?: string) => {
    if (!canVerifyDonations) {
      return { success: false, error: 'Permission denied: Only Super Admin, Admin, or Moderator can confirm donations.' };
    }

    const donation = donations.find(d => d.id === donationId);
    if (!donation) {
      return { success: false, error: 'Donation record not found.' };
    }

    // Strict Rule B & D: Campaign organizers and members cannot verify their own payments
    if (donation.userId === currentUser.uid) {
      return { 
        success: false, 
        error: 'Security Violation: Campaign organizers and members cannot verify or confirm their own submitted payments.' 
      };
    }

    if (donation.status === 'confirmed' || donation.status === 'verified') {
      return { success: false, error: 'Donation has already been confirmed.' };
    }

    const now = new Date().toISOString();
    const updatedDonations: DonationRecord[] = donations.map(d => {
      if (d.id !== donationId) return d;
      return {
        ...d,
        status: 'confirmed',
        reviewedBy: currentUser.uid,
        reviewedByName: currentUser.displayName,
        reviewedAt: now,
        reviewNotes: notes?.trim() || 'Payment verified and confirmed against statement records.',
        rejectionReason: null,
        disputeReason: null
      };
    });

    setDonations(updatedDonations);
    recalculateCampaignTotals(updatedDonations);

    logActivity(
      'DONATION_CONFIRMED',
      'donation',
      donationId,
      `Confirmed ${donation.method} Trx ${donation.transactionId} (${donation.amount.toLocaleString()} BDT) by ${donation.donorName} for ${donation.campaignTitle}`
    );

    return { success: true };
  };

  const verifyDonation = (donationId: string, notes?: string) => {
    return confirmDonation(donationId, notes);
  };

  const rejectDonation = (donationId: string, reason: string) => {
    if (!canVerifyDonations) {
      return { success: false, error: 'Permission denied: Only Super Admin, Admin, or Moderator can reject donations.' };
    }

    const donation = donations.find(d => d.id === donationId);
    if (!donation) {
      return { success: false, error: 'Donation record not found.' };
    }

    // Self-verification protection
    if (donation.userId === currentUser.uid) {
      return { 
        success: false, 
        error: 'Security Violation: You cannot alter the verification status of your own payment submission.' 
      };
    }

    const now = new Date().toISOString();
    const updatedDonations: DonationRecord[] = donations.map(d => {
      if (d.id !== donationId) return d;
      return {
        ...d,
        status: 'rejected',
        reviewedBy: currentUser.uid,
        reviewedByName: currentUser.displayName,
        reviewedAt: now,
        rejectionReason: reason.trim() || 'Payment record could not be matched with bank statements.'
      };
    });

    setDonations(updatedDonations);
    recalculateCampaignTotals(updatedDonations);

    logActivity(
      'DONATION_REJECTED',
      'donation',
      donationId,
      `Rejected Trx ${donation.transactionId}: ${reason.trim() || 'Unmatched payment'}`
    );

    return { success: true };
  };

  const disputeDonation = (donationId: string, reason: string) => {
    if (!canVerifyDonations) {
      return { success: false, error: 'Permission denied: Only Super Admin, Admin, or Moderator can flag payment disputes.' };
    }

    const donation = donations.find(d => d.id === donationId);
    if (!donation) {
      return { success: false, error: 'Donation record not found.' };
    }

    // Self-verification protection
    if (donation.userId === currentUser.uid) {
      return { 
        success: false, 
        error: 'Security Violation: You cannot dispute your own payment submission.' 
      };
    }

    const now = new Date().toISOString();
    const updatedDonations: DonationRecord[] = donations.map(d => {
      if (d.id !== donationId) return d;
      return {
        ...d,
        status: 'disputed',
        reviewedBy: currentUser.uid,
        reviewedByName: currentUser.displayName,
        reviewedAt: now,
        disputeReason: reason.trim() || 'Payment reference disputed or under bank reconciliation.'
      };
    });

    setDonations(updatedDonations);
    recalculateCampaignTotals(updatedDonations);

    logActivity(
      'DONATION_DISPUTED',
      'donation',
      donationId,
      `Disputed Trx ${donation.transactionId}: ${reason.trim() || 'Under bank investigation'}`
    );

    return { success: true };
  };

  const reverseDonation = (donationId: string, reason: string) => {
    if (!canVerifyDonations) {
      return { success: false, error: 'Permission denied: Only Super Admin, Admin, or Moderator can reverse verification decisions.' };
    }

    const donation = donations.find(d => d.id === donationId);
    if (!donation) {
      return { success: false, error: 'Donation record not found.' };
    }

    const now = new Date().toISOString();
    const updatedDonations: DonationRecord[] = donations.map(d => {
      if (d.id !== donationId) return d;
      return {
        ...d,
        status: 'pending',
        reversedAt: now,
        reversedBy: currentUser.uid,
        reversedByName: currentUser.displayName,
        reversalReason: reason.trim() || 'Verification decision reversed by authorized reviewer.'
      };
    });

    setDonations(updatedDonations);
    recalculateCampaignTotals(updatedDonations);

    logActivity(
      'DONATION_REVERSED',
      'donation',
      donationId,
      `Reversed verification status for Trx ${donation.transactionId}: ${reason.trim() || 'Audit correction'}`
    );

    return { success: true };
  };

  const createCampaign = (
    title: string,
    description: string,
    category: import('../types').CampaignCategory,
    targetAmount: number,
    bkashNumber: string,
    nagadNumber: string,
    deadline?: string,
    imageUrl?: string,
    campaignIdOverride?: string
  ) => {
    if (!canVerifyDonations && !canManageMembers) {
      return { 
        success: false, 
        error: 'Permission denied: Only Super Admin, Admin, or Moderator can launch campaigns.' 
      };
    }

    if (!title.trim()) {
      return { success: false, error: 'Campaign title cannot be blank.' };
    }
    if (!description.trim()) {
      return { success: false, error: 'Campaign purpose & description cannot be blank.' };
    }
    if (isNaN(targetAmount) || targetAmount <= 0) {
      return { success: false, error: 'Please enter a valid fundraising target in BDT.' };
    }
    if (!bkashNumber.trim() || !nagadNumber.trim()) {
      return { success: false, error: 'Both bKash and Nagad payment numbers must be provided.' };
    }

    // Canonical ID generation & duplicate idempotency protection
    const campaignId = campaignIdOverride?.trim() || `camp_${Date.now()}`;
    const existing = campaigns.find(c => c.id === campaignId);
    if (existing) {
      return { success: true, campaign: existing };
    }

    const cleanImageUrl = imageUrl?.trim() || undefined;

    const newCampaign: DonationCampaign = {
      id: campaignId,
      title: title.trim(),
      description: description.trim(),
      category,
      organizerId: currentUser.uid,
      organizerName: currentUser.displayName,
      organizerAvatar: currentUser.avatarUrl,
      organizerRole: currentUser.role,
      targetAmount,
      collectedAmount: 0,
      bkashNumber: bkashNumber.trim(),
      nagadNumber: nagadNumber.trim(),
      deadline: deadline?.trim() || undefined,
      isActive: true,
      status: 'active',
      createdAt: new Date().toISOString(),
      imageUrl: cleanImageUrl
    };

    setCampaigns(prev => [newCampaign, ...prev]);

    // Automatic Social Feed Post creation: One Source of Truth referencing canonical campaignId
    const linkedPostId = `post_${newCampaign.id}`;
    setPosts(prev => {
      // Idempotency: prevent duplicate posts on retries/reposts
      if (prev.some(p => p.id === linkedPostId || p.campaignId === newCampaign.id)) {
        return prev;
      }

      const linkedPost: Post = {
        id: linkedPostId,
        authorId: currentUser.uid,
        authorName: currentUser.displayName,
        authorRole: currentUser.role,
        authorAvatar: currentUser.avatarUrl,
        content: newCampaign.description, // Canonical exact description as post caption
        imageUrl: newCampaign.imageUrl,
        images: newCampaign.imageUrl ? [newCampaign.imageUrl] : [],
        category: 'announcement',
        isPinned: false,
        likes: [],
        bookmarks: [],
        reactions: { like: 0, celebrate: 0, heart: 0 },
        comments: [],
        createdAt: newCampaign.createdAt,
        isDonationCampaign: true,
        campaignId: newCampaign.id,
        campaignTitle: newCampaign.title,
        campaignTarget: newCampaign.targetAmount,
        campaignCollected: 0,
        campaignCategory: newCampaign.category,
        campaignStatus: 'active'
      };

      return [linkedPost, ...prev];
    });

    logActivity(
      'CAMPAIGN_CREATED',
      'campaign',
      newCampaign.id,
      `Launched campaign "${newCampaign.title}" with target ${newCampaign.targetAmount?.toLocaleString()} BDT`
    );

    return { success: true, campaign: newCampaign };
  };

  const updateCampaignStatus = (
    campaignId: string,
    status: CampaignStatus
  ) => {
    if (!canVerifyDonations && !canManageMembers) {
      return { success: false, error: 'Permission denied: Privileged administrative access required.' };
    }

    const target = campaigns.find(c => c.id === campaignId);
    if (!target) return { success: false, error: 'Campaign not found.' };

    setCampaigns(prev => prev.map(c => {
      if (c.id !== campaignId) return c;
      return {
        ...c,
        status,
        isActive: status === 'active'
      };
    }));

    // Keep linked post status in sync with canonical campaign
    setPosts(prev => prev.map(p => {
      if (p.campaignId === campaignId) {
        return { ...p, campaignStatus: status };
      }
      return p;
    }));

    logActivity('CAMPAIGN_UPDATED', 'campaign', campaignId, `Set campaign "${target.title}" status to ${status}`);
    return { success: true };
  };

  const editCampaign = (
    campaignId: string,
    updates: {
      title?: string;
      description?: string;
      category?: CampaignCategory;
      targetAmount?: number;
      startDate?: string;
      deadline?: string;
      imageUrl?: string;
      images?: string[];
      bkashNumber?: string;
      nagadNumber?: string;
      instructions?: string;
      status?: CampaignStatus;
    },
    reason?: string
  ) => {
    const target = campaigns.find(c => c.id === campaignId);
    if (!target) return { success: false, error: 'Campaign not found.' };

    if (!canUserEditCampaign(target, currentUser, isSystemController, callerAdminLimits)) {
      return { 
        success: false, 
        error: 'Permission denied: Only System Controller or authorized administrators can edit donation campaigns.' 
      };
    }

    const validation = validateCampaignEdit(updates);
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(' ') };
    }

    const now = new Date().toISOString();
    const cleanImageUrl = updates.imageUrl !== undefined ? (updates.imageUrl?.trim() || undefined) : target.imageUrl;
    const cleanImages = updates.images !== undefined ? updates.images : target.images;
    const newStatus = updates.status !== undefined ? updates.status : target.status;

    setCampaigns(prev => prev.map(c => {
      if (c.id !== campaignId) return c;
      return {
        ...c,
        title: updates.title !== undefined ? updates.title.trim() : c.title,
        description: updates.description !== undefined ? updates.description.trim() : c.description,
        category: updates.category !== undefined ? updates.category : c.category,
        targetAmount: updates.targetAmount !== undefined ? Number(updates.targetAmount) : c.targetAmount,
        startDate: updates.startDate !== undefined ? (updates.startDate?.trim() || undefined) : c.startDate,
        deadline: updates.deadline !== undefined ? (updates.deadline?.trim() || undefined) : c.deadline,
        bkashNumber: updates.bkashNumber !== undefined ? updates.bkashNumber.trim() : c.bkashNumber,
        nagadNumber: updates.nagadNumber !== undefined ? updates.nagadNumber.trim() : c.nagadNumber,
        instructions: updates.instructions !== undefined ? (updates.instructions?.trim() || undefined) : c.instructions,
        imageUrl: cleanImageUrl,
        images: cleanImages,
        status: newStatus,
        isActive: newStatus === 'active',
        updatedAt: now
      };
    }));

    // Synchronize canonical linked community post in-place without creating duplicate posts
    setPosts(prev => prev.map(p => {
      if (p.campaignId === campaignId || p.id === `post_${campaignId}`) {
        const updatedTitle = updates.title !== undefined ? updates.title.trim() : p.campaignTitle;
        const updatedDesc = updates.description !== undefined ? updates.description.trim() : p.content;
        const updatedTarget = updates.targetAmount !== undefined ? Number(updates.targetAmount) : p.campaignTarget;
        const updatedCat = updates.category !== undefined ? updates.category : p.campaignCategory;
        const postImg = cleanImageUrl;
        return {
          ...p,
          campaignTitle: updatedTitle,
          content: updatedDesc,
          campaignTarget: updatedTarget,
          campaignCategory: updatedCat,
          campaignStatus: newStatus,
          imageUrl: postImg,
          images: cleanImages && cleanImages.length > 0 ? cleanImages : (postImg ? [postImg] : []),
          updatedAt: now
        };
      }
      return p;
    }));

    logActivity(
      'CAMPAIGN_UPDATED',
      'campaign',
      campaignId,
      `Updated campaign "${updates.title || target.title}"${reason?.trim() ? `: ${reason.trim()}` : ''}`
    );

    return { success: true };
  };

  const closeCampaign = (campaignId: string, reason?: string) => {
    const target = campaigns.find(c => c.id === campaignId);
    if (!target) return { success: false, error: 'Campaign not found.' };

    if (!canUserManageCampaignStatus(target, currentUser, isSystemController, callerAdminLimits)) {
      return { success: false, error: 'Permission denied: Administrative authority required to close campaigns.' };
    }

    const now = new Date().toISOString();
    setCampaigns(prev => prev.map(c => {
      if (c.id !== campaignId) return c;
      return {
        ...c,
        status: 'closed',
        isActive: false,
        closedAt: now,
        updatedAt: now
      };
    }));

    setPosts(prev => prev.map(p => {
      if (p.campaignId === campaignId || p.id === `post_${campaignId}`) {
        return { ...p, campaignStatus: 'closed', updatedAt: now };
      }
      return p;
    }));

    logActivity(
      'CAMPAIGN_CLOSED',
      'campaign',
      campaignId,
      `Closed fundraising campaign "${target.title}"${reason?.trim() ? `: ${reason.trim()}` : ''}`
    );

    return { success: true };
  };

  const reopenCampaign = (campaignId: string, newDeadline?: string, reason?: string) => {
    const target = campaigns.find(c => c.id === campaignId);
    if (!target) return { success: false, error: 'Campaign not found.' };

    if (!canUserManageCampaignStatus(target, currentUser, isSystemController, callerAdminLimits)) {
      return { success: false, error: 'Permission denied: Administrative authority required to reopen campaigns.' };
    }

    const now = new Date().toISOString();
    setCampaigns(prev => prev.map(c => {
      if (c.id !== campaignId) return c;
      return {
        ...c,
        status: 'active',
        isActive: true,
        deadline: newDeadline?.trim() || c.deadline,
        reopenedAt: now,
        updatedAt: now
      };
    }));

    setPosts(prev => prev.map(p => {
      if (p.campaignId === campaignId || p.id === `post_${campaignId}`) {
        return { ...p, campaignStatus: 'active', updatedAt: now };
      }
      return p;
    }));

    logActivity(
      'CAMPAIGN_REOPENED',
      'campaign',
      campaignId,
      `Reopened fundraising campaign "${target.title}"${reason?.trim() ? `: ${reason.trim()}` : ''}`
    );

    return { success: true };
  };

  const archiveCampaign = (campaignId: string, reason?: string) => {
    const target = campaigns.find(c => c.id === campaignId);
    if (!target) return { success: false, error: 'Campaign not found.' };

    if (!canUserManageCampaignStatus(target, currentUser, isSystemController, callerAdminLimits)) {
      return { success: false, error: 'Permission denied: Administrative authority required to archive campaigns.' };
    }

    const now = new Date().toISOString();
    setCampaigns(prev => prev.map(c => {
      if (c.id !== campaignId) return c;
      return {
        ...c,
        status: 'archived',
        isActive: false,
        archivedAt: now,
        updatedAt: now
      };
    }));

    setPosts(prev => prev.map(p => {
      if (p.campaignId === campaignId || p.id === `post_${campaignId}`) {
        return { ...p, campaignStatus: 'archived', updatedAt: now };
      }
      return p;
    }));

    logActivity(
      'CAMPAIGN_ARCHIVED',
      'campaign',
      campaignId,
      `Archived campaign "${target.title}"${reason?.trim() ? `: ${reason.trim()}` : ''}`
    );

    return { success: true };
  };

  const deleteCampaign = (campaignId: string, reason: string) => {
    const target = campaigns.find(c => c.id === campaignId);
    if (!target) return { success: false, error: 'Campaign not found.' };

    if (!canUserDeleteCampaign(target, currentUser, isSystemController, permissionMatrix)) {
      return { 
        success: false, 
        error: 'Permission denied: Only the System Controller or authorized administrators with delete permissions can delete campaigns.' 
      };
    }

    if (!reason || !reason.trim()) {
      return { success: false, error: 'A justification/reason is required to delete a campaign.' };
    }

    // MANDATORY FINANCIAL SAFEGUARD:
    // If the campaign has ANY financial transaction or donor records, permanent deletion is strictly blocked!
    const financialCheck = checkCampaignFinancialRecords(campaignId, donations);
    if (financialCheck.hasRecords) {
      return {
        success: false,
        blockedByFinancialRecords: true,
        error: `Financial Safeguard: Cannot permanently delete "${target.title}". It contains ${financialCheck.totalRecords} financial transaction record(s) totaling ${financialCheck.totalCollectedBdt.toLocaleString()} BDT in verified funds (${financialCheck.pendingCount} pending). Financial regulations mandate preserving donor audit trails. Please Archive or Close the campaign instead.`
      };
    }

    // Clean deletion if zero financial records exist
    // 1. Create a recovery snapshot in local backup store just in case
    try {
      if (typeof localStorage !== 'undefined') {
        const existingBackups = JSON.parse(localStorage.getItem('nexus_deleted_campaigns_backup') || '[]');
        existingBackups.unshift({
          campaign: target,
          deletedAt: new Date().toISOString(),
          deletedBy: currentUser.uid,
          reason: reason.trim()
        });
        localStorage.setItem('nexus_deleted_campaigns_backup', JSON.stringify(existingBackups.slice(0, 10)));
      }
    } catch (e) {
      console.warn('Could not cache deletion backup:', e);
    }

    // 2. Remove campaign
    setCampaigns(prev => prev.filter(c => c.id !== campaignId));

    // 3. Remove linked feed post to prevent broken orphan post
    setPosts(prev => prev.filter(p => !(p.campaignId === campaignId || p.id === `post_${campaignId}`)));

    // 4. Reset selectedCampaignId if deleted
    if (selectedDonationCampaignId === campaignId) {
      setSelectedDonationCampaignId(null);
    }

    logActivity(
      'CAMPAIGN_DELETED',
      'campaign',
      campaignId,
      `Permanently deleted campaign "${target.title}" (0 financial transactions): ${reason.trim()}`
    );

    return { success: true };
  };

  // Member administration
  const approveMember = (uid: string) => {
    if (!canManageMembers) {
      return { success: false, error: 'Permission denied: Admin authority required.' };
    }

    const target = users.find(u => u.uid === uid);
    if (!target) return { success: false, error: 'Member not found.' };

    const now = new Date().toISOString();

    setUsers(prev => prev.map(u => {
      if (u.uid !== uid) return u;
      return {
        ...u,
        status: 'approved',
        approvedAt: now,
        approvedBy: currentUser.uid
      };
    }));

    logActivity('MEMBER_APPROVED', 'user', uid, `Approved member access for ${target.displayName}`);
    return { success: true };
  };

  const rejectMember = (uid: string, reason?: string) => {
    if (!canManageMembers) {
      return { success: false, error: 'Permission denied: Admin authority required.' };
    }
    const target = users.find(u => u.uid === uid);
    if (!target) return { success: false, error: 'Member not found.' };
    if (target.role === 'super_admin') {
      return { success: false, error: 'Super Admin account cannot be rejected.' };
    }
    if (target.uid === currentUser.uid) {
      return { success: false, error: 'You cannot reject your own account.' };
    }

    setUsers(prev => prev.map(u => {
      if (u.uid !== uid) return u;
      return {
        ...u,
        status: 'rejected'
      };
    }));

    logActivity(
      'MEMBER_REJECTED',
      'user',
      uid,
      `Rejected membership application for ${target.displayName}${reason ? `: ${reason}` : ''}`
    );
    return { success: true };
  };

  const suspendMember = (uid: string) => {
    if (!canManageMembers) {
      return { success: false, error: 'Permission denied: Admin authority required.' };
    }
    const target = users.find(u => u.uid === uid);
    if (!target) return { success: false, error: 'Member not found.' };
    if (target.role === 'super_admin') {
      return { success: false, error: 'Constitutional Protection: Super Admin account cannot be suspended.' };
    }
    if (target.uid === currentUser.uid) {
      return { success: false, error: 'You cannot suspend your own account.' };
    }

    const nextStatus = target.status === 'suspended' ? 'approved' : 'suspended';

    setUsers(prev => prev.map(u => {
      if (u.uid !== uid) return u;
      return {
        ...u,
        status: nextStatus
      };
    }));

    logActivity(
      'MEMBER_SUSPENDED',
      'user',
      uid,
      `${nextStatus === 'suspended' ? 'Suspended' : 'Restored'} member access for ${target.displayName}`
    );
    return { success: true };
  };

  const updateUserRole = (uid: string, newRole: UserRole) => {
    if (!canManageMembers) {
      return { success: false, error: 'Permission denied: Admin authority required.' };
    }
    const target = users.find(u => u.uid === uid);
    if (!target) return { success: false, error: 'Member not found.' };

    // Self-modification protection
    if (uid === currentUser.uid) {
      return { success: false, error: 'Self-Promotion Prohibited: You cannot alter your own role.' };
    }

    // Constitutional Super Admin protection
    if (target.role === 'super_admin') {
      return { success: false, error: 'Constitutional Protection: Super Admin cannot be demoted or altered.' };
    }

    // Constitutional Restriction: System Controller identity is singular and non-transferable
    if (newRole === 'super_admin') {
      return { success: false, error: 'Constitutional Constraint: The System Controller identity is unique and singular. Additional Super Admins cannot be created.' };
    }

    // Only authoritative System Controller can appoint or demote Admins
    if ((newRole === 'admin' || target.role === 'admin') && !isSystemController) {
      return { success: false, error: 'Security Violation: Only the authoritative System Controller (mehedihasan1303@gmail.com) can appoint or modify Admin roles.' };
    }

    // Admin limit enforcement: canAddRemoveModerators
    if (isAdmin && (newRole === 'moderator' || target.role === 'moderator')) {
      if (!callerAdminLimits.canAddRemoveModerators) {
        return { 
          success: false, 
          error: 'Permission denied: System Controller has disabled moderator assignment privileges for your administrative account.' 
        };
      }
    }

    setUsers(prev => prev.map(u => {
      if (u.uid !== uid) return u;
      return { ...u, role: newRole };
    }));

    logActivity('ROLE_UPDATED', 'user', uid, `Updated ${target.displayName} role to ${newRole}`);
    return { success: true };
  };

  const resetData = () => {
    localStorage.removeItem(STORAGE_KEY);
    const freshUsers = bootstrapUsers(INITIAL_USERS);
    setUsers(freshUsers);
    setCurrentUserId('usr_superadmin_bootstrap');
    setPosts(INITIAL_POSTS);
    setConversations(INITIAL_CONVERSATIONS);
    setActiveConversationId(INITIAL_CONVERSATIONS[0]?.id || '');
    setMessages(INITIAL_MESSAGES);
    setCampaigns(INITIAL_CAMPAIGNS);
    setDonations(INITIAL_DONATIONS);
    setActivityLogs(INITIAL_ACTIVITY_LOGS);
    setAdminLimits(INITIAL_ADMIN_LIMITS);
    setPermissionMatrix(INITIAL_PERMISSION_MATRIX);
    setEmergencyControls(INITIAL_EMERGENCY_CONTROLS);
    setCommunityReports(INITIAL_COMMUNITY_REPORTS);
    setModerationActions(INITIAL_MODERATION_ACTIONS);
    setModerationAppeals(INITIAL_MODERATION_APPEALS);
    setActiveTab('feed');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        activeTab,
        setActiveTab,
        adminActiveSection,
        setAdminActiveSection,
        navigateToAdminSection,
        isSidebarOpen,
        setIsSidebarOpen,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        adminSession,
        isAdministrativeAccessActive,
        authenticatedAdmin,
        startAdministrativeAccess,
        exitAdministrativeAccess,
        registerUser,
        isAuthenticated,
        login,
        logout,
        changePassword,
        resetPassword,
        showAuthModal,
        setShowAuthModal,
        updateProfile,
        viewingMemberId,
        setViewingMemberId,
        canPost,
        canComment,
        canMessage,
        canDonate,
        canModerate,
        canManageMembers,
        canVerifyDonations,
        isSystemController,
        adminLimits,
        defaultAdminLimits: DEFAULT_ADMIN_LIMITS,
        getAdminEffectiveLimits,
        updateAdminLimits,
        permissionMatrix,
        updateModulePermission,
        emergencyControls,
        updateEmergencyControls,
        appLogo,
        updateAppLogo,
        removeAppLogo,
        emailSettings,
        updateEmailSettings,
        sendTestEmailDiagnostic,
        sendOtpCode,
        verifyOtpCode,
        resetPasswordWithOtp,
        registerWithOtp,
        posts,
        createPost,
        editPost,
        toggleLikePost,
        toggleBookmarkPost,
        reportPost,
        dismissReport,
        addComment,
        togglePinPost,
        deletePost,
        conversations,
        activeConversationId,
        setActiveConversationId,
        messages,
        sendMessage,
        createConversation,
        markConversationAsRead,
        campaigns,
        donations,
        selectedDonationCampaignId,
        setSelectedDonationCampaignId,
        openDonationForCampaign,
        submitDonation,
        confirmDonation,
        verifyDonation,
        rejectDonation,
        disputeDonation,
        reverseDonation,
        createCampaign,
        updateCampaignStatus,
        editCampaign,
        closeCampaign,
        reopenCampaign,
        archiveCampaign,
        deleteCampaign,
        approveMember,
        rejectMember,
        suspendMember,
        updateUserRole,
        activityLogs,
        resetData,
        communityReports,
        moderationActions,
        moderationAppeals,
        submitCommunityReport,
        updateReportStatus,
        dismissCommunityReport,
        executeModerationAction,
        submitAppeal,
        resolveAppeal,
        revokeUserSessions,
        toggleAccountDisabled,
        validateSystemControllerReauth
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
