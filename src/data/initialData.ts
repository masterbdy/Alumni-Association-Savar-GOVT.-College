import { 
  UserProfile, 
  Post, 
  Conversation, 
  Message, 
  DonationCampaign, 
  DonationRecord, 
  ActivityLog,
  AdminPermissionLimits,
  ModulePermissionRule,
  SystemEmergencyControls,
  AppLogoConfig,
  EmailSystemSettingsConfig,
  CommunityReport,
  ModerationAction,
  ModerationAppeal
} from '../types';


export const INITIAL_USERS: UserProfile[] = [
  {
    uid: 'usr_superadmin_bootstrap',
    email: 'mehedihasan1303@gmail.com',
    displayName: 'System Controller',
    username: 'system.controller',
    headline: 'System Controller & Security Governor',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop&q=80',
    role: 'super_admin',
    status: 'approved',
    joinedAt: '2026-01-01T00:00:00Z',
    approvedAt: '2026-01-01T00:00:00Z',
    bio: 'Authoritative System Controller and Security Governor. Enforces zero-trust RBAC policies, account isolation, and audit compliance for Alumni Association.',
    phone: '+880 1700-000000',
    location: 'Savar, Dhaka, Bangladesh',
    occupation: 'System Controller & Chief Governor',
    chapter: 'Management Alumni Chapter',
    interests: ['Alumni Networking', 'Education Philanthropy', 'Institutional Growth'],
    showEmailPublicly: true,
    showPhonePublicly: false,
    allowDirectMessages: true,
    passwordHash: 'hash_nexus_2026',
    passwordLastChanged: '2026-01-01T00:00:00Z',
    twoFactorEnabled: true,
    activeSessions: 1,
    isEmailVerified: true
  },
  {
    uid: 'usr_president_01',
    email: 'k7379680@gmail.com',
    displayName: 'Ahmad Tanvir (President)',
    username: 'ahmad.tanvir',
    headline: 'Elected Alumni President — Dept. of Management',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop&q=80',
    role: 'admin', // President role is strictly Admin, NOT System Controller
    status: 'approved',
    joinedAt: '2026-01-10T10:00:00Z',
    approvedAt: '2026-01-10T10:00:00Z',
    bio: 'Elected President of Alumni Association, Department Of Management, Savar Govt. College. Leading alumni conventions, scholarships, and institutional endowments.',
    phone: '+880 1711-000001',
    location: 'Savar, Dhaka',
    occupation: 'Managing Director & Alumni President',
    chapter: 'Management Alumni Chapter',
    interests: ['Alumni Engagement', 'Student Mentorship', 'Scholarships'],
    website: 'https://tanvir-holdings.org',
    linkedinUrl: 'https://linkedin.com/in/ahmad-tanvir',
    twitterUrl: 'https://twitter.com/ahmadtanvir_nx',
    showEmailPublicly: true,
    showPhonePublicly: false,
    allowDirectMessages: true,
    passwordHash: 'hash_nexus_2026',
    passwordLastChanged: '2026-03-01T10:00:00Z',
    twoFactorEnabled: true,
    activeSessions: 2
  },
  {
    uid: 'usr_admin_02',
    email: 'sarah.finance@nexusclub.org',
    displayName: 'Sarah Chowdhury',
    username: 'sarah.chowdhury',
    headline: 'Finance Secretary & Chartered Financial Analyst',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&auto=format&fit=crop&q=80',
    role: 'admin',
    status: 'approved',
    joinedAt: '2026-01-15T12:30:00Z',
    approvedAt: '2026-01-15T12:35:00Z',
    approvedBy: 'usr_superadmin_01',
    bio: 'Finance Secretary & Verification Officer. Overseeing bKash/Nagad endowments and treasury audits.',
    phone: '+880 1819-223344',
    location: 'Gulshan, Dhaka',
    occupation: 'Chartered Financial Analyst',
    chapter: 'Treasury & Audit Council',
    interests: ['Endowment Funds', 'Financial Governance', 'Micro-scholarships'],
    website: 'https://chowdhury-capital.org',
    linkedinUrl: 'https://linkedin.com/in/sarah-chowdhury-cfa',
    showEmailPublicly: true,
    showPhonePublicly: true,
    allowDirectMessages: true,
    passwordHash: 'hash_nexus_2026',
    passwordLastChanged: '2026-02-15T14:30:00Z',
    twoFactorEnabled: true,
    activeSessions: 1
  },
  {
    uid: 'usr_mod_03',
    email: 'kamal.events@nexusclub.org',
    displayName: 'Kamal Hasan',
    username: 'kamal.events',
    headline: 'Community Lead & Head of Global Partnerships',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
    role: 'moderator',
    status: 'approved',
    joinedAt: '2026-02-01T09:00:00Z',
    approvedAt: '2026-02-01T09:15:00Z',
    approvedBy: 'usr_superadmin_01',
    bio: 'Community Lead & Event Coordinator. Organizing executive roundtables and fellowship summits.',
    phone: '+880 1912-334455',
    location: 'Banani, Dhaka',
    occupation: 'Head of Global Partnerships',
    chapter: 'Events & Cultural Committee',
    interests: ['Conferences', 'Alumni Relations', 'Mentorship'],
    linkedinUrl: 'https://linkedin.com/in/kamal-hasan-nexus',
    showEmailPublicly: false,
    showPhonePublicly: false,
    allowDirectMessages: true,
    passwordHash: 'hash_nexus_2026',
    passwordLastChanged: '2026-01-20T08:15:00Z',
    twoFactorEnabled: false,
    activeSessions: 1
  },
  {
    uid: 'usr_member_04',
    email: 'rafiq.ahmed@nexusclub.org',
    displayName: 'Rafiqul Islam',
    username: 'rafiq.islam',
    headline: 'Senior Enterprise Solutions Architect',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
    role: 'member',
    status: 'approved',
    joinedAt: '2026-02-14T14:20:00Z',
    approvedAt: '2026-02-14T15:00:00Z',
    approvedBy: 'usr_admin_02',
    bio: 'Senior Enterprise Architect & Philanthropist. Focused on digital transformation in public healthcare.',
    phone: '+880 1611-998877',
    location: 'Dhanmondi, Dhaka',
    occupation: 'Chief Solutions Architect',
    chapter: 'Technology Fellows Circle',
    interests: ['Distributed Systems', 'Health Informatics', 'Charity Runs'],
    githubUrl: 'https://github.com/rafiq-nexus',
    linkedinUrl: 'https://linkedin.com/in/rafiqul-islam-arch',
    showEmailPublicly: true,
    showPhonePublicly: false,
    allowDirectMessages: true,
    passwordHash: 'hash_nexus_2026',
    passwordLastChanged: '2026-02-14T14:20:00Z',
    twoFactorEnabled: true,
    activeSessions: 1
  },
  {
    uid: 'usr_pending_05',
    email: 'tania.akhtar@alumni.org',
    displayName: 'Tania Akhtar',
    username: 'tania.akhtar',
    headline: 'Data Scientist & AI Research Fellow',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    role: 'member',
    status: 'pending',
    joinedAt: '2026-10-17T18:45:00Z',
    bio: 'Alumni Applicant. Interested in youth scholarship initiatives and STEM grants.',
    phone: '+880 1715-445566',
    location: 'Uttara, Dhaka',
    occupation: 'Data Scientist & Researcher',
    chapter: 'Youth Fellowships',
    interests: ['Data Science', 'Education Equity'],
    showEmailPublicly: false,
    showPhonePublicly: false,
    allowDirectMessages: false,
    passwordHash: 'hash_nexus_2026',
    passwordLastChanged: '2026-10-17T18:45:00Z',
    twoFactorEnabled: false,
    activeSessions: 1
  },
  {
    uid: 'usr_restricted_06',
    email: 'zahir.khan@example.com',
    displayName: 'Zahir Khan',
    username: 'zahir.khan',
    headline: 'Fellow in Review',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    role: 'restricted_member',
    status: 'suspended',
    joinedAt: '2026-03-01T11:00:00Z',
    bio: 'Account temporarily suspended pending code-of-conduct review.',
    phone: '+880 1811-112233',
    location: 'Chittagong, Bangladesh',
    occupation: 'Logistics Consultant',
    passwordHash: 'hash_nexus_2026'
  }
];

