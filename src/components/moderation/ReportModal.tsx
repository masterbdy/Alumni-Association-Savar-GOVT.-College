import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ReportCategory, ReportTargetType } from '../../types';
import { Flag, X, AlertTriangle, ShieldCheck, CheckCircle2, MessageSquare, FileText, MessageCircle } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetAuthorId: string;
  targetAuthorName: string;
  targetContentSnippet: string;
  evidenceContext?: string;
}

const REPORT_CATEGORIES: { id: ReportCategory; label: string; desc: string; color: string }[] = [
  {
    id: 'harassment',
    label: 'Harassment & Bullying (হয়রানি)',
    desc: 'Unwanted targeting, personal insults, derogatory remarks, or repetitive pestering.',
    color: 'border-purple-200 text-purple-700 bg-purple-50'
  },
  {
    id: 'obscene',
    label: 'Obscene / Inappropriate Content (অশ্লীলতা)',
    desc: 'Vulgar language, sexually explicit references, or offensive media.',
    color: 'border-rose-200 text-rose-700 bg-rose-50'
  },
  {
    id: 'spam',
    label: 'Spam & Misleading Links (স্প্যাম)',
    desc: 'Commercial advertisements, unverified external links, or irrelevant mass posts.',
    color: 'border-amber-200 text-amber-700 bg-amber-50'
  },
  {
    id: 'threat',
    label: 'Threat & Violence (হুমকি বা সহিংসতা)',
    desc: 'Direct or implied threats of harm, intimidation, or violent conduct.',
    color: 'border-red-200 text-red-700 bg-red-50'
  },
  {
    id: 'fake_account',
    label: 'Fake Account / Impersonation (নকল অ্যাকাউন্ট)',
    desc: 'Pretending to be another alumni member or fabricating institutional credentials.',
    color: 'border-blue-200 text-blue-700 bg-blue-50'
  },
  {
    id: 'other',
    label: 'Other Policy Violation (অন্যান্য লঙ্ঘন)',
    desc: 'Breach of alumni association charter or community standards not listed above.',
    color: 'border-slate-200 text-slate-700 bg-slate-50'
  }
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetAuthorId,
  targetAuthorName,
  targetContentSnippet,
  evidenceContext
}) => {
  const { submitCommunityReport, currentUser } = useApp();

  const [category, setCategory] = useState<ReportCategory>('harassment');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMessage('অনুগ্রহ করে রিপোর্ট করার একটি নির্দিষ্ট কারণ লিখুন (Please state a specific reason).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const res = submitCommunityReport({
      targetType,
      targetId,
      targetContentSnippet,
      targetAuthorId,
      targetAuthorName,
      category,
      reason: reason.trim(),
      details: details.trim() || undefined,
      evidenceContext: evidenceContext || (targetType === 'message' ? `Isolated snippet from direct communication with ${targetAuthorName}` : undefined)
    });

    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage('রিপোর্ট সফলভাবে জমা হয়েছে। মডারেশন টিম এটি সতর্কতার সাথে পর্যালোচনা করবে।');
      setTimeout(() => {
        onClose();
        setSuccessMessage('');
        setReason('');
        setDetails('');
      }, 2000);
    } else {
      setErrorMessage(res.error || 'Failed to submit report. Please try again.');
    }
  };

  const getTargetIcon = () => {
    switch (targetType) {
      case 'post': return <FileText size={16} className="text-purple-600" />;
      case 'comment': return <MessageCircle size={16} className="text-cyan-600" />;
      case 'message': return <MessageSquare size={16} className="text-emerald-600" />;
      default: return <Flag size={16} className="text-amber-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-[#DBDBDB] rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#DBDBDB]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
              <Flag size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Community Safety Desk
                </span>
                <span className="text-[11px] font-semibold text-slate-500 capitalize flex items-center gap-1">
                  {getTargetIcon()}
                  <span>{targetType} Report</span>
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                রিপোর্ট করুন (Report Violating Content)
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success Alert */}
        {successMessage ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
            <CheckCircle2 size={32} className="text-emerald-600 mx-auto" />
            <h4 className="text-sm font-bold text-emerald-900">ধন্যবাদ! রিপোর্ট সফলভাবে গৃহীত হয়েছে</h4>
            <p className="text-xs text-emerald-700">{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Target Content Snapshot Box */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>কনটেন্ট রচয়িতা: <strong className="text-slate-800">{targetAuthorName}</strong></span>
                <span className="font-mono text-[10px] uppercase text-slate-400">ID: {targetId.slice(0, 10)}</span>
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-mono text-[11px] max-h-20 overflow-y-auto italic">
                "{targetContentSnippet || 'Content preview not available'}"
              </div>
              {targetType === 'message' && (
                <div className="flex items-start gap-1.5 text-[11px] text-emerald-700 bg-emerald-50/80 p-2 rounded-lg border border-emerald-100">
                  <ShieldCheck size={14} className="shrink-0 mt-0.5 text-emerald-600" />
                  <span>
                    <strong>গোপনীয়তা নিশ্চয়তা:</strong> মডারেশন দল শুধুমাত্র আপনার উল্লেখিত এই নির্দিষ্ট বার্তাটি পর্যালোচনা করবে। আপনার পুরো কথোপকথন সম্পূর্ণ সুরক্ষিত ও ব্যক্তিগত থাকবে।
                  </span>
                </div>
              )}
            </div>

            {/* Category Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                লঙ্ঘনের ধরণ নির্বাচন করুন (Select Violation Category) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {REPORT_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`text-left p-2.5 rounded-xl border transition cursor-pointer text-xs ${
                      category === cat.id
                        ? `${cat.color} border-current ring-2 ring-purple-400/30 font-semibold shadow-xs`
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="font-bold text-[12px]">{cat.label}</div>
                    <div className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{cat.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                রিপোর্টের সুনির্দিষ্ট কারণ (Specific Reason) *
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="যেমন: অবমাননাকর মন্তব্য, অসত্য তথ্য প্রচার, অবাঞ্ছিত লিংক..."
                className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-amber-500 focus:bg-white rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
              />
            </div>

            {/* Additional Details */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                অতিরিক্ত বিবরণ বা ব্যাখ্যা (Optional Context)
              </label>
              <textarea
                rows={2}
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="মডারেটরদের তদন্তের সুবিধার্থে অতিরিক্ত প্রাসঙ্গিক তথ্য উল্লেখ করতে পারেন..."
                className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-amber-500 focus:bg-white rounded-xl p-3 text-xs text-slate-800 focus:outline-none resize-none"
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Footer Buttons */}
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
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Flag size={14} />
                <span>{isSubmitting ? 'জমা হচ্ছে...' : 'রিপোর্ট জমা দিন (Submit)'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
