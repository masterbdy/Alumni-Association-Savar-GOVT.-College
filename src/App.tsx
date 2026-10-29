import React, { Component, ReactNode } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { FeedView } from './components/FeedView';
import { MemberDirectoryView } from './components/MemberDirectoryView';
import { MessagesView } from './components/MessagesView';
import { DonationsView } from './components/DonationsView';
import { AdminHubView } from './components/AdminHubView';
import { ProfileView } from './components/ProfileView';
import { PublicProfileModal } from './components/PublicProfileModal';
import { AuthModal } from './components/AuthModal';
import { PendingApprovalView } from './components/PendingApprovalView';
import { AdminAccessBanner } from './components/AdminAccessBanner';
import { DisciplinaryBanner } from './components/moderation/DisciplinaryBanner';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Captured by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAFAFA] text-[#262626] flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white border border-[#DBDBDB] rounded-2xl p-8 max-w-lg shadow-xl">
            <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-4 text-[#ED4956]">
              <AlertCircle size={28} />
            </div>
            <h1 className="text-xl font-bold mb-2 text-[#262626]">Application Notice</h1>
            <p className="text-[#737373] text-sm mb-4">
              An unexpected error occurred in the component hierarchy.
            </p>
            <div className="bg-[#FAFAFA] p-3 rounded-lg text-xs font-mono text-red-600 text-left mb-6 overflow-auto max-h-40 border border-[#DBDBDB]">
              {this.state.error?.message || 'Unknown runtime error'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-[#DD2A7B] hover:bg-[#C9226C] text-white rounded-xl text-sm font-semibold transition inline-flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <RefreshCw size={16} /> Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const { activeTab, isAuthenticated, currentUser, showAuthModal } = useApp();

  // 1. Unauthenticated Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#EEF2F6] text-[#262626] flex items-center justify-center p-3 sm:p-4 selection:bg-cyan-500/20">
        <AuthModal />
      </div>
    );
  }

  // 2. Pending, Rejected, or Suspended Approval Gate
  if (!currentUser || currentUser.status !== 'approved') {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-[#262626] flex flex-col">
        <AdminAccessBanner />
        <Navbar />
        <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex items-center justify-center">
          <PendingApprovalView />
        </main>
        {showAuthModal && <AuthModal />}
      </div>
    );
  }

  // 3. Approved Member App Experience
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] flex selection:bg-purple-500/20 selection:text-[#0F172A]">
      {/* Premium Sidebar Component (Persistent Desktop, Slide Drawer Mobile) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Banner & Header */}
        <AdminAccessBanner />
        <DisciplinaryBanner />
        <Navbar />

        {/* View Content with safe area for mobile bottom nav */}
        <main className={`flex-1 w-full mx-auto pb-20 md:pb-8 ${
          activeTab === 'feed' 
            ? 'max-w-6xl px-2 sm:px-4 py-2 sm:py-6' 
            : 'max-w-5xl px-3 sm:px-6 py-4 sm:py-6'
        }`}>
          {activeTab === 'feed' && <FeedView />}
          {activeTab === 'directory' && <MemberDirectoryView />}
          {activeTab === 'messages' && <MessagesView />}
          {activeTab === 'donations' && <DonationsView />}
          {activeTab === 'profile' && <ProfileView />}
          {activeTab === 'admin' && <AdminHubView />}
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </div>

      {/* Global Modals for Profile Inspection and Account Security */}
      <PublicProfileModal />
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
