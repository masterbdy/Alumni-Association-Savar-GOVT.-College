import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { VerifiedBadge } from './VerifiedBadge';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Calendar, 
  Bookmark, 
  CreditCard, 
  CheckCircle2, 
  Edit3, 
  Save, 
  AlertCircle,
  FileText,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Globe,
  Linkedin,
  Twitter,
  Github,
  Building2,
  MapPin,
  LogOut,
  Camera,
  Trash2,
  ShieldCheck,
  Check,
  UploadCloud,
  Loader2
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { 
    currentUser, 
    updateProfile, 
    changePassword, 
    logout,
    posts, 
    donations, 
    setActiveTab, 
    deletePost, 
    editPost
  } = useApp();

  type ProfileTab = 'overview' | 'edit' | 'security' | 'privacy' | 'activity';
  const [activeSection, setActiveSection] = useState<ProfileTab>('overview');

  // Edit form state
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [headline, setHeadline] = useState(currentUser.headline || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [location, setLocation] = useState(currentUser.location || 'Dhaka, Bangladesh');
  const [occupation, setOccupation] = useState(currentUser.occupation || '');
  const [chapter, setChapter] = useState(currentUser.chapter || 'Central Executive Chapter');
  const [website, setWebsite] = useState(currentUser.website || '');
  const [linkedinUrl, setLinkedinUrl] = useState(currentUser.linkedinUrl || '');
  const [twitterUrl, setTwitterUrl] = useState(currentUser.twitterUrl || '');
  const [githubUrl, setGithubUrl] = useState(currentUser.githubUrl || '');
  const [interestsText, setInterestsText] = useState((currentUser.interests || []).join(', '));
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(currentUser.coverPhotoUrl || '');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Post inline edit state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostContent, setEditPostContent] = useState('');

  // Feedback states
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [securityFeedback, setSecurityFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [privacyFeedback, setPrivacyFeedback] = useState<string | null>(null);

  // Avatar presets
  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
  ];

  // Cover presets
  const coverPresets = [
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80'
  ];

  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const coverInputRef = React.useRef<HTMLInputElement>(null);
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const [isProcessingCover, setIsProcessingCover] = useState(false);

  const processImageFile = (file: File, maxDim: number = 800): Promise<string> => {
    return new Promise((resolve, reject) => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        reject(new Error('Please select a JPG, PNG, WEBP, or GIF image.'));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error('Image size exceeds 5MB limit.'));
        return;
      }
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.88));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingAvatar(true);
    setProfileFeedback(null);
    try {
      const dataUrl = await processImageFile(file, 600);
      setAvatarUrl(dataUrl);
      setProfileFeedback({ type: 'success', message: 'Custom avatar uploaded! Click "Save Profile Changes" below to apply.' });
    } catch (err: any) {
      setProfileFeedback({ type: 'error', message: err.message || 'Error processing avatar.' });
    } finally {
      setIsProcessingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleCoverFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingCover(true);
    setProfileFeedback(null);
    try {
      const dataUrl = await processImageFile(file, 1400);
      setCoverPhotoUrl(dataUrl);
      setProfileFeedback({ type: 'success', message: 'Custom cover photo uploaded! Click "Save Profile Changes" below to apply.' });
    } catch (err: any) {
      setProfileFeedback({ type: 'error', message: err.message || 'Error processing cover photo.' });
    } finally {
      setIsProcessingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileFeedback(null);

    const parsedInterests = interestsText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const res = updateProfile(currentUser.uid, {
      displayName,
      headline,
      bio,
      phone,
      location,
      occupation,
      chapter,
      website,
      linkedinUrl,
      twitterUrl,
      githubUrl,
      interests: parsedInterests,
      avatarUrl,
      coverPhotoUrl
    });

    if (res.success) {
      setProfileFeedback({ type: 'success', message: 'Profile updated successfully!' });
      setTimeout(() => {
        setProfileFeedback(null);
        setActiveSection('overview');
      }, 1500);
    } else {
      setProfileFeedback({ type: 'error', message: res.error || 'Failed to update profile.' });
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityFeedback(null);

    if (newPassword !== confirmPassword) {
      setSecurityFeedback({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }

    const res = changePassword(currentPassword, newPassword);
    if (res.success) {
      setSecurityFeedback({ type: 'success', message: 'Password successfully updated!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSecurityFeedback(null), 3000);
    } else {
      setSecurityFeedback({ type: 'error', message: res.error || 'Password update failed.' });
    }
  };

  const handleTogglePrivacy = (field: 'showEmailPublicly' | 'showPhonePublicly' | 'allowDirectMessages') => {
    const nextVal = !currentUser[field];
    updateProfile(currentUser.uid, { [field]: nextVal });
    setPrivacyFeedback('Privacy settings updated');
    setTimeout(() => setPrivacyFeedback(null), 2000);
  };

  const handleStartEditPost = (postId: string, content: string) => {
    setEditingPostId(postId);
    setEditPostContent(content);
  };

  const handleSaveEditPost = (postId: string) => {
    if (!editPostContent.trim()) return;
    editPost(postId, editPostContent);
    setEditingPostId(null);
  };

  const myPosts = posts.filter(p => p.authorId === currentUser.uid);
  const myBookmarks = posts.filter(p => p.bookmarks?.includes(currentUser.uid));
  const myDonations = donations.filter(d => d.userId === currentUser.uid);
  const verifiedTotal = myDonations
    .filter(d => d.status === 'confirmed' || d.status === 'verified')
    .reduce((sum, d) => sum + d.amount, 0);

  const roleColors: Record<string, string> = {
    super_admin: 'bg-purple-50 text-purple-700 border-purple-200',
    admin: 'bg-blue-50 text-blue-700 border-blue-200',
    moderator: 'bg-sky-50 text-sky-700 border-sky-200',
    member: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    restricted_member: 'bg-red-50 text-red-700 border-red-200'
  };

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: '', color: 'bg-slate-200', width: 'w-0' };
    if (pwd.length < 6) return { label: 'Too short (min 6)', color: 'bg-red-500', width: 'w-1/4' };
    if (pwd.length < 8) return { label: 'Medium', color: 'bg-amber-500', width: 'w-2/4' };
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' };
    return { label: 'Good', color: 'bg-blue-500', width: 'w-3/4' };
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Top Profile Card with Cover Photo & Instagram Header */}
      <div className="bg-white border border-[#DBDBDB] rounded-2xl shadow-xs overflow-hidden relative">
        {/* Cover Photo */}
        <div className="relative h-40 sm:h-52 w-full bg-gradient-to-r from-orange-100 via-pink-50 to-purple-100">
          {currentUser.coverPhotoUrl ? (
            <img 
              src={currentUser.coverPhotoUrl} 
              alt="Cover Banner" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full opacity-30 bg-[radial-gradient(#DD2A7B_1px,transparent_1px)] [background-size:16px_16px]" />
          )}

          {/* Quick Cover Change Button */}
          <button
            onClick={() => setActiveSection('edit')}
            className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/90 hover:bg-white text-[#262626] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-[#DBDBDB] cursor-pointer shadow-xs"
          >
            <Camera size={13} className="text-[#DD2A7B]" /> Change Cover
          </button>
        </div>

        {/* Instagram Profile Header */}
        <div className="px-5 sm:px-8 pb-5 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-4">
            <div className="flex items-end gap-4">
              <div className="relative group">
                <div className="p-1 rounded-full bg-gradient-to-tr from-[#FCAF45] via-[#DD2A7B] to-[#8134AF] shadow-md">
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.displayName}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white bg-white"
                  />
                </div>
                <button
                  onClick={() => setActiveSection('edit')}
                  title="Change profile avatar"
                  className="absolute bottom-1 right-1 p-2 bg-[#DD2A7B] hover:bg-[#C9226C] text-white rounded-full shadow-md transition cursor-pointer border-2 border-white"
                >
                  <Camera size={13} />
                </button>
              </div>

              <div className="pb-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-[#262626] tracking-tight flex items-center gap-2">
                    <span>{currentUser.displayName}</span>
                    <VerifiedBadge user={currentUser} size="md" />
                  </h1>
                  <span className={`text-[10px] uppercase px-2.5 py-0.5 rounded-full font-bold border ${roleColors[currentUser.role]}`}>
                    {currentUser.role === 'super_admin' ? 'System Controller' : currentUser.role.replace('_', ' ')}
                  </span>
                </div>
                {currentUser.username && (
                  <p className="text-xs text-[#737373] font-mono mt-0.5">@{currentUser.username}</p>
                )}
                <p className="text-xs text-[#262626] font-medium mt-1">
                  {currentUser.headline || currentUser.occupation || 'Community Member'}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <button
                onClick={() => setActiveSection('edit')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  activeSection === 'edit'
                    ? 'bg-[#DD2A7B] text-white shadow-xs'
                    : 'bg-[#EFEFEF] hover:bg-[#DBDBDB] text-[#262626]'
                }`}
              >
                <Edit3 size={14} /> Edit Profile
              </button>

              <button
                onClick={logout}
                className="px-3.5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Sign out of account"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>

          {/* Council Badges & Verification Meta */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#DBDBDB] text-xs text-[#737373]">
            <VerifiedBadge user={currentUser} size="sm" showLabel={true} />
            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <CheckCircle2 size={13} /> {(currentUser.status || 'approved').toUpperCase()} MEMBER
            </span>
            <span className="flex items-center gap-1.5 bg-[#FAFAFA] px-2.5 py-1 rounded-lg border border-[#DBDBDB] text-[#262626]">
              <Calendar size={13} className="text-[#DD2A7B]" /> Joined {new Date(currentUser.joinedAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1.5 bg-[#FAFAFA] px-2.5 py-1 rounded-lg border border-[#DBDBDB] text-[#262626]">
              <Lock size={13} className="text-amber-600" /> Protected Account
            </span>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto px-5 sm:px-8 border-t border-[#DBDBDB] bg-[#FAFAFA] py-2">
          {[
            { id: 'overview', label: 'Overview', icon: <User size={14} /> },
            { id: 'edit', label: 'Edit Profile', icon: <Edit3 size={14} /> },
            { id: 'security', label: 'Password & Security', icon: <KeyRound size={14} /> },
            { id: 'privacy', label: 'Privacy Controls', icon: <ShieldCheck size={14} /> },
            { id: 'activity', label: 'Posts & Activity', icon: <FileText size={14} />, badge: myPosts.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as ProfileTab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                activeSection === tab.id
                  ? 'bg-[#262626] text-white shadow-xs'
                  : 'text-[#737373] hover:text-[#262626] hover:bg-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeSection === tab.id ? 'bg-[#DD2A7B] text-white' : 'bg-[#DBDBDB] text-[#262626]'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 1: OVERVIEW */}
      {activeSection === 'overview' && (
        <div className="space-y-5">
          {/* Instagram Stats Counter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-[#DBDBDB] rounded-2xl p-4 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between text-[#737373] mb-2">
                <span className="text-xs font-semibold">Feed Posts</span>
                <FileText size={18} className="text-[#DD2A7B]" />
              </div>
              <div className="text-2xl font-bold text-[#262626] font-mono">{myPosts.length}</div>
              <span className="text-[11px] text-[#737373] mt-1">Dispatches shared to feed</span>
            </div>

            <div className="bg-white border border-[#DBDBDB] rounded-2xl p-4 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between text-[#737373] mb-2">
                <span className="text-xs font-semibold">Saved Items</span>
                <Bookmark size={18} className="text-[#8134AF]" />
              </div>
              <div className="text-2xl font-bold text-[#262626] font-mono">{myBookmarks.length}</div>
              <span className="text-[11px] text-[#737373] mt-1">Posts saved for reference</span>
            </div>

            <div className="bg-white border border-[#DBDBDB] rounded-2xl p-4 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between text-[#737373] mb-2">
                <span className="text-xs font-semibold">Verified Contributions</span>
                <CreditCard size={18} className="text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-[#262626] font-mono">{verifiedTotal.toLocaleString()} BDT</div>
              <span className="text-[11px] text-emerald-700 mt-1">Confirmed donations</span>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-white border border-[#DBDBDB] rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#737373] mb-2">Biography</h3>
              <p className="text-xs text-[#262626] leading-relaxed bg-[#FAFAFA] p-4 rounded-xl border border-[#DBDBDB]">
                {currentUser.bio || 'No bio provided. Click "Edit Profile" to share details with the community.'}
              </p>
            </div>

            {/* Focus Areas & Interests */}
            {currentUser.interests && currentUser.interests.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#737373] mb-2">Interests & Specializations</h3>
                <div className="flex flex-wrap gap-2">
                  {currentUser.interests.map((tag, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1 bg-pink-50 border border-pink-200 text-[#DD2A7B] text-xs font-medium rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Coordinates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="flex items-center gap-3 text-xs text-[#262626] bg-[#FAFAFA] p-3 rounded-xl border border-[#DBDBDB]">
                <Building2 size={16} className="text-[#DD2A7B] shrink-0" />
                <div>
                  <span className="text-[10px] text-[#737373] uppercase tracking-wider block">Assigned Chapter</span>
                  <span className="font-semibold">{currentUser.chapter || 'Central Executive Chapter'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-[#262626] bg-[#FAFAFA] p-3 rounded-xl border border-[#DBDBDB]">
                <MapPin size={16} className="text-[#DD2A7B] shrink-0" />
                <div>
                  <span className="text-[10px] text-[#737373] uppercase tracking-wider block">Location</span>
                  <span className="font-semibold">{currentUser.location || 'Dhaka, Bangladesh'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-[#262626] bg-[#FAFAFA] p-3 rounded-xl border border-[#DBDBDB]">
                <Mail size={16} className="text-[#DD2A7B] shrink-0" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#737373] uppercase tracking-wider">Email</span>
                    <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1.5 rounded border border-emerald-200">Verified</span>
                  </div>
                  <span className="font-semibold">{currentUser.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-[#262626] bg-[#FAFAFA] p-3 rounded-xl border border-[#DBDBDB]">
                <Phone size={16} className="text-emerald-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-[#737373] uppercase tracking-wider block">Phone / WhatsApp</span>
                  <span className="font-semibold">{currentUser.phone || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* Social & Web Links */}
            {(currentUser.website || currentUser.linkedinUrl || currentUser.twitterUrl || currentUser.githubUrl) && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#737373] mb-2">External Links</h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  {currentUser.website && (
                    <a href={currentUser.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-[#FAFAFA] hover:bg-[#F2F2F2] px-3 py-1.5 rounded-xl border border-[#DBDBDB] text-[#262626] transition">
                      <Globe size={13} className="text-[#DD2A7B]" /> Website
                    </a>
                  )}
                  {currentUser.linkedinUrl && (
                    <a href={currentUser.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-[#FAFAFA] hover:bg-[#F2F2F2] px-3 py-1.5 rounded-xl border border-[#DBDBDB] text-[#262626] transition">
                      <Linkedin size={13} className="text-[#0A66C2]" /> LinkedIn
                    </a>
                  )}
                  {currentUser.twitterUrl && (
                    <a href={currentUser.twitterUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-[#FAFAFA] hover:bg-[#F2F2F2] px-3 py-1.5 rounded-xl border border-[#DBDBDB] text-[#262626] transition">
                      <Twitter size={13} className="text-[#1DA1F2]" /> Twitter/X
                    </a>
                  )}
                  {currentUser.githubUrl && (
                    <a href={currentUser.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-[#FAFAFA] hover:bg-[#F2F2F2] px-3 py-1.5 rounded-xl border border-[#DBDBDB] text-[#262626] transition">
                      <Github size={13} className="text-[#262626]" /> GitHub
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: EDIT PROFILE */}
      {activeSection === 'edit' && (
        <div className="bg-white border border-[#DBDBDB] rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs">
          <div>
            <h2 className="text-lg font-bold text-[#262626] flex items-center gap-2">
              <Edit3 size={18} className="text-[#DD2A7B]" /> Edit Profile
            </h2>
            <p className="text-xs text-[#737373] mt-1">
              Update your public details. Changes are updated immediately across all community views.
            </p>
          </div>

          {profileFeedback && (
            <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
              profileFeedback.type === 'success' 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {profileFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{profileFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Avatar & Cover Section */}
            <div className="space-y-4 bg-[#FAFAFA] p-4 sm:p-5 rounded-xl border border-[#DBDBDB]">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarFileSelected}
              />
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleCoverFileSelected}
              />

              {/* 1. Avatar */}
              <div>
                <label className="text-xs font-semibold text-[#262626] block mb-2">Profile Picture</label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="relative w-16 h-16 shrink-0">
                    <img 
                      src={avatarUrl} 
                      alt="Avatar Preview" 
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#DBDBDB] shadow-xs"
                    />
                    {isProcessingAvatar && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white">
                        <Loader2 size={18} className="animate-spin text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <button
                      type="button"
                      disabled={isProcessingAvatar}
                      onClick={() => avatarInputRef.current?.click()}
                      className="px-3.5 py-1.5 bg-white hover:bg-[#F2F2F2] border border-[#DBDBDB] disabled:opacity-50 text-[#262626] rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Camera size={14} className="text-[#DD2A7B]" />
                      <span>{isProcessingAvatar ? 'Optimizing...' : 'Upload Photo'}</span>
                    </button>

                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={e => setAvatarUrl(e.target.value)}
                      placeholder="Or enter image URL (https://...)"
                      className="w-full bg-white border border-[#DBDBDB] rounded-xl px-3 py-1.5 text-xs text-[#262626] focus:outline-none focus:border-[#DD2A7B]"
                    />
                  </div>
                </div>

                {/* Avatar Presets */}
                <div className="pt-2 mt-2 border-t border-[#DBDBDB]">
                  <span className="text-[10px] uppercase font-bold text-[#737373] tracking-wider block mb-1.5">
                    Or select an avatar preset:
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {avatarPresets.map((preset, idx) => (
                      <img
                        key={idx}
                        src={preset}
                        alt={`Preset ${idx}`}
                        onClick={() => setAvatarUrl(preset)}
                        className={`w-9 h-9 rounded-full object-cover border-2 cursor-pointer transition ${
                          avatarUrl === preset ? 'border-[#DD2A7B] scale-105' : 'border-transparent hover:border-[#DBDBDB]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Cover Banner */}
              <div className="pt-3 border-t border-[#DBDBDB]">
                <label className="text-xs font-semibold text-[#262626] block mb-2">Profile Header Banner</label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="relative w-28 h-14 shrink-0 rounded-xl overflow-hidden border border-[#DBDBDB] bg-white">
                    {coverPhotoUrl ? (
                      <img 
                        src={coverPhotoUrl} 
                        alt="Cover Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-[#737373]">
                        No banner
                      </div>
                    )}
                    {isProcessingCover && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                        <Loader2 size={16} className="animate-spin text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <button
                      type="button"
                      disabled={isProcessingCover}
                      onClick={() => coverInputRef.current?.click()}
                      className="px-3.5 py-1.5 bg-white hover:bg-[#F2F2F2] border border-[#DBDBDB] text-[#262626] rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <UploadCloud size={14} className="text-[#DD2A7B]" />
                      <span>{isProcessingCover ? 'Optimizing...' : 'Upload Header Image'}</span>
                    </button>

                    <input
                      type="url"
                      value={coverPhotoUrl}
                      onChange={e => setCoverPhotoUrl(e.target.value)}
                      placeholder="Or enter banner URL (https://...)"
                      className="w-full bg-white border border-[#DBDBDB] rounded-xl px-3 py-1.5 text-xs text-[#262626] focus:outline-none focus:border-[#DD2A7B]"
                    />
                  </div>
                </div>

                {/* Cover Presets */}
                <div className="pt-2 mt-2 border-t border-[#DBDBDB]">
                  <span className="text-[10px] uppercase font-bold text-[#737373] tracking-wider block mb-1.5">
                    Or select a banner preset:
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {coverPresets.map((preset, idx) => (
                      <img
                        key={idx}
                        src={preset}
                        alt={`Cover Preset ${idx}`}
                        onClick={() => setCoverPhotoUrl(preset)}
                        className={`w-16 h-8 rounded-lg object-cover border-2 cursor-pointer transition ${
                          coverPhotoUrl === preset ? 'border-[#DD2A7B] scale-105' : 'border-transparent hover:border-[#DBDBDB]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#262626] block mb-1">Display Name *</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl px-3.5 py-2 text-xs text-[#262626] focus:outline-none focus:border-[#DD2A7B] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#262626] block mb-1">Role / Headline</label>
                <input
                  type="text"
                  value={headline}
                  onChange={e => setHeadline(e.target.value)}
                  placeholder="e.g. Senior Partner & Community Fellow"
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl px-3.5 py-2 text-xs text-[#262626] focus:outline-none focus:border-[#DD2A7B] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#262626] block mb-1">Profession / Organization</label>
                <input
                  type="text"
                  value={occupation}
                  onChange={e => setOccupation(e.target.value)}
                  placeholder="e.g. Managing Director @ TechCorp"
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl px-3.5 py-2 text-xs text-[#262626] focus:outline-none focus:border-[#DD2A7B] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#262626] block mb-1">Phone / WhatsApp</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+880 1XXXXXXXXX"
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl px-3.5 py-2 text-xs text-[#262626] focus:outline-none focus:border-[#DD2A7B] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#262626] block mb-1">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Dhaka, Bangladesh"
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl px-3.5 py-2 text-xs text-[#262626] focus:outline-none focus:border-[#DD2A7B] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#262626] block mb-1">Chapter Affiliation</label>
                <input
                  type="text"
                  value={chapter}
                  onChange={e => setChapter(e.target.value)}
                  placeholder="e.g. Central Chapter"
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl px-3.5 py-2 text-xs text-[#262626] focus:outline-none focus:border-[#DD2A7B] focus:bg-white"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="text-xs font-semibold text-[#262626] block mb-1">Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Share your interests, background, and achievements..."
                className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl p-3 text-xs text-[#262626] focus:outline-none focus:border-[#DD2A7B] focus:bg-white resize-none"
              />
            </div>

            {/* Interests */}
            <div>
              <label className="text-xs font-semibold text-[#262626] block mb-1">Interests (comma separated)</label>
              <input
                type="text"
                value={interestsText}
                onChange={e => setInterestsText(e.target.value)}
                placeholder="Philanthropy, Technology, Education, Startups"
                className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl px-3.5 py-2 text-xs text-[#262626] focus:outline-none focus:border-[#DD2A7B] focus:bg-white"
              />
            </div>

            {/* External Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#262626] block mb-1">LinkedIn Profile</label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={e => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl px-3.5 py-2 text-xs text-[#262626] focus:outline-none focus:border-[#DD2A7B] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#262626] block mb-1">Website</label>
                <input
                  type="url"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl px-3.5 py-2 text-xs text-[#262626] focus:outline-none focus:border-[#DD2A7B] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#262626] block mb-1">Twitter / X</label>
                <input
                  type="url"
                  value={twitterUrl}
                  onChange={e => setTwitterUrl(e.target.value)}
                  placeholder="https://twitter.com/..."
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl px-3.5 py-2 text-xs text-[#262626] focus:outline-none focus:border-[#DD2A7B] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#262626] block mb-1">GitHub / Portfolio</label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={e => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl px-3.5 py-2 text-xs text-[#262626] focus:outline-none focus:border-[#DD2A7B] focus:bg-white"
                />
              </div>
            </div>

            {/* Governance Protection Notice */}
            <div className="bg-[#FAFAFA] p-4 rounded-xl border border-[#DBDBDB] space-y-2">
              <span className="text-[11px] uppercase font-bold text-[#737373] tracking-wider flex items-center gap-1.5">
                <Lock size={12} className="text-amber-600" /> Protected Governance Attributes (Read-Only)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#737373] pt-1">
                <div>
                  <span className="text-[10px] text-[#737373] block">Registered Email</span>
                  <span className="text-[#262626] font-mono">{currentUser.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#737373] block">Community Role</span>
                  <span className="text-[#DD2A7B] font-semibold capitalize">{currentUser.role.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#737373] block">Status</span>
                  <span className="text-emerald-700 font-semibold">{(currentUser.status || 'approved').toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#DD2A7B] hover:bg-[#C9226C] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Save size={15} /> Save Changes
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('overview')}
                className="px-4 py-2.5 bg-[#EFEFEF] hover:bg-[#DBDBDB] text-[#262626] rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 3: PASSWORD & SECURITY */}
      {activeSection === 'security' && (
        <div className="space-y-5">
          <div className="bg-white border border-[#DBDBDB] rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-[#262626] flex items-center gap-2">
                <KeyRound size={18} className="text-[#DD2A7B]" /> Change Account Password
              </h2>
              <p className="text-xs text-[#737373] mt-1">
                Verify your current credentials and select a strong new password to protect your account.
              </p>
            </div>

            {securityFeedback && (
              <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                securityFeedback.type === 'success' 
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {securityFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{securityFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label className="text-xs font-semibold text-[#262626] block mb-1">Current Password *</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl px-3.5 py-2.5 text-xs text-[#262626] pr-10 focus:outline-none focus:border-[#DD2A7B] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-3 text-[#737373] hover:text-[#262626]"
                  >
                    {showCurrentPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#262626] block mb-1">New Password *</label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl px-3.5 py-2.5 text-xs text-[#262626] pr-10 focus:outline-none focus:border-[#DD2A7B] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-3 text-[#737373] hover:text-[#262626]"
                  >
                    {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300`} />
                    </div>
                    <span className="text-[10px] text-[#737373]">Strength: {strength.label}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-[#262626] block mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl px-3.5 py-2.5 text-xs text-[#262626] focus:outline-none focus:border-[#DD2A7B] focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-[#DD2A7B] hover:bg-[#C9226C] text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck size={15} /> Update Password
              </button>
            </form>
          </div>

          {/* Account Security Audit & Session Details */}
          <div className="bg-white border border-[#DBDBDB] rounded-2xl p-6 sm:p-7 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-[#262626] flex items-center gap-2">
              <Shield size={16} className="text-emerald-600" /> Account Security & Sessions
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#FAFAFA] p-4 rounded-xl border border-[#DBDBDB] text-xs">
                <span className="text-[10px] text-[#737373] uppercase tracking-wider block">Password Changed</span>
                <span className="text-[#262626] font-semibold mt-1 block">
                  {currentUser.passwordLastChanged 
                    ? new Date(currentUser.passwordLastChanged).toLocaleDateString()
                    : 'Initial Setup'}
                </span>
                <span className="text-[10px] text-emerald-700 mt-1 block">✓ Up to date</span>
              </div>

              <div className="bg-[#FAFAFA] p-4 rounded-xl border border-[#DBDBDB] text-xs">
                <span className="text-[10px] text-[#737373] uppercase tracking-wider block">Two-Factor Auth</span>
                <span className="text-emerald-700 font-semibold mt-1 block">Active</span>
                <span className="text-[10px] text-[#737373] mt-1 block">Device & session binding</span>
              </div>

              <div className="bg-[#FAFAFA] p-4 rounded-xl border border-[#DBDBDB] text-xs">
                <span className="text-[10px] text-[#737373] uppercase tracking-wider block">Active Sessions</span>
                <span className="text-[#262626] font-semibold mt-1 block">1 Active Session</span>
                <span className="text-[10px] text-[#DD2A7B] mt-1 block">Current Client Device</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <LogOut size={13} /> Sign Out Current Session
              </button>

              <button
                onClick={() => {
                  setSecurityFeedback({ type: 'success', message: 'All secondary sessions invalidated.' });
                  setTimeout(() => setSecurityFeedback(null), 2500);
                }}
                className="px-4 py-2 bg-[#FAFAFA] hover:bg-[#F2F2F2] border border-[#DBDBDB] text-[#262626] rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Sign Out Other Devices
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: PRIVACY SETTINGS */}
      {activeSection === 'privacy' && (
        <div className="bg-white border border-[#DBDBDB] rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs">
          <div>
            <h2 className="text-lg font-bold text-[#262626] flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#DD2A7B]" /> Privacy & Visibility Controls
            </h2>
            <p className="text-xs text-[#737373] mt-1">
              Control what contact information is visible to other approved members in the directory.
            </p>
          </div>

          {privacyFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-xl flex items-center gap-2">
              <CheckCircle2 size={15} />
              <span>{privacyFeedback}</span>
            </div>
          )}

          <div className="space-y-3">
            <div className="bg-[#FAFAFA] p-4 rounded-xl border border-[#DBDBDB] flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-[#262626] flex items-center gap-2">
                  <Mail size={14} className="text-[#DD2A7B]" /> Display Email in Member Directory
                </h4>
                <p className="text-[11px] text-[#737373] mt-0.5">
                  When enabled, members can view your email on your public profile.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePrivacy('showEmailPublicly')}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition ${
                  currentUser.showEmailPublicly ? 'bg-[#DD2A7B] justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </button>
            </div>

            <div className="bg-[#FAFAFA] p-4 rounded-xl border border-[#DBDBDB] flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-[#262626] flex items-center gap-2">
                  <Phone size={14} className="text-emerald-600" /> Display Phone in Directory
                </h4>
                <p className="text-[11px] text-[#737373] mt-0.5">
                  When enabled, fellow members can see your phone number.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePrivacy('showPhonePublicly')}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition ${
                  currentUser.showPhonePublicly ? 'bg-[#DD2A7B] justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </button>
            </div>

            <div className="bg-[#FAFAFA] p-4 rounded-xl border border-[#DBDBDB] flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-[#262626] flex items-center gap-2">
                  <Check size={14} className="text-purple-600" /> Allow Direct Messaging
                </h4>
                <p className="text-[11px] text-[#737373] mt-0.5">
                  Allow approved members to start conversations with you.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePrivacy('allowDirectMessages')}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition ${
                  currentUser.allowDirectMessages !== false ? 'bg-[#DD2A7B] justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: MY RECORDS & ACTIVITY */}
      {activeSection === 'activity' && (
        <div className="space-y-5">
          {/* My Published Posts with Edit & Delete */}
          <div className="bg-white border border-[#DBDBDB] rounded-2xl p-6 sm:p-7 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-[#262626] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText size={16} className="text-[#DD2A7B]" />
                Your Feed Posts ({myPosts.length})
              </span>
              <button
                onClick={() => setActiveTab('feed')}
                className="text-xs text-[#DD2A7B] hover:underline font-semibold"
              >
                Open Feed →
              </button>
            </h3>

            {myPosts.length === 0 ? (
              <div className="text-center py-8 bg-[#FAFAFA] rounded-xl border border-[#DBDBDB] text-xs text-[#737373]">
                You haven't posted any updates to the community feed yet.
              </div>
            ) : (
              <div className="space-y-3">
                {myPosts.map(post => (
                  <div key={post.id} className="bg-[#FAFAFA] p-4 rounded-xl border border-[#DBDBDB] space-y-3">
                    {editingPostId === post.id ? (
                      <div className="space-y-2">
                        <textarea
                          rows={3}
                          value={editPostContent}
                          onChange={e => setEditPostContent(e.target.value)}
                          className="w-full bg-white border border-[#DBDBDB] rounded-xl p-3 text-xs text-[#262626] focus:outline-none focus:border-[#DD2A7B] resize-none"
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => setEditingPostId(null)}
                            className="px-3 py-1 bg-[#EFEFEF] hover:bg-[#DBDBDB] text-[#262626] rounded-lg text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEditPost(post.id)}
                            className="px-3 py-1 bg-[#DD2A7B] hover:bg-[#C9226C] text-white font-bold rounded-lg text-xs"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-[#262626] leading-relaxed">{post.content}</p>
                        {post.imageUrl && (
                          <img 
                            src={post.imageUrl} 
                            alt="Attachment" 
                            className="w-full max-h-48 object-cover rounded-xl border border-[#DBDBDB]" 
                          />
                        )}
                        <div className="flex items-center justify-between text-[11px] text-[#737373] pt-2 border-t border-[#DBDBDB]">
                          <div className="flex items-center gap-3">
                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="text-[#DD2A7B] font-semibold">♥ {post.likes.length} Likes</span>
                            <span>•</span>
                            <span>💬 {post.comments.length} Comments</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleStartEditPost(post.id, post.content)}
                              className="px-2.5 py-1 bg-white hover:bg-[#EFEFEF] text-[#262626] border border-[#DBDBDB] rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 size={12} /> Edit
                            </button>
                            <button
                              onClick={() => deletePost(post.id)}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Donations & Contributions History */}
          <div className="bg-white border border-[#DBDBDB] rounded-2xl p-6 sm:p-7 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-[#262626] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CreditCard size={16} className="text-emerald-600" />
                Your Donation Records ({myDonations.length})
              </span>
              <button
                onClick={() => setActiveTab('donations')}
                className="text-xs text-[#DD2A7B] hover:underline font-semibold"
              >
                Donate More →
              </button>
            </h3>

            {myDonations.length === 0 ? (
              <div className="text-center py-8 bg-[#FAFAFA] rounded-xl border border-[#DBDBDB] text-xs text-[#737373]">
                You haven't submitted any donation records yet.
              </div>
            ) : (
              <div className="space-y-3">
                {myDonations.map(don => (
                  <div key={don.id} className="bg-[#FAFAFA] p-4 rounded-xl border border-[#DBDBDB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-[#262626]">{don.campaignTitle}</div>
                      <div className="text-[11px] text-[#737373] mt-0.5">
                        {don.method} • TrxID: <span className="font-mono text-[#262626] font-semibold">{don.transactionId}</span>
                      </div>
                      <div className="text-[10px] text-[#737373] mt-1">
                        Submitted: {new Date(don.submittedAt).toLocaleDateString()}
                      </div>
                      {don.rejectionReason && (
                        <div className="text-[11px] text-red-600 mt-1">
                          Reason: {don.rejectionReason}
                        </div>
                      )}
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <div className="text-sm font-bold text-[#262626] font-mono">{don.amount.toLocaleString()} BDT</div>
                      <span className={`inline-block mt-1 text-[10px] uppercase px-2 py-0.5 rounded font-bold border ${
                        don.status === 'confirmed' || don.status === 'verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        don.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {don.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