export const INITIAL_CAMPAIGNS: DonationCampaign[] = [
  {
    id: 'camp_scholarship_2026',
    title: 'Executive Youth STEM Scholarship Fund 2026',
    description: 'Providing comprehensive higher-education tuition and research stipends for 50 talented underprivileged students.',
    category: 'community',
    organizerId: 'usr_superadmin_01',
    organizerName: 'Ahmad Tanvir (President)',
    organizerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    organizerRole: 'super_admin',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80',
    targetAmount: 500000,
    collectedAmount: 75000, // Strictly computed from confirmed donations
    bkashNumber: '01711-000001 (Merchant / Send Money)',
    nagadNumber: '01819-223344 (Personal / Send Money)',
    deadline: '2026-12-31',
    isActive: true,
    status: 'active',
    createdAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'camp_winter_relief',
    title: 'Northern District Flood & Winter Care Drive',
    description: 'Immediate warm clothing, emergency medical packs, and winter blankets for rural community centers in Kurigram and Rangpur.',
    category: 'relief',
    organizerId: 'usr_admin_02',
    organizerName: 'Sarah Chowdhury (VP)',
    organizerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    organizerRole: 'admin',
    imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&auto=format&fit=crop&q=80',
    targetAmount: 250000,
    collectedAmount: 0,
    bkashNumber: '01711-000001 (Send Money)',
    nagadNumber: '01819-223344 (Send Money)',
    deadline: '2026-11-30',
    isActive: true,
    status: 'active',
    createdAt: '2026-10-01T10:00:00Z'
  },
  {
    id: 'camp_grand_picnic_2026',
    title: 'Annual Executive Club Grand Picnic & Family Get-Together',
    description: 'Annual member retreat at Bhawal Eco-Resort, Gazipur. Includes luxury transport, live BBQ, games for kids, raffle draw, and fellowship dinner.',
    category: 'picnic',
    organizerId: 'usr_mod_03',
    organizerName: 'Kamal Hossain (Secretary)',
    organizerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    organizerRole: 'moderator',
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
    targetAmount: 180000,
    collectedAmount: 0,
    bkashNumber: '01711-000001 (Send Money)',
    nagadNumber: '01819-223344 (Send Money)',
    deadline: '2026-11-15',
    isActive: true,
    status: 'active',
    createdAt: '2026-10-05T12:00:00Z'
  },
  {
    id: 'camp_club_gala_2026',
    title: 'Executive Club House Enhancement & Annual Gala Dinner',
    description: 'Capital contribution for lounge interior upgrade, executive library, and the prestigious 2026 Member Recognition Banquet.',
    category: 'club',
    organizerId: 'usr_superadmin_01',
    organizerName: 'Ahmad Tanvir (President)',
    organizerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    organizerRole: 'super_admin',
    imageUrl: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200&auto=format&fit=crop&q=80',
    targetAmount: 350000,
    collectedAmount: 0,
    bkashNumber: '01711-000001 (Send Money)',
    nagadNumber: '01819-223344 (Send Money)',
    deadline: '2026-12-20',
    isActive: true,
    status: 'active',
    createdAt: '2026-10-10T14:00:00Z'
  }
];

