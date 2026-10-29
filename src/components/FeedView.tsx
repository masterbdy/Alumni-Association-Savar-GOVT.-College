import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Post, PostCategory, UserProfile, DonationCampaign, DonationMethod } from '../types';
import { ImageUploadPicker } from './ImageUploadPicker';
import { ImageLightbox } from './ImageLightbox';
import { ThreeClubCrest } from './ThreeClubCrest';
import { VerifiedBadge } from './VerifiedBadge';
import { ReportModal } from './moderation/ReportModal';
import { canCampaignAcceptDonations, getEffectiveCampaignStatus } from '../services/donationService';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Image as ImageIcon, 
  Plus, 
  Check, 
  Pin, 
  Trash2, 
  Edit3, 
  Bookmark, 
  Flag, 
  Lock, 
  Send, 
  X, 
  AlertCircle, 
  Sparkles,
  TrendingUp,
  Users,
  Megaphone,
  Calendar,
  Save,
  MessageSquare,
  CreditCard,
  ArrowUpRight,
  Copy,
  CheckCircle2,
  Target
} from 'lucide-react';

export const FeedView: React.FC = () => {
  const { 
    currentUser, 
    users, 
    posts, 
    createPost, 
    editPost,
    toggleLikePost, 
    toggleBookmarkPost,
    reportPost,
    addComment, 
    togglePinPost, 
    deletePost,
    createConversation,
    campaigns,
    setActiveTab,
    canPost,
    canComment,
    canDonate,
    canModerate,
    setViewingMemberId,
    openDonationForCampaign,
    submitDonation
  } = useApp();

  // Create Post Modal & States
  const [composerOpen, setComposerOpen] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<PostCategory>('general');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // In-Feed Campaign Donation Modal
  const [activeDonationModalCampaign, setActiveDonationModalCampaign] = useState<DonationCampaign | null>(null);
  const [donateMethod, setDonateMethod] = useState<DonationMethod>('bKash');
  const [donateAmount, setDonateAmount] = useState<string>('5000');
  const [donateMobile, setDonateMobile] = useState<string>(
    currentUser?.phone ? currentUser.phone.replace(/\D/g, '') : '01711000000'
  );
  const [donateTrxId, setDonateTrxId] = useState<string>('');
  const [donateDate, setDonateDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [donateNotes, setDonateNotes] = useState<string>('');
  const [donateEvidence, setDonateEvidence] = useState<string[]>([]);
  const [donateSubmitting, setDonateSubmitting] = useState(false);
  const [donateError, setDonateError] = useState('');
  const [donateSuccess, setDonateSuccess] = useState('');
  const [feedCopied, setFeedCopied] = useState<string | null>(null);

  const handleFeedCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setFeedCopied(label);
    setTimeout(() => setFeedCopied(null), 2000);
  };

  const handleFeedDonationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDonationModalCampaign) return;
    setDonateError('');
    setDonateSuccess('');

    if (!canDonate) {
      setDonateError('Your account is currently restricted from submitting donations.');
      return;
    }

    const numAmount = parseFloat(donateAmount);
    if (isNaN(numAmount) || numAmount < 10) {
      setDonateError('Please enter a valid amount (minimum 10 BDT).');
      return;
    }

    if (!donateTrxId.trim() || donateTrxId.trim().length < 6) {
      setDonateError('Please enter a valid bKash/Nagad Transaction ID (e.g. 9K4M82PQ10).');
      return;
    }

    setDonateSubmitting(true);
    const res = submitDonation(
      activeDonationModalCampaign.id,
      numAmount,
      donateMethod,
      donateMobile,
      donateTrxId,
      donateNotes,
      donateEvidence[0],
      donateDate
    );
    setDonateSubmitting(false);

    if (res.success) {
      setDonateSuccess(`Contribution of ${numAmount.toLocaleString()} BDT submitted for Trx ${donateTrxId.toUpperCase()}! Awaiting verification.`);
      setDonateTrxId('');
      setDonateNotes('');
      setDonateEvidence([]);
      setTimeout(() => {
        setDonateSuccess('');
        setActiveDonationModalCampaign(null);
      }, 3000);
    } else {
      setDonateError(res.error || 'Failed to submit donation.');
    }
  };

  // Active open comment drawers
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentErrors, setCommentErrors] = useState<Record<string, string>>({});

  // Post dropdown menu
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);

  // Lightbox state
  const [lightboxData, setLightboxData] = useState<{ images: string[]; initialIndex: number } | null>(null);

  // Edit post state
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<PostCategory>('general');

  // Report target state (Post / Comment / Message)
  const [activeReportTarget, setActiveReportTarget] = useState<{
    targetType: 'post' | 'comment' | 'message';
    targetId: string;
    targetAuthorId: string;
    targetAuthorName: string;
    targetContentSnippet: string;
    evidenceContext?: string;
  } | null>(null);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');

  // Selected member highlight modal (Community Moments)
  const [selectedHighlightUser, setSelectedHighlightUser] = useState<UserProfile | null>(null);

  // Active filter
  const [activeFilter, setActiveFilter] = useState<'all' | 'announcements' | 'bookmarked'>('all');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleComments = (postId: string) => {
    setOpenComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!canPost) {
      setErrorMessage('Your account is awaiting executive approval or restricted.');
      return;
    }

    if (!newContent.trim() && uploadedImages.length === 0) {
      setErrorMessage('Please write a message or upload an image.');
      return;
    }

    setIsSubmitting(true);
    const result = createPost(newContent, newCategory, uploadedImages);
    setIsSubmitting(false);

    if (result.success) {
      setNewContent('');
      setUploadedImages([]);
      setComposerOpen(false);
      showToast('Dispatched to community timeline!');
    } else {
      setErrorMessage(result.error || 'Failed to submit post.');
    }
  };

  const handleCommentSubmit = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = commentInputs[postId] || '';
    if (!text.trim()) {
      setCommentErrors(prev => ({ ...prev, [postId]: 'Comment cannot be blank.' }));
      return;
    }

    const res = addComment(postId, text);
    if (res.success) {
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      setCommentErrors(prev => ({ ...prev, [postId]: '' }));
      showToast('Comment posted');
    } else {
      setCommentErrors(prev => ({ ...prev, [postId]: res.error || 'Failed to submit comment' }));
    }
  };

  const handleShare = (post: Post) => {
    const text = `${post.authorName} on Nexus Club: "${post.content.slice(0, 80)}..."`;
    navigator.clipboard.writeText(text);
    showToast('Post excerpt copied to clipboard!');
  };

  const handleStartEdit = (post: Post) => {
    setEditingPost(post);
    setEditContent(post.content);
    setEditCategory(post.category);
    setOpenMenuPostId(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    const res = editPost(editingPost.id, editContent, editCategory);
    if (res.success) {
      setEditingPost(null);
      showToast('Post updated successfully.');
    }
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingPostId) return;
    const res = reportPost(reportingPostId, reportReason);
    if (res.success) {
      showToast('Flagged for council review.');
      setReportingPostId(null);
      setReportReason('');
    }
  };

  // Filtered timeline
  const timelinePosts = posts
    .filter(p => {
      if (activeFilter === 'announcements') return p.category === 'announcement' || p.isPinned;
      if (activeFilter === 'bookmarked') return p.bookmarks?.includes(currentUser.uid);
      return true;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Approved council members for Community Highlights row
  const highlightMembers = users.filter(u => u.status === 'approved');

  // Active campaign summary for desktop sidebar
  const primaryCampaign = campaigns[0];

  return (
    <div className="w-full">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#262626] text-white px-4 py-2 rounded-full text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check size={14} className="text-[#DD2A7B]" /> {toastMessage}
        </div>
      )}

      {/* Main 3-Column Social Layout on Desktop, 1-Column on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Desktop Sidebar: Shortcuts & Filters (Instagram/Clean Style) */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-16 space-y-3">
          {/* User Profile Capsule */}
          <div 
            onClick={() => setActiveTab('profile')}
            className="p-3 bg-white hover:bg-[#FAFAFA] border border-[#DBDBDB] rounded-2xl flex items-center gap-3 cursor-pointer transition group shadow-xs"
          >
            <div className="p-0.5 rounded-full bg-gradient-to-tr from-[#FCAF45] via-[#DD2A7B] to-[#8134AF] shrink-0">
              <img 
                src={currentUser.avatarUrl} 
                alt={currentUser.displayName} 
                className="w-10 h-10 rounded-full object-cover border border-white"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-[#262626] truncate group-hover:text-[#DD2A7B] transition flex items-center gap-1.5">
                <span className="truncate">{currentUser.displayName}</span>
                <VerifiedBadge user={currentUser} size="xs" />
              </div>
              <div className="text-[10px] text-[#737373] capitalize truncate">
                {currentUser.role === 'super_admin' ? 'System Controller' : currentUser.role.replace('_', ' ')}
              </div>
            </div>
          </div>

          {/* Quick Timeline Feeds Filter */}
          <div className="bg-white border border-[#DBDBDB] rounded-2xl p-2.5 space-y-1 shadow-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                activeFilter === 'all' ? 'bg-[#FAFAFA] text-[#262626] font-bold border border-[#DBDBDB]' : 'text-[#737373] hover:bg-[#FAFAFA] hover:text-[#262626]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Sparkles size={14} className="text-[#DD2A7B]" />
                Main Feed
              </span>
              <span className="text-[10px] text-[#737373] font-mono">{posts.length}</span>
            </button>

            <button
              onClick={() => setActiveFilter('announcements')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                activeFilter === 'announcements' ? 'bg-[#FAFAFA] text-[#262626] font-bold border border-[#DBDBDB]' : 'text-[#737373] hover:bg-[#FAFAFA] hover:text-[#262626]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Megaphone size={14} className="text-[#8134AF]" />
                Official Notices
              </span>
              <span className="text-[10px] text-[#737373] font-mono">
                {posts.filter(p => p.category === 'announcement' || p.isPinned).length}
              </span>
            </button>

            <button
              onClick={() => setActiveFilter('bookmarked')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                activeFilter === 'bookmarked' ? 'bg-[#FAFAFA] text-[#262626] font-bold border border-[#DBDBDB]' : 'text-[#737373] hover:bg-[#FAFAFA] hover:text-[#262626]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Bookmark size={14} className="text-emerald-600" />
                Saved Posts
              </span>
              <span className="text-[10px] text-[#737373] font-mono">
                {posts.filter(p => p.bookmarks?.includes(currentUser.uid)).length}
              </span>
            </button>
          </div>

          {/* Quick Direct Message Jump */}
          <div className="bg-white border border-[#DBDBDB] rounded-2xl p-3 space-y-2 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#737373] flex items-center justify-between">
              <span>Direct Channels</span>
              <span 
                onClick={() => setActiveTab('messages')}
                className="text-[10px] text-[#DD2A7B] cursor-pointer hover:underline lowercase font-semibold"
              >
                open
              </span>
            </div>
            <div className="space-y-1.5">
              <button
                onClick={() => setActiveTab('messages')}
                className="w-full text-left p-2 rounded-xl hover:bg-[#FAFAFA] text-xs text-[#262626] flex items-center gap-2.5 transition cursor-pointer border border-transparent hover:border-[#DBDBDB]"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#FCAF45] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center font-bold text-[10px] shadow-xs">
                  EC
                </div>
                <div className="truncate flex-1 text-[11px] font-medium">Executive Council</div>
              </button>
            </div>
          </div>
        </aside>

        {/* Central Social Timeline (Max-w-xl, Instagram standard width) */}
        <main className="lg:col-span-6 w-full max-w-[600px] mx-auto space-y-3">

          {/* 1. Member Stories / Highlights Row (Instagram Style Native Scroll) */}
          <div className="bg-white border border-[#DBDBDB] sm:rounded-2xl py-3.5 px-3 overflow-hidden shadow-xs">
            <div className="flex items-center gap-3.5 overflow-x-auto pb-1 scrollbar-none">
              
              {/* Add Story / Post Button */}
              <div
                onClick={() => {
                  if (canPost) setComposerOpen(true);
                }}
                className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
              >
                <div className="relative">
                  <img
                    src={currentUser.avatarUrl}
                    alt="You"
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#DBDBDB] group-hover:border-[#DD2A7B] transition"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#DD2A7B] rounded-full flex items-center justify-center text-white border-2 border-white shadow-xs">
                    <Plus size={12} strokeWidth={3} />
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-[#737373] max-w-[64px] truncate text-center">
                  Your Story
                </span>
              </div>

              {/* Verified Member Highlight Avatars with Instagram Gradient Ring */}
              {highlightMembers.map(member => {
                const isCurrent = member.uid === currentUser.uid;
                if (isCurrent) return null;

                return (
                  <div
                    key={member.uid}
                    onClick={() => setSelectedHighlightUser(member)}
                    className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
                  >
                    <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-[#FCAF45] via-[#DD2A7B] to-[#8134AF] group-hover:scale-105 transition-transform shadow-xs">
                      <img
                        src={member.avatarUrl}
                        alt={member.displayName}
                        className="w-13 h-13 rounded-full object-cover border-2 border-white"
                      />
                    </div>
                    <span className="text-[10px] font-medium text-[#262626] max-w-[64px] truncate text-center">
                      {member.displayName.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Compact Post Composer Bar */}
          <div className="bg-white border border-[#DBDBDB] sm:rounded-2xl p-3 sm:p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-0.5 rounded-full bg-gradient-to-tr from-[#FCAF45] via-[#DD2A7B] to-[#8134AF] shrink-0">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-8 h-8 rounded-full object-cover border border-white"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (canPost) setComposerOpen(true);
                  else showToast('Your membership is pending review.');
                }}
                className="flex-1 bg-[#FAFAFA] hover:bg-[#F2F2F2] text-[#737373] hover:text-[#262626] border border-[#DBDBDB] rounded-full px-4 py-2 text-left text-xs transition cursor-pointer"
              >
                {canPost 
                  ? `What's on your mind, ${currentUser.displayName.split(' ')[0]}?` 
                  : 'Posting is locked pending account approval.'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-[#DBDBDB] text-xs">
              <button
                type="button"
                onClick={() => {
                  if (canPost) {
                    setComposerOpen(true);
                  }
                }}
                className="flex-1 py-1.5 rounded-xl hover:bg-[#FAFAFA] text-[#737373] hover:text-[#262626] flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <ImageIcon size={15} className="text-emerald-600" />
                <span className="font-semibold text-[11px]">Photo / Media</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (canPost) {
                    setNewCategory('announcement');
                    setComposerOpen(true);
                  }
                }}
                className="flex-1 py-1.5 rounded-xl hover:bg-[#FAFAFA] text-[#737373] hover:text-[#262626] flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Megaphone size={15} className="text-[#DD2A7B]" />
                <span className="font-semibold text-[11px]">Notice</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (canPost) {
                    setNewCategory('event');
                    setComposerOpen(true);
                  }
                }}
                className="flex-1 py-1.5 rounded-xl hover:bg-[#FAFAFA] text-[#737373] hover:text-[#262626] flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Calendar size={15} className="text-[#8134AF]" />
                <span className="font-semibold text-[11px]">Event</span>
              </button>
            </div>
          </div>

          {/* 3. Instagram-Inspired Post Cards Feed */}
          <div className="space-y-3">
            {timelinePosts.length === 0 ? (
              <div className="bg-white border border-[#DBDBDB] sm:rounded-2xl p-10 text-center text-[#737373] shadow-xs">
                <Sparkles size={32} className="mx-auto mb-2 text-[#DD2A7B]/60" />
                <div className="text-sm font-bold text-[#262626]">No posts yet</div>
                <p className="text-xs text-[#737373] mt-1">Be the first member to share a post with the community.</p>
              </div>
            ) : (
              timelinePosts.map(post => {
                const hasLiked = post.likes.includes(currentUser.uid);
                const isBookmarked = post.bookmarks?.includes(currentUser.uid);
                const isCommentsOpen = !!openComments[post.id];
                const isAuthor = post.authorId === currentUser.uid;
                const isMenuOpen = openMenuPostId === post.id;

                const isDonationPost = post.isDonationCampaign || !!post.campaignId;
                const canonicalCampaign = post.campaignId ? campaigns.find(c => c.id === post.campaignId) : undefined;
                const campaignTitle = canonicalCampaign?.title || post.campaignTitle;
                const campaignTarget = canonicalCampaign?.targetAmount ?? post.campaignTarget ?? 0;
                const campaignCollected = canonicalCampaign?.collectedAmount ?? post.campaignCollected ?? 0;
                const campaignProgress = campaignTarget > 0 ? Math.min(100, Math.round((campaignCollected / campaignTarget) * 100)) : 0;
                const campaignStatus = canonicalCampaign ? getEffectiveCampaignStatus(canonicalCampaign) : (post.campaignStatus ?? 'active');
                const isDonationAccepting = canonicalCampaign ? canCampaignAcceptDonations(canonicalCampaign) : (campaignStatus === 'active');

                const allImages: string[] = post.images && post.images.length > 0 
                  ? post.images 
                  : post.imageUrl 
                    ? [post.imageUrl] 
                    : canonicalCampaign?.imageUrl
                      ? [canonicalCampaign.imageUrl]
                      : [];

                return (
                  <article
                    key={post.id}
                    className="feed-post-card-3d rounded-2xl overflow-hidden"
                  >
                    {/* Official Community Donation Cause Header Ribbon */}
                    {isDonationPost && (
                      <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-orange-50 px-3.5 py-2 border-b border-[#DBDBDB] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-md bg-[#DD2A7B] text-white flex items-center justify-center shrink-0">
                            <CreditCard size={13} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[10px] uppercase font-black tracking-wider text-[#DD2A7B] flex items-center gap-1 leading-none">
                              <span>Official Donation Cause</span>
                            </div>
                            <div className="text-xs font-bold text-[#262626] truncate mt-0.5">
                              {campaignTitle || 'Community Fundraising Program'}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase shrink-0">
                          {campaignStatus}
                        </span>
                      </div>
                    )}

                    {/* Optional Pinned Announcement Ribbon */}
                    {post.isPinned && (
                      <div className="bg-amber-50 px-3.5 py-1.5 flex items-center justify-between text-xs font-semibold text-amber-800 border-b border-amber-200">
                        <span className="flex items-center gap-1.5">
                          <Pin size={12} className="rotate-45 text-amber-600" /> Pinned Official Announcement
                        </span>
                        <span className="text-[10px] text-amber-700 font-bold">Priority Notice</span>
                      </div>
                    )}

                    {/* Author Top Bar (Instagram Style) */}
                    <div className="p-3 pb-2 flex items-center justify-between gap-3">
                      <div 
                        className="flex items-center gap-2.5 cursor-pointer group min-w-0"
                        onClick={() => setViewingMemberId(post.authorId)}
                      >
                        <div className="p-0.5 rounded-full bg-gradient-to-tr from-[#FCAF45] via-[#DD2A7B] to-[#8134AF] shrink-0">
                          <img
                            src={post.authorAvatar}
                            alt={post.authorName}
                            className="w-9 h-9 rounded-full object-cover border border-white"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-[#262626] group-hover:text-[#DD2A7B] transition leading-tight truncate">
                              {post.authorName}
                            </span>
                            <VerifiedBadge userId={post.authorId} role={post.authorRole} size="sm" />
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#737373] mt-0.5">
                            <span className="capitalize font-medium text-[#737373]">
                              {post.authorRole === 'super_admin' ? 'System Controller' : post.authorRole.replace('_', ' ')}
                            </span>
                            <span>•</span>
                            <span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            {post.updatedAt && <span className="text-[10px] text-[#737373] italic">(edited)</span>}
                          </div>
                        </div>
                      </div>

                      {/* Three-Dot Action Menu */}
                      <div className="relative shrink-0">
                        <button
                          onClick={() => setOpenMenuPostId(isMenuOpen ? null : post.id)}
                          className="p-1.5 rounded-full hover:bg-[#FAFAFA] text-[#737373] hover:text-[#262626] transition cursor-pointer"
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-0 mt-1 w-48 bg-white border border-[#DBDBDB] rounded-xl shadow-xl p-1.5 z-30 animate-in fade-in zoom-in-95 text-xs">
                            {canModerate && (
                              <button
                                onClick={() => {
                                  togglePinPost(post.id);
                                  setOpenMenuPostId(null);
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#FAFAFA] text-[#262626] flex items-center gap-2 cursor-pointer"
                              >
                                <Pin size={13} className={post.isPinned ? 'rotate-45 text-[#DD2A7B]' : ''} />
                                <span>{post.isPinned ? 'Unpin Post' : 'Pin to Top'}</span>
                              </button>
                            )}

                            {isAuthor && (
                              <button
                                onClick={() => handleStartEdit(post)}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#FAFAFA] text-[#262626] flex items-center gap-2 cursor-pointer"
                              >
                                <Edit3 size={13} />
                                <span>Edit Post</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                toggleBookmarkPost(post.id);
                                setOpenMenuPostId(null);
                                showToast(isBookmarked ? 'Removed from saved' : 'Saved to bookmarks');
                              }}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#FAFAFA] text-[#262626] flex items-center gap-2 cursor-pointer"
                            >
                              <Bookmark size={13} className={isBookmarked ? 'fill-[#262626] text-[#262626]' : ''} />
                              <span>{isBookmarked ? 'Remove Bookmark' : 'Save Post'}</span>
                            </button>

                            {!isAuthor && (
                              <button
                                onClick={() => {
                                  setActiveReportTarget({
                                    targetType: 'post',
                                    targetId: post.id,
                                    targetAuthorId: post.authorId,
                                    targetAuthorName: post.authorName,
                                    targetContentSnippet: post.content.slice(0, 160)
                                  });
                                  setOpenMenuPostId(null);
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-50 text-amber-700 flex items-center gap-2 cursor-pointer font-medium"
                              >
                                <Flag size={13} />
                                <span>রিপোর্ট করুন (Report)</span>
                              </button>
                            )}

                            {(isAuthor || canModerate) && (
                              <button
                                onClick={() => {
                                  deletePost(post.id);
                                  setOpenMenuPostId(null);
                                  showToast('Post deleted');
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 size={13} />
                                <span>Delete Post</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Edge-to-Edge Responsive Image Display (Instagram Style) */}
                    {allImages.length > 0 && (
                      <div className="bg-[#FAFAFA] overflow-hidden cursor-pointer select-none border-y border-[#DBDBDB]/60">
                        {allImages.length === 1 && (
                          <div 
                            className="max-h-[560px] flex items-center justify-center overflow-hidden bg-black/5"
                            onClick={() => setLightboxData({ images: allImages, initialIndex: 0 })}
                          >
                            <img
                              src={allImages[0]}
                              alt="Post media"
                              className="w-full h-auto object-cover max-h-[560px]"
                            />
                          </div>
                        )}

                        {allImages.length === 2 && (
                          <div className="grid grid-cols-2 gap-0.5">
                            {allImages.map((src, idx) => (
                              <div
                                key={idx}
                                className="aspect-square overflow-hidden"
                                onClick={() => setLightboxData({ images: allImages, initialIndex: idx })}
                              >
                                <img src={src} alt="Post media" className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}

                        {allImages.length === 3 && (
                          <div className="grid grid-cols-3 gap-0.5">
                            <div
                              className="col-span-2 aspect-[4/3] overflow-hidden"
                              onClick={() => setLightboxData({ images: allImages, initialIndex: 0 })}
                            >
                              <img src={allImages[0]} alt="Post media" className="w-full h-full object-cover" />
                            </div>
                            <div className="col-span-1 grid grid-rows-2 gap-0.5">
                              {allImages.slice(1, 3).map((src, idx) => (
                                <div
                                  key={idx}
                                  className="aspect-square overflow-hidden"
                                  onClick={() => setLightboxData({ images: allImages, initialIndex: idx + 1 })}
                                >
                                  <img src={src} alt="Post media" className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {allImages.length >= 4 && (
                          <div className="grid grid-cols-2 gap-0.5">
                            {allImages.slice(0, 4).map((src, idx) => (
                              <div
                                key={idx}
                                className="aspect-square overflow-hidden"
                                onClick={() => setLightboxData({ images: allImages, initialIndex: idx })}
                              >
                                <img src={src} alt="Post media" className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Instagram-Style Actions Bar: Like Heart, Comment, Share, and Bookmark */}
                    <div className="px-3 pt-2.5 pb-1 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Like Heart Button */}
                        <button
                          onClick={() => toggleLikePost(post.id)}
                          disabled={!canComment}
                          className="text-[#262626] hover:opacity-70 transition cursor-pointer"
                          title="Like"
                        >
                          <Heart 
                            size={22} 
                            className={hasLiked ? 'fill-[#ED4956] text-[#ED4956]' : 'text-[#262626]'} 
                          />
                        </button>

                        {/* Comment Button */}
                        <button
                          onClick={() => toggleComments(post.id)}
                          className="text-[#262626] hover:opacity-70 transition cursor-pointer"
                          title="Comment"
                        >
                          <MessageCircle size={22} className="text-[#262626]" />
                        </button>

                        {/* Share Button */}
                        <button
                          onClick={() => handleShare(post)}
                          className="text-[#262626] hover:opacity-70 transition cursor-pointer"
                          title="Share"
                        >
                          <Share2 size={21} className="text-[#262626]" />
                        </button>
                      </div>

                      {/* Bookmark Save Button */}
                      <button
                        onClick={() => {
                          toggleBookmarkPost(post.id);
                          showToast(isBookmarked ? 'Removed from saved' : 'Saved to bookmarks');
                        }}
                        className="text-[#262626] hover:opacity-70 transition cursor-pointer"
                        title={isBookmarked ? 'Saved' : 'Save'}
                      >
                        <Bookmark 
                          size={22} 
                          className={isBookmarked ? 'fill-[#262626] text-[#262626]' : 'text-[#262626]'} 
                        />
                      </button>
                    </div>

                    {/* Likes Count */}
                    <div className="px-3.5 py-0.5 text-xs font-bold text-[#262626]">
                      {post.likes.length === 1 
                        ? '1 like' 
                        : `${post.likes.length.toLocaleString()} likes`}
                    </div>

                    {/* Post Content Caption */}
                    <div className="px-3.5 py-1 text-[13px] text-[#262626] leading-relaxed">
                      <span 
                        onClick={() => setViewingMemberId(post.authorId)}
                        className="font-bold text-[#262626] mr-1.5 cursor-pointer hover:underline"
                      >
                        {post.authorName}
                      </span>
                      <span className="whitespace-pre-line">{post.content}</span>
                    </div>

                    {/* Official Campaign Financial Progress & Prominent Donate Now Button */}
                    {isDonationPost ? (
                      <div className="mx-3.5 my-2.5 p-3.5 rounded-xl bg-[#FAFAFA] border border-[#DBDBDB] space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="text-xs sm:text-sm font-bold text-emerald-700 font-mono">
                              {campaignCollected.toLocaleString()} BDT
                            </span>
                            <span className="text-[10px] text-[#737373] ml-1">Confirmed Raised</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-[#DD2A7B] font-mono">{campaignProgress}%</span>
                            {campaignTarget > 0 && (
                              <span className="text-[10px] text-[#737373] ml-1">
                                of {campaignTarget.toLocaleString()} BDT
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Instagram-style Progress Bar */}
                        <div className="w-full bg-[#EFEFEF] h-2.5 rounded-full overflow-hidden border border-[#DBDBDB]/60">
                          <div 
                            className="bg-gradient-to-r from-[#FCAF45] via-[#DD2A7B] to-[#8134AF] h-full rounded-full transition-all duration-500"
                            style={{ width: `${campaignProgress}%` }}
                          />
                        </div>

                        {/* Prominent Donate Now Action Button or Closed Indicator */}
                        <div className="pt-1 flex items-center gap-2">
                          {isDonationAccepting ? (
                            <button
                              onClick={() => {
                                if (canonicalCampaign) {
                                  setActiveDonationModalCampaign(canonicalCampaign);
                                } else if (post.campaignId) {
                                  openDonationForCampaign(post.campaignId);
                                } else {
                                  setActiveTab('donations');
                                }
                              }}
                              className="flex-1 py-2 px-3.5 rounded-xl bg-gradient-to-r from-[#DD2A7B] via-[#C9226C] to-[#8134AF] hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer group"
                            >
                              <CreditCard size={15} className="group-hover:scale-110 transition-transform" />
                              <span>Donate Now — bKash / Nagad</span>
                              <ArrowUpRight size={13} className="opacity-80" />
                            </button>
                          ) : (
                            <div className="flex-1 py-2 px-3.5 rounded-xl bg-gray-100 border border-gray-300 text-gray-500 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 select-none">
                              <Lock size={14} className="text-gray-400" />
                              <span>
                                {campaignStatus === 'expired' 
                                  ? 'Donation Closed (Expired)' 
                                  : campaignStatus === 'archived' 
                                    ? 'Campaign Archived' 
                                    : 'Donation Closed'}
                              </span>
                            </div>
                          )}

                          <button
                            onClick={() => {
                              if (post.campaignId) {
                                openDonationForCampaign(post.campaignId);
                              } else {
                                setActiveTab('donations');
                              }
                            }}
                            className="py-2 px-3 rounded-xl bg-white hover:bg-[#F2F2F2] border border-[#DBDBDB] text-[#262626] text-xs font-semibold transition cursor-pointer shrink-0"
                            title="Open Campaign in Donations Tab"
                          >
                            Hub
                          </button>
                        </div>
                      </div>
                    ) : (post.category === 'announcement' || post.content.toLowerCase().includes('donation') || post.content.toLowerCase().includes('endowment') || post.content.toLowerCase().includes('scholarship')) ? (
                      <div className="mx-3.5 my-2 p-2.5 bg-gradient-to-r from-pink-50 via-purple-50 to-orange-50 border border-[#DBDBDB] rounded-xl flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs text-[#262626]">
                          <CreditCard size={15} className="text-[#DD2A7B]" />
                          <span className="font-semibold">Community Fundraising & Donations</span>
                        </div>
                        <button
                          onClick={() => setActiveTab('donations')}
                          className="px-2.5 py-1 bg-[#DD2A7B] hover:bg-[#C9226C] text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                        >
                          <span>Donate</span>
                          <ArrowUpRight size={12} />
                        </button>
                      </div>
                    ) : null}

                    {/* Comment preview toggle / counter */}
                    <div className="px-3.5 py-1">
                      {post.comments.length > 0 && !isCommentsOpen && (
                        <button
                          onClick={() => toggleComments(post.id)}
                          className="text-xs text-[#737373] hover:text-[#262626] cursor-pointer"
                        >
                          View all {post.comments.length} comments
                        </button>
                      )}
                    </div>

                    {/* Comments Drawer (Inline Instagram Style) */}
                    {isCommentsOpen && (
                      <div className="px-3.5 py-2.5 bg-[#FAFAFA] border-t border-[#DBDBDB] space-y-2.5">
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {post.comments.length === 0 ? (
                            <div className="text-xs text-[#737373] py-1">No comments yet. Start the conversation!</div>
                          ) : (
                            post.comments.map(c => (
                              <div key={c.id} className="flex items-start gap-2">
                                <img 
                                  src={c.authorAvatar} 
                                  alt={c.authorName} 
                                  onClick={() => setViewingMemberId(c.authorId)}
                                  className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5 cursor-pointer" 
                                />
                                <div className="text-xs flex-1">
                                  <span 
                                    onClick={() => setViewingMemberId(c.authorId)}
                                    className="font-bold text-[#262626] mr-1.5 cursor-pointer hover:underline inline-flex items-center gap-1"
                                  >
                                    {c.authorName}
                                    <VerifiedBadge userId={c.authorId} role={c.authorRole} size="xs" />
                                  </span>
                                  <span className="text-[#262626]">{c.content}</span>
                                  <div className="text-[10px] text-[#737373] mt-0.5 flex items-center justify-between">
                                    <span>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    {c.authorId !== currentUser.uid && (
                                      <button
                                        type="button"
                                        onClick={() => setActiveReportTarget({
                                          targetType: 'comment',
                                          targetId: c.id,
                                          targetAuthorId: c.authorId,
                                          targetAuthorName: c.authorName,
                                          targetContentSnippet: c.content
                                        })}
                                        className="text-[#737373] hover:text-amber-600 transition flex items-center gap-0.5 text-[9px] cursor-pointer"
                                        title="Report this comment"
                                      >
                                        <Flag size={9} />
                                        <span>Report</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Inline Comment Input */}
                        {canComment ? (
                          <form onSubmit={e => handleCommentSubmit(post.id, e)} className="flex items-center gap-2 pt-1 border-t border-[#DBDBDB]">
                            <img src={currentUser.avatarUrl} alt="You" className="w-6 h-6 rounded-full object-cover shrink-0" />
                            <input
                              type="text"
                              value={commentInputs[post.id] || ''}
                              onChange={e => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                              placeholder="Add a comment..."
                              className="flex-1 bg-transparent py-1 text-xs text-[#262626] placeholder-[#737373] focus:outline-none"
                            />
                            <button
                              type="submit"
                              disabled={!commentInputs[post.id]?.trim()}
                              className="text-xs font-bold text-[#DD2A7B] disabled:opacity-40 hover:text-[#C9226C] cursor-pointer"
                            >
                              Post
                            </button>
                          </form>
                        ) : (
                          <div className="text-[11px] text-[#737373] italic">Commenting is locked for non-approved accounts.</div>
                        )}
                        {commentErrors[post.id] && (
                          <div className="text-[10px] text-red-500">{commentErrors[post.id]}</div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </main>

        {/* Right Desktop Sidebar: 3D Crest & Philanthropy Spotlight */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-16 space-y-3">
          {/* Interactive 3D Executive Seal Widget */}
          <div className="bg-white border border-[#DBDBDB] rounded-2xl p-3 shadow-xs">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#DD2A7B] flex items-center gap-1.5">
                <Sparkles size={12} /> Executive Crest
              </span>
              <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-semibold border border-emerald-200">Interactive</span>
            </div>
            <ThreeClubCrest />
          </div>

          {/* Active Endowment Campaign Mini-Tracker */}
          {primaryCampaign && (
            <div className="bg-white border border-[#DBDBDB] rounded-2xl p-4 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#737373] flex items-center gap-1">
                  <TrendingUp size={12} className="text-[#DD2A7B]" /> Endowment Fund
                </span>
                <span 
                  onClick={() => setActiveTab('donations')} 
                  className="text-[10px] text-[#DD2A7B] cursor-pointer hover:underline font-bold"
                >
                  Give →
                </span>
              </div>
              <div className="text-xs font-bold text-[#262626] line-clamp-1">{primaryCampaign.title}</div>
              <div className="w-full bg-[#FAFAFA] h-1.5 rounded-full overflow-hidden border border-[#DBDBDB]">
                <div 
                  className="bg-gradient-to-r from-[#FCAF45] via-[#DD2A7B] to-[#8134AF] h-full rounded-full"
                  style={{ width: `${Math.min(100, Math.round((primaryCampaign.collectedAmount / (primaryCampaign.targetAmount || 1)) * 100))}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-[#737373] font-mono">
                <span>{primaryCampaign.collectedAmount.toLocaleString()} BDT</span>
                <span className="text-[#262626] font-bold">
                  {primaryCampaign.targetAmount 
                    ? `${Math.round((primaryCampaign.collectedAmount / primaryCampaign.targetAmount) * 100)}%`
                    : 'Ongoing'}
                </span>
              </div>
            </div>
          )}

          {/* Council Fellows Directory Snippet */}
          <div className="bg-white border border-[#DBDBDB] rounded-2xl p-3.5 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#737373]">
              <span className="flex items-center gap-1">
                <Users size={12} className="text-[#DD2A7B]" /> Fellows Roster
              </span>
              <span 
                onClick={() => setActiveTab('directory')}
                className="text-[10px] text-[#DD2A7B] cursor-pointer hover:underline font-semibold lowercase"
              >
                see all
              </span>
            </div>
            <div className="space-y-2">
              {highlightMembers.slice(0, 4).map(u => (
                <div 
                  key={u.uid} 
                  onClick={() => setSelectedHighlightUser(u)}
                  className="flex items-center justify-between p-1.5 rounded-xl hover:bg-[#FAFAFA] transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <img src={u.avatarUrl} alt={u.displayName} className="w-7 h-7 rounded-full object-cover border border-[#DBDBDB]" />
                    <div>
                      <div className="text-xs font-bold text-[#262626] truncate max-w-[120px] flex items-center gap-1">
                        <span className="truncate">{u.displayName}</span>
                        <VerifiedBadge user={u} size="xs" />
                      </div>
                      <div className="text-[10px] text-[#737373] capitalize">
                        {u.role === 'super_admin' ? 'System Controller' : u.role.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={e => {
                      e.stopPropagation();
                      createConversation(u.uid);
                    }}
                    className="p-1 text-[#737373] hover:text-[#DD2A7B]"
                    title="Send Message"
                  >
                    <MessageSquare size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Full-Screen Create Post Modal (Instagram Style) */}
      {composerOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white border border-[#DBDBDB] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-3.5 border-b border-[#DBDBDB] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#262626]">Create New Post</h3>
              <button
                onClick={() => setComposerOpen(false)}
                className="p-1 rounded-full text-[#737373] hover:text-[#262626]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handlePostSubmit} className="p-4 overflow-y-auto flex-1 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="p-0.5 rounded-full bg-gradient-to-tr from-[#FCAF45] via-[#DD2A7B] to-[#8134AF] shrink-0">
                  <img src={currentUser.avatarUrl} alt={currentUser.displayName} className="w-9 h-9 rounded-full object-cover border border-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#262626] flex items-center gap-1.5">
                    <span>{currentUser.displayName}</span>
                    <VerifiedBadge user={currentUser} size="xs" />
                  </div>
                  <div className="text-[10px] text-[#737373] flex items-center gap-1">
                    <Lock size={9} /> Private Community
                  </div>
                </div>
              </div>

              <textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder={`What's on your mind, ${currentUser.displayName.split(' ')[0]}?`}
                rows={4}
                className="w-full bg-transparent text-[#262626] placeholder-[#737373] text-sm focus:outline-none resize-none pt-1"
                autoFocus
              />

              {/* Direct Media Upload Picker */}
              <div className="p-3 bg-[#FAFAFA] rounded-xl border border-[#DBDBDB]">
                <ImageUploadPicker
                  images={uploadedImages}
                  onChange={setUploadedImages}
                  maxImages={4}
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
                {(['general', 'announcement', 'event', 'discussion'] as PostCategory[]).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition cursor-pointer ${
                      newCategory === cat 
                        ? 'bg-[#DD2A7B] text-white shadow-xs' 
                        : 'bg-[#FAFAFA] text-[#737373] hover:text-[#262626] border border-[#DBDBDB]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {errorMessage && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl flex items-center gap-2">
                  <AlertCircle size={14} /> {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || (!newContent.trim() && uploadedImages.length === 0)}
                className="w-full py-2.5 bg-[#DD2A7B] hover:bg-[#C9226C] disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Send size={14} />
                {isSubmitting ? 'Sharing...' : 'Share Post'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Member Highlight Modal (Story / Moments) */}
      {selectedHighlightUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#DBDBDB] rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center space-y-4">
            <div className="relative mx-auto w-20 h-20">
              <div className="p-1 rounded-full bg-gradient-to-tr from-[#FCAF45] via-[#DD2A7B] to-[#8134AF] shadow-md">
                <img
                  src={selectedHighlightUser.avatarUrl}
                  alt={selectedHighlightUser.displayName}
                  className="w-full h-full rounded-full object-cover border-2 border-white"
                />
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-[#262626] flex items-center justify-center gap-1.5 flex-wrap">
                <span>{selectedHighlightUser.displayName}</span>
                <VerifiedBadge user={selectedHighlightUser} size="sm" />
              </h3>
              <div className="text-xs text-[#DD2A7B] uppercase font-bold tracking-wider mt-0.5">
                {selectedHighlightUser.role === 'super_admin' ? 'System Controller' : selectedHighlightUser.role.replace('_', ' ')}
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                Verified Active Member
              </div>
            </div>

            <p className="text-xs text-[#737373] leading-relaxed bg-[#FAFAFA] p-3 rounded-xl border border-[#DBDBDB]">
              {selectedHighlightUser.bio || 'Fellow member in good standing with the Executive Council.'}
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  createConversation(selectedHighlightUser.uid);
                  setSelectedHighlightUser(null);
                }}
                className="flex-1 py-2 bg-[#DD2A7B] hover:bg-[#C9226C] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <MessageSquare size={14} /> Send Message
              </button>
              <button
                onClick={() => setSelectedHighlightUser(null)}
                className="px-4 py-2 bg-[#FAFAFA] hover:bg-[#F2F2F2] text-[#262626] border border-[#DBDBDB] rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxData && (
        <ImageLightbox
          images={lightboxData.images}
          initialIndex={lightboxData.initialIndex}
          onClose={() => setLightboxData(null)}
        />
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#DBDBDB] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#262626] flex items-center gap-2">
                <Edit3 size={16} className="text-[#DD2A7B]" /> Edit Post
              </h3>
              <button onClick={() => setEditingPost(null)} className="text-[#737373] hover:text-[#262626]">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <textarea
                rows={4}
                required
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl p-3 text-xs text-[#262626] focus:outline-none resize-none"
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-[#DBDBDB]">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="px-4 py-2 text-xs text-[#737373] hover:text-[#262626]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#DD2A7B] hover:bg-[#C9226C] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Save size={14} /> Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comprehensive Community Safety Report Modal */}
      {activeReportTarget && (
        <ReportModal
          isOpen={!!activeReportTarget}
          onClose={() => setActiveReportTarget(null)}
          targetType={activeReportTarget.targetType}
          targetId={activeReportTarget.targetId}
          targetAuthorId={activeReportTarget.targetAuthorId}
          targetAuthorName={activeReportTarget.targetAuthorName}
          targetContentSnippet={activeReportTarget.targetContentSnippet}
          evidenceContext={activeReportTarget.evidenceContext}
        />
      )}

      {/* In-Feed Campaign Details & Contribution Modal */}
      {activeDonationModalCampaign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#DBDBDB] rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#DBDBDB]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-pink-50 text-[#DD2A7B] flex items-center justify-center shrink-0">
                  <CreditCard size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#DD2A7B] bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100">
                      {activeDonationModalCampaign.category}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase">
                      {activeDonationModalCampaign.status}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#262626] mt-0.5 truncate">
                    {activeDonationModalCampaign.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveDonationModalCampaign(null);
                  setDonateError('');
                  setDonateSuccess('');
                }}
                className="text-[#737373] hover:text-[#262626] p-1 cursor-pointer"
                title="Back to Feed"
              >
                <X size={18} />
              </button>
            </div>

            {/* Campaign Organizer Bar */}
            <div className="flex items-center justify-between bg-[#FAFAFA] border border-[#DBDBDB] p-2.5 rounded-xl text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={activeDonationModalCampaign.organizerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={activeDonationModalCampaign.organizerName}
                  className="w-7 h-7 rounded-full object-cover shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-[#262626] truncate">{activeDonationModalCampaign.organizerName}</span>
                    <VerifiedBadge userId={activeDonationModalCampaign.organizerId} role={activeDonationModalCampaign.organizerRole} size="xs" />
                  </div>
                  <span className="text-[10px] text-[#737373]">Authorized Organizer</span>
                </div>
              </div>

              {activeDonationModalCampaign.deadline && (
                <div className="text-right text-[10px] text-[#737373] shrink-0">
                  <span className="block font-semibold">Deadline</span>
                  <span className="font-mono text-[#DD2A7B]">{activeDonationModalCampaign.deadline}</span>
                </div>
              )}
            </div>

            {/* Campaign Cover Image if provided */}
            {activeDonationModalCampaign.imageUrl && (
              <div className="rounded-xl overflow-hidden max-h-48 border border-[#DBDBDB] bg-[#FAFAFA]">
                <img
                  src={activeDonationModalCampaign.imageUrl}
                  alt={activeDonationModalCampaign.title}
                  className="w-full h-36 sm:h-44 object-cover"
                />
              </div>
            )}

            {/* Description / Caption */}
            <div className="text-xs text-[#262626] bg-[#FAFAFA] p-3 rounded-xl border border-[#DBDBDB] leading-relaxed">
              <span className="font-semibold text-[#737373] block text-[10px] uppercase mb-1">Campaign Purpose & Description</span>
              <p className="whitespace-pre-line">{activeDonationModalCampaign.description}</p>
            </div>

            {/* Financial Target Meter */}
            <div className="space-y-1.5 p-3 rounded-xl bg-pink-50/40 border border-pink-100">
              <div className="flex justify-between items-baseline text-xs">
                <div>
                  <span className="text-emerald-700 font-mono font-bold text-sm">
                    {activeDonationModalCampaign.collectedAmount.toLocaleString()} BDT
                  </span>
                  <span className="text-[10px] text-[#737373] ml-1">Confirmed Raised</span>
                </div>
                <div className="text-right">
                  <span className="text-[#DD2A7B] font-bold text-xs">
                    {activeDonationModalCampaign.targetAmount
                      ? Math.min(100, Math.round((activeDonationModalCampaign.collectedAmount / activeDonationModalCampaign.targetAmount) * 100))
                      : 0}%
                  </span>
                  {activeDonationModalCampaign.targetAmount && (
                    <span className="text-[10px] text-[#737373] ml-1">
                      of {activeDonationModalCampaign.targetAmount.toLocaleString()} BDT
                    </span>
                  )}
                </div>
              </div>

              <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-[#DBDBDB]/60">
                <div
                  className="bg-gradient-to-r from-[#FCAF45] via-[#DD2A7B] to-[#8134AF] h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      activeDonationModalCampaign.targetAmount
                        ? Math.min(100, Math.round((activeDonationModalCampaign.collectedAmount / activeDonationModalCampaign.targetAmount) * 100))
                        : 0
                    }%`
                  }}
                />
              </div>
            </div>

            {/* 1-Click Copy bKash / Nagad Numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#FAFAFA] border border-[#DBDBDB] flex items-center justify-between gap-1">
                <div className="min-w-0">
                  <span className="font-bold text-[#E2136E] block text-[11px]">bKash Account</span>
                  <span className="font-mono text-[11px] text-[#262626] truncate block">{activeDonationModalCampaign.bkashNumber}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleFeedCopy(activeDonationModalCampaign.bkashNumber.split(' ')[0], 'bkash')}
                  className="px-2 py-1 rounded-md bg-white border border-[#DBDBDB] text-[10px] font-semibold text-[#262626] hover:bg-[#F2F2F2] cursor-pointer shrink-0 flex items-center gap-1"
                >
                  {feedCopied === 'bkash' ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                  <span>{feedCopied === 'bkash' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAFAFA] border border-[#DBDBDB] flex items-center justify-between gap-1">
                <div className="min-w-0">
                  <span className="font-bold text-[#F7941D] block text-[11px]">Nagad Account</span>
                  <span className="font-mono text-[11px] text-[#262626] truncate block">{activeDonationModalCampaign.nagadNumber}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleFeedCopy(activeDonationModalCampaign.nagadNumber.split(' ')[0], 'nagad')}
                  className="px-2 py-1 rounded-md bg-white border border-[#DBDBDB] text-[10px] font-semibold text-[#262626] hover:bg-[#F2F2F2] cursor-pointer shrink-0 flex items-center gap-1"
                >
                  {feedCopied === 'nagad' ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                  <span>{feedCopied === 'nagad' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Feedback Messages */}
            {donateError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{donateError}</span>
              </div>
            )}

            {donateSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
                <span>{donateSuccess}</span>
              </div>
            )}

            {/* Quick Donation Submission Form */}
            <form onSubmit={handleFeedDonationSubmit} className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#262626] block mb-1">Amount (BDT) *</label>
                  <input
                    type="number"
                    required
                    min={10}
                    step={100}
                    value={donateAmount}
                    onChange={e => setDonateAmount(e.target.value)}
                    className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#262626] block mb-1">Payment Method</label>
                  <select
                    value={donateMethod}
                    onChange={e => setDonateMethod(e.target.value as DonationMethod)}
                    className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none"
                  >
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                    <option value="Bank">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#262626] block mb-1">Sender Mobile *</label>
                  <input
                    type="tel"
                    required
                    value={donateMobile}
                    onChange={e => setDonateMobile(e.target.value)}
                    placeholder="01711000000"
                    className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#262626] block mb-1">Transaction ID (TrxID) *</label>
                  <input
                    type="text"
                    required
                    value={donateTrxId}
                    onChange={e => setDonateTrxId(e.target.value.toUpperCase())}
                    placeholder="e.g. 9K4M82PQ10"
                    className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#262626] block mb-1">Payment Slip / Evidence (Optional)</label>
                <ImageUploadPicker
                  images={donateEvidence}
                  onChange={setDonateEvidence}
                  maxImages={1}
                  maxSizeBytes={5 * 1024 * 1024}
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#DBDBDB]">
                <button
                  type="button"
                  onClick={() => {
                    const campId = activeDonationModalCampaign.id;
                    setActiveDonationModalCampaign(null);
                    openDonationForCampaign(campId);
                  }}
                  className="text-[11px] font-semibold text-[#DD2A7B] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open in Full Donations Hub</span>
                  <ArrowUpRight size={12} />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDonationModalCampaign(null);
                      setDonateError('');
                      setDonateSuccess('');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#EFEFEF] hover:bg-[#DBDBDB] text-[#262626] text-xs font-semibold cursor-pointer"
                  >
                    Back to Feed
                  </button>
                  <button
                    type="submit"
                    disabled={donateSubmitting || !canCampaignAcceptDonations(activeDonationModalCampaign)}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#DD2A7B] to-[#8134AF] hover:opacity-90 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <CreditCard size={14} />
                    <span>
                      {!canCampaignAcceptDonations(activeDonationModalCampaign)
                        ? 'Donation Closed'
                        : donateSubmitting 
                          ? 'Submitting...' 
                          : 'Submit Pledge'}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
