import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, UserProfile, ActivityLog, AdminPermissionLimits, ModulePermissionRule } from '../types';
import { ImageLightbox } from './ImageLightbox';
import { VerifiedBadge } from './VerifiedBadge';
import { SystemSettingsView } from './SystemSettingsView';
import { CommunityModerationSection } from './moderation/CommunityModerationSection';
import { 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Users, 
  CreditCard, 
  Clock, 
  AlertCircle, 
  Search, 
  ShieldAlert,
  UserCheck,
  UserX,
  History,
  FileCheck,
  Trash2,
  Image as ImageIcon,
  KeyRound,
  Eye,
  Lock,
  Sliders,
  AlertTriangle,
  Radio,
  Power,
  RotateCcw,
  Check,
  X,
  FileText,
  Filter,
  Layers,
  Activity,
  UserCog,
  Settings
} from 'lucide-react';


export const AdminHubView: React.FC = () => {
  const { 
    currentUser, 
    users, 
    donations, 
    posts,
    verifyDonation, 
    rejectDonation, 
    approveMember, 
    rejectMember,
    suspendMember, 
    updateUserRole, 
    dismissReport,
    deletePost,
    activityLogs,
    canManageMembers,
    canVerifyDonations,
    startAdministrativeAccess,
    authenticatedAdmin,
    isSystemController,
    adminLimits,
    defaultAdminLimits,
    getAdminEffectiveLimits,
    updateAdminLimits,
    permissionMatrix,
    updateModulePermission,
    emergencyControls,
    updateEmergencyControls,
    appLogo,
    updateAppLogo,
    removeAppLogo,
    communityReports,
    adminActiveSection,
    setAdminActiveSection
  } = useApp();

  const activeSection = adminActiveSection;
  const setActiveSection = setAdminActiveSection;
  const isAdmin = currentUser.role === 'admin';
  const isModerator = currentUser.role === 'moderator';
  const callerAdminLimits = (isAdmin && currentUser?.uid) ? getAdminEffectiveLimits(currentUser.uid) : defaultAdminLimits;
  const [logoInputFile, setLogoInputFile] = useState<{
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  } | null>(null);
  const [logoInputError, setLogoInputError] = useState('');
  const [rejectingDonationId, setRejectingDonationId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewingSlipUrl, setViewingSlipUrl] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Privileged Account Inspection Modal state
  const [inspectTargetUser, setInspectTargetUser] = useState<UserProfile | null>(null);
  const [reauthPassword, setReauthPassword] = useState('');
  const [accessReason, setAccessReason] = useState('');
  const [inspectError, setInspectError] = useState('');
  const [inspectLoading, setInspectLoading] = useState(false);

  // Role Change Confirmation Modal
  const [roleChangeTarget, setRoleChangeTarget] = useState<UserProfile | null>(null);
  const [newSelectedRole, setNewSelectedRole] = useState<UserRole>('member');
  const [roleChangeReason, setRoleChangeReason] = useState('');

  // Member search in role manager
  const [memberSearch, setMemberSearch] = useState('');

  // Admin Limits state
  const adminsList = users.filter(u => u.role === 'admin');
  const [selectedAdminUid, setSelectedAdminUid] = useState<string>(adminsList[0]?.uid || '');
  const [editingLimits, setEditingLimits] = useState<AdminPermissionLimits>(
    selectedAdminUid ? getAdminEffectiveLimits(selectedAdminUid) : defaultAdminLimits
  );
  const [limitsReason, setLimitsReason] = useState('');

  // Permission Matrix Editing
  const [editingMatrixRule, setEditingMatrixRule] = useState<ModulePermissionRule | null>(null);
  const [matrixAction, setMatrixAction] = useState<'view' | 'create' | 'edit' | 'delete' | 'approve'>('create');
  const [matrixRoles, setMatrixRoles] = useState<UserRole[]>([]);
  const [matrixReason, setMatrixReason] = useState('');

  // Emergency Control Toggle Modal
  const [emergencyToggleTarget, setEmergencyToggleTarget] = useState<{
    key: keyof typeof emergencyControls;
    label: string;
    nextValue: boolean;
  } | null>(null);
  const [emergencyReason, setEmergencyReason] = useState('');

  // Emergency Account Restriction
  const [emergencyRestrictUser, setEmergencyRestrictUser] = useState<UserProfile | null>(null);
  const [emergencyRestrictReason, setEmergencyRestrictReason] = useState('');

  // Audit Logs Filter & Modal
  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilterAction, setAuditFilterAction] = useState<string>('ALL');
  const [auditFilterOutcome, setAuditFilterOutcome] = useState<string>('ALL');
  const [inspectingLog, setInspectingLog] = useState<ActivityLog | null>(null);

  if (!canManageMembers && !canVerifyDonations && !isSystemController) {
    return (
      <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center max-w-xl mx-auto space-y-3 shadow-xs">
        <ShieldAlert size={36} className="text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-[#262626]">Access Prohibited</h2>
        <p className="text-xs text-[#737373]">
          The Administrative Verification Hub and System Controller Center are strictly restricted to verified Executive Administrators and the System Controller (mehedihasan1303@gmail.com).
        </p>
      </div>
    );
  }

  const pendingDonations = donations.filter(d => d.status === 'pending');
  const pendingMembers = users.filter(u => u.status === 'pending');
  const reportedPosts = posts.filter(p => p.reports && p.reports.length > 0);

  // Handlers
  const handleVerifyDonation = (id: string) => {
    setActionSuccess('');
    setActionError('');
    const res = verifyDonation(id);
    if (res.success) {
      setActionSuccess('Donation verified! Funds certified and added to ledger.');
      setTimeout(() => setActionSuccess(''), 4000);
    } else {
      setActionError(res.error || 'Verification failed.');
    }
  };

  const handleRejectDonationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingDonationId) return;
    const res = rejectDonation(rejectingDonationId, rejectReason);
    if (res.success) {
      setActionSuccess('Donation rejected and logged.');
      setRejectingDonationId(null);
      setRejectReason('');
      setTimeout(() => setActionSuccess(''), 4000);
    } else {
      setActionError(res.error || 'Failed to reject donation.');
    }
  };

  const handleApproveMember = (uid: string) => {
    setActionSuccess('');
    setActionError('');
    const res = approveMember(uid);
    if (res.success) {
      setActionSuccess('Member successfully approved for full platform access.');
      setTimeout(() => setActionSuccess(''), 4000);
    } else {
      setActionError(res.error || 'Failed to approve member.');
    }
  };

  const handleRejectMember = (uid: string) => {
    setActionSuccess('');
    setActionError('');
    const res = rejectMember(uid, 'Membership application declined by council.');
    if (res.success) {
      setActionSuccess('Application rejected.');
      setTimeout(() => setActionSuccess(''), 4000);
    } else {
      setActionError(res.error || 'Failed to reject member.');
    }
  };

  const handleSuspendMember = (uid: string) => {
    setActionSuccess('');
    setActionError('');
    const res = suspendMember(uid);
    if (res.success) {
      setActionSuccess('Member status updated successfully.');
      setTimeout(() => setActionSuccess(''), 4000);
    } else {
      setActionError(res.error || 'Failed to update member status.');
    }
  };

  const handleDismissReport = (postId: string) => {
    setActionSuccess('');
    const res = dismissReport(postId);
    if (res.success) {
      setActionSuccess('Reports dismissed. Post kept in community feed.');
      setTimeout(() => setActionSuccess(''), 3000);
    }
  };

  const handleDeleteReportedPost = (postId: string) => {
    setActionSuccess('');
    deletePost(postId);
    setActionSuccess('Reported post deleted from community feed.');
    setTimeout(() => setActionSuccess(''), 3000);
  };

  const confirmRoleChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleChangeTarget) return;
    setActionSuccess('');
    setActionError('');

    const res = updateUserRole(roleChangeTarget.uid, newSelectedRole);
    if (res.success) {
      setActionSuccess(`Role for ${roleChangeTarget.displayName} successfully updated to ${newSelectedRole}.`);
      setRoleChangeTarget(null);
      setRoleChangeReason('');
      setTimeout(() => setActionSuccess(''), 4000);
    } else {
      setActionError(res.error || 'Failed to update role.');
    }
  };

  const handleSaveAdminLimits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdminUid) return;
    setActionSuccess('');
    setActionError('');

    const res = updateAdminLimits(selectedAdminUid, editingLimits, limitsReason);
    if (res.success) {
      setActionSuccess('Administrator permission limits saved and logged to audit trail.');
      setLimitsReason('');
      setTimeout(() => setActionSuccess(''), 4000);
    } else {
      setActionError(res.error || 'Failed to update administrator limits.');
    }
  };

  const handleSaveMatrixRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatrixRule) return;
    setActionSuccess('');
    setActionError('');

    const res = updateModulePermission(editingMatrixRule.moduleId, matrixAction, matrixRoles, matrixReason);
    if (res.success) {
      setActionSuccess(`Permission matrix for ${editingMatrixRule.moduleName} (${matrixAction.toUpperCase()}) updated.`);
      setEditingMatrixRule(null);
      setMatrixReason('');
      setTimeout(() => setActionSuccess(''), 4000);
    } else {
      setActionError(res.error || 'Failed to update permission matrix.');
    }
  };

  const handleSaveEmergencyToggle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyToggleTarget) return;
    setActionSuccess('');
    setActionError('');

    const res = updateEmergencyControls(
      { [emergencyToggleTarget.key]: emergencyToggleTarget.nextValue },
      emergencyReason
    );

    if (res.success) {
      setActionSuccess(`Emergency switch "${emergencyToggleTarget.label}" set to ${emergencyToggleTarget.nextValue ? 'ON' : 'OFF'}.`);
      setEmergencyToggleTarget(null);
      setEmergencyReason('');
      setTimeout(() => setActionSuccess(''), 4000);
    } else {
      setActionError(res.error || 'Failed to update emergency control.');
    }
  };

  const handleEmergencyRestrictMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyRestrictUser) return;
    setActionSuccess('');
    setActionError('');

    const nextRole: UserRole = emergencyRestrictUser.role === 'restricted_member' ? 'member' : 'restricted_member';
    const res = updateUserRole(emergencyRestrictUser.uid, nextRole);

    if (res.success) {
      setActionSuccess(`Account ${emergencyRestrictUser.displayName} ${nextRole === 'restricted_member' ? 'restricted' : 'restored'}.`);
      setEmergencyRestrictUser(null);
      setEmergencyRestrictReason('');
      setTimeout(() => setActionSuccess(''), 4000);
    } else {
      setActionError(res.error || 'Failed to update account restriction.');
    }
  };

  // Filtered lists
  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(memberSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const filteredLogs = activityLogs.filter(l => {
    const matchesSearch = 
      l.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.actorName.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      (l.reason && l.reason.toLowerCase().includes(auditSearch.toLowerCase()));
    const matchesAction = auditFilterAction === 'ALL' || l.action === auditFilterAction;
    const matchesOutcome = auditFilterOutcome === 'ALL' || l.outcome === auditFilterOutcome;
    return matchesSearch && matchesAction && matchesOutcome;
  });

  const isEmergencyActive = 
    emergencyControls.maintenanceMode || 
    emergencyControls.freezeDonations || 
    emergencyControls.pauseRegistrations || 
    emergencyControls.restrictedPostingMode;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#DBDBDB] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 mb-2">
            <ShieldCheck size={14} className="text-purple-600" /> 
            {isSystemController 
              ? 'Authoritative Master Control Center' 
              : isAdmin 
              ? 'Executive Administrator Panel' 
              : 'Community Moderation Desk'}
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            {isSystemController 
              ? 'System Control' 
              : isAdmin 
              ? 'Admin Control Center' 
              : 'Moderator Control Desk'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isSystemController 
              ? 'Manage your community from one place' 
              : isAdmin 
              ? 'Community operations and member administration within assigned limits' 
              : 'Review reported community content and maintain discourse standards'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-600 bg-[#FAFAFA] px-3.5 py-2 rounded-xl border border-[#DBDBDB] flex items-center gap-2 shadow-xs">
            <span className="text-slate-400">Identity:</span>
            <strong className="text-slate-800">{currentUser.displayName}</strong>
            <VerifiedBadge user={currentUser} size="xs" />
            <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-full ${
              isSystemController 
                ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                : isAdmin 
                ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' 
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}>
              {isSystemController ? 'System Controller' : currentUser.role}
            </span>
          </div>
        </div>
      </div>

      {/* Emergency Active Status Alert */}
      {isEmergencyActive && (
        <div className="bg-rose-50 border-2 border-rose-400 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900">Emergency Protocol Active</h4>
              <p className="text-xs text-rose-700">
                Active policies: 
                {emergencyControls.maintenanceMode && ' [Maintenance Mode]'}
                {emergencyControls.freezeDonations && ' [Donations Frozen]'}
                {emergencyControls.pauseRegistrations && ' [Registrations Paused]'}
                {emergencyControls.restrictedPostingMode && ' [Restricted Posting]'}
                {emergencyControls.reason && ` — "${emergencyControls.reason}"`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveSection('emergency')}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shrink-0 cursor-pointer"
          >
            Manage Controls
          </button>
        </div>
      )}

      {/* Global Alerts */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center gap-2 shadow-xs">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="bg-rose-50 border border-rose-300 text-rose-800 text-xs p-3.5 rounded-xl flex items-center gap-2 shadow-xs">
          <AlertCircle size={16} className="text-rose-600 shrink-0" /> {actionError}
        </div>
      )}

      {/* Section Navigation Tabs */}
      {/* Section Navigation Tabs (Role Filtered) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#DBDBDB]">
        {/* Overview (System Controller & Admin) */}
        {!isModerator && (
          <button
            onClick={() => setActiveSection('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeSection === 'overview' 
                ? 'bg-purple-700 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-gray-100'
            }`}
          >
            <Activity size={14} />
            <span>Dashboard</span>
          </button>
        )}

        {/* Roles & RBAC (System Controller or Admins with canAddRemoveModerators) */}
        {(isSystemController || (isAdmin && callerAdminLimits.canAddRemoveModerators)) && (
          <button
            onClick={() => setActiveSection('roles')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeSection === 'roles' 
                ? 'bg-purple-700 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-gray-100'
            }`}
          >
            <ShieldCheck size={14} />
            <span>{isSystemController ? 'Role Hierarchy' : 'Moderator Management'}</span>
          </button>
        )}

        {/* Permission Matrix (System Controller Only) */}
        {isSystemController && (
          <button
            onClick={() => setActiveSection('matrix')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeSection === 'matrix' 
                ? 'bg-purple-700 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-gray-100'
            }`}
          >
            <Layers size={14} />
            <span>Permission Matrix</span>
          </button>
        )}

        {/* Admin Limits (System Controller Only) */}
        {isSystemController && (
          <button
            onClick={() => setActiveSection('limits')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeSection === 'limits' 
                ? 'bg-purple-700 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-gray-100'
            }`}
          >
            <Sliders size={14} />
            <span>Admin Limits ({adminsList.length})</span>
          </button>
        )}

        {/* Emergency Controls (System Controller Only) */}
        {isSystemController && (
          <button
            onClick={() => setActiveSection('emergency')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeSection === 'emergency' 
                ? 'bg-purple-700 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-gray-100'
            }`}
          >
            <Power size={14} className={isEmergencyActive ? 'text-rose-400' : ''} />
            <span>Emergency Controls</span>
            {isEmergencyActive && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            )}
          </button>
        )}

        {/* App Logo & Identity (System Controller Only) */}
        {isSystemController && (
          <button
            onClick={() => setActiveSection('logo')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeSection === 'logo' 
                ? 'bg-purple-700 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-gray-100'
            }`}
          >
            <ImageIcon size={14} />
            <span>App Logo & Identity</span>
          </button>
        )}

        {/* System Settings (System Controller Only) */}
        {isSystemController && (
          <button
            onClick={() => setActiveSection('settings')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeSection === 'settings' 
                ? 'bg-purple-700 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-gray-100'
            }`}
          >
            <Settings size={14} />
            <span>Settings</span>
          </button>
        )}


        {/* Membership Approvals (System Controller or Admins with canApproveSuspendMembers) */}
        {(isSystemController || (isAdmin && callerAdminLimits.canApproveSuspendMembers)) && (
          <button
            onClick={() => setActiveSection('members')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeSection === 'members' 
                ? 'bg-purple-700 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-gray-100'
            }`}
          >
            <Users size={14} />
            <span>Approvals</span>
            {pendingMembers.length > 0 && (
              <span className="bg-amber-400 text-slate-900 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                {pendingMembers.length}
              </span>
            )}
          </button>
        )}

        {/* Donation Queue (System Controller or Admins with canReviewVerifyDonations) */}
        {(isSystemController || (isAdmin && callerAdminLimits.canReviewVerifyDonations)) && (
          <button
            onClick={() => setActiveSection('donations')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeSection === 'donations' 
                ? 'bg-purple-700 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-gray-100'
            }`}
          >
            <CreditCard size={14} />
            <span>Donations</span>
            {pendingDonations.length > 0 && (
              <span className="bg-amber-400 text-slate-900 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                {pendingDonations.length}
              </span>
            )}
          </button>
        )}

        {/* Security & Community Moderation Center (System Controller, Permitted Admin, or Moderator) */}
        {(isSystemController || isModerator || (isAdmin && callerAdminLimits.canDeleteModeratePosts)) && (
          <button
            onClick={() => setActiveSection('moderation')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeSection === 'moderation' 
                ? 'bg-purple-700 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-gray-100'
            }`}
          >
            <ShieldAlert size={14} />
            <span>Moderation & Safety</span>
            {communityReports.filter(r => r.status === 'pending').length > 0 && (
              <span className="bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                {communityReports.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
        )}

        {/* Reported Posts / Content Moderation (System Controller, Permitted Admin, or Moderator) */}
        {(isSystemController || isModerator || (isAdmin && callerAdminLimits.canDeleteModeratePosts)) && (
          <button
            onClick={() => setActiveSection('reports')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeSection === 'reports' 
                ? 'bg-purple-700 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-gray-100'
            }`}
          >
            <AlertCircle size={14} />
            <span>Legacy Flagged Posts</span>
            {reportedPosts.length > 0 && (
              <span className="bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                {reportedPosts.length}
              </span>
            )}
          </button>
        )}

        {/* Audit Log (System Controller or Permitted Admin) */}
        {(isSystemController || (isAdmin && callerAdminLimits.canViewAdminReports)) && (
          <button
            onClick={() => setActiveSection('audit')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeSection === 'audit' 
                ? 'bg-purple-700 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-gray-100'
            }`}
          >
            <History size={14} />
            <span>Audit Logs</span>
          </button>
        )}
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: SIMPLE SYSTEM CONTROLLER / ADMIN DASHBOARD     */}
      {/* ========================================================= */}
      {activeSection === 'overview' && !isModerator && (
        <div className="space-y-6">
          {/* Summary Cards (5 Metrics calculated from real authorized application data) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Card 1: Total Members */}
            <div className="bg-white border border-[#DBDBDB] rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Users size={14} className="text-purple-600" />
                <span>Total Members</span>
              </div>
              <div className="text-2xl font-black text-slate-800 tracking-tight">{users.length}</div>
              <p className="text-[10px] text-slate-500 mt-1">Verified alumni community</p>
            </div>

            {/* Card 2: Admin & Moderator Counts */}
            <div className="bg-white border border-[#DBDBDB] rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-cyan-600" />
                <span>Leadership Tier</span>
              </div>
              <div className="text-xl font-black text-slate-800 tracking-tight mt-0.5">
                {users.filter(u => u.role === 'admin').length} Admins
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {users.filter(u => u.role === 'moderator').length} Moderators active
              </p>
            </div>

            {/* Card 3: Pending Approvals or Tasks */}
            <div className="bg-white border border-[#DBDBDB] rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <UserCheck size={14} className="text-amber-600" />
                <span>Pending Approvals</span>
              </div>
              <div className="text-2xl font-black text-amber-600 tracking-tight">
                {pendingMembers.length}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {pendingMembers.length === 1 ? '1 profile waiting' : `${pendingMembers.length} profiles waiting`}
              </p>
            </div>

            {/* Card 4: Donation Review Status */}
            <div className="bg-white border border-[#DBDBDB] rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <CreditCard size={14} className="text-emerald-600" />
                <span>Donation Status</span>
              </div>
              <div className="text-xl font-black text-emerald-700 tracking-tight mt-0.5">
                {pendingDonations.length} Pending
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {pendingDonations.reduce((sum, d) => sum + d.amount, 0).toLocaleString()} BDT in queue
              </p>
            </div>

            {/* Card 5: Recent Security Activity */}
            <div className="bg-white border border-[#DBDBDB] rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <History size={14} className="text-rose-600" />
                <span>Security Events</span>
              </div>
              <div className="text-xs font-bold text-slate-800 truncate mt-1">
                {activityLogs[0]?.action || 'SYSTEM_INITIALIZED'}
              </div>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                By {activityLogs[0]?.actorName || 'System'} • {new Date(activityLogs[0]?.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Six Simple Action Cards (Requirement 4) */}
          <div>
            <div className="mb-3">
              <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <Sliders size={16} className="text-purple-600" />
                <span>Quick Administration Actions</span>
              </h2>
              <p className="text-xs text-slate-500">
                Direct access to core administrative and community oversight modules
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* Action 1: Manage Members & Roles */}
              <div 
                onClick={() => {
                  if (isSystemController || (isAdmin && callerAdminLimits.canAddRemoveModerators)) {
                    setActiveSection('roles');
                  } else if (isAdmin && callerAdminLimits.canApproveSuspendMembers) {
                    setActiveSection('members');
                  }
                }}
                className="bg-white hover:bg-purple-50/40 border border-[#DBDBDB] hover:border-purple-300 p-4 rounded-2xl transition cursor-pointer shadow-xs group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 group-hover:text-purple-700 transition-colors">
                      Manage Members & Roles
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Inspect registered alumni, adjust roles, and approve membership applicants.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action 2: Set Admin Permissions (System Controller only) */}
              <div 
                onClick={() => {
                  if (isSystemController) {
                    setActiveSection('matrix');
                  }
                }}
                className={`bg-white border p-4 rounded-2xl transition shadow-xs group ${
                  isSystemController 
                    ? 'hover:bg-purple-50/40 border-[#DBDBDB] hover:border-purple-300 cursor-pointer' 
                    : 'opacity-60 border-slate-200 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Sliders size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 group-hover:text-purple-700 transition-colors flex items-center gap-1.5">
                      <span>Set Admin Permissions</span>
                      {!isSystemController && <Lock size={12} className="text-slate-400" />}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {isSystemController 
                        ? 'Centralized module permission matrix and administrator permission ceilings.' 
                        : 'Ceilings enforced by System Controller.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action 3: Manage Community Content */}
              <div 
                onClick={() => {
                  if (isSystemController || isModerator || (isAdmin && callerAdminLimits.canDeleteModeratePosts)) {
                    setActiveSection('reports');
                  }
                }}
                className="bg-white hover:bg-purple-50/40 border border-[#DBDBDB] hover:border-purple-300 p-4 rounded-2xl transition cursor-pointer shadow-xs group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ShieldAlert size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 group-hover:text-purple-700 transition-colors">
                      Manage Community Content
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Review flagged community posts, comments, and reported policy violations.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action 4: Review Donations */}
              <div 
                onClick={() => {
                  if (isSystemController || (isAdmin && callerAdminLimits.canReviewVerifyDonations)) {
                    setActiveSection('donations');
                  }
                }}
                className="bg-white hover:bg-purple-50/40 border border-[#DBDBDB] hover:border-purple-300 p-4 rounded-2xl transition cursor-pointer shadow-xs group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 group-hover:text-purple-700 transition-colors">
                      Review Donations
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Audit bKash and Nagad payment slips and certify financial endowment pledges.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action 5: View Activity & Security */}
              <div 
                onClick={() => {
                  if (isSystemController || (isAdmin && callerAdminLimits.canViewAdminReports)) {
                    setActiveSection('audit');
                  }
                }}
                className="bg-white hover:bg-purple-50/40 border border-[#DBDBDB] hover:border-purple-300 p-4 rounded-2xl transition cursor-pointer shadow-xs group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <History size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 group-hover:text-purple-700 transition-colors">
                      View Activity & Security
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Inspect immutable audit logs, session records, and trigger emergency controls.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action 6: Configure App Settings (System Controller only) */}
              <div 
                onClick={() => {
                  if (isSystemController) {
                    setActiveSection('settings');
                  }
                }}
                className={`bg-white border p-4 rounded-2xl transition shadow-xs group ${
                  isSystemController 
                    ? 'hover:bg-purple-50/40 border-[#DBDBDB] hover:border-purple-300 cursor-pointer' 
                    : 'opacity-60 border-slate-200 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Settings size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 group-hover:text-purple-700 transition-colors flex items-center gap-1.5">
                      <span>Configure System Settings</span>
                      {!isSystemController && <Lock size={12} className="text-slate-400" />}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {isSystemController 
                        ? 'Configure Firebase cloud services, email OTP settings, security policies, and health diagnostics.' 
                        : 'Exclusive to System Controller.'}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Quick System Controller Summary Card (Exclusive to System Controller) */}
          {isSystemController && (
            <div className="bg-gradient-to-br from-slate-900 to-purple-950 text-white rounded-2xl p-6 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-full border border-purple-500/30 inline-block mb-1">
                    Authoritative Root Identity
                  </span>
                  <h3 className="text-lg font-bold">mehedihasan1303@gmail.com</h3>
                  <p className="text-xs text-purple-200 mt-0.5">
                    Constitutional Super Admin & Supreme System Controller. Client self-escalation is strictly prohibited.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveSection('emergency')}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Power size={14} /> Emergency Station
                  </button>
                  <button
                    onClick={() => setActiveSection('matrix')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Layers size={14} /> Module Matrix
                  </button>
                </div>
              </div>

              {/* Status Breakdown Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-purple-800/60 text-xs">
                <div>
                  <div className="text-purple-300 text-[11px]">System Status</div>
                  <div className="font-bold flex items-center gap-1 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${isEmergencyActive ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
                    {isEmergencyActive ? 'Emergency Mode' : 'Nominal & Healthy'}
                  </div>
                </div>
                <div>
                  <div className="text-purple-300 text-[11px]">Enforcement Engine</div>
                  <div className="font-bold mt-0.5">Firestore Rules v2</div>
                </div>
                <div>
                  <div className="text-purple-300 text-[11px]">Audit Logging</div>
                  <div className="font-bold mt-0.5">{activityLogs.length} immutable events</div>
                </div>
                <div>
                  <div className="text-purple-300 text-[11px]">Controlled Admins</div>
                  <div className="font-bold mt-0.5">{adminsList.length} Active Admins</div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Governance & Security Activity */}
          <div className="bg-white border border-[#DBDBDB] rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <History size={16} className="text-purple-600" />
                Recent Governance & Security Activity
              </h3>
              {(isSystemController || (isAdmin && callerAdminLimits.canViewAdminReports)) && (
                <button
                  onClick={() => setActiveSection('audit')}
                  className="text-xs text-purple-700 font-semibold hover:underline cursor-pointer"
                >
                  View Full Audit Log ({activityLogs.length})
                </button>
              )}
            </div>

            <div className="space-y-2">
              {activityLogs.slice(0, 5).map(log => (
                <div
                  key={log.id}
                  onClick={() => setInspectingLog(log)}
                  className="bg-[#FAFAFA] hover:bg-gray-100/80 border border-[#DBDBDB] p-3 rounded-xl flex items-start justify-between gap-3 text-xs transition cursor-pointer"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-slate-800">{log.actorName}</span>
                      <span className="text-[10px] text-slate-500">({log.actorRole})</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase border ${
                        log.outcome === 'denied' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        log.outcome === 'failure' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {log.action}
                      </span>
                    </div>
                    <p className="text-slate-700 text-[11px]">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Access Denied Card for Moderator attempting to open Overview or other panels */}
      {isModerator && activeSection !== 'reports' && (
        <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center max-w-lg mx-auto space-y-3 shadow-xs">
          <ShieldAlert size={36} className="text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Module Access Denied</h3>
          <p className="text-xs text-slate-500">
            Your account role is Moderator. Moderator permissions are strictly confined to Content Moderation & Reports.
          </p>
          <button
            onClick={() => setActiveSection('reports')}
            className="px-4 py-2 rounded-xl bg-purple-700 text-white text-xs font-bold hover:bg-purple-800 transition cursor-pointer"
          >
            Go to Content Moderation
          </button>
        </div>
      )}

      {/* Access Denied Card for Admin attempting to open restricted System Controller panels */}
      {isAdmin && !isSystemController && ['matrix', 'limits', 'emergency', 'logo'].includes(activeSection) && (
        <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center max-w-lg mx-auto space-y-3 shadow-xs">
          <ShieldAlert size={36} className="text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">System Controller Access Required</h3>
          <p className="text-xs text-slate-500">
            Permission matrices, admin limit ceilings, emergency stations, and official app settings are strictly reserved for the authoritative System Controller (mehedihasan1303@gmail.com).
          </p>
          <button
            onClick={() => setActiveSection('overview')}
            className="px-4 py-2 rounded-xl bg-purple-700 text-white text-xs font-bold hover:bg-purple-800 transition cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: ROLE MANAGEMENT & RBAC                         */}
      {/* ========================================================= */}
      {activeSection === 'roles' && (
        <div className="bg-white border border-[#DBDBDB] rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#262626] flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#DD2A7B]" />
                Role Hierarchy & Assignment Engine
              </h2>
              <p className="text-xs text-[#737373] mt-0.5">
                Manage roles (Super Admin, Admin, Moderator, Member, Restricted). Anti-self-escalation enforced.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-3 text-[#737373]" />
              <input
                type="text"
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                placeholder="Search member name/email..."
                className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl pl-9 pr-3 py-2 text-xs text-[#262626] placeholder-[#737373] focus:outline-none focus:border-[#DD2A7B]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#DBDBDB] text-[#737373] text-[10px] uppercase tracking-wider bg-[#FAFAFA]">
                  <th className="py-2.5 px-3 font-semibold">Member Identity</th>
                  <th className="py-2.5 px-3 font-semibold">Account Status</th>
                  <th className="py-2.5 px-3 font-semibold">Assigned Role</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DBDBDB] text-[#262626]">
                {filteredUsers.map(u => {
                  const isSuperAdminAccount = u.role === 'super_admin';
                  const isSelf = u.uid === currentUser.uid;

                  return (
                    <tr key={u.uid} className="hover:bg-gray-50/80 transition">
                      <td className="py-3 px-3 flex items-center gap-2.5">
                        <img src={u.avatarUrl} alt={u.displayName} className="w-8 h-8 rounded-lg object-cover border border-[#DBDBDB]" />
                        <div>
                          <div className="font-bold text-[#262626] flex items-center gap-1.5 flex-wrap">
                            <span>{u.displayName}</span>
                            <VerifiedBadge user={u} size="xs" />
                            {isSuperAdminAccount && (
                              <span className="text-[9px] bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded border border-purple-200 font-semibold">
                                System Controller
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#737373]">{u.email}</div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          u.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          u.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {u.status}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="capitalize font-semibold text-xs px-2 py-0.5 rounded-lg bg-gray-100 border border-gray-200">
                          {u.role === 'super_admin' ? 'Super Admin' : u.role}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {isSuperAdminAccount ? (
                            <span className="text-[10px] text-purple-700 font-bold px-2 py-0.5 bg-purple-50 rounded border border-purple-200">
                              Immutable Root
                            </span>
                          ) : isSelf ? (
                            <span className="text-[10px] text-[#737373] px-2 py-0.5">
                              Current Session
                            </span>
                          ) : (
                            <>
                              {/* Change Role Button (Opens Confirmation Modal) */}
                              <button
                                onClick={() => {
                                  setRoleChangeTarget(u);
                                  setNewSelectedRole(u.role);
                                  setRoleChangeReason('');
                                }}
                                className="text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition cursor-pointer bg-white text-[#262626] border-[#DBDBDB] hover:bg-gray-100 flex items-center gap-1"
                              >
                                <UserCog size={12} /> Assign Role
                              </button>

                              {/* Suspend / Restore Button */}
                              <button
                                onClick={() => handleSuspendMember(u.uid)}
                                className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition cursor-pointer ${
                                  u.status === 'suspended'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                                }`}
                              >
                                {u.status === 'suspended' ? 'Restore' : 'Suspend'}
                              </button>

                              {/* Privileged Inspection (System Controller Only) */}
                              {isSystemController && (
                                <button
                                  onClick={() => {
                                    setInspectTargetUser(u);
                                    setReauthPassword('');
                                    setAccessReason('');
                                    setInspectError('');
                                  }}
                                  title="System Controller Privileged Support Access"
                                  className="text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition cursor-pointer bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 flex items-center gap-1"
                                >
                                  <Eye size={12} /> Inspect
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 3: CENTRALIZED PERMISSION MATRIX                  */}
      {/* ========================================================= */}
      {activeSection === 'matrix' && isSystemController && (
        <div className="bg-white border border-[#DBDBDB] rounded-2xl p-6 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#262626] flex items-center gap-2">
                <Layers size={18} className="text-[#DD2A7B]" />
                Centralized Module Permission Matrix
              </h2>
              <p className="text-xs text-[#737373] mt-0.5">
                Fine-grained View, Create, Edit, Delete, and Approve permissions per module. Deny-by-default architecture.
              </p>
            </div>
            <span className="text-[11px] bg-purple-50 text-purple-700 font-bold px-3 py-1 rounded-xl border border-purple-200">
              System Controller Governed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-[#DBDBDB] rounded-xl overflow-hidden">
              <thead className="bg-[#FAFAFA] text-[#737373] text-[10px] uppercase font-semibold border-b border-[#DBDBDB]">
                <tr>
                  <th className="p-3">Module Name</th>
                  <th className="p-3">View</th>
                  <th className="p-3">Create</th>
                  <th className="p-3">Edit</th>
                  <th className="p-3">Delete</th>
                  <th className="p-3">Approve</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DBDBDB]">
                {permissionMatrix.map(rule => (
                  <tr key={rule.moduleId} className="hover:bg-gray-50/80 transition">
                    <td className="p-3">
                      <div className="font-bold text-[#262626]">{rule.moduleName}</div>
                      <div className="text-[10px] text-[#737373]">{rule.description}</div>
                    </td>

                    {(['view', 'create', 'edit', 'delete', 'approve'] as const).map(act => {
                      const rolesAllowed = rule.allowedRoles[act] || [];
                      return (
                        <td key={act} className="p-3">
                          <button
                            onClick={() => {
                              setEditingMatrixRule(rule);
                              setMatrixAction(act);
                              setMatrixRoles([...rolesAllowed]);
                              setMatrixReason('');
                            }}
                            className="w-full text-left p-1.5 rounded-lg border border-dashed border-[#DBDBDB] hover:border-[#DD2A7B] hover:bg-pink-50/50 transition cursor-pointer"
                          >
                            <div className="flex flex-wrap gap-1">
                              {rolesAllowed.length === 0 ? (
                                <span className="text-[10px] text-gray-400 italic">None (Deny)</span>
                              ) : (
                                rolesAllowed.map(r => (
                                  <span
                                    key={r}
                                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${
                                      r === 'super_admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                      r === 'admin' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                      r === 'moderator' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                                      r === 'member' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                      'bg-gray-100 text-gray-600 border-gray-300'
                                    }`}
                                  >
                                    {r === 'super_admin' ? 'Root' : r}
                                  </span>
                                ))
                              )}
                            </div>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-purple-50 border border-purple-200 p-3.5 rounded-xl text-purple-900 text-xs flex items-center gap-2">
            <Lock size={15} className="text-purple-600 shrink-0" />
            <span>
              <strong>Deny-by-default Principle:</strong> Actions not explicitly granted to a role in this matrix or in Firestore Security Rules are automatically rejected at the database and application layer.
            </span>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 4: ADMINISTRATOR PERMISSION LIMITS                */}
      {/* ========================================================= */}
      {activeSection === 'limits' && isSystemController && (
        <div className="bg-white border border-[#DBDBDB] rounded-2xl p-6 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#262626] flex items-center gap-2">
                <Sliders size={18} className="text-[#DD2A7B]" />
                Administrator Operational Ceilings & Limits
              </h2>
              <p className="text-xs text-[#737373] mt-0.5">
                Impose strict granular limits on specific Admins. An Admin cannot exceed capabilities enabled here.
              </p>
            </div>
            <span className="text-[11px] bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-xl border border-blue-200">
              Per-Admin Enforcement
            </span>
          </div>

          {/* Admin Selector */}
          {adminsList.length === 0 ? (
            <div className="text-center py-8 text-[#737373] text-xs bg-[#FAFAFA] rounded-xl border border-[#DBDBDB]">
              No active Admin accounts found. Use the Role Manager to appoint an Admin first.
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-[#262626] block mb-2">Select Administrator to Configure:</label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {adminsList.map(adm => {
                  const isSelected = adm.uid === selectedAdminUid;
                  return (
                    <button
                      key={adm.uid}
                      type="button"
                      onClick={() => {
                        setSelectedAdminUid(adm.uid);
                        setEditingLimits(getAdminEffectiveLimits(adm.uid));
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                        isSelected 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                          : 'bg-white text-[#262626] border-[#DBDBDB] hover:bg-gray-50'
                      }`}
                    >
                      <img src={adm.avatarUrl} alt={adm.displayName} className="w-5 h-5 rounded-full object-cover" />
                      <span>{adm.displayName}</span>
                      <span className="text-[10px] opacity-70">({adm.email})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Toggles Grid */}
          {selectedAdminUid && (
            <form onSubmit={handleSaveAdminLimits} className="space-y-5 pt-3 border-t border-[#DBDBDB]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {[
                  {
                    key: 'canAddRemoveModerators' as const,
                    title: 'Appoint / Revoke Moderators',
                    desc: 'Allow this Admin to promote members to Moderator and manage moderator staff.'
                  },
                  {
                    key: 'canApproveSuspendMembers' as const,
                    title: 'Approve & Suspend Members',
                    desc: 'Allow approving incoming membership applications and suspending problematic accounts.'
                  },
                  {
                    key: 'canDeleteModeratePosts' as const,
                    title: 'Moderate & Delete Community Posts',
                    desc: 'Allow removing reported or policy-violating posts from the public feed.'
                  },
                  {
                    key: 'canManageAnnouncements' as const,
                    title: 'Publish Official System Announcements',
                    desc: 'Allow authoring verified announcement posts broadcasted to all community members.'
                  },
                  {
                    key: 'canReviewVerifyDonations' as const,
                    title: 'Certify & Reject Donations',
                    desc: 'Allow matching bKash/Nagad transactions against bank statements and approving payouts.'
                  },
                  {
                    key: 'canViewAdminReports' as const,
                    title: 'Manage Content Violation Reports',
                    desc: 'Allow reviewing and dismissing community member abuse flags.'
                  },
                  {
                    key: 'canChangeAppSettings' as const,
                    title: 'Modify Platform Settings',
                    desc: 'Allow altering club configuration metadata and chapter settings.'
                  },
                  {
                    key: 'canAccessSensitiveMemberInfo' as const,
                    title: 'Access Sensitive Member Data',
                    desc: 'Allow viewing private phone numbers and security activity audit logs.'
                  }
                ].map(item => {
                  const isChecked = editingLimits[item.key];
                  return (
                    <div
                      key={item.key}
                      onClick={() => setEditingLimits(prev => ({ ...prev, [item.key]: !isChecked }))}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                        isChecked 
                          ? 'bg-emerald-50/40 border-emerald-300' 
                          : 'bg-[#FAFAFA] border-[#DBDBDB] opacity-75'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-[#262626] flex items-center gap-1.5">
                          <span>{item.title}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            isChecked ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {isChecked ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#737373]">{item.desc}</p>
                      </div>

                      <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${
                        isChecked ? 'bg-emerald-600 border-emerald-700 text-white' : 'bg-white border-[#DBDBDB]'
                      }`}>
                        {isChecked && <Check size={14} />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Auditable Reason Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#262626] block">
                  Auditable Reason for Limit Updates *
                </label>
                <input
                  type="text"
                  required
                  value={limitsReason}
                  onChange={e => setLimitsReason(e.target.value)}
                  placeholder="e.g. Delegating bKash verification duties for Charity Relief Month 2026."
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl px-3.5 py-2.5 text-xs text-[#262626] placeholder-[#737373] focus:outline-none focus:border-[#DD2A7B]"
                />
                <div className="text-[10px] text-[#737373]">
                  Changes are stamped into the immutable audit trail under your System Controller account.
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingLimits(defaultAdminLimits)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#262626] rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Reset to Strict Defaults
                </button>
                <button
                  type="submit"
                  disabled={limitsReason.trim().length < 5}
                  className="px-5 py-2 bg-[#DD2A7B] hover:bg-[#C9226C] text-white font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  Save Administrator Ceilings
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 5: EMERGENCY CONTROLS & OVERRIDES                */}
      {/* ========================================================= */}
      {activeSection === 'emergency' && isSystemController && (
        <div className="bg-white border border-[#DBDBDB] rounded-2xl p-6 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#262626] flex items-center gap-2">
                <Power size={18} className="text-rose-600" />
                Emergency Operations & Platform Overrides
              </h2>
              <p className="text-xs text-[#737373] mt-0.5">
                Immediate platform-wide safeguards. Any changes require auditable justifications and emit alerts.
              </p>
            </div>
            <span className="text-[11px] bg-rose-50 text-rose-700 font-bold px-3 py-1 rounded-xl border border-rose-200">
              High Severity Station
            </span>
          </div>

          {/* 4 Emergency Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                key: 'maintenanceMode' as const,
                title: 'System Maintenance Mode',
                desc: 'Puts the platform into read-only mode. Blocks all messaging, posts, and donation creations.',
                status: emergencyControls.maintenanceMode
              },
              {
                key: 'freezeDonations' as const,
                title: 'Freeze All Donation Ingestion',
                desc: 'Immediately rejects new bKash/Nagad donation submissions. Existing campaigns remain viewable.',
                status: emergencyControls.freezeDonations
              },
              {
                key: 'pauseRegistrations' as const,
                title: 'Pause Membership Registrations',
                desc: 'Blocks public registration applications. Existing members can log in normally.',
                status: emergencyControls.pauseRegistrations
              },
              {
                key: 'restrictedPostingMode' as const,
                title: 'Restricted Posting Mode',
                desc: 'Restricts feed post creation strictly to Admins and Moderators. Members can only view.',
                status: emergencyControls.restrictedPostingMode
              }
            ].map(sw => (
              <div
                key={sw.key}
                className={`p-4 rounded-2xl border transition ${
                  sw.status 
                    ? 'bg-rose-50 border-rose-300' 
                    : 'bg-[#FAFAFA] border-[#DBDBDB]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-[#262626] flex items-center gap-1.5">
                      <span>{sw.title}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        sw.status ? 'bg-rose-600 text-white' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {sw.status ? 'ACTIVE' : 'OFF'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#737373]">{sw.desc}</p>
                  </div>

                  <button
                    onClick={() => {
                      setEmergencyToggleTarget({
                        key: sw.key,
                        label: sw.title,
                        nextValue: !sw.status
                      });
                      setEmergencyReason('');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                      sw.status
                        ? 'bg-gray-900 hover:bg-black text-white'
                        : 'bg-rose-600 hover:bg-rose-700 text-white'
                    }`}
                  >
                    {sw.status ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Account Restriction Override */}
          <div className="pt-4 border-t border-[#DBDBDB] space-y-3">
            <h3 className="text-xs font-bold text-[#262626] flex items-center gap-2">
              <UserX size={15} className="text-rose-600" />
              Emergency Account Isolation (Suspicious Behavior)
            </h3>
            <p className="text-xs text-[#737373]">
              Instantly restrict any suspicious account to read-only restricted status with a 1-click restore mechanism.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {users
                .filter(u => u.role !== 'super_admin' && u.uid !== currentUser.uid)
                .slice(0, 6)
                .map(u => {
                  const isRestricted = u.role === 'restricted_member';
                  return (
                    <div
                      key={u.uid}
                      className="bg-[#FAFAFA] border border-[#DBDBDB] p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <img src={u.avatarUrl} alt={u.displayName} className="w-6 h-6 rounded-md object-cover" />
                        <div className="truncate">
                          <div className="font-bold text-[#262626] truncate">{u.displayName}</div>
                          <div className="text-[10px] text-[#737373] truncate">{u.role}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setEmergencyRestrictUser(u);
                          setEmergencyRestrictReason('');
                        }}
                        className={`text-[10px] px-2 py-1 rounded-lg font-bold transition cursor-pointer shrink-0 ${
                          isRestricted 
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                            : 'bg-rose-600 text-white hover:bg-rose-700'
                        }`}
                      >
                        {isRestricted ? 'Restore' : 'Restrict'}
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION: OFFICIAL APPLICATION LOGO & IDENTITY             */}
      {/* ========================================================= */}
      {activeSection === 'logo' && (
        <div className="bg-white border border-[#DBDBDB] rounded-2xl p-6 space-y-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#262626] flex items-center gap-2">
                <ImageIcon size={18} className="text-[#DD2A7B]" />
                Official Application Logo & Visual Identity
              </h2>
              <p className="text-xs text-[#737373] mt-0.5">
                Authoritative control over the Alumni Association emblem displayed across authentication, navbar, and portal screens.
              </p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              System Controller Exclusive
            </span>
          </div>

          {logoInputError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{logoInputError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Active Logo */}
            <div className="p-5 rounded-2xl bg-[#FAFAFA] border border-[#DBDBDB] space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Current Active Logo
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-sm p-1 overflow-hidden flex items-center justify-center">
                  <img 
                    src={appLogo.url} 
                    alt="Active Logo" 
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div className="space-y-1 text-xs text-slate-600">
                  <p className="font-bold text-slate-800">{appLogo.fileName}</p>
                  <p>Size: {(appLogo.fileSize / 1024).toFixed(1)} KB • {appLogo.mimeType}</p>
                  <p className="text-[11px] text-slate-500">Updated: {new Date(appLogo.updatedAt).toLocaleDateString()}</p>
                  <p className="text-[11px] text-purple-700 font-medium">By: {appLogo.updatedByName}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <button
                  type="button"
                  disabled={!isSystemController}
                  onClick={() => {
                    const res = removeAppLogo();
                    if (res.success) {
                      setActionSuccess('Official logo reset to default emblem.');
                      setLogoInputFile(null);
                      setTimeout(() => setActionSuccess(''), 4000);
                    } else {
                      setActionError(res.error || 'Failed to reset logo.');
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  Reset to Default Logo
                </button>
              </div>
            </div>

            {/* Upload New Logo */}
            <div className="p-5 rounded-2xl bg-[#FAFAFA] border border-[#DBDBDB] space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Upload New Logo (Max 2MB: PNG, JPG, WEBP, SVG)
              </h3>
              
              <div className="space-y-3">
                <input
                  type="file"
                  id="admin-logo-upload"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    setLogoInputError('');
                    const file = e.target.files?.[0];
                    if (!file) return;

                    // Size check: 2MB max
                    if (file.size > 2 * 1024 * 1024) {
                      setLogoInputError('File size exceeds the 2MB limit. Please upload a smaller image.');
                      return;
                    }

                    // Format check
                    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
                    if (!validTypes.includes(file.type.toLowerCase())) {
                      setLogoInputError('Invalid file format. Allowed types: PNG, JPG, JPEG, WEBP, SVG.');
                      return;
                    }

                    const reader = new FileReader();
                    reader.onload = (event) => {
                      if (event.target?.result) {
                        setLogoInputFile({
                          url: event.target.result as string,
                          fileName: file.name,
                          fileSize: file.size,
                          mimeType: file.type
                        });
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />

                <label
                  htmlFor="admin-logo-upload"
                  className="border-2 border-dashed border-slate-300 hover:border-cyan-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-white transition-colors"
                >
                  <ImageIcon size={28} className="text-slate-400 mb-2" />
                  <span className="text-xs font-bold text-slate-700">Click to Browse or Drag New Logo</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">Square ratio (1:1) recommended</span>
                </label>

                {/* Staged File Preview */}
                {logoInputFile && (
                  <div className="p-3 rounded-xl bg-white border border-cyan-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={logoInputFile.url} 
                        alt="Preview" 
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200" 
                      />
                      <div className="text-xs">
                        <p className="font-bold text-slate-800">{logoInputFile.fileName}</p>
                        <p className="text-slate-500">{(logoInputFile.fileSize / 1024).toFixed(1)} KB • Ready to commit</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const res = updateAppLogo(logoInputFile);
                        if (res.success) {
                          setActionSuccess('Official application logo updated successfully across all views.');
                          setLogoInputFile(null);
                          setTimeout(() => setActionSuccess(''), 4000);
                        } else {
                          setActionError(res.error || 'Failed to update logo.');
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                    >
                      Apply & Save Logo
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION: SYSTEM CONTROLLER SETTINGS (FIREBASE, EMAIL, SECURITY, HEALTH) */}
      {/* ========================================================= */}
      {activeSection === 'settings' && isSystemController && (
        <SystemSettingsView />
      )}

      {/* Explicit Prohibited Notice if non-controller tries to access protected tab */}
      {['matrix', 'limits', 'emergency', 'logo', 'settings'].includes(activeSection) && !isSystemController && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-sm space-y-3">
          <ShieldAlert size={36} className="text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-rose-950">Privilege Restricted</h2>
          <p className="text-xs text-rose-800">
            This module is restricted to the authoritative System Controller (mehedihasan1303@gmail.com). Executive Administrators and Moderators are barred from accessing or modifying system-level infrastructure.
          </p>
          <button
            onClick={() => setActiveSection('overview')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 6: DONATION VERIFICATION QUEUE (PRESERVED)         */}
      {/* ========================================================= */}

      {activeSection === 'donations' && (
        <div className="bg-white border border-[#DBDBDB] rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#262626] flex items-center gap-2">
                <FileCheck size={18} className="text-[#DD2A7B]" />
                bKash & Nagad Pending Verification Queue
              </h2>
              <p className="text-xs text-[#737373] mt-0.5">
                Compare submitted TrxIDs with SMS/statement notifications before approval.
              </p>
            </div>
            <span className="text-xs text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-full font-bold">
              {pendingDonations.length} Pending Actions
            </span>
          </div>

          {pendingDonations.length === 0 ? (
            <div className="text-center py-12 text-[#737373] text-xs bg-[#FAFAFA] rounded-xl border border-[#DBDBDB]">
              <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500" />
              All submitted donations have been processed. Queue is clean!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingDonations.map(don => (
                <div
                  key={don.id}
                  className="bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        don.method === 'bKash' ? 'bg-[#E2136E]/15 text-[#E2136E] border border-[#E2136E]/30' : 'bg-[#F7941D]/15 text-[#F7941D] border border-[#F7941D]/30'
                      }`}>
                        {don.method}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#262626]">
                        TrxID: {don.transactionId}
                      </span>
                      <span className="text-xs font-bold text-emerald-700">
                        {don.amount.toLocaleString()} BDT
                      </span>
                    </div>

                    <div className="text-xs text-[#262626]">
                      <span>Donor: <strong>{don.donorName}</strong> ({don.donorMobile})</span> • 
                      <span className="text-[#737373]"> Campaign: <em>{don.campaignTitle}</em></span>
                    </div>

                    {don.notes && (
                      <div className="text-[11px] text-[#737373] italic">"{don.notes}"</div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {don.paymentEvidenceUrl && (
                      <button
                        onClick={() => setViewingSlipUrl(don.paymentEvidenceUrl!)}
                        className="p-2 text-[#737373] hover:text-[#262626] bg-white border border-[#DBDBDB] rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                        title="View Payment Screenshot"
                      >
                        <ImageIcon size={14} /> Slip
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setRejectingDonationId(don.id);
                        setRejectReason('');
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Reject
                    </button>

                    <button
                      onClick={() => handleVerifyDonation(don.id)}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1"
                    >
                      <CheckCircle2 size={13} /> Certify Payment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 7: MEMBERSHIP APPROVALS (PRESERVED)               */}
      {/* ========================================================= */}
      {activeSection === 'members' && (
        <div className="bg-white border border-[#DBDBDB] rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#262626] flex items-center gap-2">
                <Users size={18} className="text-[#DD2A7B]" />
                Pending Membership Applications
              </h2>
              <p className="text-xs text-[#737373] mt-0.5">
                Vetting desk for new registrations. Review credentials before admitting.
              </p>
            </div>
            <span className="text-xs text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-full font-bold">
              {pendingMembers.length} Applications
            </span>
          </div>

          {pendingMembers.length === 0 ? (
            <div className="text-center py-12 text-[#737373] text-xs bg-[#FAFAFA] rounded-xl border border-[#DBDBDB]">
              <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500" />
              No pending membership applications. All registered applicants have been processed.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingMembers.map(member => (
                <div
                  key={member.uid}
                  className="bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <img src={member.avatarUrl} alt={member.displayName} className="w-12 h-12 rounded-xl object-cover border border-[#DBDBDB]" />
                    <div>
                      <div className="font-bold text-[#262626] text-sm flex items-center gap-1.5">
                        <span>{member.displayName}</span>
                        <span className="text-[10px] text-[#737373] font-normal">@{member.username}</span>
                      </div>
                      <div className="text-xs text-[#737373]">{member.email} • {member.phone}</div>
                      <div className="text-xs text-[#262626] mt-1 font-medium">
                        Chapter: {member.chapter || 'General Assembly'} • Occupation: {member.occupation || 'N/A'}
                      </div>
                      {member.bio && (
                        <div className="text-[11px] text-[#737373] mt-0.5">"{member.bio}"</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRejectMember(member.uid)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleApproveMember(member.uid)}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1"
                    >
                      <UserCheck size={14} /> Approve Membership
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION: COMMUNITY MODERATION & ACCOUNT SECURITY CENTER    */}
      {/* ========================================================= */}
      {activeSection === 'moderation' && (
        <CommunityModerationSection />
      )}

      {/* ========================================================= */}
      {/* SECTION 8: REPORTED POSTS MODERATION (PRESERVED)          */}
      {/* ========================================================= */}
      {activeSection === 'reports' && (
        <div className="bg-white border border-[#DBDBDB] rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#262626] flex items-center gap-2">
                <AlertCircle size={18} className="text-amber-500" />
                Community Content Moderation & Reports
              </h2>
              <p className="text-xs text-[#737373] mt-0.5">
                Review flagged posts reported by members for code-of-conduct violations.
              </p>
            </div>
            <span className="text-xs text-rose-700 bg-rose-50 border border-rose-300 px-2.5 py-1 rounded-full font-bold">
              {reportedPosts.length} Flagged
            </span>
          </div>

          <div className="space-y-3">
            {reportedPosts.length === 0 ? (
              <div className="text-center py-12 text-[#737373] text-xs bg-[#FAFAFA] rounded-xl border border-[#DBDBDB]">
                <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500" />
                No flagged or reported posts. Community standards are maintained!
              </div>
            ) : (
              reportedPosts.map(post => (
                <div
                  key={post.id}
                  className="bg-[#FAFAFA] border border-amber-200 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <img src={post.authorAvatar} alt={post.authorName} className="w-8 h-8 rounded-lg object-cover border border-[#DBDBDB]" />
                      <div>
                        <div className="text-xs font-bold text-[#262626]">{post.authorName}</div>
                        <div className="text-[10px] text-[#737373]">{new Date(post.createdAt).toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDismissReport(post.id)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#262626] border border-[#DBDBDB] rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        Dismiss Reports
                      </button>
                      <button
                        onClick={() => handleDeleteReportedPost(post.id)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 size={13} /> Delete Post
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-[#262626] bg-white p-3 rounded-lg border border-[#DBDBDB]">
                    {post.content}
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="text-[11px] font-bold text-amber-800">Member Reports:</div>
                    {post.reports?.map((rep, idx) => (
                      <div key={idx} className="text-[11px] text-[#737373] flex items-center gap-2">
                        <span className="text-[#262626] font-medium">• {rep.reporterName}:</span>
                        <span>"{rep.reason}"</span>
                        <span className="text-[9px] text-[#737373]">({new Date(rep.reportedAt).toLocaleTimeString()})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 9: SECURITY AUDIT TRAIL                           */}
      {/* ========================================================= */}
      {activeSection === 'audit' && (
        <div className="bg-white border border-[#DBDBDB] rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#262626] flex items-center gap-2">
                <History size={18} className="text-[#DD2A7B]" />
                Immutable Governance & Security Audit Trail
              </h2>
              <p className="text-xs text-[#737373] mt-0.5">
                Timestamped records of security decisions, permission mutations, and emergency operations.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter by outcome */}
              <select
                value={auditFilterOutcome}
                onChange={e => setAuditFilterOutcome(e.target.value)}
                className="bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl px-2.5 py-1.5 text-xs text-[#262626] focus:outline-none"
              >
                <option value="ALL">All Outcomes</option>
                <option value="success">Success</option>
                <option value="denied">Access Denied</option>
                <option value="failure">Failure</option>
              </select>

              {/* Filter by action */}
              <select
                value={auditFilterAction}
                onChange={e => setAuditFilterAction(e.target.value)}
                className="bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl px-2.5 py-1.5 text-xs text-[#262626] focus:outline-none"
              >
                <option value="ALL">All Actions</option>
                <option value="ROLE_UPDATED">ROLE_UPDATED</option>
                <option value="ADMIN_LIMITS_UPDATED">ADMIN_LIMITS_UPDATED</option>
                <option value="PERMISSION_LIMITS_UPDATED">PERMISSION_LIMITS_UPDATED</option>
                <option value="EMERGENCY_RESTRICTION_UPDATED">EMERGENCY_RESTRICTION</option>
                <option value="DONATION_CONFIRMED">DONATION_CONFIRMED</option>
                <option value="DONATION_REJECTED">DONATION_REJECTED</option>
                <option value="MEMBER_SUSPENDED">MEMBER_SUSPENDED</option>
                <option value="MEMBER_APPROVED">MEMBER_APPROVED</option>
              </select>

              {/* Search */}
              <div className="relative w-full sm:w-48">
                <Search size={14} className="absolute left-3 top-2.5 text-[#737373]" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                  placeholder="Search logs..."
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#262626] placeholder-[#737373] focus:outline-none focus:border-[#DD2A7B]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {filteredLogs.map(log => (
              <div
                key={log.id}
                onClick={() => setInspectingLog(log)}
                className="bg-[#FAFAFA] hover:bg-gray-100/90 border border-[#DBDBDB] p-3 rounded-xl flex items-start justify-between gap-3 text-xs transition cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="font-bold text-[#262626]">{log.actorName}</span>
                    <VerifiedBadge userId={log.actorId} role={log.actorRole} size="xs" />
                    <span className="text-[10px] text-[#737373] font-mono">
                      ({log.actorRole === 'super_admin' ? 'System Controller' : log.actorRole})
                    </span>
                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-bold bg-pink-50 text-[#DD2A7B] border border-pink-200">
                      {log.action}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase border ${
                      log.outcome === 'denied' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      log.outcome === 'failure' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {log.outcome || 'success'}
                    </span>
                  </div>
                  <div className="text-[#262626] text-xs">{log.details}</div>
                  {log.reason && (
                    <div className="text-[11px] text-[#737373] mt-0.5">
                      <strong>Reason:</strong> {log.reason}
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-[#737373] font-mono whitespace-nowrap shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS & OVERLAYS                                         */}
      {/* ========================================================= */}

      {/* Reject Donation Modal */}
      {rejectingDonationId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#DBDBDB] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-[#262626]">Reject Donation Submission</h3>
            <p className="text-xs text-[#737373]">
              Please specify the audit reason for rejecting this bKash/Nagad donation record.
            </p>
            <form onSubmit={handleRejectDonationSubmit} className="space-y-4">
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Transaction ID was not found in statement records."
                className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl p-3 text-xs text-[#262626] focus:outline-none focus:border-[#DD2A7B]"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingDonationId(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#262626] rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Change Confirmation Modal */}
      {roleChangeTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-purple-300 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
                <UserCog size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#262626]">Modify Member Role</h3>
                <p className="text-xs text-[#737373]">{roleChangeTarget.displayName} ({roleChangeTarget.email})</p>
              </div>
            </div>

            <form onSubmit={confirmRoleChangeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#262626] font-semibold mb-1">Select Target Role</label>
                <select
                  value={newSelectedRole}
                  onChange={e => setNewSelectedRole(e.target.value as UserRole)}
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl p-2.5 text-xs text-[#262626] capitalize focus:outline-none focus:border-[#DD2A7B]"
                >
                  <option value="member">Member</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                  <option value="restricted_member">Restricted Member</option>
                  {isSystemController && <option value="super_admin">Super Admin</option>}
                </select>
              </div>

              <div>
                <label className="block text-[#262626] font-semibold mb-1">Auditable Justification</label>
                <input
                  type="text"
                  required
                  value={roleChangeReason}
                  onChange={e => setRoleChangeReason(e.target.value)}
                  placeholder="e.g. Council resolution #43 on appointing regional moderator."
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl p-2.5 text-xs text-[#262626] placeholder-[#737373] focus:outline-none focus:border-[#DD2A7B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRoleChangeTarget(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#262626] rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  Commit Role Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Module Matrix Edit Modal */}
      {editingMatrixRule && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#DBDBDB] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-[#262626]">
              Edit Permission: {editingMatrixRule.moduleName} ({matrixAction.toUpperCase()})
            </h3>
            <p className="text-xs text-[#737373]">
              Select which roles are permitted to perform the <strong>{matrixAction.toUpperCase()}</strong> action on this module.
            </p>

            <form onSubmit={handleSaveMatrixRule} className="space-y-4 text-xs">
              <div className="space-y-2">
                {(['super_admin', 'admin', 'moderator', 'member'] as UserRole[]).map(r => {
                  const isChecked = matrixRoles.includes(r);
                  const isLocked = r === 'super_admin'; // Prevent self-lockout
                  return (
                    <label
                      key={r}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer ${
                        isChecked ? 'bg-purple-50/60 border-purple-300' : 'bg-[#FAFAFA] border-[#DBDBDB]'
                      }`}
                    >
                      <span className="capitalize font-semibold text-[#262626]">
                        {r === 'super_admin' ? 'Super Admin (Locked)' : r}
                      </span>
                      <input
                        type="checkbox"
                        disabled={isLocked}
                        checked={isChecked}
                        onChange={e => {
                          if (e.target.checked) {
                            setMatrixRoles(prev => [...prev, r]);
                          } else {
                            setMatrixRoles(prev => prev.filter(x => x !== r));
                          }
                        }}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                    </label>
                  );
                })}
              </div>

              <div>
                <label className="block text-[#262626] font-semibold mb-1">Auditable Reason *</label>
                <input
                  type="text"
                  required
                  value={matrixReason}
                  onChange={e => setMatrixReason(e.target.value)}
                  placeholder="e.g. Enabling moderator access to review incoming reports."
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl p-2.5 text-xs text-[#262626] placeholder-[#737373] focus:outline-none focus:border-[#DD2A7B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMatrixRule(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#262626] rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={matrixReason.trim().length < 5}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  Update Permission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency Toggle Modal */}
      {emergencyToggleTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-rose-300 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle size={24} />
              <h3 className="text-base font-bold text-[#262626]">
                Confirm Emergency Switch: {emergencyToggleTarget.label}
              </h3>
            </div>
            <p className="text-xs text-[#737373]">
              You are switching this emergency directive to <strong>{emergencyToggleTarget.nextValue ? 'ON (ACTIVE)' : 'OFF (DEACTIVATED)'}</strong>. A mandatory reason is required for compliance audit logs.
            </p>

            <form onSubmit={handleSaveEmergencyToggle} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#262626] font-semibold mb-1">Audit Reason (Minimum 5 characters) *</label>
                <textarea
                  required
                  rows={3}
                  value={emergencyReason}
                  onChange={e => setEmergencyReason(e.target.value)}
                  placeholder="e.g. Detected unusual spike in spam accounts; pausing signups pending database check."
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl p-3 text-xs text-[#262626] placeholder-[#737373] focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEmergencyToggleTarget(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#262626] rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={emergencyReason.trim().length < 5}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  Apply Emergency Directive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency Restrict User Modal */}
      {emergencyRestrictUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-rose-300 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-[#262626]">
              {emergencyRestrictUser.role === 'restricted_member' ? 'Restore Account' : 'Emergency Restrict Account'}
            </h3>
            <p className="text-xs text-[#737373]">
              {emergencyRestrictUser.displayName} ({emergencyRestrictUser.email})
            </p>

            <form onSubmit={handleEmergencyRestrictMember} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#262626] font-semibold mb-1">Reason for disciplinary action</label>
                <input
                  type="text"
                  required
                  value={emergencyRestrictReason}
                  onChange={e => setEmergencyRestrictReason(e.target.value)}
                  placeholder="e.g. Investigation of spam activity in direct messaging."
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl p-2.5 text-xs text-[#262626] placeholder-[#737373] focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEmergencyRestrictUser(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#262626] rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  Confirm Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Immutable Audit Detail Inspection Modal */}
      {inspectingLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#DBDBDB] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#DD2A7B] bg-pink-50 px-2 py-0.5 rounded border border-pink-200">
                  {inspectingLog.action}
                </span>
                <h3 className="text-base font-bold text-[#262626] mt-1">Audit Record Detail</h3>
              </div>
              <button
                onClick={() => setInspectingLog(null)}
                className="text-[#737373] hover:text-[#262626] p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs bg-[#FAFAFA] p-4 rounded-xl border border-[#DBDBDB]">
              <div className="flex justify-between">
                <span className="text-[#737373]">Event ID:</span>
                <span className="font-mono text-[#262626] font-semibold">{inspectingLog.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Actor:</span>
                <span className="font-semibold text-[#262626]">{inspectingLog.actorName} ({inspectingLog.actorRole})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Actor UID:</span>
                <span className="font-mono text-[#737373]">{inspectingLog.actorId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Target Type / ID:</span>
                <span className="font-mono text-[#262626]">{inspectingLog.targetType} • {inspectingLog.targetId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Outcome:</span>
                <span className={`font-bold uppercase ${
                  inspectingLog.outcome === 'denied' ? 'text-rose-600' :
                  inspectingLog.outcome === 'failure' ? 'text-amber-600' :
                  'text-emerald-600'
                }`}>
                  {inspectingLog.outcome || 'success'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Timestamp:</span>
                <span className="font-mono text-[#262626]">{new Date(inspectingLog.timestamp).toISOString()}</span>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <span className="text-[#737373] font-semibold">Event Details:</span>
              <p className="text-[#262626] bg-gray-50 p-3 rounded-lg border border-[#DBDBDB] leading-relaxed">
                {inspectingLog.details}
              </p>
            </div>

            {inspectingLog.reason && (
              <div className="text-xs space-y-1">
                <span className="text-[#737373] font-semibold">Stated Justification:</span>
                <p className="text-[#262626] bg-gray-50 p-2.5 rounded-lg border border-[#DBDBDB] italic">
                  "{inspectingLog.reason}"
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectingLog(null)}
                className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for viewing payment slip */}
      {viewingSlipUrl && (
        <ImageLightbox
          images={[viewingSlipUrl]}
          initialIndex={0}
          onClose={() => setViewingSlipUrl(null)}
        />
      )}

      {/* Privileged Account Inspection Modal (System Controller Exclusive) */}
      {inspectTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-amber-300 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#262626]">
                    Privileged Support Inspection
                  </h3>
                  <p className="text-xs text-amber-700 font-semibold">
                    Strictly Restricted to System Controller
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setInspectTargetUser(null);
                  setInspectError('');
                }}
                className="text-[#737373] hover:text-[#262626] p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-[#FAFAFA] border border-[#DBDBDB] p-3.5 rounded-xl space-y-2 text-xs">
              <div className="text-[#737373] text-[11px] font-semibold">Target Account Record:</div>
              <div className="flex items-center gap-3">
                <img
                  src={inspectTargetUser.avatarUrl}
                  alt={inspectTargetUser.displayName}
                  className="w-10 h-10 rounded-xl object-cover border border-[#DBDBDB]"
                />
                <div>
                  <div className="text-[#262626] font-bold text-sm flex items-center gap-1.5 flex-wrap">
                    <span>{inspectTargetUser.displayName}</span>
                    <VerifiedBadge user={inspectTargetUser} size="xs" />
                  </div>
                  <div className="text-[#737373] text-[11px]">{inspectTargetUser.email}</div>
                  <div className="text-[10px] text-purple-700 capitalize font-mono mt-0.5">
                    Role: {inspectTargetUser.role === 'super_admin' ? 'System Controller' : inspectTargetUser.role} • Status: {inspectTargetUser.status}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-amber-900 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle size={14} className="text-amber-700" /> Mandatory Safeguards:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
                <li>Grants a 15-minute temporary read/audit support session.</li>
                <li>Target member passwords cannot be viewed, exported, or overridden.</li>
                <li>Every action is recorded in the immutable audit trail under System Controller.</li>
                <li>Session can be terminated immediately via the persistent top banner.</li>
              </ul>
            </div>

            {inspectError && (
              <div className="bg-rose-50 border border-rose-300 p-3 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span>{inspectError}</span>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setInspectError('');
                if (accessReason.trim().length < 10) {
                  setInspectError('Auditable access reason must be at least 10 characters.');
                  return;
                }
                if (!reauthPassword) {
                  setInspectError('System Controller password re-verification is required.');
                  return;
                }
                setInspectLoading(true);
                const res = await startAdministrativeAccess(
                  inspectTargetUser.uid,
                  accessReason.trim(),
                  reauthPassword
                );
                setInspectLoading(false);
                if (res.success) {
                  setInspectTargetUser(null);
                  setActionSuccess(`Privileged inspection active for ${inspectTargetUser.displayName}.`);
                } else {
                  setInspectError(res.error || 'Access denied.');
                }
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-[#262626] font-semibold mb-1">
                  System Controller Password (Re-authentication) *
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-3 text-[#737373]" />
                  <input
                    type="password"
                    required
                    value={reauthPassword}
                    onChange={(e) => setReauthPassword(e.target.value)}
                    placeholder="Enter your System Controller password"
                    className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl pl-9 pr-3 py-2 text-[#262626] placeholder-[#737373] focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#262626] font-semibold mb-1">
                  Formal Access Reason (Immutable Audit Trail) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={accessReason}
                  onChange={(e) => setAccessReason(e.target.value)}
                  placeholder="e.g. Investigating reported bKash donation verification mismatch for campaign #12."
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl p-3 text-[#262626] placeholder-[#737373] focus:outline-none focus:border-amber-500"
                />
                <div className="text-[10px] text-[#737373] mt-0.5">
                  Minimum 10 characters. Stored permanently in audit log.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setInspectTargetUser(null);
                    setInspectError('');
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#262626] rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inspectLoading}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {inspectLoading ? (
                    'Verifying...'
                  ) : (
                    <>
                      <KeyRound size={14} /> Authorize & Begin Inspection
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
