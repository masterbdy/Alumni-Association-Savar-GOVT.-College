import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Clock, 
  ShieldAlert, 
  XCircle, 
  LogOut, 
  RefreshCw, 
  ShieldCheck, 
  Mail, 
  Building2, 
  Calendar,
  Lock
} from 'lucide-react';

export const PendingApprovalView: React.FC = () => {
  const { currentUser, logout } = useApp();

  if (!currentUser) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-[#737373] mb-4">Account profile could not be loaded.</p>
        <button onClick={logout} className="px-4 py-2 bg-gray-200 text-xs font-semibold rounded-xl cursor-pointer">Sign Out</button>
      </div>
    );
  }

  const isPending = currentUser.status === 'pending';
  const isSuspended = currentUser.status === 'suspended';
  const isRejected = currentUser.status === 'rejected';

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-white border border-[#DBDBDB] rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        {/* Status Icon Header */}
        <div className="text-center mb-6 relative">
          {isPending && (
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs animate-pulse">
              <Clock size={32} />
            </div>
          )}
          {isSuspended && (
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-xs">
              <ShieldAlert size={32} />
            </div>
          )}
          {isRejected && (
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-xs">
              <XCircle size={32} />
            </div>
          )}

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 border bg-[#FAFAFA] text-[#737373] border-[#DBDBDB]">
            <Lock size={12} className="text-[#DD2A7B]" />
            Private Access Gate
          </div>

          <h1 className="text-2xl font-bold text-[#262626] tracking-tight">
            {isPending && 'Application Under Review'}
            {isSuspended && 'Membership Access Suspended'}
            {isRejected && 'Application Not Approved'}
          </h1>
          <p className="text-sm text-[#737373] mt-2 max-w-md mx-auto">
            {isPending && 'Your membership application is currently awaiting review by the Super Admin & Executive Council.'}
            {isSuspended && 'This account has been temporarily suspended by council administrators.'}
            {isRejected && 'Your application for club membership was not accepted at this time.'}
          </p>
        </div>

        {/* Applicant Profile Card */}
        <div className="bg-[#FAFAFA] border border-[#DBDBDB] rounded-2xl p-4 sm:p-5 mb-6 space-y-3">
          <div className="flex items-center gap-3.5 pb-3 border-b border-[#DBDBDB]">
            <img 
              src={currentUser.avatarUrl} 
              alt={currentUser.displayName} 
              className="w-12 h-12 rounded-xl object-cover border border-[#DBDBDB]"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[#262626] truncate">{currentUser.displayName}</div>
              <div className="text-xs text-[#737373] flex items-center gap-1.5 mt-0.5">
                <Mail size={12} /> {currentUser.email}
              </div>
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border uppercase ${
              isPending 
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : isSuspended
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              {currentUser.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div>
              <span className="text-[#737373] block mb-0.5">Assigned Chapter</span>
              <span className="text-[#262626] font-medium flex items-center gap-1">
                <Building2 size={12} className="text-[#DD2A7B]" /> {currentUser.chapter || 'General Assembly'}
              </span>
            </div>
            <div>
              <span className="text-[#737373] block mb-0.5">Submission Date</span>
              <span className="text-[#262626] font-medium flex items-center gap-1">
                <Calendar size={12} className="text-[#DD2A7B]" /> {currentUser.joinedAt ? new Date(currentUser.joinedAt).toLocaleDateString() : 'Recent'}
              </span>
            </div>
          </div>
        </div>

        {/* Security / Policy Notice */}
        <div className="bg-pink-50/40 border border-pink-200 rounded-2xl p-4 mb-6 text-xs text-[#262626] space-y-2">
          <div className="font-semibold text-[#DD2A7B] flex items-center gap-1.5">
            <ShieldCheck size={14} /> Private Community Policy
          </div>
          <p className="text-[#737373] leading-relaxed">
            Nexus maintains strict access control to protect private member records, conversations, and financial contributions. You cannot access posts, member directories, direct messaging, or donation verification queues until an authorized administrator verifies your application.
          </p>
        </div>

        {/* Primary Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#DD2A7B] hover:bg-[#C9226C] text-white text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <RefreshCw size={14} /> Check Status
          </button>
          <button
            onClick={logout}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#262626] border border-[#DBDBDB] text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