export const INITIAL_DONATIONS: DonationRecord[] = [
  {
    id: 'don_101',
    campaignId: 'camp_scholarship_2026',
    campaignTitle: 'Executive Youth STEM Scholarship Fund 2026',
    userId: 'usr_member_04',
    donorName: 'Rafiqul Islam',
    donorMobile: '01611998877',
    method: 'bKash',
    amount: 25000,
    transactionId: '9K4M82PQ10',
    paymentDate: '2026-10-12',
    notes: 'Q3 Patron contribution for undergraduate books.',
    status: 'confirmed',
    submittedAt: '2026-10-12T11:15:00Z',
    reviewedBy: 'usr_admin_02',
    reviewedByName: 'Sarah Chowdhury',
    reviewedAt: '2026-10-12T13:40:00Z',
    reviewNotes: 'Verified against bank bKash statement batch #882.'
  },
  {
    id: 'don_102',
    campaignId: 'camp_scholarship_2026',
    campaignTitle: 'Executive Youth STEM Scholarship Fund 2026',
    userId: 'usr_member_04',
    donorName: 'Rafiqul Islam',
    donorMobile: '01611998877',
    method: 'Nagad',
    amount: 50000,
    transactionId: 'NG77218XA3',
    paymentDate: '2026-10-14',
    notes: 'Matching grant contribution.',
    status: 'confirmed',
    submittedAt: '2026-10-14T09:20:00Z',
    reviewedBy: 'usr_admin_02',
    reviewedByName: 'Sarah Chowdhury',
    reviewedAt: '2026-10-14T10:05:00Z',
    reviewNotes: 'Confirmed via Nagad Merchant app.'
  },
  {
    id: 'don_pending_01',
    campaignId: 'camp_winter_relief',
    campaignTitle: 'Northern District Flood & Winter Care Drive',
    userId: 'usr_member_04',
    donorName: 'Rafiqul Islam',
    donorMobile: '01611998877',
    method: 'bKash',
    amount: 15000,
    transactionId: 'BK9948210Z',
    paymentDate: '2026-10-18',
    notes: 'For 50 heavy winter blankets.',
    status: 'pending',
    submittedAt: '2026-10-18T01:30:00Z'
  }
];

