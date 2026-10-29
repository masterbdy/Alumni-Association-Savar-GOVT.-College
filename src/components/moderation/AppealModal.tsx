import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ModerationAction, ModerationAppeal } from '../../types';
import { Scale, X, AlertCircle, CheckCircle2, Clock, Send, ShieldAlert, FileText } from 'lucide-react';

interface AppealModalProps {
  isOpen: boolean;
  onClose: () => void;
  action?: ModerationAction | null;
  existingAppeal?: ModerationAppeal | null;
}

export const AppealModal: React.FC<AppealModalProps> = ({
  isOpen,
  onClose,
  action,
  existingAppeal
}) => {
  const { submitAppeal, currentUser } = useApp();
  const [statement, setStatement] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!action) return;

    if (!statement.trim() || statement.trim().length < 15) {
      setErrorMsg('অনুগ্রহ করে আপনার আপিলের বক্তব্য বিস্তারিতভাবে লিখুন (কমপক্ষে ১৫ অক্ষর)।');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const res = submitAppeal(action.id, statement.trim());
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg('আপনার আপিল সফলভাবে জমা নেওয়া হয়েছে। মডারেশন টিম এটি পর্যালোচনা করবে।');
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
        setStatement('');
      }, 2500);
    } else {
      setErrorMsg(res.error || 'আপিল জমা দেওয়া সম্ভব হয়নি।');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-[#DBDBDB] rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#DBDBDB]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200">
              <Scale size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                Community Justice & Review
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                মডারেশন আপিল আবেদন (Moderation Appeal)
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
            <CheckCircle2 size={32} className="text-emerald-600 mx-auto" />
            <h4 className="text-sm font-bold text-emerald-900">আপিল আবেদন জমা হয়েছে</h4>
            <p className="text-xs text-emerald-700">{successMsg}</p>
          </div>
        )}

        {/* Existing Appeal View */}
        {existingAppeal ? (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border ${
              existingAppeal.status === 'approved' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : existingAppeal.status === 'rejected'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase flex items-center gap-1.5">
                  <Clock size={14} />
                  <span>আপিল স্ট্যাটাস: {existingAppeal.status.toUpperCase()}</span>
                </span>
                <span className="text-[11px] font-mono opacity-80">
                  {new Date(existingAppeal.submittedAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs">
                {existingAppeal.status === 'pending' && 'আপনার আপিল বর্তমানে মডারেশন বোর্ডের অধীনে বিবেচনাধীন রয়েছে। সিদ্ধান্ত হওয়া মাত্র আপনি অবহিত হবেন।'}
                {existingAppeal.status === 'approved' && 'অভিনন্দন! আপনার আপিল গৃহীত হয়েছে এবং সীমাবদ্ধতা প্রত্যাহার করা হয়েছে।'}
                {existingAppeal.status === 'rejected' && 'আপনার আপিল পর্যালোচনার পর বহাল রাখা হয়েছে।'}
              </p>
              {existingAppeal.reviewNote && (
                <div className="mt-3 p-2.5 bg-white/70 rounded-lg text-xs font-medium border border-current/20">
                  <span className="font-bold block text-[10px] uppercase opacity-75">মডারেটরের পর্যালোচনা মন্তব্য:</span>
                  <p className="mt-0.5">{existingAppeal.reviewNote}</p>
                  {existingAppeal.reviewedByName && (
                    <span className="text-[10px] block mt-1 text-slate-500">— {existingAppeal.reviewedByName}</span>
                  )}
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">আপনার বক্তব্য (Your Appeal Statement):</span>
              <p className="text-slate-800 italic bg-white p-2.5 rounded-lg border border-slate-200">
                "{existingAppeal.appealStatement}"
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                বন্ধ করুন (Close)
              </button>
            </div>
          </div>
        ) : action ? (
          /* New Appeal Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Penalty Information Banner */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                <ShieldAlert size={16} className="text-amber-600" />
                <span>গৃহীত ব্যবস্থা: {action.actionType.replace('_', ' ').toUpperCase()}</span>
              </div>
              <div className="text-slate-700">
                <span className="font-semibold text-slate-600">কারণ: </span>
                <span>{action.reason}</span>
              </div>
              {action.expiresAt && (
                <div className="text-[11px] text-amber-700 flex items-center gap-1">
                  <Clock size={12} />
                  <span>মেয়াদ শেষ: {new Date(action.expiresAt).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                আপনার আপিলের যৌক্তিকতা বা ব্যাখ্যা (Your Statement) *
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                পরিস্থিতিটি কেন ভুল বোঝাবুঝি ছিল বা কেন এই সিদ্ধান্ত পুনর্বিবেচনা করা উচিত, তা শিষ্টাচার বজায় রেখে ব্যাখ্যা করুন:
              </p>
              <textarea
                rows={4}
                required
                value={statement}
                onChange={e => setStatement(e.target.value)}
                placeholder="সম্মানিত মডারেশন কমিটি, আমার উক্ত বক্তব্য বা পোস্টটি ভুলবশত প্রদান করা হয়েছিল..."
                className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-purple-600 focus:bg-white rounded-xl p-3 text-xs text-slate-800 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DBDBDB]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                বাতিল (Cancel)
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Send size={14} />
                <span>{isSubmitting ? 'জমা হচ্ছে...' : 'আপিল জমা দিন (Submit Appeal)'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 text-center text-xs text-slate-500">
            কোনো সক্রিয় শাস্তিমূলক রেকর্ড পাওয়া যায়নি।
          </div>
        )}
      </div>
    </div>
  );
};
