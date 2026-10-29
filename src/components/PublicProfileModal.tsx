import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { VerifiedBadge } from './VerifiedBadge';
import { 
  X, 
  MessageSquare, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Globe, 
  Linkedin, 
  Twitter, 
  Github, 
  CheckCircle2, 
  Lock, 
  AlertTriangle
} from 'lucide-react';

export const PublicProfileModal: React.FC = () => {
  const { 
    viewingMemberId, 
    setViewingMemberId, 
    users, 
    currentUser, 
    createConversation, 
    posts 
  } = useApp();

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  if (!viewingMemberId) return null;

  const member = users.find(u => u.uid === viewingMemberId);
  if (!member) return null;

  const isMe = member.uid === currentUser.uid;
  const isExecutiveOrAdmin = currentUser.role === 'super_admin' || currentUser.role === 'admin';
  const memberPosts = posts.filter(p => p.authorId === member.uid);

  const canViewEmail = isMe || isExecutiveOrAdmin || member.showEmailPublicly;
  const canViewPhone = isMe || isExecutiveOrAdmin || member.showPhonePublicly;

  const roleColors: Record<string, string> = {
    super_admin: 'bg-purple-50 text-purple-700 border-purple-200',
    admin: 'bg-blue-50 text-blue-700 border-blue-200',
    moderator: 'bg-sky-50 text-sky-700 border-sky-200',
    member: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    restricted_member: 'bg-red-50 text-red-700 border-red-200'
  };

  const handleSendMessage = () => {
    createConversation(member.uid);
    setViewingMemberId(null);
  };

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    setReportSubmitted(true);
    setTimeout(() => {
      setReportSubmitted(false);
      setReportOpen(false);
      setReportReason('');
    }, 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={() => setViewingMemberId(null)}
    >
      <div 
        className="bg-white border border-[#DBDBDB] rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl relative my-auto scrollbar-thin"
        onClick={e => e.stopPropagation()}
      >
        {/* Cover Photo */}
        <div className="relative h-36 sm:h-48 w-full bg-gradient-to-r from-orange-100 via-pink-50 to-purple-100 overflow-hidden">
          {member.coverPhotoUrl ? (
            <img 
              src={member.coverPhotoUrl} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full opacity-30 bg-[radial-gradient(#DD2A7B_1px,transparent_1px)] [background-size:16px_16px]" />
          )}

          {/* Close button */}
          <button
            onClick={() => setViewingMemberId(null)}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#262626] flex items-center justify-center transition border border-[#DBDBDB] cursor-pointer shadow-xs"
            aria-label="Close Profile"
          >
            <X size={16} />
          </button>
        </div>

        {/* Profile Card Header */}
        <div className="px-5 sm:px-7 pb-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-4">
            <div className="flex items-end gap-3.5 sm:gap-4">
              <div className="p-1 rounded-full bg-gradient-to-tr from-[#FCAF45] via-[#DD2A7B] to-[#8134AF] shadow-md">
                <img 
                  src={member.avatarUrl} 
                  alt={member.displayName}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white bg-white"
                />
              </div>
              <div className="pb-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#262626] tracking-tight flex items-center gap-2">
                    <span>{member.displayName}</span>
                    <VerifiedBadge user={member} size="md" />
                  </h2>
                  <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold border ${roleColors[member.role] || roleColors.member}`}>
                    {member.role === 'super_admin' ? 'System Controller' : member.role.replace('_', ' ')}
                  </span>
                </div>
                {member.username && (
                  <p className="text-xs text-[#737373] font-mono mt-0.5">@{member.username}</p>
                )}
                <p className="text-xs text-[#262626] font-medium mt-1">
                  {member.headline || member.occupation || 'Community Member'}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {!isMe && member.status === 'approved' && (
                <button
                  onClick={handleSendMessage}
                  className="px-4 py-2 bg-[#DD2A7B] hover:bg-[#C9226C] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <MessageSquare size={14} /> Send Message
                </button>
              )}
              {!isMe && (
                <button
                  onClick={() => setReportOpen(!reportOpen)}
                  className="p-2 bg-[#FAFAFA] hover:bg-[#F2F2F2] border border-[#DBDBDB] text-[#737373] hover:text-red-600 rounded-xl transition cursor-pointer"
                  title="Report Member"
                >
                  <AlertTriangle size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Report dialog */}
          {reportOpen && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-[#262626]">
              <h4 className="font-bold text-red-700 mb-1 flex items-center gap-1.5">
                <AlertTriangle size={14} /> Report Profile to Moderators
              </h4>
              {reportSubmitted ? (
                <p className="text-emerald-700 font-semibold py-1">Report recorded for compliance review.</p>
              ) : (
                <form onSubmit={handleReport} className="space-y-2 mt-2">
                  <input
                    type="text"
                    required
                    value={reportReason}
                    onChange={e => setReportReason(e.target.value)}
                    placeholder="Reason for report (e.g. impersonation, spam)..."
                    className="w-full bg-white border border-[#DBDBDB] rounded-xl px-3 py-1.5 text-xs text-[#262626] focus:outline-none focus:border-red-400"
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button 
                      type="button" 
                      onClick={() => setReportOpen(false)}
                      className="px-3 py-1 text-[#737373] hover:text-[#262626]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg"
                    >
                      Submit Report
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Verification and Status Pill Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-3 rounded-xl bg-[#FAFAFA] border border-[#DBDBDB] text-xs">
            <div>
              <span className="text-[10px] text-[#737373] uppercase tracking-wider block">Status</span>
              <span className={`font-semibold flex items-center gap-1 mt-0.5 ${
                member.status === 'approved' ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                <CheckCircle2 size={12} /> {(member.status || 'approved').toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#737373] uppercase tracking-wider block">Chapter</span>
              <span className="text-[#262626] font-semibold truncate block mt-0.5">
                {member.chapter || 'Central Chapter'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#737373] uppercase tracking-wider block">Location</span>
              <span className="text-[#262626] font-semibold truncate block mt-0.5">
                {member.location || 'Dhaka, BD'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#737373] uppercase tracking-wider block">Member Since</span>
              <span className="text-[#262626] font-semibold block mt-0.5">
                {new Date(member.joinedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Biography */}
          <div className="mb-4">
            <h4 className="text-[11px] uppercase font-bold text-[#737373] tracking-wider mb-1.5">
              Biography
            </h4>
            <p className="text-xs text-[#262626] leading-relaxed bg-[#FAFAFA] p-3.5 rounded-xl border border-[#DBDBDB]">
              {member.bio || 'No public biography provided.'}
            </p>
          </div>

          {/* Interests */}
          {member.interests && member.interests.length > 0 && (
            <div className="mb-4">
              <h4 className="text-[11px] uppercase font-bold text-[#737373] tracking-wider mb-2">
                Areas of Focus & Expertise
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {member.interests.map((tag, idx) => (
                  <span 
                    key={idx}
                    className="px-2.5 py-1 rounded-full bg-pink-50 border border-pink-200 text-[#DD2A7B] text-[11px] font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Direct Coordinates */}
          <div className="mb-4">
            <h4 className="text-[11px] uppercase font-bold text-[#737373] tracking-wider mb-2 flex items-center justify-between">
              <span>Contact Coordinates</span>
              {!isMe && !isExecutiveOrAdmin && (
                <span className="text-[10px] text-[#737373] font-normal lowercase flex items-center gap-1">
                  <Lock size={10} /> privacy-filtered
                </span>
              )}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2.5 bg-[#FAFAFA] p-3 rounded-xl border border-[#DBDBDB]">
                <Mail size={15} className="text-[#DD2A7B] shrink-0" />
                {canViewEmail ? (
                  <span className="text-[#262626] truncate">{member.email}</span>
                ) : (
                  <span className="text-[#737373] italic flex items-center gap-1">
                    <Lock size={11} /> Hidden by member
                  </span>
                )}
                {isExecutiveOrAdmin && !member.showEmailPublicly && (
                  <span className="text-[9px] bg-amber-50 text-amber-800 px-1.5 py-0.2 rounded border border-amber-200 ml-auto">
                    Admin View
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 bg-[#FAFAFA] p-3 rounded-xl border border-[#DBDBDB]">
                <Phone size={15} className="text-emerald-600 shrink-0" />
                {canViewPhone ? (
                  <span className="text-[#262626]">{member.phone || 'Not set'}</span>
                ) : (
                  <span className="text-[#737373] italic flex items-center gap-1">
                    <Lock size={11} /> Hidden by member
                  </span>
                )}
                {isExecutiveOrAdmin && !member.showPhonePublicly && (
                  <span className="text-[9px] bg-amber-50 text-amber-800 px-1.5 py-0.2 rounded border border-amber-200 ml-auto">
                    Admin View
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Professional Links */}
          {(member.website || member.linkedinUrl || member.twitterUrl || member.githubUrl) && (
            <div className="mb-4">
              <h4 className="text-[11px] uppercase font-bold text-[#737373] tracking-wider mb-2">
                External Links
              </h4>
              <div className="flex flex-wrap gap-2 text-xs">
                {member.website && (
                  <a 
                    href={member.website} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1.5 bg-[#FAFAFA] hover:bg-[#F2F2F2] px-3 py-1.5 rounded-xl border border-[#DBDBDB] text-[#262626] transition"
                  >
                    <Globe size={13} className="text-[#DD2A7B]" /> Website
                  </a>
                )}
                {member.linkedinUrl && (
                  <a 
                    href={member.linkedinUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1.5 bg-[#FAFAFA] hover:bg-[#F2F2F2] px-3 py-1.5 rounded-xl border border-[#DBDBDB] text-[#262626] transition"
                  >
                    <Linkedin size={13} className="text-[#0A66C2]" /> LinkedIn
                  </a>
                )}
                {member.twitterUrl && (
                  <a 
                    href={member.twitterUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1.5 bg-[#FAFAFA] hover:bg-[#F2F2F2] px-3 py-1.5 rounded-xl border border-[#DBDBDB] text-[#262626] transition"
                  >
                    <Twitter size={13} className="text-[#1DA1F2]" /> Twitter/X
                  </a>
                )}
                {member.githubUrl && (
                  <a 
                    href={member.githubUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1.5 bg-[#FAFAFA] hover:bg-[#F2F2F2] px-3 py-1.5 rounded-xl border border-[#DBDBDB] text-[#262626] transition"
                  >
                    <Github size={13} className="text-[#262626]" /> GitHub
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Member's Dispatches in Timeline */}
          <div>
            <h4 className="text-[11px] uppercase font-bold text-[#737373] tracking-wider mb-2 flex items-center justify-between">
              <span>Feed Posts</span>
              <span className="text-[10px] text-[#737373]">{memberPosts.length} posts</span>
            </h4>
            {memberPosts.length === 0 ? (
              <div className="text-center py-4 bg-[#FAFAFA] rounded-xl border border-[#DBDBDB] text-xs text-[#737373]">
                No posts published yet.
              </div>
            ) : (
              <div className="space-y-2">
                {memberPosts.slice(0, 3).map(post => (
                  <div 
                    key={post.id}
                    className="bg-[#FAFAFA] p-3 rounded-xl border border-[#DBDBDB] text-xs"
                  >
                    <p className="text-[#262626] line-clamp-2">{post.content}</p>
                    <div className="text-[10px] text-[#737373] mt-1.5 flex items-center justify-between">
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      <span className="text-[#DD2A7B] font-semibold">♥ {post.likes.length} Likes</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
