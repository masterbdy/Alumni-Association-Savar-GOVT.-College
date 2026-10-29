import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Home, 
  Users, 
  CreditCard, 
  Plus, 
  MessageSquare, 
  User,
  LayoutDashboard
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    conversations,
    donations,
    users,
    posts,
    canManageMembers,
    canVerifyDonations
  } = useApp();

  const unreadMessages = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const pendingDonations = donations.filter(d => d.status === 'pending').length;
  const pendingMembers = users.filter(u => u.status === 'pending').length;
  const reportedPosts = posts.filter(p => p.reports && p.reports.length > 0).length;
  const totalAdminAttention = pendingMembers + pendingDonations + reportedPosts;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#DBDBDB] px-1 pt-1.5 pb-2 flex items-center justify-around shadow-lg safe-area-bottom">
      {/* 1. Home / Feed */}
      <button
        onClick={() => setActiveTab('feed')}
        className={`flex flex-col items-center justify-center flex-1 min-w-0 py-1 transition cursor-pointer ${
          activeTab === 'feed' ? 'text-[#262626]' : 'text-[#737373] hover:text-[#262626]'
        }`}
      >
        <Home size={20} strokeWidth={activeTab === 'feed' ? 2.5 : 1.8} />
        <span className={`text-[9px] mt-0.5 truncate ${activeTab === 'feed' ? 'text-[#262626] font-bold' : 'font-medium'}`}>
          Home
        </span>
      </button>

      {/* 2. Mandatory Donation Tab */}
      <button
        onClick={() => setActiveTab('donations')}
        className={`flex flex-col items-center justify-center flex-1 min-w-0 py-1 relative transition cursor-pointer ${
          activeTab === 'donations' ? 'text-[#262626]' : 'text-[#737373] hover:text-[#262626]'
        }`}
      >
        <div className="relative">
          <CreditCard size={20} strokeWidth={activeTab === 'donations' ? 2.5 : 1.8} />
          {canVerifyDonations && pendingDonations > 0 && (
            <span className="absolute -top-1 -right-2 bg-[#DD2A7B] text-white text-[9px] font-extrabold px-1 py-0.2 rounded-full min-w-3.5 text-center leading-none">
              {pendingDonations}
            </span>
          )}
        </div>
        <span className={`text-[9px] mt-0.5 truncate ${activeTab === 'donations' ? 'text-[#262626] font-bold' : 'font-medium'}`}>
          Donate
        </span>
      </button>

      {/* 3. Quick Create Post Center Button (Instagram Style) */}
      <button
        onClick={() => {
          setActiveTab('feed');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="flex flex-col items-center justify-center flex-1 min-w-0 py-0.5 cursor-pointer group"
        title="Create new post"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FCAF45] via-[#DD2A7B] to-[#8134AF] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
          <Plus size={18} strokeWidth={2.8} />
        </div>
        <span className="text-[9px] mt-0.5 font-bold text-[#DD2A7B]">
          Post
        </span>
      </button>

      {/* 4. Admin Hub for Reviewers / Members for Regular Users */}
      {canManageMembers || canVerifyDonations ? (
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex flex-col items-center justify-center flex-1 min-w-0 py-1 relative transition cursor-pointer ${
            activeTab === 'admin' ? 'text-[#262626]' : 'text-[#737373] hover:text-[#262626]'
          }`}
        >
          <div className="relative">
            <LayoutDashboard size={20} strokeWidth={activeTab === 'admin' ? 2.5 : 1.8} />
            {totalAdminAttention > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#DD2A7B] text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full min-w-3.5 text-center leading-none">
                {totalAdminAttention}
              </span>
            )}
          </div>
          <span className={`text-[9px] mt-0.5 truncate ${activeTab === 'admin' ? 'text-[#262626] font-bold' : 'font-medium'}`}>
            Admin
          </span>
        </button>
      ) : (
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex flex-col items-center justify-center flex-1 min-w-0 py-1 transition cursor-pointer ${
            activeTab === 'directory' ? 'text-[#262626]' : 'text-[#737373] hover:text-[#262626]'
          }`}
        >
          <Users size={20} strokeWidth={activeTab === 'directory' ? 2.5 : 1.8} />
          <span className={`text-[9px] mt-0.5 truncate ${activeTab === 'directory' ? 'text-[#262626] font-bold' : 'font-medium'}`}>
            Explore
          </span>
        </button>
      )}

      {/* 5. Messages */}
      <button
        onClick={() => setActiveTab('messages')}
        className={`flex flex-col items-center justify-center flex-1 min-w-0 py-1 relative transition cursor-pointer ${
          activeTab === 'messages' ? 'text-[#262626]' : 'text-[#737373] hover:text-[#262626]'
        }`}
      >
        <div className="relative">
          <MessageSquare size={20} strokeWidth={activeTab === 'messages' ? 2.5 : 1.8} />
          {unreadMessages > 0 && (
            <span className="absolute -top-1 -right-2 bg-[#DD2A7B] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
              {unreadMessages}
            </span>
          )}
        </div>
        <span className={`text-[9px] mt-0.5 truncate ${activeTab === 'messages' ? 'text-[#262626] font-bold' : 'font-medium'}`}>
          Direct
        </span>
      </button>

      {/* 6. Profile */}
      <button
        onClick={() => setActiveTab('profile')}
        className={`flex flex-col items-center justify-center flex-1 min-w-0 py-1 transition cursor-pointer ${
          activeTab === 'profile' ? 'text-[#262626]' : 'text-[#737373] hover:text-[#262626]'
        }`}
      >
        <User size={20} strokeWidth={activeTab === 'profile' ? 2.5 : 1.8} />
        <span className={`text-[9px] mt-0.5 truncate ${activeTab === 'profile' ? 'text-[#262626] font-bold' : 'font-medium'}`}>
          Profile
        </span>
      </button>
    </nav>
  );
};
