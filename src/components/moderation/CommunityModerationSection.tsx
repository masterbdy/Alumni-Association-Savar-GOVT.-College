import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CommunityReport, 
  ModerationAction, 
  ModerationAppeal, 
  ReportStatus, 
  ReportCategory, 
  ReportTargetType, 
  ModerationActionType, 
  UserProfile 
} from '../../types';
import { VerifiedBadge } from '../VerifiedBadge';
import { 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Flag, 
  Scale, 
  KeyRound, 
  Lock, 
  UserX, 
  UserCheck, 
  Clock, 
  Eye, 
  Trash2, 
  AlertTriangle, 
  Search, 
  Filter, 
  MessageSquare, 
  FileText, 
  MessageCircle, 
  ShieldAlert,
  Send,
  RefreshCw,
  LogOut,
  Power,
  Check,
  X
} from 'lucide-react';

export const CommunityModerationSection: React.FC = () => {
  const { 
    currentUser, 
    users, 
    communityReports, 
    moderationActions, 
    moderationAppeals, 
    updateReportStatus, 
    dismissCommunityReport, 
    executeModerationAction, 
    resolveAppeal, 
    revokeUserSessions, 
    toggleAccountDisabled, 
    validateSystemControllerReauth, 
    isSystemController,
    sendOtpCode
  } = useApp();

  // Sub-tabs: 'reports' | 'actions' | 'appeals' | 'security'
  const [activeSubTab, setActiveSubTab] = useState<'reports' | 'actions' | 'appeals' | 'security'>('reports');

  // Filter States for Reports
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Report for Detailed Review / Action
  const [selectedReport, setSelectedReport] = useState<CommunityReport | null>(null);

  // Take Action Modal States
  const [actionTargetReport, setActionTargetReport] = useState<CommunityReport | null>(null);
  const [chosenActionType, setChosenActionType] = useState<ModerationActionType>('warning');
  const [actionReason, setActionReason] = useState<string>('');
  const [actionDurationHours, setActionDurationHours] = useState<number>(72); // 3 days default
  const [reauthPassword, setReauthPassword] = useState<string>('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string>('');

  // Appeal Review Modal States
  const [selectedAppeal, setSelectedAppeal] = useState<ModerationAppeal | null>(null);
  const [appealReviewDecision, setAppealReviewDecision] = useState<'approved' | 'rejected'>('approved');
  const [appealReviewNote, setAppealReviewNote] = useState<string>('');
  const [appealSubmitting, setAppealSubmitting] = useState(false);

  // Account Security Controls State
  const [securityTargetUser, setSecurityTargetUser] = useState<UserProfile | null>(null);
  const [securityModalType, setSecurityModalType] = useState<'revoke_sessions' | 'toggle_disable' | 'trigger_reset' | null>(null);
  const [securityReason, setSecurityReason] = useState<string>('');
  const [securityReauthPassword, setSecurityReauthPassword] = useState<string>('');
  const [securitySearch, setSecuritySearch] = useState<string>('');

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  // Counts for Badges
  const pendingCount = communityReports.filter(r => r.status === 'pending').length;
  const underReviewCount = communityReports.filter(r => r.status === 'under_review').length;
  const pendingAppealsCount = moderationAppeals.filter(a => a.status === 'pending').length;

  // Filtered Reports
  const filteredReports = communityReports.filter(r => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesType = targetTypeFilter === 'all' || r.targetType === targetTypeFilter;
    const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
    const matchesSearch = 
      r.targetAuthorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reporterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.targetContentSnippet.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesType && matchesCategory && matchesSearch;
  });

  // Filtered Users for Security
  const filteredSecurityUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(securitySearch.toLowerCase()) ||
    u.email.toLowerCase().includes(securitySearch.toLowerCase()) ||
    u.role.toLowerCase().includes(securitySearch.toLowerCase())
  );

  // Status Change Handler
  const handleMarkStatus = (reportId: string, status: ReportStatus) => {
    const res = updateReportStatus(reportId, status);
    if (res.success) {
      triggerToast(`Report status updated to ${status.replace('_', ' ')}.`);
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport(prev => prev ? { ...prev, status } : null);
      }
    }
  };

  // Dismiss Report Handler
  const handleDismiss = (reportId: string) => {
    const res = dismissCommunityReport(reportId, 'Dismissed upon administrative inspection: no violation detected.');
    if (res.success) {
      triggerToast('Report dismissed.');
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport(null);
      }
    }
  };

  // Execute Action Submission
  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTargetReport) return;

    if (!actionReason.trim()) {
      setModalError('অনুগ্রহ করে এই শাস্তিমূলক পদক্ষেপের সুনির্দিষ্ট কারণ উল্লেখ করুন।');
      return;
    }

    // Protection check: Cannot target super admin
    if (actionTargetReport.targetAuthorId === 'usr_superadmin_bootstrap' || 
        users.find(u => u.uid === actionTargetReport.targetAuthorId)?.email === 'mehedihasan1303@gmail.com') {
      setModalError('সংবিধান অনুযায়ী সিস্টেম কন্ট্রোলারের বিরুদ্ধে কোনো শাস্তিমূলক ব্যবস্থা প্রয়োগ করা যাবে না।');
      return;
    }

    // Require System Controller reauth for sensitive penalties
    if (chosenActionType === 'account_suspension' || chosenActionType === 'temporary_restriction') {
      if (isSystemController && !validateSystemControllerReauth(reauthPassword)) {
        setModalError('ভুল মাস্টার পাসওয়ার্ড। প্রমাণীকরণ ব্যর্থ হয়েছে।');
        return;
      }
    }

    setActionSubmitting(true);
    setModalError('');

    const res = executeModerationAction({
      reportId: actionTargetReport.id,
      targetType: actionTargetReport.targetType,
      targetId: actionTargetReport.targetId,
      targetUserId: actionTargetReport.targetAuthorId,
      actionType: chosenActionType,
      reason: actionReason.trim(),
      durationHours: chosenActionType === 'temporary_restriction' ? actionDurationHours : undefined,
      adminReauthPassword: reauthPassword
    });

    setActionSubmitting(false);

    if (res.success) {
      triggerToast(`মডারেশন পদক্ষেপ (${chosenActionType}) সফলভাবে প্রয়োগ ও লগ করা হয়েছে।`);
      setActionTargetReport(null);
      setActionReason('');
      setReauthPassword('');
      if (selectedReport && selectedReport.id === actionTargetReport.id) {
        setSelectedReport(null);
      }
    } else {
      setModalError(res.error || 'Failed to apply moderation action.');
    }
  };

  // Appeal Resolution Submission
  const handleResolveAppealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppeal) return;

    if (!appealReviewNote.trim()) {
      setModalError('অনুগ্রহ করে পর্যালোচনার আনুষ্ঠানিক সিদ্ধান্ত মন্তব্য লিখুন।');
      return;
    }

    setAppealSubmitting(true);
    setModalError('');

    const res = resolveAppeal(selectedAppeal.id, appealReviewDecision, appealReviewNote.trim());
    setAppealSubmitting(false);

    if (res.success) {
      triggerToast(`আপিল সফলভাবে ${appealReviewDecision === 'approved' ? 'মঞ্জুর' : 'খারিজ'} করা হয়েছে।`);
      setSelectedAppeal(null);
      setAppealReviewNote('');
    } else {
      setModalError(res.error || 'Failed to process appeal.');
    }
  };

  // Security Session Revocation Submission
  const handleRevokeSessionsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityTargetUser) return;

    if (isSystemController && !validateSystemControllerReauth(securityReauthPassword)) {
      setModalError('ভুল মাস্টার পাসওয়ার্ড। প্রমাণীকরণ ব্যর্থ হয়েছে।');
      return;
    }

    const res = revokeUserSessions(securityTargetUser.uid, securityReason.trim() || 'Administrative session revocation', securityReauthPassword);
    if (res.success) {
      triggerToast(`সদস্য ${securityTargetUser.displayName}-এর সমস্ত সক্রিয় সেশন তাৎক্ষণিকভাবে বাতিল করা হয়েছে।`);
      setSecurityModalType(null);
      setSecurityTargetUser(null);
      setSecurityReason('');
      setSecurityReauthPassword('');
    } else {
      setModalError(res.error || 'Failed to revoke sessions.');
    }
  };

  // Security Account Disable Toggle Submission
  const handleToggleDisableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityTargetUser) return;

    if (securityTargetUser.uid === 'usr_superadmin_bootstrap' || securityTargetUser.email === 'mehedihasan1303@gmail.com') {
      setModalError('সিস্টেম কন্ট্রোলার অ্যাকাউন্ট নিষ্ক্রিয় করা সম্ভব নয়।');
      return;
    }

    if (isSystemController && !validateSystemControllerReauth(securityReauthPassword)) {
      setModalError('ভুল মাস্টার পাসওয়ার্ড। প্রমাণীকরণ ব্যর্থ হয়েছে।');
      return;
    }

    const res = toggleAccountDisabled(securityTargetUser.uid, securityReason.trim() || 'Administrative security toggle', securityReauthPassword);
    if (res.success) {
      triggerToast(`অ্যাকাউন্ট স্ট্যাটাস সফলভাবে আপডেট করা হয়েছে।`);
      setSecurityModalType(null);
      setSecurityTargetUser(null);
      setSecurityReason('');
      setSecurityReauthPassword('');
    } else {
      setModalError(res.error || 'Failed to toggle account disabled status.');
    }
  };

  // Password Reset Dispatch Handler
  const handleTriggerPasswordReset = async (user: UserProfile) => {
    try {
      const res = await sendOtpCode(user.email, 'password_reset');
      if (res.success) {
        triggerToast(`নিরাপদ পাসওয়ার্ড রিসেট ওয়ান-টাইম ওটিপি কোড ${user.email} এ প্রেরণ করা হয়েছে।`);
      } else {
        triggerToast(`রিসেট কোড পাঠানো যায়নি: ${res.message}`);
      }
    } catch (err: any) {
      triggerToast(`ত্রুটি: ${err.message || 'Error triggering reset'}`);
    }
  };

  const getCategoryBadge = (cat: ReportCategory) => {
    switch (cat) {
      case 'threat':
        return <span className="bg-red-100 text-red-800 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full">Threat</span>;
      case 'harassment':
        return <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full">Harassment</span>;
      case 'obscene':
        return <span className="bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full">Obscene</span>;
      case 'spam':
        return <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">Spam</span>;
      case 'fake_account':
        return <span className="bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full">Fake Account</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full">Other</span>;
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'pending':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">Pending</span>;
      case 'under_review':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full">Under Review</span>;
      case 'action_taken':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">Action Taken</span>;
      case 'dismissed':
        return <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full">Dismissed</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {successToast && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center gap-2 shadow-xs">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Banner Notice: Zero-Password Privacy Architecture */}
      <div className="bg-gradient-to-r from-slate-900 to-purple-950 text-white rounded-2xl p-5 shadow-sm border border-purple-900/40 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 border border-purple-500/30">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded-full border border-purple-700/50 mb-1">
                Zero-Trust Community Safety Architecture
              </div>
              <h2 className="text-lg font-bold tracking-tight text-white">
                Security & Community Moderation Center
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-purple-200/80 bg-purple-900/40 px-3 py-1.5 rounded-xl border border-purple-700/40 flex items-center gap-1.5">
              <Lock size={12} className="text-purple-300" />
              <span>Zero-Plaintext Policy: Passwords Never Logged or Exposed</span>
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl pt-1">
          কমিউনিটি নিরাপত্তা নীতি অনুযায়ী কোনো সদস্যের মূল বা প্লেইনটেক্সট পাসওয়ার্ড সিস্টেম কন্ট্রোলারসহ কেউ দেখতে পারবে না। অডিট লগে কোনো পাসওয়ার্ড বা সিক্রেট টোকেন লিপিবদ্ধ হবে না। ব্যক্তিগত বার্তাগুলো গোপনীয়; শুধুমাত্র রিপোর্ট করা নির্দিষ্ট বার্তার প্রমাণ স্ন্যাপশট হিসেবে পর্যালোচনা করা যাবে।
        </p>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#DBDBDB]">
        <button
          onClick={() => setActiveSubTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'reports' 
              ? 'bg-purple-700 text-white shadow-xs' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Flag size={14} />
          <span>রিপোর্ট কিউ (Reports Queue)</span>
          {pendingCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('actions')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'actions' 
              ? 'bg-purple-700 text-white shadow-xs' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert size={14} />
          <span>শাস্তিমূলক ব্যবস্থা লগ (Disciplinary Actions)</span>
          <span className="text-slate-400 text-[10px]">({moderationActions.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('appeals')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'appeals' 
              ? 'bg-purple-700 text-white shadow-xs' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Scale size={14} />
          <span>আপিল পর্যালোচনা (Appeals Desk)</span>
          {pendingAppealsCount > 0 && (
            <span className="bg-amber-400 text-slate-900 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {pendingAppealsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('security')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
            activeSubTab === 'security' 
              ? 'bg-purple-700 text-white shadow-xs' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <KeyRound size={14} />
          <span>অ্যাকাউন্ট সিকিউরিটি ও সেশন (Account Security)</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* SUB-TAB 1: COMMUNITY REPORTS QUEUE                        */}
      {/* ========================================================= */}
      {activeSubTab === 'reports' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white border border-[#DBDBDB] rounded-2xl p-4 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              {/* Search */}
              <div className="relative sm:col-span-1">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="খুঁজুন (Search author, reason...)"
                  className="w-full pl-8 pr-3 py-1.5 bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                >
                  <option value="all">সকল স্ট্যাটাস (All Statuses)</option>
                  <option value="pending">অপেক্ষমান (Pending - {pendingCount})</option>
                  <option value="under_review">তদন্তাধীন (Under Review - {underReviewCount})</option>
                  <option value="action_taken">ব্যবস্থা গৃহীত (Action Taken)</option>
                  <option value="dismissed">খারিজকৃত (Dismissed)</option>
                </select>
              </div>

              {/* Target Type Filter */}
              <div>
                <select
                  value={targetTypeFilter}
                  onChange={e => setTargetTypeFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                >
                  <option value="all">সকল কনটেন্ট (All Types)</option>
                  <option value="post">পোস্ট (Posts)</option>
                  <option value="comment">মন্তব্য (Comments)</option>
                  <option value="message">ব্যক্তিগত বার্তা (Direct Messages)</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                >
                  <option value="all">সকল ক্যাটাগরি (All Categories)</option>
                  <option value="harassment">Harassment</option>
                  <option value="obscene">Obscene Content</option>
                  <option value="spam">Spam</option>
                  <option value="threat">Threat & Violence</option>
                  <option value="fake_account">Fake Account</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reports Table / Card List */}
          {filteredReports.length === 0 ? (
            <div className="bg-white border border-[#DBDBDB] rounded-2xl p-8 text-center space-y-2">
              <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">কোনো অমীমাংসিত রিপোর্ট নেই</h4>
              <p className="text-xs text-slate-500">
                নির্বাচিত ফিল্টারের অধীনে কোনো রিপোর্ট পাওয়া যায়নি। কমিউনিটি নিরাপদ ও সুশৃঙ্খল রয়েছে।
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map(report => (
                <div 
                  key={report.id}
                  className={`bg-white border rounded-2xl p-4 transition shadow-xs space-y-3 ${
                    report.status === 'pending'
                      ? 'border-amber-300 ring-1 ring-amber-200'
                      : report.status === 'under_review'
                      ? 'border-blue-300 ring-1 ring-blue-100'
                      : 'border-[#DBDBDB]'
                  }`}
                >
                  {/* Report Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      {getCategoryBadge(report.category)}
                      {getStatusBadge(report.status)}
                      <span className="text-[11px] font-mono text-slate-400">ID: {report.id}</span>
                      <span className="text-[11px] text-slate-500 capitalize flex items-center gap-1 font-medium">
                        {report.targetType === 'post' && <FileText size={12} className="text-purple-600" />}
                        {report.targetType === 'comment' && <MessageCircle size={12} className="text-cyan-600" />}
                        {report.targetType === 'message' && <MessageSquare size={12} className="text-emerald-600" />}
                        <span>{report.targetType}</span>
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono">
                      {new Date(report.reportedAt).toLocaleString()}
                    </div>
                  </div>

                  {/* Authors & Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">অভিযুক্ত সদস্য (Target Author)</span>
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <span>{report.targetAuthorName}</span>
                        <VerifiedBadge userId={report.targetAuthorId} role={report.targetAuthorRole} size="xs" />
                        <span className="text-[10px] font-mono font-normal text-slate-500">({report.targetAuthorRole})</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">অভিযোগকারী (Reporter)</span>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <span className="font-semibold">{report.reporterName}</span>
                        <span className="text-[10px] font-mono text-slate-400">({report.reporterRole})</span>
                      </div>
                    </div>
                  </div>

                  {/* Content Snippet */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">রিপোর্টকৃত কনটেন্টের অংশবিশেষ (Isolated Snippet):</span>
                    <p className="text-xs text-slate-800 font-mono italic bg-white p-2 rounded-lg border border-slate-200">
                      "{report.targetContentSnippet}"
                    </p>
                    {report.evidenceContext && (
                      <p className="text-[11px] text-emerald-700 pt-1">
                        <strong>প্রমাণ স্ন্যাপশট:</strong> {report.evidenceContext}
                      </p>
                    )}
                  </div>

                  {/* Reason & Details */}
                  <div className="text-xs text-slate-700 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60">
                    <div><strong className="text-amber-900">লঙ্ঘনের সুনির্দিষ্ট অভিযোগ:</strong> {report.reason}</div>
                    {report.details && (
                      <div className="text-slate-600 mt-0.5 text-[11px]">
                        <strong>বিস্তারিত:</strong> {report.details}
                      </div>
                    )}
                  </div>

                  {/* Review info if exists */}
                  {report.reviewedAt && (
                    <div className="text-[11px] text-slate-600 bg-slate-100 p-2 rounded-lg flex items-center justify-between">
                      <span>তদন্তকারী: <strong>{report.assignedModeratorName || 'মডারেশন বোর্ড'}</strong></span>
                      <span>পর্যালোচনা: {new Date(report.reviewedAt).toLocaleDateString()}</span>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      {report.status === 'pending' && (
                        <button
                          onClick={() => handleMarkStatus(report.id, 'under_review')}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1"
                        >
                          <Eye size={12} />
                          <span>তদন্তাধীন চিহ্নিত করুন (Mark Under Review)</span>
                        </button>
                      )}

                      {report.status !== 'dismissed' && report.status !== 'action_taken' && (
                        <button
                          onClick={() => handleDismiss(report.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1"
                        >
                          <X size={12} />
                          <span>খারিজ করুন (Dismiss)</span>
                        </button>
                      )}
                    </div>

                    {report.status !== 'action_taken' && (
                      <button
                        onClick={() => {
                          setActionTargetReport(report);
                          setChosenActionType('warning');
                          setActionReason(`Violation: ${report.reason}`);
                          setModalError('');
                        }}
                        className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <ShieldAlert size={13} />
                        <span>শাস্তিমূলক ব্যবস্থা নিন (Take Action)</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 2: DISCIPLINARY ACTIONS LOG                       */}
      {/* ========================================================= */}
      {activeSubTab === 'actions' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#DBDBDB] rounded-2xl p-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-1">গৃহীত শাস্তিমূলক পদক্ষেপের অডিট ট্রেইল (Disciplinary Actions Log)</h3>
            <p className="text-xs text-slate-500">
              মডারেশন বোর্ড ও সিস্টেম কন্ট্রোলার কর্তৃক আরোপিত প্রতিটি সতর্কবার্তা, সীমাবদ্ধতা ও স্থগিতাদেশ এখানে স্থায়ীভাবে লিপিবদ্ধ থাকে।
            </p>
          </div>

          {moderationActions.length === 0 ? (
            <div className="bg-white border border-[#DBDBDB] rounded-2xl p-8 text-center text-xs text-slate-500">
              এখনও কোনো শাস্তিমূলক ব্যবস্থা গ্রহণের রেকর্ড নেই।
            </div>
          ) : (
            <div className="bg-white border border-[#DBDBDB] rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#FAFAFA] text-slate-500 uppercase text-[10px] font-bold border-b border-[#DBDBDB]">
                    <tr>
                      <th className="p-3">তারিখ ও সময়</th>
                      <th className="p-3">শাস্তির ধরণ</th>
                      <th className="p-3">সদস্য (Target Member)</th>
                      <th className="p-3">কারণ (Recorded Reason)</th>
                      <th className="p-3">দায়িত্বপ্রাপ্ত মডারেটর</th>
                      <th className="p-3">মেয়াদ (Expiration)</th>
                      <th className="p-3">আপিল</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DBDBDB] text-slate-700">
                    {moderationActions.map(action => (
                      <tr key={action.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(action.timestamp).toLocaleDateString()}<br/>
                          <span className="text-[10px] opacity-75">{new Date(action.timestamp).toLocaleTimeString()}</span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            action.actionType === 'account_suspension'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : action.actionType === 'temporary_restriction'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : action.actionType === 'content_removal'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-purple-100 text-purple-800 border border-purple-200'
                          }`}>
                            {action.actionType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          {action.targetUserName}
                        </td>
                        <td className="p-3 max-w-xs truncate" title={action.reason}>
                          {action.reason}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="font-semibold text-slate-800">{action.moderatorName}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">({action.moderatorRole})</span>
                        </td>
                        <td className="p-3 whitespace-nowrap font-mono text-[11px]">
                          {action.expiresAt ? new Date(action.expiresAt).toLocaleDateString() : 'Permanent / N/A'}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {action.hasAppeal ? (
                            <span className="text-purple-700 font-bold text-[11px] flex items-center gap-1">
                              <Scale size={12} /> Filed
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 3: APPEALS DESK                                   */}
      {/* ========================================================= */}
      {activeSubTab === 'appeals' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#DBDBDB] rounded-2xl p-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-1">কমিউনিটি আপিল পর্যালোচনা ডেস্ক (Member Appeals Desk)</h3>
            <p className="text-xs text-slate-500">
              শাস্তিমূলক ব্যবস্থা প্রাপ্ত সদস্যরা আত্মপক্ষ সমর্থন করে আপিল করতে পারেন। মডারেশন বোর্ড প্রতিটি আপিল নিরপেক্ষভাবে পর্যালোচনা করতে পারে।
            </p>
          </div>

          {moderationAppeals.length === 0 ? (
            <div className="bg-white border border-[#DBDBDB] rounded-2xl p-8 text-center text-xs text-slate-500">
              কোনো আপিল আবেদন জমা পড়েনি।
            </div>
          ) : (
            <div className="space-y-3">
              {moderationAppeals.map(appeal => (
                <div 
                  key={appeal.id}
                  className={`bg-white border rounded-2xl p-4 transition shadow-xs space-y-3 ${
                    appeal.status === 'pending'
                      ? 'border-purple-300 ring-1 ring-purple-100'
                      : appeal.status === 'approved'
                      ? 'border-emerald-300'
                      : 'border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        appeal.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : appeal.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        Appeal {appeal.status}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{appeal.appellantName}</span>
                      <span className="text-[11px] text-slate-500 font-mono">({appeal.appellantEmail})</span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      জমা: {new Date(appeal.submittedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">গৃহীত মূল শাস্তি (Imposed Penalty)</span>
                      <span className="font-bold text-amber-800 capitalize">{appeal.penaltyType.replace('_', ' ')}</span>
                      <p className="text-[11px] text-slate-600 mt-0.5">"{appeal.penaltyReason}"</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">আপিল আবেদনকারীর বক্তব্য (Statement)</span>
                      <p className="text-xs text-slate-800 italic bg-white p-2 rounded-lg border border-slate-200">
                        "{appeal.appealStatement}"
                      </p>
                    </div>
                  </div>

                  {appeal.reviewNote && (
                    <div className="p-2.5 bg-slate-100 rounded-xl text-xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">মডারেশনের পর্যালোচনামূলক সিদ্ধান্ত:</span>
                      <p className="text-slate-800">{appeal.reviewNote}</p>
                      {appeal.reviewedByName && (
                        <span className="text-[10px] text-slate-500 block font-mono">
                          সিদ্ধান্তকারী: {appeal.reviewedByName} ({new Date(appeal.reviewedAt || '').toLocaleDateString()})
                        </span>
                      )}
                    </div>
                  )}

                  {appeal.status === 'pending' && (
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setSelectedAppeal(appeal);
                          setAppealReviewDecision('rejected');
                          setAppealReviewNote('পর্যালোচনায় প্রাপ্ত তথ্যের ভিত্তিতে শাস্তি বহাল রাখা হলো।');
                          setModalError('');
                        }}
                        className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1"
                      >
                        <XCircle size={14} />
                        <span>আপিল নামঞ্জুর করুন (Reject)</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedAppeal(appeal);
                          setAppealReviewDecision('approved');
                          setAppealReviewNote('আপিলকারীর বক্তব্য গ্রহণযোগ্য হওয়ায় অবিলম্বে সকল পোস্টিং সীমাবদ্ধতা প্রত্যাহার করা হলো।');
                          setModalError('');
                        }}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 size={14} />
                        <span>আপিল মঞ্জুর করুন ও শাস্তি প্রত্যাহার করুন (Approve & Restore)</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 4: ACCOUNT SECURITY CONTROLS                     */}
      {/* ========================================================= */}
      {activeSubTab === 'security' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#DBDBDB] rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">অ্যাকাউন্ট সিকিউরিটি ও সেশন নিয়ন্ত্রণ (Account Security Desk)</h3>
                <p className="text-xs text-slate-500">
                  নিরাপত্তা ব্যবস্থার অংশ হিসেবে সদস্যের সক্রিয় সেশন বাতিল করা, সন্দেহভাজন অ্যাকাউন্ট নিষ্ক্রিয় করা এবং নিরাপদ পাসওয়ার্ড রিসেট পরিচালনা করুন।
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={securitySearch}
                  onChange={e => setSecuritySearch(e.target.value)}
                  placeholder="সদস্য খুঁজুন (Name or Email)..."
                  className="w-full pl-8 pr-3 py-1.5 bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>
          </div>

          {/* Member Security Table */}
          <div className="bg-white border border-[#DBDBDB] rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAFAFA] text-slate-500 uppercase text-[10px] font-bold border-b border-[#DBDBDB]">
                  <tr>
                    <th className="p-3">সদস্য</th>
                    <th className="p-3">রোল ও স্ট্যাটাস</th>
                    <th className="p-3">সর্বশেষ লগইন (Last Login)</th>
                    <th className="p-3">সেশন স্ট্যাটাস</th>
                    <th className="p-3">অ্যাকাউন্ট স্ট্যাটাস</th>
                    <th className="p-3 text-right">সিকিউরিটি অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DBDBDB] text-slate-700">
                  {filteredSecurityUsers.map(user => {
                    const isTargetSuper = user.uid === 'usr_superadmin_bootstrap' || user.email === 'mehedihasan1303@gmail.com';
                    return (
                      <tr key={user.uid} className="hover:bg-slate-50 transition">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover border border-[#DBDBDB]"
                            />
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1">
                                <span>{user.displayName}</span>
                                <VerifiedBadge user={user} size="xs" />
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono">{user.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                            user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'admin' ? 'bg-cyan-100 text-cyan-800' :
                            user.role === 'moderator' ? 'bg-amber-100 text-amber-800' :
                            user.role === 'restricted_member' ? 'bg-rose-100 text-rose-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {user.role}
                          </span>
                        </td>

                        <td className="p-3 whitespace-nowrap font-mono text-[11px] text-slate-500">
                          {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Recent Active'}
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Active Sessions: {user.activeSessions ?? 1}
                            </span>
                            {user.sessionsRevokedAt && (
                              <span className="block text-[10px] text-rose-600 font-mono">
                                Revoked: {new Date(user.sessionsRevokedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          {user.isAccountDisabled ? (
                            <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200">
                              Disabled
                            </span>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                              Active
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Revoke Sessions */}
                            <button
                              onClick={() => {
                                setSecurityTargetUser(user);
                                setSecurityModalType('revoke_sessions');
                                setSecurityReason('Administrative token invalidation');
                                setSecurityReauthPassword('');
                                setModalError('');
                              }}
                              title="Revoke all active logins"
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1"
                            >
                              <LogOut size={12} />
                              <span className="hidden sm:inline">সেশন বাতিল</span>
                            </button>

                            {/* Trigger Password Reset Link */}
                            <button
                              onClick={() => handleTriggerPasswordReset(user)}
                              title="Send password reset OTP"
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1"
                            >
                              <KeyRound size={12} />
                              <span className="hidden sm:inline">রিসেট লিংক</span>
                            </button>

                            {/* Disable / Enable Toggle */}
                            {!isTargetSuper && (
                              <button
                                onClick={() => {
                                  setSecurityTargetUser(user);
                                  setSecurityModalType('toggle_disable');
                                  setSecurityReason(user.isAccountDisabled ? 'Reactivating verified member account' : 'Security precaution');
                                  setSecurityReauthPassword('');
                                  setModalError('');
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1 border ${
                                  user.isAccountDisabled
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                                    : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                                }`}
                              >
                                <Power size={12} />
                                <span>{user.isAccountDisabled ? 'সক্রিয় করুন' : 'নিষ্ক্রিয়'}</span>
                              </button>
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
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: TAKE MODERATION ACTION MODAL                     */}
      {/* ========================================================= */}
      {actionTargetReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-[#DBDBDB] rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-[#DBDBDB]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    শাস্তিমূলক পদক্ষেপ গ্রহণ (Execute Moderation Action)
                  </h3>
                  <p className="text-xs text-slate-500">
                    সদস্য: <strong className="text-slate-800">{actionTargetReport.targetAuthorName}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActionTargetReport(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleActionSubmit} className="space-y-4">
              {/* Select Action Type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">পদক্ষেপের ধরণ (Action Type) *</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setChosenActionType('warning')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                      chosenActionType === 'warning'
                        ? 'bg-amber-50 border-amber-400 font-bold text-amber-900 ring-2 ring-amber-300/40'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">সতর্কবার্তা (Warning)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">সদস্যের প্রোফাইলে আনুষ্ঠানিক সতর্কবার্তা নোটিশ যুক্ত হবে।</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChosenActionType('content_removal')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                      chosenActionType === 'content_removal'
                        ? 'bg-rose-50 border-rose-400 font-bold text-rose-900 ring-2 ring-rose-300/40'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">কনটেন্ট অপসরণ (Removal)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">নির্দিষ্ট পোস্ট বা কমেন্ট পাবলিক ফিড থেকে ডিলিট হবে।</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChosenActionType('temporary_restriction')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                      chosenActionType === 'temporary_restriction'
                        ? 'bg-purple-50 border-purple-400 font-bold text-purple-900 ring-2 ring-purple-300/40'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">সাময়িক সীমাবদ্ধতা (Restriction)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">নির্দিষ্ট মেয়াদের জন্য নতুন পোস্ট ও মন্তব্য স্থগিত থাকবে।</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChosenActionType('account_suspension')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                      chosenActionType === 'account_suspension'
                        ? 'bg-red-50 border-red-400 font-bold text-red-900 ring-2 ring-red-300/40'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">অ্যাকাউন্ট স্থগিত (Suspension)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">গুরুতর লঙ্ঘনে অ্যাকাউন্ট সাময়িক বা স্থায়ীভাবে সাসপেন্ড হবে।</div>
                  </button>
                </div>
              </div>

              {/* Duration selector if restriction */}
              {chosenActionType === 'temporary_restriction' && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">সীমাবদ্ধতার মেয়াদ (Duration)</label>
                  <select
                    value={actionDurationHours}
                    onChange={e => setActionDurationHours(Number(e.target.value))}
                    className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value={24}>২৪ ঘণ্টা (1 Day)</option>
                    <option value={72}>৭২ ঘণ্টা (3 Days - Recommended)</option>
                    <option value={168}>৭ দিন (1 Week)</option>
                    <option value={336}>১৪ দিন (2 Weeks)</option>
                    <option value={720}>৩০ দিন (1 Month)</option>
                  </select>
                </div>
              )}

              {/* Recorded Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  শাস্তিমূলক পদক্ষেপের কারণ (Recorded Justification) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={actionReason}
                  onChange={e => setActionReason(e.target.value)}
                  placeholder="যেমন: কমিউনিটি নির্দেশিকা লঙ্ঘন করে অবাঞ্ছিত বাণিজ্যিক লিংক প্রচার এবং সতর্কবার্তার পরেও পুনরাবৃত্তি..."
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-purple-600 resize-none"
                />
              </div>

              {/* Re-auth Password for sensitive actions */}
              {(chosenActionType === 'account_suspension' || chosenActionType === 'temporary_restriction') && (
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                    <Lock size={14} className="text-purple-700" />
                    <span>মাস্টার রি-অথেনটিকেশন আবশ্যক (Re-Authentication Required)</span>
                  </div>
                  <p className="text-[11px] text-purple-700">
                    গুরুত্বপূর্ণ নিরাপত্তা পদক্ষেপ নিশ্চিত করতে সিস্টেম কন্ট্রোলারের পাসওয়ার্ড প্রবেশ করান:
                  </p>
                  <input
                    type="password"
                    required
                    value={reauthPassword}
                    onChange={e => setReauthPassword(e.target.value)}
                    placeholder="Enter Master Controller Password"
                    className="w-full bg-white border border-purple-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                  />
                </div>
              )}

              {modalError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DBDBDB]">
                <button
                  type="button"
                  onClick={() => setActionTargetReport(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={actionSubmitting}
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check size={14} />
                  <span>{actionSubmitting ? 'প্রয়োগ হচ্ছে...' : 'পদক্ষেপ নিশ্চিত করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: APPEAL RESOLUTION MODAL                          */}
      {/* ========================================================= */}
      {selectedAppeal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-[#DBDBDB] rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-[#DBDBDB]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200">
                  <Scale size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    আপিল পর্যালোচনা ও রায় (Appeal Adjudication)
                  </h3>
                  <p className="text-xs text-slate-500">
                    আবেদনকারী: <strong className="text-slate-800">{selectedAppeal.appellantName}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAppeal(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResolveAppealSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">আবেদনকারীর আত্মপক্ষ সমর্থন বক্তব্য:</span>
                <p className="text-slate-800 italic bg-white p-2.5 rounded-lg border border-slate-200">
                  "{selectedAppeal.appealStatement}"
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">সিদ্ধান্ত (Resolution) *</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setAppealReviewDecision('approved')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                      appealReviewDecision === 'approved'
                        ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-900 ring-2 ring-emerald-300/40'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1 text-emerald-700">
                      <CheckCircle2 size={14} /> মঞ্জুর করুন (Approve)
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">সীমাবদ্ধতা প্রত্যাহার হবে ও সদস্যের পোস্টিং অধিকার ফিরবে।</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAppealReviewDecision('rejected')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                      appealReviewDecision === 'rejected'
                        ? 'bg-rose-50 border-rose-400 font-bold text-rose-900 ring-2 ring-rose-300/40'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1 text-rose-700">
                      <XCircle size={14} /> নামঞ্জুর করুন (Reject)
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">পূর্বের শাস্তিমূলক সিদ্ধান্ত ও মেয়াদ অপরিবর্তিত থাকবে।</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  মডারেশন বোর্ডের পর্যালোচনা মন্তব্য (Review Note) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={appealReviewNote}
                  onChange={e => setAppealReviewNote(e.target.value)}
                  placeholder="সিদ্ধান্তের কারণ লিখুন যা সদস্যকে অবগত করা হবে..."
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-purple-600 resize-none"
                />
              </div>

              {modalError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DBDBDB]">
                <button
                  type="button"
                  onClick={() => setSelectedAppeal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={appealSubmitting}
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check size={14} />
                  <span>{appealSubmitting ? 'প্রক্রিয়াধীন...' : 'চূড়ান্ত সিদ্ধান্ত নিশ্চিত করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: ACCOUNT SECURITY ACTIONS (REVOKE / TOGGLE)       */}
      {/* ========================================================= */}
      {securityTargetUser && securityModalType && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-[#DBDBDB] rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-[#DBDBDB]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {securityModalType === 'revoke_sessions' ? 'সেশন প্রত্যাহার (Revoke Sessions)' : 'অ্যাকাউন্ট স্ট্যাটাস পরিবর্তন'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    লক্ষ্য: <strong className="text-slate-800">{securityTargetUser.displayName}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSecurityModalType(null);
                  setSecurityTargetUser(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form 
              onSubmit={securityModalType === 'revoke_sessions' ? handleRevokeSessionsSubmit : handleToggleDisableSubmit} 
              className="space-y-4"
            >
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1 text-amber-900">
                <span className="font-bold block">
                  {securityModalType === 'revoke_sessions'
                    ? 'সেশন বাতিলকরণ প্রভাব:'
                    : 'অ্যাকাউন্ট ফ্রিজ / অ্যাক্টিভেশন প্রভাব:'}
                </span>
                <p className="text-[11px] text-amber-800">
                  {securityModalType === 'revoke_sessions'
                    ? 'এই সদস্যের সকল সক্রিয় ডিভাইসের রিফ্রেশ টোকেন তাৎক্ষণিকভাবে বাতিল হবে এবং পুনরায় লগইন করতে হবে।'
                    : securityTargetUser.isAccountDisabled
                    ? 'অ্যাকাউন্টটি পুনরায় সক্রিয় করা হবে এবং সদস্য প্ল্যাটফর্মে স্বাভাবিক প্রবেশাধিকার পাবেন।'
                    : 'অ্যাকাউন্টটি সাময়িকভাবে নিষ্ক্রিয় করা হবে এবং সদস্য লগইন করতে পারবেন না।'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">অ্যাকশনের কারণ (Reason) *</label>
                <input
                  type="text"
                  required
                  value={securityReason}
                  onChange={e => setSecurityReason(e.target.value)}
                  placeholder="নিরাপত্তা পদক্ষেপের কারণ..."
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              {isSystemController && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    মাস্টার কন্ট্রোলার পাসওয়ার্ড (Re-Auth) *
                  </label>
                  <input
                    type="password"
                    required
                    value={securityReauthPassword}
                    onChange={e => setSecurityReauthPassword(e.target.value)}
                    placeholder="Enter Master Password"
                    className="w-full bg-white border border-[#DBDBDB] focus:border-purple-600 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none font-mono"
                  />
                </div>
              )}

              {modalError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DBDBDB]">
                <button
                  type="button"
                  onClick={() => {
                    setSecurityModalType(null);
                    setSecurityTargetUser(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check size={14} />
                  <span>নিশ্চিত করুন (Execute)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