export const INITIAL_POSTS: Post[] = [
  {
    id: 'post_camp_scholarship_2026',
    authorId: 'usr_superadmin_01',
    authorName: 'Ahmad Tanvir (President)',
    authorRole: 'super_admin',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    content: 'Providing comprehensive higher-education tuition and research stipends for 50 talented underprivileged students.',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80'],
    category: 'announcement',
    isPinned: true,
    likes: ['usr_admin_02', 'usr_mod_03', 'usr_member_04'],
    reactions: { like: 14, celebrate: 8, heart: 12 },
    createdAt: '2026-10-15T08:00:00Z',
    comments: [
      {
        id: 'comm_01',
        postId: 'post_camp_scholarship_2026',
        authorId: 'usr_admin_02',
        authorName: 'Sarah Chowdhury',
        authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        authorRole: 'admin',
        content: 'The bKash and Nagad payment channels are open and actively monitored for verification within 2 hours of submission.',
        createdAt: '2026-10-15T09:12:00Z'
      },
      {
        id: 'comm_02',
        postId: 'post_camp_scholarship_2026',
        authorId: 'usr_member_04',
        authorName: 'Rafiqul Islam',
        authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        authorRole: 'member',
        content: 'Proud to be part of this initiative. Just submitted my donation record via bKash.',
        createdAt: '2026-10-15T10:45:00Z'
      }
    ],
    isDonationCampaign: true,
    campaignId: 'camp_scholarship_2026',
    campaignTitle: 'Executive Youth STEM Scholarship Fund 2026',
    campaignTarget: 500000,
    campaignCollected: 75000,
    campaignCategory: 'community',
    campaignStatus: 'active'
  },
  {
    id: 'post_camp_winter_relief',
    authorId: 'usr_admin_02',
    authorName: 'Sarah Chowdhury (VP)',
    authorRole: 'admin',
    authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    content: 'Immediate warm clothing, emergency medical packs, and winter blankets for rural community centers in Kurigram and Rangpur.',
    imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&auto=format&fit=crop&q=80'],
    category: 'announcement',
    isPinned: false,
    likes: ['usr_superadmin_01'],
    reactions: { like: 8, celebrate: 4, heart: 10 },
    createdAt: '2026-10-17T11:00:00Z',
    comments: [],
    isDonationCampaign: true,
    campaignId: 'camp_winter_relief',
    campaignTitle: 'Northern District Flood & Winter Care Drive',
    campaignTarget: 250000,
    campaignCollected: 0,
    campaignCategory: 'relief',
    campaignStatus: 'active'
  },
  {
    id: 'post_02',
    authorId: 'usr_mod_03',
    authorName: 'Kamal Hasan',
    authorRole: 'moderator',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    content: 'Quarterly Executive Dinner and Annual General Assembly has been scheduled for next month at the Dhaka Club Regency Hall. RSVP via direct message to the moderation team.',
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
    category: 'event',
    isPinned: false,
    likes: ['usr_superadmin_01', 'usr_member_04'],
    reactions: { like: 9, celebrate: 11, heart: 5 },
    createdAt: '2026-10-16T14:30:00Z',
    comments: []
  }
];

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_group_exec',
    type: 'group',
    name: 'Executive Committee Council',
    participants: ['usr_superadmin_bootstrap', 'usr_superadmin_01', 'usr_admin_02', 'usr_mod_03'],
    lastMessage: 'All donation records for Q3 have been audited against bank records.',
    lastMessageSenderId: 'usr_admin_02',
    lastMessageAt: '2026-10-18T00:50:00Z',
    unreadCount: 1
  },
  {
    id: 'conv_dm_01',
    type: 'direct',
    name: 'Sarah Chowdhury',
    participants: ['usr_superadmin_01', 'usr_admin_02'],
    lastMessage: 'A new donation TrxID BK9948210Z has been submitted for verification.',
    lastMessageSenderId: 'usr_admin_02',
    lastMessageAt: '2026-10-18T01:32:00Z',
    unreadCount: 0
  }
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg_01',
    conversationId: 'conv_group_exec',
    senderId: 'usr_superadmin_01',
    senderName: 'Ahmad Tanvir',
    senderRole: 'super_admin',
    text: 'Please review the pending applicant Tania Akhtar in the Admin desk.',
    createdAt: '2026-10-17T20:00:00Z'
  },
  {
    id: 'msg_02',
    conversationId: 'conv_group_exec',
    senderId: 'usr_admin_02',
    senderName: 'Sarah Chowdhury',
    senderRole: 'admin',
    text: 'All donation records for Q3 have been audited against bank records.',
    createdAt: '2026-10-18T00:50:00Z'
  },
  {
    id: 'msg_03',
    conversationId: 'conv_dm_01',
    senderId: 'usr_admin_02',
    senderName: 'Sarah Chowdhury',
    senderRole: 'admin',
    text: 'A new donation TrxID BK9948210Z has been submitted for verification.',
    createdAt: '2026-10-18T01:32:00Z'
  }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'log_01',
    actorId: 'usr_admin_02',
    actorName: 'Sarah Chowdhury',
    actorRole: 'admin',
    action: 'DONATION_VERIFIED',
    targetType: 'donation',
    targetId: 'don_101',
    details: 'Verified bKash transaction 9K4M82PQ10 (25,000 BDT) for STEM Scholarship.',
    timestamp: '2026-10-12T13:40:00Z'
  },
  {
    id: 'log_02',
    actorId: 'usr_superadmin_01',
    actorName: 'Ahmad Tanvir',
    actorRole: 'super_admin',
    action: 'MEMBER_APPROVED',
    targetType: 'user',
    targetId: 'usr_member_04',
    details: 'Approved membership application for Rafiqul Islam.',
    timestamp: '2026-02-14T15:00:00Z'
  },
  {
    id: 'log_03',
    actorId: 'usr_superadmin_01',
    actorName: 'Ahmad Tanvir',
    actorRole: 'super_admin',
    action: 'POST_PINNED',
    targetType: 'post',
    targetId: 'post_01',
    details: 'Pinned President Welcome Address to feed.',
    timestamp: '2026-10-15T08:05:00Z'
  }
];

