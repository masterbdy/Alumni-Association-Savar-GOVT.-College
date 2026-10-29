import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ImageLightbox } from './ImageLightbox';
import { VerifiedBadge } from './VerifiedBadge';
import { 
  MessageSquare, 
  Send, 
  Users, 
  Plus, 
  Search, 
  AlertCircle, 
  X, 
  Paperclip,
  ArrowLeft,
  Check,
  CheckCheck,
  Loader2,
  Edit3,
  RefreshCw,
  Sparkles,
  Flag
} from 'lucide-react';
import { ReportModal } from './moderation/ReportModal';

export const MessagesView: React.FC = () => {
  const { 
    currentUser, 
    users, 
    conversations, 
    activeConversationId, 
    setActiveConversationId, 
    messages, 
    sendMessage, 
    createConversation,
    markConversationAsRead,
    canMessage,
    setViewingMemberId 
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [convSearch, setConvSearch] = useState('');
  const [attachmentImage, setAttachmentImage] = useState<string | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<{
    targetType: 'post' | 'comment' | 'message';
    targetId: string;
    targetAuthorId: string;
    targetAuthorName: string;
    targetContentSnippet: string;
    evidenceContext?: string;
  } | null>(null);

  // Mobile navigation state: false = Inbox list, true = Active chat view
  const [mobileChatView, setMobileChatView] = useState<boolean>(false);
  const prevActiveConvId = useRef<string | null>(null);

  useEffect(() => {
    // If active conversation changes dynamically (e.g. from Member Directory or Profile), show chat view on mobile
    if (prevActiveConvId.current !== null && activeConversationId && prevActiveConvId.current !== activeConversationId) {
      setMobileChatView(true);
    }
    prevActiveConvId.current = activeConversationId;
  }, [activeConversationId]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter conversations for the current user (Private & Isolated)
  const userConversations = conversations
    .filter(c => c.participants && currentUser?.uid && c.participants.includes(currentUser.uid))
    .sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());

  // Active conversation resolution
  const activeConv = userConversations.find(c => c.id === activeConversationId) || userConversations[0] || null;

  // Messages strictly belonging to active conversation
  const convMessages = activeConv
    ? messages.filter(m => m.conversationId === activeConv.id)
    : [];

  // Auto-scroll messages to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [activeConv?.id]);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [convMessages.length]);

  // Mark conversation as read when active
  useEffect(() => {
    if (activeConv && activeConv.unreadCount > 0) {
      markConversationAsRead(activeConv.id);
    }
  }, [activeConv?.id, activeConv?.unreadCount]);

  // Formatted timestamp helper
  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WEBP, GIF).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size cannot exceed 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      setAttachmentImage(ev.target?.result as string);
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!canMessage) {
      setErrorMsg('Approved membership is required to send messages.');
      return;
    }

    const textToSend = inputText.trim();
    if (!textToSend && !attachmentImage) return;

    if (!activeConv) {
      setErrorMsg('No conversation selected.');
      return;
    }

    setIsSending(true);
    const res = sendMessage(activeConv.id, textToSend, attachmentImage || undefined);
    setIsSending(false);

    if (res.success) {
      setInputText('');
      setAttachmentImage(null);
      // Auto-focus back on textarea
      setTimeout(() => textareaRef.current?.focus(), 50);
    } else {
      setErrorMsg(res.error || 'Failed to send message.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Desktop: Enter sends message, Shift+Enter inserts newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStartChatWith = (uid: string) => {
    setErrorMsg('');
    const convId = createConversation(uid);
    setShowNewChatModal(false);
    if (convId) {
      setActiveConversationId(convId);
      setMobileChatView(true);
    }
  };

  // Filter conversations in inbox search
  const filteredConversations = userConversations.filter(c => {
    const query = convSearch.toLowerCase().trim();
    if (!query) return true;
    if (c.name.toLowerCase().includes(query)) return true;
    if (c.lastMessage.toLowerCase().includes(query)) return true;
    // Check other participant display name
    const otherId = c.participants.find(p => p !== currentUser.uid);
    const other = otherId ? users.find(u => u.uid === otherId) : null;
    return other?.displayName.toLowerCase().includes(query);
  });

  // Eligible members for new message composer
  const eligibleUsers = users.filter(
    u => u.uid !== currentUser.uid && u.status === 'approved' && (
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.occupation && u.occupation.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.chapter && u.chapter.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  return (
    <div className="bg-white border border-[#DBDBDB] sm:rounded-2xl shadow-xs overflow-hidden flex flex-col md:grid md:grid-cols-12 min-h-[580px] h-[calc(100vh-190px)] max-h-[760px] relative">
      {/* 1. Left Column: Conversations Inbox (Instagram Direct Style) */}
      <div 
        className={`md:col-span-4 border-r border-[#DBDBDB] flex-col bg-white h-full ${
          mobileChatView ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Inbox Top Bar */}
        <div className="p-3.5 border-b border-[#DBDBDB] space-y-2.5 shrink-0 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={19} className="text-[#DD2A7B]" />
              <h1 className="text-base font-bold text-[#262626]">Messages</h1>
              {userConversations.some(c => c.unreadCount > 0) && (
                <span className="w-2 h-2 rounded-full bg-[#DD2A7B]" />
              )}
            </div>

            {canMessage && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowNewChatModal(true);
                }}
                className="p-1.5 rounded-xl bg-pink-50 text-[#DD2A7B] hover:bg-pink-100 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title="Compose New Message"
              >
                <Edit3 size={15} />
                <span className="hidden sm:inline">New Message</span>
              </button>
            )}
          </div>

          {/* Inbox Search Field */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-[#737373]" />
            <input
              type="text"
              value={convSearch}
              onChange={e => setConvSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl pl-8.5 pr-8 py-1.5 text-xs text-[#262626] placeholder-[#737373] focus:outline-none focus:border-[#DD2A7B] focus:bg-white transition"
            />
            {convSearch && (
              <button
                onClick={() => setConvSearch('')}
                className="absolute right-2.5 top-2.5 text-[#737373] hover:text-[#262626]"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Conversations List */}
        <div className="overflow-y-auto flex-1 divide-y divide-[#DBDBDB]/50">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#737373] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-50 text-[#DD2A7B] flex items-center justify-center mx-auto">
                <MessageSquare size={22} />
              </div>
              <div className="font-bold text-[#262626] text-sm">
                {convSearch ? 'No chats found' : 'Your Messages'}
              </div>
              <p className="max-w-xs mx-auto leading-relaxed">
                {convSearch 
                  ? `No conversations match "${convSearch}".` 
                  : 'Send private messages and connect with other approved executive members.'}
              </p>
              {canMessage && (
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#DD2A7B] to-[#8134AF] text-white text-xs font-bold shadow-xs hover:opacity-95 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus size={14} /> Start a Conversation
                </button>
              )}
            </div>
          ) : (
            filteredConversations.map(conv => {
              const isSelected = conv.id === activeConv?.id;
              const otherUserId = conv.type === 'direct' 
                ? conv.participants.find(p => p !== currentUser.uid) 
                : null;
              const otherUser = otherUserId ? users.find(u => u.uid === otherUserId) : null;
              const isUnread = conv.unreadCount > 0;
              const isSentByMe = conv.lastMessageSenderId === currentUser.uid;

              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    setActiveConversationId(conv.id);
                    markConversationAsRead(conv.id);
                    setMobileChatView(true);
                  }}
                  className={`w-full text-left p-3.5 flex items-start gap-3 transition cursor-pointer relative ${
                    isSelected 
                      ? 'bg-[#FAFAFA] border-l-4 border-[#DD2A7B]' 
                      : 'hover:bg-[#FAFAFA] border-l-4 border-transparent'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-[#FCAF45] via-[#DD2A7B] to-[#8134AF] flex items-center justify-center">
                      {otherUser?.avatarUrl ? (
                        <img 
                          src={otherUser.avatarUrl} 
                          alt={conv.name} 
                          className="w-full h-full rounded-full object-cover border border-white" 
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-white text-[#262626] flex items-center justify-center font-bold text-xs">
                          {conv.type === 'group' ? <Users size={16} className="text-[#DD2A7B]" /> : conv.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    {isUnread && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#DD2A7B] border-2 border-white" />
                    )}
                  </div>

                  {/* Text Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`text-xs truncate ${isUnread ? 'font-black text-[#262626]' : 'font-bold text-[#262626]'}`}>
                          {otherUser?.displayName || conv.name}
                        </span>
                        {otherUser && <VerifiedBadge userId={otherUser.uid} role={otherUser.role} size="xs" />}
                      </div>
                      <span className={`text-[10px] whitespace-nowrap shrink-0 ${isUnread ? 'text-[#DD2A7B] font-bold' : 'text-[#737373]'}`}>
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-[11px] truncate leading-tight ${isUnread ? 'text-[#262626] font-semibold' : 'text-[#737373]'}`}>
                        {isSentByMe && <span className="text-[#737373] font-normal">You: </span>}
                        {conv.lastMessage}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="bg-[#DD2A7B] text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Right Column: Active Chat Area */}
      <div 
        className={`md:col-span-8 flex-col bg-white h-full relative ${
          !mobileChatView ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeConv ? (
          <>
            {/* Chat Top Header */}
            {(() => {
              const otherUserId = activeConv.type === 'direct' 
                ? activeConv.participants.find(p => p !== currentUser.uid) 
                : null;
              const otherUser = otherUserId ? users.find(u => u.uid === otherUserId) : null;

              return (
                <div className="px-3 py-2.5 sm:px-4 sm:py-3 border-b border-[#DBDBDB] bg-white flex items-center justify-between shrink-0 shadow-xs z-10">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Back Button (Mobile Only) */}
                    <button
                      type="button"
                      onClick={() => setMobileChatView(false)}
                      className="md:hidden p-1.5 text-[#262626] hover:bg-[#FAFAFA] rounded-full transition cursor-pointer shrink-0"
                      title="Back to Messages"
                    >
                      <ArrowLeft size={18} />
                    </button>

                    {/* Participant Avatar */}
                    <div 
                      className={`flex items-center gap-2.5 min-w-0 ${otherUser ? 'cursor-pointer group' : ''}`}
                      onClick={() => otherUserId && setViewingMemberId(otherUserId)}
                    >
                      <div className="relative shrink-0">
                        {otherUser ? (
                          <div className="p-0.5 rounded-full bg-gradient-to-tr from-[#FCAF45] via-[#DD2A7B] to-[#8134AF]">
                            <img 
                              src={otherUser.avatarUrl} 
                              alt={otherUser.displayName} 
                              className="w-9 h-9 rounded-full object-cover border border-white" 
                            />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-pink-50 text-[#DD2A7B] flex items-center justify-center font-bold text-xs border border-pink-200">
                            {activeConv.type === 'group' ? <Users size={17} /> : activeConv.name.charAt(0)}
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h2 className="text-xs sm:text-sm font-bold text-[#262626] group-hover:text-[#DD2A7B] transition truncate">
                            {otherUser?.displayName || activeConv.name}
                          </h2>
                          {otherUser && <VerifiedBadge userId={otherUser.uid} role={otherUser.role} size="xs" />}
                        </div>
                        <div className="text-[10px] text-[#737373] flex items-center gap-1.5 truncate">
                          <span>{activeConv.type === 'group' ? `${activeConv.participants.length} Members` : (otherUser?.occupation || 'Approved Executive Member')}</span>
                          {otherUser?.chapter && <span>• {otherUser.chapter}</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {otherUserId && (
                      <button
                        onClick={() => setViewingMemberId(otherUserId)}
                        className="text-[11px] font-semibold text-[#DD2A7B] hover:bg-pink-50 px-2.5 py-1 rounded-lg transition cursor-pointer"
                      >
                        Profile
                      </button>
                    )}
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FAFAFA] text-[#737373] border border-[#DBDBDB]">
                      {activeConv.type}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Scrollable Messages Stream */}
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 bg-[#FAFAFA]">
              {convMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-xs text-[#737373] space-y-2">
                  <div className="w-12 h-12 rounded-full bg-pink-50 text-[#DD2A7B] flex items-center justify-center">
                    <Sparkles size={22} />
                  </div>
                  <div className="font-bold text-[#262626] text-sm">No messages yet</div>
                  <p className="max-w-xs leading-relaxed">
                    Start a friendly conversation with {activeConv.name}. Supports multiline text, English, Bangla, emojis, and photos.
                  </p>
                </div>
              ) : (
                convMessages.map((msg, index) => {
                  const isMe = msg.senderId === currentUser.uid;
                  const prevMsg = convMessages[index - 1];
                  const showSenderHeader = !prevMsg || prevMsg.senderId !== msg.senderId;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      {/* Sender Name if changed */}
                      {showSenderHeader && !isMe && (
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-[10px] font-bold text-[#737373] flex items-center gap-1">
                            <span>{msg.senderName}</span>
                            <VerifiedBadge userId={msg.senderId} role={msg.senderRole} size="xs" />
                          </span>
                        </div>
                      )}

                      {/* Bubble */}
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 text-xs leading-relaxed space-y-2 shadow-xs break-words whitespace-pre-wrap ${
                          isMe
                            ? 'bg-gradient-to-tr from-[#FCAF45] via-[#DD2A7B] to-[#8134AF] text-white rounded-br-xs'
                            : 'bg-white text-[#262626] border border-[#DBDBDB] rounded-bl-xs'
                        }`}
                      >
                        {msg.imageUrl && (
                          <div 
                            className="rounded-xl overflow-hidden cursor-pointer max-h-56 border border-white/20 bg-black/5"
                            onClick={() => setLightboxImg(msg.imageUrl!)}
                          >
                            <img 
                              src={msg.imageUrl} 
                              alt="Attachment" 
                              className="w-full h-auto object-cover hover:scale-102 transition" 
                            />
                          </div>
                        )}
                        {msg.text && <div>{msg.text}</div>}
                      </div>

                      {/* Timestamp & Sent Status / Report Trigger */}
                      <div className="flex items-center gap-2 mt-0.5 px-1 text-[9px] text-[#737373]">
                        <span>{formatTime(msg.createdAt)}</span>
                        {isMe ? (
                          <CheckCheck size={11} className="text-emerald-600" />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setReportTarget({
                              targetType: 'message',
                              targetId: msg.id,
                              targetAuthorId: msg.senderId,
                              targetAuthorName: msg.senderName,
                              targetContentSnippet: msg.text || (msg.imageUrl ? '[Attached Image File]' : 'Direct message'),
                              evidenceContext: `Private message flagged from conversation "${activeConv.name}"`
                            })}
                            className="text-slate-400 hover:text-amber-600 transition flex items-center gap-0.5 cursor-pointer"
                            title="Report this message to Community Moderation"
                          >
                            <Flag size={9} />
                            <span>Report</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="px-4 py-2 bg-red-50 text-red-700 text-xs flex items-center justify-between border-t border-red-200 shrink-0">
                <div className="flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSend()}
                  className="font-bold underline text-xs ml-2 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Attachment Preview Drawer */}
            {attachmentImage && (
              <div className="p-2.5 bg-[#FAFAFA] border-t border-[#DBDBDB] flex items-center gap-3 shrink-0">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-[#DBDBDB] bg-white">
                  <img src={attachmentImage} alt="Attachment preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setAttachmentImage(null)}
                    className="absolute top-1 right-1 bg-black/75 rounded-full p-0.5 text-white hover:bg-black transition cursor-pointer"
                  >
                    <X size={11} />
                  </button>
                </div>
                <div className="text-xs text-[#262626]">
                  <span className="font-semibold block">Photo attached</span>
                  <span className="text-[10px] text-[#737373]">Will send alongside message</span>
                </div>
              </div>
            )}

            {/* 3. Bottom Message Composer — Always Accessible & Responsive */}
            <div className="p-2.5 sm:p-3 bg-white border-t border-[#DBDBDB] shrink-0 sticky bottom-0 z-20">
              {canMessage ? (
                <form onSubmit={handleSend} className="flex items-end gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {/* Attachment Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach Photo"
                    className="p-2.5 text-[#737373] hover:text-[#262626] bg-[#FAFAFA] hover:bg-[#F2F2F2] border border-[#DBDBDB] rounded-xl transition cursor-pointer shrink-0"
                  >
                    <Paperclip size={16} />
                  </button>

                  {/* Multiline Message Textarea */}
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Write a message..."
                    className="flex-1 bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#262626] placeholder-[#737373] focus:outline-none resize-none min-h-[38px] max-h-[110px] leading-relaxed transition"
                  />

                  {/* Send Action Button */}
                  <button
                    type="submit"
                    disabled={(!inputText.trim() && !attachmentImage) || isSending}
                    className="p-2.5 bg-gradient-to-r from-[#DD2A7B] to-[#8134AF] hover:opacity-95 disabled:opacity-35 text-white rounded-xl transition cursor-pointer shadow-xs shrink-0 flex items-center justify-center min-w-[38px]"
                    title="Send Message"
                  >
                    {isSending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-xs text-[#737373] text-center py-2 bg-[#FAFAFA] rounded-xl border border-[#DBDBDB]">
                  Messaging is reserved for approved community members.
                </div>
              )}
            </div>
          </>
        ) : (
          /* Empty Active State (Desktop) */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-[#737373] space-y-3">
            <div className="w-16 h-16 rounded-full bg-pink-50 text-[#DD2A7B] flex items-center justify-center mx-auto">
              <MessageSquare size={32} />
            </div>
            <div className="font-bold text-[#262626] text-base">Select a Conversation</div>
            <p className="max-w-xs mx-auto leading-relaxed">
              Choose an existing chat from the left inbox or start a new direct conversation with an approved member.
            </p>
            {canMessage && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowNewChatModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#DD2A7B] to-[#8134AF] text-white text-xs font-bold shadow-xs hover:opacity-95 cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus size={14} /> New Message
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. New Message Composer Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#DBDBDB] rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#DBDBDB]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-pink-50 text-[#DD2A7B] flex items-center justify-center">
                  <Edit3 size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#262626]">New Message</h3>
                  <p className="text-[10px] text-[#737373]">Connect with an approved executive member</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNewChatModal(false)}
                className="text-[#737373] hover:text-[#262626] p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Member Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-[#737373]" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, role, chapter..."
                className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl pl-9 pr-3 py-2 text-xs text-[#262626] placeholder-[#737373] focus:outline-none transition"
              />
            </div>

            {/* Member Results List */}
            <div className="max-h-64 overflow-y-auto space-y-1 divide-y divide-[#DBDBDB]/50">
              {eligibleUsers.length === 0 ? (
                <div className="text-xs text-[#737373] text-center py-6">
                  No matching approved members found.
                </div>
              ) : (
                eligibleUsers.map(u => (
                  <button
                    key={u.uid}
                    onClick={() => handleStartChatWith(u.uid)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-[#FAFAFA] flex items-center justify-between text-xs transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-0.5 rounded-full bg-gradient-to-tr from-[#FCAF45] via-[#DD2A7B] to-[#8134AF] shrink-0">
                        <img 
                          src={u.avatarUrl} 
                          alt={u.displayName} 
                          className="w-9 h-9 rounded-full object-cover border border-white" 
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#262626] group-hover:text-[#DD2A7B] transition truncate">
                            {u.displayName}
                          </span>
                          <VerifiedBadge userId={u.uid} role={u.role} size="xs" />
                        </div>
                        <div className="text-[10px] text-[#737373] truncate">
                          {u.occupation || u.role.replace('_', ' ')} {u.chapter && `• ${u.chapter}`}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#DD2A7B] font-bold shrink-0 ml-2">Chat →</span>
                  </button>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-[#DBDBDB] flex justify-end">
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="px-4 py-1.5 rounded-xl bg-[#EFEFEF] hover:bg-[#DBDBDB] text-[#262626] text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Lightbox for Chat Image Attachment */}
      {lightboxImg && (
        <ImageLightbox
          images={[lightboxImg]}
          initialIndex={0}
          onClose={() => setLightboxImg(null)}
        />
      )}

      {/* 6. Isolated Message Snippet Safety Report Modal */}
      {reportTarget && (
        <ReportModal
          isOpen={!!reportTarget}
          onClose={() => setReportTarget(null)}
          targetType={reportTarget.targetType}
          targetId={reportTarget.targetId}
          targetAuthorId={reportTarget.targetAuthorId}
          targetAuthorName={reportTarget.targetAuthorName}
          targetContentSnippet={reportTarget.targetContentSnippet}
          evidenceContext={reportTarget.evidenceContext}
        />
      )}
    </div>
  );
};
