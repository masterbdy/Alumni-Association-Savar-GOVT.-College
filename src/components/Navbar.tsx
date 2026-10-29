import React, { useState } from 'react';
import { useApp, AppTab } from '../context/AppContext';
import { VerifiedBadge } from './VerifiedBadge';
import { 
  Users, 
  MessageSquare, 
  CreditCard, 
  LayoutDashboard, 
  ChevronDown, 
  Check, 
  RotateCcw,
  Sparkles,
  UserCheck,
  Bell,
  Search,
  Plus,
  X,
  LogOut,
  KeyRound,
  ShieldCheck,
  User,
  Menu
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    currentUser, 
    users, 
    adminSession,
    isAdministrativeAccessActive,
    exitAdministrativeAccess,
    activeTab, 
    setActiveTab, 
    canManageMembers, 
    canVerifyDonations,
    resetData,
    donations,
    conversations,
    posts,
    logout,
    setShowAuthModal,
    isAuthenticated,
    appLogo,
    setIsSidebarOpen
  } = useApp();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const pendingDonationsCount = donations.filter(d => d.status === 'pending').length;
  const pendingMembersCount = users.filter(u => u.status === 'pending').length;
  const reportedPostsCount = posts.filter(p => p.reports && p.reports.length > 0).length;
  const totalAdminAttention = pendingDonationsCount + pendingMembersCount + reportedPostsCount;

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const navItems: { id: AppTab; label: string; icon: React.ReactNode; badge?: number; adminOnly?: boolean }[] = [
    { id: 'feed', label: 'Feed', icon: <Sparkles size={16} /> },
    { id: 'directory', label: 'Members', icon: <Users size={16} /> },
    { 
      id: 'donations', 
      label: 'Donations', 
      icon: <CreditCard size={16} />,
      badge: canVerifyDonations && pendingDonationsCount > 0 ? pendingDonationsCount : undefined
    },
    { 
      id: 'admin', 
      label: 'Admin Hub', 
      icon: <LayoutDashboard size={16} />, 
      badge: totalAdminAttention > 0 ? totalAdminAttention : undefined,
      adminOnly: true 
    }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#DBDBDB] px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Mobile Drawer Trigger + Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition cursor-pointer"
            title="Open navigation menu"
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </button>

          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('feed')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 p-0.5 shadow-xs shrink-0 overflow-hidden flex items-center justify-center">
            <img 
              src={appLogo.url} 
              alt="Alumni Association Logo" 
              className="w-full h-full object-cover rounded-[10px]"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&auto=format&fit=crop&q=80';
              }}
            />
          </div>
          <div>
            <div className="text-sm sm:text-base font-black text-slate-800 tracking-tight flex items-center gap-1.5 leading-none">
              Alumni Association
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                SGC
              </span>
            </div>
            <div className="text-[10px] text-slate-500 hidden sm:block mt-0.5 font-medium">
              Dept. of Management, Savar Govt. College
            </div>
          </div>
        </div>
      </div>

        {/* Center: Desktop Navigation Tabs - Only for approved members */}
        {currentUser.status === 'approved' && (
          <nav className="hidden md:flex items-center gap-1 bg-[#FAFAFA] p-1 rounded-xl border border-[#DBDBDB]">
            {navItems.map(item => {
              if (item.adminOnly && !canManageMembers && !canVerifyDonations) {
                return null;
              }

              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                    isActive 
                      ? 'bg-white text-[#262626] shadow-xs border border-[#DBDBDB]' 
                      : 'text-[#737373] hover:text-[#262626] hover:bg-white/60'
                  }`}
                >
                  <span className={isActive ? 'text-[#DD2A7B]' : ''}>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-[#DD2A7B] text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Section: Social Actions & Role Persona Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {currentUser.status === 'approved' && (
            <>
              {/* Quick Search Trigger */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                title="Search timeline"
                className="w-8 h-8 rounded-full bg-[#FAFAFA] hover:bg-[#F2F2F2] text-[#262626] flex items-center justify-center transition border border-[#DBDBDB] cursor-pointer"
              >
                <Search size={15} />
              </button>

              {/* Notifications Bell */}
              <div className="relative">
                <button
                  onClick={() => {
                    setNotifDropdownOpen(!notifDropdownOpen);
                    setRoleDropdownOpen(false);
                  }}
                  title="Notifications"
                  className="w-8 h-8 rounded-full bg-[#FAFAFA] hover:bg-[#F2F2F2] text-[#262626] flex items-center justify-center transition border border-[#DBDBDB] cursor-pointer relative"
                >
                  <Bell size={15} />
                  {totalAdminAttention > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#DD2A7B] rounded-full border-2 border-white" />
                  )}
                </button>

                {/* Notification Drawer */}
                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-[#DBDBDB] rounded-2xl shadow-xl p-3 z-50 text-xs animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-2 border-b border-[#DBDBDB] mb-2">
                      <span className="font-bold text-[#262626]">Notifications</span>
                      <span className="text-[10px] text-[#DD2A7B] font-semibold">{totalAdminAttention} pending alerts</span>
                    </div>
                    <div className="space-y-2">
                      {pendingDonationsCount > 0 && (
                        <div 
                          onClick={() => {
                            setActiveTab('admin');
                            setNotifDropdownOpen(false);
                          }}
                          className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 cursor-pointer hover:bg-amber-100/80 transition"
                        >
                          <div className="font-bold text-amber-900">{pendingDonationsCount} Pending Donations</div>
                          <div className="text-[10px] text-amber-700">bKash/Nagad transactions awaiting review.</div>
                        </div>
                      )}
                      {pendingMembersCount > 0 && (
                        <div 
                          onClick={() => {
                            setActiveTab('admin');
                            setNotifDropdownOpen(false);
                          }}
                          className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 cursor-pointer hover:bg-blue-100/80 transition"
                        >
                          <div className="font-bold text-blue-900">{pendingMembersCount} Membership Applications</div>
                          <div className="text-[10px] text-blue-700">Applicants waiting for approval.</div>
                        </div>
                      )}
                      {reportedPostsCount > 0 && (
                        <div 
                          onClick={() => {
                            setActiveTab('admin');
                            setNotifDropdownOpen(false);
                          }}
                          className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 cursor-pointer hover:bg-rose-100/80 transition"
                        >
                          <div className="font-bold text-rose-900">{reportedPostsCount} Flagged Feed Posts</div>
                          <div className="text-[10px] text-rose-700">Content reported by community.</div>
                        </div>
                      )}
                      {totalAdminAttention === 0 && (
                        <div className="text-center py-4 text-[#737373]">
                          No unread notifications.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Quick Create Post (Header Action) */}
          <button
            onClick={() => {
              setActiveTab('feed');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#DD2A7B] hover:bg-[#C9226C] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus size={14} />
            <span>Post</span>
          </button>

          {/* Persona Switcher / Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setRoleDropdownOpen(!roleDropdownOpen);
                setNotifDropdownOpen(false);
              }}
              className="flex items-center gap-2 bg-[#FAFAFA] hover:bg-[#F2F2F2] border border-[#DBDBDB] hover:border-[#A8A8A8] rounded-full pl-1 pr-2 py-1 transition text-left cursor-pointer"
            >
              <div className="p-0.5 rounded-full bg-gradient-to-tr from-[#FCAF45] via-[#DD2A7B] to-[#8134AF]">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-6 h-6 rounded-full object-cover border border-white"
                />
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-[#262626] max-w-[120px] truncate">
                <span className="truncate">{currentUser.displayName.split(' ')[0]}</span>
                <VerifiedBadge user={currentUser} size="xs" />
              </span>
              <ChevronDown size={13} className="text-[#737373]" />
            </button>

            {/* Dropdown Menu */}
            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-[#DBDBDB] rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-[#DBDBDB] mb-1.5 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-[#262626] flex items-center gap-1.5 truncate">
                      <span className="truncate">{currentUser.displayName}</span>
                      <VerifiedBadge user={currentUser} size="xs" />
                    </div>
                    <div className="text-[10px] text-[#737373] capitalize truncate">
                      {currentUser.role === 'super_admin' ? 'System Controller' : currentUser.role.replace('_', ' ')} • {currentUser.status}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setActiveTab('profile');
                      setRoleDropdownOpen(false);
                    }}
                    className="text-[11px] text-[#DD2A7B] hover:underline font-semibold cursor-pointer"
                  >
                    View
                  </button>
                </div>

                {/* Profile & Security Quick Shortcuts */}
                <div className="space-y-1 pb-2 border-b border-[#DBDBDB]">
                  <button
                    onClick={() => {
                      setActiveTab('profile');
                      setRoleDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-[#FAFAFA] text-xs text-[#262626] flex items-center gap-2 transition cursor-pointer"
                  >
                    <User size={13} className="text-[#DD2A7B]" />
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('profile');
                      setRoleDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-[#FAFAFA] text-xs text-[#262626] flex items-center gap-2 transition cursor-pointer"
                  >
                    <KeyRound size={13} className="text-amber-500" />
                    <span>Password & Account Security</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowAuthModal(true);
                      setRoleDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-[#DD2A7B]/10 text-xs text-[#DD2A7B] flex items-center gap-2 transition cursor-pointer"
                  >
                    <ShieldCheck size={13} />
                    <span>Switch Role / Portal</span>
                  </button>
                </div>

                {/* Privileged Administrative Access Status */}
                {isAdministrativeAccessActive && adminSession && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 my-1.5 space-y-2">
                    <div className="text-[10px] uppercase font-bold text-amber-800 flex items-center gap-1.5">
                      <ShieldCheck size={12} className="text-amber-600" /> Support Inspection Active
                    </div>
                    <div className="text-[11px] text-amber-900">
                      Target: <strong>{adminSession.targetName}</strong>
                    </div>
                    <button
                      onClick={() => {
                        exitAdministrativeAccess();
                        setRoleDropdownOpen(false);
                      }}
                      className="w-full py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <LogOut size={12} /> Exit Support Session
                    </button>
                  </div>
                )}

                {/* Dedicated Navigation Options */}
                <div className="space-y-1 py-1">
                  {(canManageMembers || canVerifyDonations) && (
                    <button
                      onClick={() => {
                        setActiveTab('admin');
                        setRoleDropdownOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-[#FAFAFA] text-xs text-[#DD2A7B] font-medium flex items-center gap-2 transition cursor-pointer"
                    >
                      <LayoutDashboard size={13} />
                      <span>Admin Verification Hub</span>
                    </button>
                  )}
                  <div className="px-2.5 py-1 text-[10px] text-[#737373]">
                    Session: <span className="font-mono text-[#262626]">{currentUser.uid.slice(0, 10)}...</span>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-[#DBDBDB] flex items-center justify-between px-2">
                  <button
                    onClick={() => {
                      logout();
                      setRoleDropdownOpen(false);
                    }}
                    className="text-[11px] text-[#DC2626] hover:text-red-700 font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <LogOut size={11} /> Sign Out
                  </button>
                  <button
                    onClick={() => {
                      resetData();
                      setRoleDropdownOpen(false);
                    }}
                    className="text-[11px] text-[#737373] hover:text-[#262626] flex items-center gap-1 transition cursor-pointer"
                  >
                    <RotateCcw size={11} /> Reset Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Search Drawer */}
      {searchOpen && (
        <div className="max-w-7xl mx-auto pt-2 pb-1 px-1">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-[#737373]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search community posts, members, or topics..."
              className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl pl-9 pr-8 py-2 text-xs text-[#262626] placeholder-[#737373] focus:outline-none focus:border-[#DD2A7B] focus:bg-white"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-[#737373] hover:text-[#262626]"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