export const DEFAULT_ADMIN_LIMITS: AdminPermissionLimits = {
  canAddRemoveModerators: true,
  canApproveSuspendMembers: true,
  canDeleteModeratePosts: true,
  canManageAnnouncements: true,
  canReviewVerifyDonations: true,
  canViewAdminReports: true,
  canChangeAppSettings: false, // Deny by default: only System Controller can change core app settings
  canAccessSensitiveMemberInfo: false // Deny by default: sensitive phone/email details protected
};

export const INITIAL_ADMIN_LIMITS: Record<string, AdminPermissionLimits> = {
  usr_admin_02: {
    canAddRemoveModerators: false, // Sarah is finance lead; cannot alter moderator roster
    canApproveSuspendMembers: true,
    canDeleteModeratePosts: true,
    canManageAnnouncements: true,
    canReviewVerifyDonations: true,
    canViewAdminReports: true,
    canChangeAppSettings: false,
    canAccessSensitiveMemberInfo: true
  }
};

export const INITIAL_PERMISSION_MATRIX: ModulePermissionRule[] = [
  {
    moduleId: 'feed',
    moduleName: 'Social Timeline & Posts',
    description: 'Creating, editing, pinning, and deleting community feed posts and comments.',
    allowedRoles: {
      view: ['super_admin', 'admin', 'moderator', 'member', 'restricted_member'],
      create: ['super_admin', 'admin', 'moderator', 'member'],
      edit: ['super_admin', 'admin', 'moderator', 'member'],
      delete: ['super_admin', 'admin', 'moderator'],
      approve: ['super_admin', 'admin', 'moderator']
    }
  },
  {
    moduleId: 'directory',
    moduleName: 'Member Directory & Profiles',
    description: 'Viewing members, searching profiles, and managing public member data.',
    allowedRoles: {
      view: ['super_admin', 'admin', 'moderator', 'member'],
      create: ['super_admin', 'admin'],
      edit: ['super_admin', 'admin'],
      delete: ['super_admin'],
      approve: ['super_admin', 'admin']
    }
  },
  {
    moduleId: 'messages',
    moduleName: 'Direct & Group Messaging',
    description: 'Private 1-on-1 and committee conversations with photo attachments.',
    allowedRoles: {
      view: ['super_admin', 'admin', 'moderator', 'member'],
      create: ['super_admin', 'admin', 'moderator', 'member'],
      edit: ['super_admin'],
      delete: ['super_admin'],
      approve: ['super_admin']
    }
  },
  {
    moduleId: 'donations',
    moduleName: 'Endowment Campaigns & Donations',
    description: 'Launching fundraising campaigns, submitting pledges, and financial verification.',
    allowedRoles: {
      view: ['super_admin', 'admin', 'moderator', 'member', 'restricted_member'],
      create: ['super_admin', 'admin', 'moderator', 'member'], // members create pledges, admins create campaigns
      edit: ['super_admin', 'admin', 'moderator'],
      delete: ['super_admin'],
      approve: ['super_admin', 'admin', 'moderator']
    }
  },
  {
    moduleId: 'admin',
    moduleName: 'Administrative Operations & Auditing',
    description: 'Member approvals, donation ledger verification, reported posts, and audit log inspection.',
    allowedRoles: {
      view: ['super_admin', 'admin', 'moderator'],
      create: ['super_admin', 'admin'],
      edit: ['super_admin', 'admin'],
      delete: ['super_admin'],
      approve: ['super_admin', 'admin', 'moderator']
    }
  },
  {
    moduleId: 'settings',
    moduleName: 'System Controller Master Control & Security',
    description: 'Permission matrices, role assignment, admin limit caps, and emergency maintenance controls.',
    allowedRoles: {
      view: ['super_admin'],
      create: ['super_admin'],
      edit: ['super_admin'],
      delete: ['super_admin'],
      approve: ['super_admin']
    }
  }
];

