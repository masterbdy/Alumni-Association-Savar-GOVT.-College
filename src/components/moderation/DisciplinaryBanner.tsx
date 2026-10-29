import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppealModal } from './AppealModal';
import { ShieldAlert, AlertTriangle, Scale, Clock, ChevronRight } from 'lucide-react';

export const DisciplinaryBanner: React.FC = () => {
  const { currentUser, moderationActions, moderationAppeals } = useApp();
  const [showAppealModal, setShowAppealModal] = useState(false);

  // Check if member has active penalties
  const isRestricted = currentUser.postingRestrictedUntil && new Date(currentUser.postingRestrictedUntil) > new Date();
  const hasWarnings = (currentUser.activeWarningsCount || 0) > 0;
  const hasNotice = !!currentUser.lastModerationNotice;

  if (!isRestricted && !hasWarnings && !hasNotice) {
    return null;
  }

  // Find relevant action and appeal
  const memberActions = moderationActions
    .filter(a => a.targetUserId === currentUser.uid)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  const latestAction = memberActions[0] || null;
  const latestAppeal = moderationAppeals.find(
    app => app.appellantId === currentUser.uid && (latestAction ? app.actionId === latestAction.id : true)
  ) || null;

  return (
    <>
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-xs text-amber-900 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldAlert size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-900">কমিউনিটি নোটিশ (Safety Notice)</span>
                {isRestricted && (
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200">
                    Posting Restricted
                  </span>
                )}
                {hasWarnings && (
                  <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {currentUser.activeWarningsCount} Active Warning(s)
                  </span>
                )}
              </div>
              <p className="text-amber-800 text-[11px] mt-0.5">
                {currentUser.lastModerationNotice?.reason || 'আপনার অ্যাকাউন্টের কার্যকলাপে কমিউনিটি নীতিমালার ব্যত্যয় পরিলক্ষিত হয়েছে।'}
                {isRestricted && currentUser.postingRestrictedUntil && (
                  <span className="font-semibold text-rose-700 ml-1">
                    (মেয়াদ: {new Date(currentUser.postingRestrictedUntil).toLocaleDateString()})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {latestAppeal ? (
              <button
                onClick={() => setShowAppealModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Clock size={13} className="text-amber-700" />
                <span>আপিল স্ট্যাটাস ({latestAppeal.status})</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAppealModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Scale size={13} />
                <span>আপিল আবেদন করুন (Appeal Decision)</span>
                <ChevronRight size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      <AppealModal
        isOpen={showAppealModal}
        onClose={() => setShowAppealModal(false)}
        action={latestAction}
        existingAppeal={latestAppeal}
      />
    </>
  );
};
