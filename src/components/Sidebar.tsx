import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AdminSectionTab, AppTab } from '../types';
import { 
  LayoutDashboard, 
  ShieldCheck, 
  Users, 
  Sliders, 
  ShieldAlert, 
  CreditCard, 
  MessageSquare, 
  Bell, 
  FileCheck, 
  History, 
  Settings, 
  User, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Sparkles,
  Lock,
  Layers,
  Power,
  Database
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    adminActiveSection,
    navigateToAdminSection,
    isSidebarOpen,
    setIsSidebarOpen,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    appLogo,
    logout,
    donations,
    users,
    posts,
    conversations,
    communityReports,
    isSystemController,
    canManageMembers,
    canVerifyDonations
  } = useApp();

  const isSuperAdmin = currentUser.role === 'super_admin' && isSystemController;
  const isAdmin = currentUser.role === 'admin';
  const isModerator = currentUser.role === 'moderator';

  // Badges calculation from real data
  const pendingMembersCount = users.filter(u => u.status === 'pending').length;
  const pendingDonationsCount = donations.filter(d => d.status === 'pending').length;
  const pendingReportsCount = communityReports.filter(r => r.status === 'pending').length;
  const reportedPostsCount = posts.filter(p => p.reports && p.reports.length > 0).length || pendingReportsCount;
  const totalUnreadMessages = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen, setIsSidebarOpen]);

  interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
    onClick: () => void;
    isActive: boolean;
    group?: 'core' | 'admin' | 'settings';
  }

  // Construct role-specific navigation list
  const navItems: NavItem[] = [];

  if (isSuperAdmin) {
    // 1. SYSTEM CONTROLLER NAVIGATION (Items 1 through 13)
    navItems.push(
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard size={18} />,
        isActive: activeTab === 'feed',
        onClick: () => {
          setActiveTab('feed');
          setIsSidebarOpen(false);
        },
        group: 'core'
      },
      {
        id: 'system_control',
        label: 'System Control',
        icon: <ShieldCheck size={18} />,
        badge: (pendingMembersCount + pendingDonationsCount + reportedPostsCount) || undefined,
        badgeColor: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
        isActive: activeTab === 'admin' && adminActiveSection === 'overview',
        onClick: () => navigateToAdminSection('overview'),
        group: 'admin'
      },
      {
        id: 'members_roles',
        label: 'Members & Roles',
        icon: <Users size={18} />,
        badge: pendingMembersCount > 0 ? pendingMembersCount : undefined,
        badgeColor: 'bg-amber-400 text-slate-900',
        isActive: activeTab === 'admin' && adminActiveSection === 'roles',
        onClick: () => navigateToAdminSection('roles'),
        group: 'admin'
      },
      {
        id: 'permission_settings',
        label: 'Permission Settings',
        icon: <Sliders size={18} />,
        isActive: activeTab === 'admin' && (adminActiveSection === 'matrix' || adminActiveSection === 'limits'),
        onClick: () => navigateToAdminSection('matrix'),
        group: 'admin'
      },
      {
        id: 'posts_moderation',
        label: 'Community Moderation',
        icon: <ShieldAlert size={18} />,
        badge: pendingReportsCount > 0 ? pendingReportsCount : (reportedPostsCount > 0 ? reportedPostsCount : undefined),
        badgeColor: 'bg-rose-500 text-white',
        isActive: activeTab === 'admin' && (adminActiveSection === 'moderation' || adminActiveSection === 'reports'),
        onClick: () => navigateToAdminSection('moderation'),
        group: 'admin'
      },
      {
        id: 'donations_payments',
        label: 'Donations & Payments',
        icon: <CreditCard size={18} />,
        badge: pendingDonationsCount > 0 ? pendingDonationsCount : undefined,
        badgeColor: 'bg-emerald-500 text-white',
        isActive: activeTab === 'donations' || (activeTab === 'admin' && adminActiveSection === 'donations'),
        onClick: () => {
          setActiveTab('donations');
          setIsSidebarOpen(false);
        },
        group: 'core'
      },
      {
        id: 'messages',
        label: 'Messages',
        icon: <MessageSquare size={18} />,
        badge: totalUnreadMessages > 0 ? totalUnreadMessages : undefined,
        badgeColor: 'bg-cyan-500 text-white',
        isActive: activeTab === 'messages',
        onClick: () => {
          setActiveTab('messages');
          setIsSidebarOpen(false);
        },
        group: 'core'
      },
      {
        id: 'announcements_events',
        label: 'Announcements & Events',
        icon: <Bell size={18} />,
        isActive: activeTab === 'feed',
        onClick: () => {
          setActiveTab('feed');
          setIsSidebarOpen(false);
        },
        group: 'core'
      },
      {
        id: 'reports',
        label: 'Reports',
        icon: <FileCheck size={18} />,
        badge: reportedPostsCount > 0 ? reportedPostsCount : undefined,
        badgeColor: 'bg-rose-500 text-white',
        isActive: activeTab === 'admin' && adminActiveSection === 'reports',
        onClick: () => navigateToAdminSection('reports'),
        group: 'admin'
      },
      {
        id: 'activity_security',
        label: 'Activity Log & Security',
        icon: <History size={18} />,
        isActive: activeTab === 'admin' && (adminActiveSection === 'audit' || adminActiveSection === 'emergency'),
        onClick: () => navigateToAdminSection('audit'),
        group: 'admin'
      },
      {
        id: 'app_settings',
        label: 'System Settings',
        icon: <Settings size={18} />,
        isActive: activeTab === 'admin' && (adminActiveSection === 'settings' || adminActiveSection === 'logo'),
        onClick: () => navigateToAdminSection('settings'),
        group: 'settings'
      },
      {
        id: 'data_backup',
        label: 'Backup & Recovery',
        icon: <Database size={18} />,
        isActive: activeTab === 'admin' && adminActiveSection === 'backup',
        onClick: () => navigateToAdminSection('backup'),
        group: 'settings'
      },

      {
        id: 'profile',
        label: 'My Profile',
        icon: <User size={18} />,
        isActive: activeTab === 'profile',
        onClick: () => {
          setActiveTab('profile');
          setIsSidebarOpen(false);
        },
        group: 'settings'
      }
    );
  } else if (isAdmin) {
    // 2. ADMIN NAVIGATION (Elected President / Assigned Admins)
    navItems.push(
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard size={18} />,
        isActive: activeTab === 'feed',
        onClick: () => {
          setActiveTab('feed');
          setIsSidebarOpen(false);
        },
        group: 'core'
      },
      {
        id: 'admin_panel',
        label: 'Admin Control Panel',
        icon: <ShieldCheck size={18} />,
        badge: (pendingMembersCount + pendingDonationsCount) || undefined,
        badgeColor: 'bg-purple-500 text-white',
        isActive: activeTab === 'admin',
        onClick: () => navigateToAdminSection('overview'),
        group: 'admin'
      },
      {
        id: 'members',
        label: 'Members Directory',
        icon: <Users size={18} />,
        isActive: activeTab === 'directory',
        onClick: () => {
          setActiveTab('directory');
          setIsSidebarOpen(false);
        },
        group: 'core'
      },
      {
        id: 'donations',
        label: 'Donations & Endowments',
        icon: <CreditCard size={18} />,
        badge: pendingDonationsCount > 0 ? pendingDonationsCount : undefined,
        badgeColor: 'bg-emerald-500 text-white',
        isActive: activeTab === 'donations',
        onClick: () => {
          setActiveTab('donations');
          setIsSidebarOpen(false);
        },
        group: 'core'
      },
      {
        id: 'messages',
        label: 'Messages',
        icon: <MessageSquare size={18} />,
        badge: totalUnreadMessages > 0 ? totalUnreadMessages : undefined,
        badgeColor: 'bg-cyan-500 text-white',
        isActive: activeTab === 'messages',
        onClick: () => {
          setActiveTab('messages');
          setIsSidebarOpen(false);
        },
        group: 'core'
      },
      {
        id: 'profile',
        label: 'My Profile',
        icon: <User size={18} />,
        isActive: activeTab === 'profile',
        onClick: () => {
          setActiveTab('profile');
          setIsSidebarOpen(false);
        },
        group: 'settings'
      }
    );
  } else if (isModerator) {
    // 3. MODERATOR NAVIGATION
    navItems.push(
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard size={18} />,
        isActive: activeTab === 'feed',
        onClick: () => {
          setActiveTab('feed');
          setIsSidebarOpen(false);
        },
        group: 'core'
      },
      {
        id: 'moderator_panel',
        label: 'Moderator Desk',
        icon: <ShieldAlert size={18} />,
        badge: pendingReportsCount > 0 ? pendingReportsCount : (reportedPostsCount > 0 ? reportedPostsCount : undefined),
        badgeColor: 'bg-rose-500 text-white',
        isActive: activeTab === 'admin',
        onClick: () => navigateToAdminSection('moderation'),
        group: 'admin'
      },
      {
        id: 'members',
        label: 'Members Directory',
        icon: <Users size={18} />,
        isActive: activeTab === 'directory',
        onClick: () => {
          setActiveTab('directory');
          setIsSidebarOpen(false);
        },
        group: 'core'
      },
      {
        id: 'messages',
        label: 'Messages',
        icon: <MessageSquare size={18} />,
        badge: totalUnreadMessages > 0 ? totalUnreadMessages : undefined,
        badgeColor: 'bg-cyan-500 text-white',
        isActive: activeTab === 'messages',
        onClick: () => {
          setActiveTab('messages');
          setIsSidebarOpen(false);
        },
        group: 'core'
      },
      {
        id: 'profile',
        label: 'My Profile',
        icon: <User size={18} />,
        isActive: activeTab === 'profile',
        onClick: () => {
          setActiveTab('profile');
          setIsSidebarOpen(false);
        },
        group: 'settings'
      }
    );
  } else {
    // 4. REGULAR MEMBER NAVIGATION
    navItems.push(
      {
        id: 'dashboard',
        label: 'Community Feed',
        icon: <Sparkles size={18} />,
        isActive: activeTab === 'feed',
        onClick: () => {
          setActiveTab('feed');
          setIsSidebarOpen(false);
        },
        group: 'core'
      },
      {
        id: 'directory',
        label: 'Alumni Directory',
        icon: <Users size={18} />,
        isActive: activeTab === 'directory',
        onClick: () => {
          setActiveTab('directory');
          setIsSidebarOpen(false);
        },
        group: 'core'
      },
      {
        id: 'donations',
        label: 'Donations & Pledges',
        icon: <CreditCard size={18} />,
        isActive: activeTab === 'donations',
        onClick: () => {
          setActiveTab('donations');
          setIsSidebarOpen(false);
        },
        group: 'core'
      },
      {
        id: 'messages',
        label: 'Messages',
        icon: <MessageSquare size={18} />,
        badge: totalUnreadMessages > 0 ? totalUnreadMessages : undefined,
        badgeColor: 'bg-cyan-500 text-white',
        isActive: activeTab === 'messages',
        onClick: () => {
          setActiveTab('messages');
          setIsSidebarOpen(false);
        },
        group: 'core'
      },
      {
        id: 'profile',
        label: 'My Profile',
        icon: <User size={18} />,
        isActive: activeTab === 'profile',
        onClick: () => {
          setActiveTab('profile');
          setIsSidebarOpen(false);
        },
        group: 'settings'
      }
    );
  }

  const renderSidebarContent = (isMobile: boolean = false) => {
    const collapsed = !isMobile && isSidebarCollapsed;

    return (
      <div className="flex flex-col h-full bg-[#0B0F19] text-slate-200 select-none border-r border-[#1E293B]">
        {/* Brand Header */}
        <div className={`p-4 border-b border-white/10 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <div 
            className="flex items-center gap-3 cursor-pointer overflow-hidden"
            onClick={() => {
              setActiveTab('feed');
              if (isMobile) setIsSidebarOpen(false);
            }}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-purple-600 p-0.5 shadow-md shadow-purple-900/30 shrink-0 overflow-hidden flex items-center justify-center">
              <img 
                src={appLogo.url} 
                alt="Alumni Association Emblem" 
                className="w-full h-full object-cover rounded-[14px]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&auto=format&fit=crop&q=80';
                }}
              />
            </div>

            {!collapsed && (
              <div className="overflow-hidden">
                <div className="text-sm font-black text-white tracking-tight flex items-center gap-1.5 leading-tight truncate">
                  Alumni Association
                </div>
                <div className="text-[10px] font-medium text-purple-300/80 truncate">
                  Dept. of Management, SGC
                </div>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          {isMobile && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition"
              aria-label="Close navigation drawer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* User Identity Pill / Role Badge */}
        {!collapsed ? (
          <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <img 
                src={currentUser.avatarUrl} 
                alt={currentUser.displayName} 
                className="w-8 h-8 rounded-xl object-cover border border-white/10 shrink-0" 
              />
              <div className="overflow-hidden flex-1">
                <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                  {currentUser.displayName}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full ${
                    isSuperAdmin
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : isAdmin
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : isModerator
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-700/50 text-slate-300'
                  }`}>
                    {isSuperAdmin ? 'System Controller' : currentUser.role.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-2.5 flex justify-center border-b border-white/5">
            <img 
              src={currentUser.avatarUrl} 
              alt={currentUser.displayName} 
              className="w-7 h-7 rounded-lg object-cover border border-white/10" 
              title={`${currentUser.displayName} (${currentUser.role})`}
            />
          </div>
        )}

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          {navItems.map((item) => {
            const active = item.isActive;

            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative cursor-pointer ${
                  active 
                    ? 'bg-gradient-to-r from-purple-900/60 to-purple-800/40 text-white shadow-sm border border-purple-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                } ${collapsed ? 'justify-center px-2' : ''}`}
                title={collapsed ? item.label : undefined}
                aria-current={active ? 'page' : undefined}
              >
                {/* Active Indicator Bar */}
                {active && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-gradient-to-b from-purple-400 to-pink-500 rounded-r-md" />
                )}

                <span className={`shrink-0 transition-transform ${active ? 'text-purple-300 scale-105' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {item.icon}
                </span>

                {!collapsed && (
                  <span className="truncate flex-1 text-left">
                    {item.label}
                  </span>
                )}

                {/* Counter / Badge */}
                {item.badge !== undefined && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${item.badgeColor || 'bg-purple-600 text-white'} ${collapsed ? 'absolute top-1 right-1 px-1 text-[8px]' : ''}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Actions & Collapse Toggle */}
        <div className="p-3 border-t border-white/10 space-y-2">
          {/* Logout Action (Item 13 for System Controller / General) */}
          <button
            onClick={() => {
              logout();
              if (isMobile) setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400/90 hover:text-rose-300 hover:bg-rose-500/10 transition cursor-pointer ${
              collapsed ? 'justify-center px-2' : ''
            }`}
            title="Log Out"
          >
            <LogOut size={17} className="shrink-0" />
            {!collapsed && <span className="truncate">Log Out</span>}
          </button>

          {/* Desktop Collapse Toggle */}
          {!isMobile && (
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition border border-white/5 cursor-pointer"
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? (
                <ChevronRight size={15} />
              ) : (
                <>
                  <ChevronLeft size={15} />
                  <span>Collapse Menu</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ========================================================= */}
      {/* DESKTOP PERSISTENT SIDEBAR                                */}
      {/* ========================================================= */}
      <aside 
        className={`hidden md:block shrink-0 sticky top-0 h-screen transition-all duration-300 z-30 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* ========================================================= */}
      {/* MOBILE SLIDE-OVER DRAWER                                  */}
      {/* ========================================================= */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-fadeIn">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer container */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-slideRight">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