export const INITIAL_EMERGENCY_CONTROLS: SystemEmergencyControls = {
  maintenanceMode: false,
  freezeDonations: false,
  pauseRegistrations: false,
  restrictedPostingMode: false,
  lastUpdatedBy: 'usr_superadmin_bootstrap',
  lastUpdatedAt: '2026-01-01T00:00:00Z',
  reason: 'Initial system operational state'
};

export const DEFAULT_APP_LOGO: AppLogoConfig = {
  url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&auto=format&fit=crop&q=80',
  fileName: 'alumni-mgmt-logo.png',
  fileSize: 45200,
  mimeType: 'image/png',
  updatedAt: '2026-01-01T00:00:00Z',
  updatedBy: 'usr_superadmin_bootstrap',
  updatedByName: 'System Controller'
};

export const DEFAULT_EMAIL_SETTINGS: EmailSystemSettingsConfig = {
  senderDisplayName: 'Alumni Association - Department Of Management, Savar Govt. College',
  supportEmail: 'support@alumni-management-sgc.org',
  enforceRegistrationOtp: true,
  enforcePasswordResetOtp: true,
  allowedEmailDomainFilter: '', // empty = any valid email allowed
  lastUpdatedBy: 'usr_superadmin_bootstrap',
  lastUpdatedAt: '2026-01-01T00:00:00Z'
};

