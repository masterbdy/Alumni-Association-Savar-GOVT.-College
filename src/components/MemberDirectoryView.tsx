import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, UserStatus } from '../types';
import { VerifiedBadge } from './VerifiedBadge';
import { 
  Users, 
  Search, 
  MessageSquare, 
  UserPlus, 
  CheckCircle, 
  X,
  Phone
} from 'lucide-react';

export const MemberDirectoryView: React.FC = () => {
  const { 
    currentUser, 
    users, 
    createConversation, 
    registerUser,
    setViewingMemberId 
  } = useApp();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // New user form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('+880 1711-');
  const [newBio, setNewBio] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regError, setRegError] = useState('');

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!newName.trim() || !newEmail.trim()) return;

    try {
      registerUser(newName.trim(), newEmail.trim(), newPhone.trim(), newBio.trim());
      setRegSuccess(`Registration for ${newName} submitted! Status is set to "Pending" awaiting administrator review.`);
      setNewName('');
      setNewEmail('');
      setNewBio('');
      setTimeout(() => {
        setRegSuccess('');
        setShowRegisterModal(false);
      }, 2500);
    } catch (err: any) {
      setRegError(err.message || 'Registration failed. Please review inputs.');
    }
  };

  const filtered = users.filter(u => {
    const matchesSearch = 
      u.displayName.toLowerCase().includes(search.toLowerCase()) || 
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const roleColors: Record<UserRole, string> = {
    super_admin: 'bg-purple-50 text-purple-700 border-purple-200',
    admin: 'bg-blue-50 text-blue-700 border-blue-200',
    moderator: 'bg-sky-50 text-sky-700 border-sky-200',
    member: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    restricted_member: 'bg-red-50 text-red-700 border-red-200'
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white border border-[#DBDBDB] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-[#262626] flex items-center gap-2">
            <Users size={20} className="text-[#DD2A7B]" />
            Member Directory
          </h1>
          <p className="text-xs text-[#737373] mt-1">
            Certified roster of verified fellows, council members, and pending applicants.
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="px-4 py-2 bg-[#DD2A7B] hover:bg-[#C9226C] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <UserPlus size={15} /> Apply / Register Member
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-[#DBDBDB] rounded-2xl p-4 flex flex-col sm:flex-row gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-3 text-[#737373]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email address..."
            className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl pl-9 pr-3 py-2 text-xs text-[#262626] placeholder-[#737373] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as any)}
            className="bg-[#FAFAFA] border border-[#DBDBDB] text-xs text-[#262626] rounded-xl px-3 py-2 focus:outline-none focus:border-[#DD2A7B]"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">System Controller</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
            <option value="member">Member</option>
            <option value="restricted_member">Restricted</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-[#FAFAFA] border border-[#DBDBDB] text-xs text-[#262626] rounded-xl px-3 py-2 focus:outline-none focus:border-[#DD2A7B]"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(member => {
          const isMe = member.uid === currentUser.uid;
          return (
            <div
              key={member.uid}
              className="bg-white border border-[#DBDBDB] rounded-2xl p-5 flex flex-col justify-between hover:border-[#A8A8A8] transition shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div 
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => setViewingMemberId(member.uid)}
                  >
                    <div className="p-0.5 rounded-full bg-gradient-to-tr from-[#FCAF45] via-[#DD2A7B] to-[#8134AF] shrink-0">
                      <img
                        src={member.avatarUrl}
                        alt={member.displayName}
                        className="w-12 h-12 rounded-full object-cover border border-white"
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#262626] group-hover:text-[#DD2A7B] transition flex items-center gap-1.5 flex-wrap">
                        <span>{member.displayName}</span>
                        <VerifiedBadge user={member} size="sm" />
                        {isMe && <span className="text-[10px] text-[#DD2A7B] font-semibold">(You)</span>}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-bold border ${roleColors[member.role]}`}>
                          {member.role === 'super_admin' ? 'System Controller' : member.role.replace('_', ' ')}
                        </span>
                        <span className={`text-[10px] font-semibold ${
                          member.status === 'approved' ? 'text-emerald-700' :
                          member.status === 'pending' ? 'text-amber-700' : 'text-red-700'
                        }`}>
                          • {member.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#737373] line-clamp-3 mb-4 leading-relaxed">
                  {member.bio || 'Fellow member of the private community.'}
                </p>

                {member.phone && member.showPhonePublicly && (
                  <div className="text-[11px] text-[#737373] flex items-center gap-1.5 mb-2">
                    <Phone size={12} className="text-[#737373]" />
                    <span>{member.phone}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#DBDBDB] flex items-center justify-between gap-2">
                <button
                  onClick={() => setViewingMemberId(member.uid)}
                  className="text-xs text-[#737373] hover:text-[#262626] transition font-semibold cursor-pointer"
                >
                  View Profile →
                </button>

                {!isMe && member.status === 'approved' && (
                  <button
                    onClick={() => createConversation(member.uid)}
                    className="text-xs text-[#DD2A7B] hover:text-[#C9226C] font-semibold flex items-center gap-1 bg-pink-50 hover:bg-pink-100 border border-pink-200 px-3 py-1 rounded-xl transition cursor-pointer"
                  >
                    <MessageSquare size={12} /> Message
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#DBDBDB] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#262626]">Apply for Membership</h3>
              <button 
                onClick={() => setShowRegisterModal(false)}
                className="text-[#737373] hover:text-[#262626] p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#737373] leading-relaxed">
              New accounts are registered with a <strong className="text-amber-700">Pending</strong> status. Access requires administrator approval.
            </p>

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#262626] block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Dr. Mahmudul Hasan"
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#262626] block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="e.g. mahmud@example.com"
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#262626] block mb-1">Phone</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#262626] block mb-1">Affiliation & Background</label>
                <textarea
                  rows={2}
                  value={newBio}
                  onChange={e => setNewBio(e.target.value)}
                  placeholder="Briefly state your organization or background..."
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none resize-none"
                />
              </div>

              {regSuccess && (
                <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl flex items-center gap-2">
                  <CheckCircle size={14} /> {regSuccess}
                </div>
              )}

              {regError && (
                <div className="text-xs text-rose-800 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl flex items-center gap-2">
                  <X size={14} className="text-rose-600" /> {regError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-[#DD2A7B] hover:bg-[#C9226C] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Submit Application
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