export const INITIAL_COMMUNITY_REPORTS: CommunityReport[] = [
  {
    id: 'rep_101',
    targetType: 'post',
    targetId: 'post_01',
    targetContentSnippet: 'Alumni Gala 2026 registration is now officially active...',
    targetAuthorId: 'usr_president_01',
    targetAuthorName: 'Ahmad Tanvir (President)',
    targetAuthorRole: 'admin',
    reporterId: 'usr_member_04',
    reporterName: 'Rafiqul Islam',
    reporterRole: 'member',
    category: 'spam',
    reason: 'Unverified external registration link in comment thread',
    details: 'The comment thread includes an unofficial payment link that could confuse donors.',
    status: 'under_review',
    reportedAt: '2026-10-27T11:20:00Z',
    assignedModeratorId: 'usr_mod_03',
    assignedModeratorName: 'Kamal Hasan'
  },
  {
    id: 'rep_102',
    targetType: 'message',
    targetId: 'msg_flagged_demo',
    targetContentSnippet: 'Direct message inquiry regarding internal executive election voting proxy.',
    targetAuthorId: 'usr_restricted_06',
    targetAuthorName: 'Zahir Khan',
    targetAuthorRole: 'restricted_member',
    reporterId: 'usr_admin_02',
    reporterName: 'Sarah Chowdhury',
    reporterRole: 'admin',
    category: 'harassment',
    reason: 'Persistent unsolicited solicitation for executive voting delegates',
    details: 'Member contacted multiple chapter leads repeatedly despite clear opt-out requests.',
    evidenceContext: 'Snippet: "You must back our regional slate or face council complaints..." (Isolated message proof)',
    status: 'action_taken',
    reportedAt: '2026-10-25T14:10:00Z',
    assignedModeratorId: 'usr_superadmin_bootstrap',
    assignedModeratorName: 'System Controller',
    reviewedAt: '2026-10-25T16:00:00Z',
    reviewNotes: 'Verified violation of direct messaging code of conduct. Issued 7-day posting and DM restriction.',
    resolutionAction: 'temporary_restriction',
    resolutionActionId: 'act_201'
  },
  {
    id: 'rep_103',
    targetType: 'comment',
    targetId: 'comm_flagged_demo',
    targetContentSnippet: 'This department picnic budget seems heavily exaggerated without itemized receipts.',
    targetAuthorId: 'usr_member_04',
    targetAuthorName: 'Rafiqul Islam',
    targetAuthorRole: 'member',
    reporterId: 'usr_president_01',
    reporterName: 'Ahmad Tanvir (President)',
    reporterRole: 'admin',
    category: 'other',
    reason: 'Unfounded public accusation regarding approved committee budgets',
    details: 'Financial inquiries must be submitted through the Treasury Secretary, not unverified public accusations.',
    status: 'pending',
    reportedAt: '2026-10-28T09:30:00Z'
  }
];

export const INITIAL_MODERATION_ACTIONS: ModerationAction[] = [
  {
    id: 'act_201',
    reportId: 'rep_102',
    targetType: 'message',
    targetId: 'msg_flagged_demo',
    targetUserId: 'usr_restricted_06',
    targetUserName: 'Zahir Khan',
    actionType: 'temporary_restriction',
    reason: 'Persistent unsolicited messaging violating chapter communication standards.',
    moderatorId: 'usr_superadmin_bootstrap',
    moderatorName: 'System Controller',
    moderatorRole: 'super_admin',
    timestamp: '2026-10-25T16:00:00Z',
    durationHours: 168,
    expiresAt: '2026-11-01T16:00:00Z',
    hasAppeal: true,
    appealId: 'app_301'
  }
];

export const INITIAL_MODERATION_APPEALS: ModerationAppeal[] = [
  {
    id: 'app_301',
    actionId: 'act_201',
    reportId: 'rep_102',
    appellantId: 'usr_restricted_06',
    appellantName: 'Zahir Khan',
    appellantEmail: 'zahir.khan@example.com',
    penaltyType: 'temporary_restriction',
    penaltyReason: 'Persistent unsolicited messaging violating chapter communication standards.',
    appealStatement: 'I apologize for the misunderstanding. I was reaching out as part of the regional alumni outreach committee to coordinate regional representation. I did not intend any harassment and will strictly abide by official coordination channels in the future.',
    submittedAt: '2026-10-26T10:00:00Z',
    status: 'pending'
  }
];

