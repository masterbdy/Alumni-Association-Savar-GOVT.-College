import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DonationMethod, CampaignCategory, DonationRecord, DonationCampaign, CampaignStatus } from '../types';
import { ImageUploadPicker } from './ImageUploadPicker';
import { ImageLightbox } from './ImageLightbox';
import { VerifiedBadge } from './VerifiedBadge';
import { 
  isCampaignExpired,
  getEffectiveCampaignStatus,
  canCampaignAcceptDonations,
  checkCampaignFinancialRecords,
  canUserEditCampaign,
  canUserDeleteCampaign,
  canUserManageCampaignStatus,
  validateCampaignEdit
} from '../services/donationService';
import { 
  CreditCard, 
  Copy, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  ArrowUpRight, 
  Sparkles, 
  TrendingUp, 
  FileText, 
  Image as ImageIcon, 
  ShieldCheck, 
  Users, 
  Target, 
  AlertTriangle, 
  RotateCcw, 
  XCircle, 
  CheckCircle, 
  Lock, 
  Plus,
  Edit3,
  Trash2,
  Archive,
  Unlock,
  Play,
  Search,
  Filter,
  Eye,
  Calendar,
  X,
  Info,
  ChevronRight
} from 'lucide-react';

export const DonationsView: React.FC = () => {
  const { 
    currentUser, 
    campaigns, 
    donations, 
    selectedDonationCampaignId,
    setSelectedDonationCampaignId,
    submitDonation, 
    confirmDonation, 
    rejectDonation, 
    disputeDonation, 
    reverseDonation, 
    createCampaign, 
    editCampaign,
    closeCampaign,
    reopenCampaign,
    archiveCampaign,
    deleteCampaign,
    isSystemController,
    getAdminEffectiveLimits,
    permissionMatrix,
    canDonate, 
    canVerifyDonations 
  } = useApp();

  const callerLimits = currentUser?.uid ? getAdminEffectiveLimits(currentUser.uid) : undefined;

  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    selectedDonationCampaignId || campaigns[0]?.id || ''
  );

  useEffect(() => {
    if (selectedDonationCampaignId && campaigns.some(c => c.id === selectedDonationCampaignId)) {
      setSelectedCampaignId(selectedDonationCampaignId);
    }
  }, [selectedDonationCampaignId, campaigns]);

  const [method, setMethod] = useState<DonationMethod>('bKash');
  const [amount, setAmount] = useState<string>('5000');
  const [mobile, setMobile] = useState<string>(currentUser?.phone ? currentUser.phone.replace(/\D/g, '') : '01711000000');
  
  // Campaign creation modal state
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<CampaignCategory>('community');
  const [newTarget, setNewTarget] = useState('200000');
  const [newBkash, setNewBkash] = useState('01711-000001 (Send Money)');
  const [newNagad, setNewNagad] = useState('01819-223344 (Send Money)');
  const [newDeadline, setNewDeadline] = useState('');
  const [newCampaignImages, setNewCampaignImages] = useState<string[]>([]);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [createCampaignError, setCreateCampaignError] = useState('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  const [viewingEvidenceUrl, setViewingEvidenceUrl] = useState<string | null>(null);

  // Category filter & Status filter for campaigns
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed' | 'expired' | 'archived'>('all');
  const [campaignSearchQuery, setCampaignSearchQuery] = useState('');

  // Edit Campaign State
  const [editingCampaign, setEditingCampaign] = useState<DonationCampaign | null>(null);
  const [editStep, setEditStep] = useState<'form' | 'review'>('form');
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState<CampaignCategory>('community');
  const [editTarget, setEditTarget] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editBkash, setEditBkash] = useState('');
  const [editNagad, setEditNagad] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [editStatus, setEditStatus] = useState<CampaignStatus>('active');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editReason, setEditReason] = useState('');
  const [editErrors, setEditErrors] = useState<string[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Campaign State & Financial Safeguard
  const [deletingCampaign, setDeletingCampaign] = useState<DonationCampaign | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Close & Reopen Modals
  const [closingCampaign, setClosingCampaign] = useState<DonationCampaign | null>(null);
  const [closeReason, setCloseReason] = useState('');
  const [reopeningCampaign, setReopeningCampaign] = useState<DonationCampaign | null>(null);
  const [reopenDeadline, setReopenDeadline] = useState('');
  const [reopenReason, setReopenReason] = useState('');

  // Archive Modal
  const [archivingCampaign, setArchivingCampaign] = useState<DonationCampaign | null>(null);
  const [archiveReason, setArchiveReason] = useState('');

  // Verification tab for reviewers
  const [reviewerTab, setReviewerTab] = useState<'pending' | 'confirmed' | 'disputed' | 'all'>('pending');

  // Action modals
  const [reviewModalDonation, setReviewModalDonation] = useState<DonationRecord | null>(null);
  const [actionType, setActionType] = useState<'confirm' | 'reject' | 'dispute' | 'reverse' | null>(null);
  const [actionReason, setActionReason] = useState<string>('');

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const activeCampaign = campaigns.find(c => c.id === selectedCampaignId) || campaigns[0];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 10) {
      setErrorMsg('Please enter a valid amount (minimum 10 BDT).');
      return;
    }

    if (!transactionId.trim() || transactionId.trim().length < 6) {
      setErrorMsg('Please enter a valid bKash/Nagad Transaction ID (e.g. 9K4M82PQ10).');
      return;
    }

    setIsSubmitting(true);
    const result = submitDonation(
      selectedCampaignId,
      numericAmount,
      method,
      mobile,
      transactionId,
      notes,
      evidenceImages[0],
      paymentDate
    );
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMsg(`Donation submission for Trx ${transactionId.toUpperCase()} received! Queued for verification.`);
      setTransactionId('');
      setNotes('');
      setEvidenceImages([]);
    } else {
      setErrorMsg(result.error || 'Failed to submit donation.');
    }
  };

  const handleExecuteReviewAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalDonation || !actionType) return;

    let res: { success: boolean; error?: string };
    if (actionType === 'confirm') {
      res = confirmDonation(reviewModalDonation.id, actionReason);
    } else if (actionType === 'reject') {
      res = rejectDonation(reviewModalDonation.id, actionReason || 'Transaction ID not found in bank records.');
    } else if (actionType === 'dispute') {
      res = disputeDonation(reviewModalDonation.id, actionReason || 'Payment amount or reference discrepancy.');
    } else {
      res = reverseDonation(reviewModalDonation.id, actionReason || 'Auditable correction performed.');
    }

    if (res.success) {
      setSuccessMsg(`Payment Trx ${reviewModalDonation.transactionId} updated successfully: ${actionType.toUpperCase()}.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setReviewModalDonation(null);
      setActionType(null);
      setActionReason('');
    } else {
      setErrorMsg(res.error || 'Action failed.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleCreateCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateCampaignError('');

    const targetNum = parseFloat(newTarget);
    if (isNaN(targetNum) || targetNum <= 0) {
      setCreateCampaignError('Please enter a valid target amount greater than 0.');
      return;
    }

    if (!newTitle.trim()) {
      setCreateCampaignError('Please enter a campaign title.');
      return;
    }

    if (!newDesc.trim()) {
      setCreateCampaignError('Please enter a detailed campaign description.');
      return;
    }

    if (!newBkash.trim() || !newNagad.trim()) {
      setCreateCampaignError('Both bKash and Nagad payment numbers must be configured.');
      return;
    }

    setIsCreatingCampaign(true);
    const res = createCampaign(
      newTitle,
      newDesc,
      newCategory,
      targetNum,
      newBkash,
      newNagad,
      newDeadline || undefined,
      newCampaignImages[0] || undefined
    );
    setIsCreatingCampaign(false);

    if (res.success && res.campaign) {
      setSuccessMsg(`Campaign "${res.campaign.title}" launched successfully and posted to the Social Feed!`);
      setSelectedCampaignId(res.campaign.id);
      setSelectedDonationCampaignId(res.campaign.id);
      setShowCreateCampaignModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewTarget('200000');
      setNewDeadline('');
      setNewCampaignImages([]);
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setCreateCampaignError(res.error || 'Failed to create campaign.');
    }
  };

  const handleOpenEdit = (camp: DonationCampaign) => {
    setEditingCampaign(camp);
    setEditStep('form');
    setEditTitle(camp.title);
    setEditDesc(camp.description);
    setEditCategory(camp.category);
    setEditTarget(String(camp.targetAmount || ''));
    setEditStartDate(camp.startDate || '');
    setEditDeadline(camp.deadline || '');
    setEditBkash(camp.bkashNumber);
    setEditNagad(camp.nagadNumber);
    setEditInstructions(camp.instructions || '');
    setEditStatus(camp.status || 'active');
    setEditImages(camp.imageUrl ? [camp.imageUrl] : (camp.images || []));
    setEditReason('');
    setEditErrors([]);
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateCampaignEdit({
      title: editTitle,
      description: editDesc,
      targetAmount: parseFloat(editTarget),
      bkashNumber: editBkash,
      nagadNumber: editNagad,
      startDate: editStartDate || undefined,
      deadline: editDeadline || undefined
    });

    if (!validation.isValid) {
      setEditErrors(validation.errors);
      return;
    }

    setEditErrors([]);
    setEditStep('review');
  };

  const handleConfirmSaveEdit = () => {
    if (!editingCampaign) return;
    setIsSavingEdit(true);
    setEditErrors([]);

    const res = editCampaign(
      editingCampaign.id,
      {
        title: editTitle.trim(),
        description: editDesc.trim(),
        category: editCategory,
        targetAmount: parseFloat(editTarget),
        startDate: editStartDate || undefined,
        deadline: editDeadline || undefined,
        imageUrl: editImages[0] || undefined,
        images: editImages,
        bkashNumber: editBkash.trim(),
        nagadNumber: editNagad.trim(),
        instructions: editInstructions.trim() || undefined,
        status: editStatus
      },
      editReason.trim() || 'Updated campaign parameters and schedule'
    );

    setIsSavingEdit(false);
    if (res.success) {
      setSuccessMsg(`Campaign "${editTitle.trim()}" successfully updated and synced across feed and donation pages!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setEditingCampaign(null);
    } else {
      setEditErrors([res.error || 'Failed to update campaign.']);
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingCampaign) return;
    if (!deleteReason.trim()) {
      setDeleteError('Please provide an auditable reason for campaign deletion.');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');
    const res = deleteCampaign(deletingCampaign.id, deleteReason.trim());
    setIsDeleting(false);

    if (res.success) {
      setSuccessMsg(`Campaign "${deletingCampaign.title}" was permanently deleted.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setDeletingCampaign(null);
      setDeleteReason('');
      if (selectedCampaignId === deletingCampaign.id) {
        setSelectedCampaignId(campaigns.find(c => c.id !== deletingCampaign.id)?.id || '');
      }
    } else {
      setDeleteError(res.error || 'Deletion failed.');
    }
  };

  const handleConfirmClose = () => {
    if (!closingCampaign) return;
    const res = closeCampaign(closingCampaign.id, closeReason.trim() || 'Campaign manually closed by authorized coordinator');
    if (res.success) {
      setSuccessMsg(`Campaign "${closingCampaign.title}" is now CLOSED. New donations are disabled.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setClosingCampaign(null);
      setCloseReason('');
    } else {
      setErrorMsg(res.error || 'Failed to close campaign.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleConfirmReopen = () => {
    if (!reopeningCampaign) return;
    const res = reopenCampaign(
      reopeningCampaign.id, 
      reopenDeadline.trim() || undefined, 
      reopenReason.trim() || 'Campaign reopened by authorized coordinator'
    );
    if (res.success) {
      setSuccessMsg(`Campaign "${reopeningCampaign.title}" has been REOPENED. Donations are now active!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setReopeningCampaign(null);
      setReopenDeadline('');
      setReopenReason('');
    } else {
      setErrorMsg(res.error || 'Failed to reopen campaign.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleConfirmArchive = () => {
    if (!archivingCampaign) return;
    const res = archiveCampaign(archivingCampaign.id, archiveReason.trim() || 'Archived to preserve financial audit trail');
    if (res.success) {
      setSuccessMsg(`Campaign "${archivingCampaign.title}" has been ARCHIVED. Financial pledges preserved.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setArchivingCampaign(null);
      setArchiveReason('');
    } else {
      setErrorMsg(res.error || 'Failed to archive campaign.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const filteredCampaigns = campaigns.filter(c => {
    const effective = getEffectiveCampaignStatus(c);
    
    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active' && effective !== 'active') return false;
      if (statusFilter === 'closed' && effective !== 'closed') return false;
      if (statusFilter === 'expired' && effective !== 'expired') return false;
      if (statusFilter === 'archived' && effective !== 'archived') return false;
    }
    
    // Category filter
    if (selectedCategory !== 'all' && c.category !== selectedCategory) {
      return false;
    }

    // Search query
    if (campaignSearchQuery.trim()) {
      const q = campaignSearchQuery.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchDesc = c.description.toLowerCase().includes(q);
      const matchOrganizer = (c.organizerName || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchOrganizer) {
        return false;
      }
    }

    return true;
  });

  const confirmedDonations = donations.filter(d => d.status === 'confirmed' || d.status === 'verified');
  const pendingDonations = donations.filter(d => d.status === 'pending');
  const totalConfirmedAmount = confirmedDonations.reduce((sum, d) => sum + d.amount, 0);
  const totalPendingAmount = pendingDonations.reduce((sum, d) => sum + d.amount, 0);
  const totalFundraisingTarget = campaigns.reduce((sum, c) => sum + (c.targetAmount || 0), 0);
  const totalRemainingTarget = Math.max(0, totalFundraisingTarget - totalConfirmedAmount);
  const totalConfirmedCount = confirmedDonations.length;

  const userDonations = donations.filter(d => d.userId === currentUser.uid);

  const categoryLabels: Record<CampaignCategory, { label: string; color: string }> = {
    community: { label: 'Community STEM & Aid', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    club: { label: 'Club House & Capital', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    picnic: { label: 'Picnic & Get-Together', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    event: { label: 'Gala & Banquet Events', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    relief: { label: 'Emergency Relief Drive', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    general: { label: 'General Fund', color: 'bg-slate-100 text-slate-700 border-slate-200' }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Strict Totals Bar */}
      <div className="bg-white border border-[#DBDBDB] rounded-2xl p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#DD2A7B] bg-pink-50 px-3 py-1 rounded-full border border-pink-200 mb-2">
              <Sparkles size={14} /> Official Contribution & Philanthropy Hub
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#262626] tracking-tight">
              Community Donations & Verified Funds
            </h1>
            <p className="text-xs sm:text-sm text-[#737373] mt-1 max-w-2xl leading-relaxed">
              Transparent, audited fundraising for community endowments, club development, family picnics, and fellowship events.
            </p>
          </div>

          {canVerifyDonations && (
            <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
              <button
                onClick={() => {
                  setCreateCampaignError('');
                  setShowCreateCampaignModal(true);
                }}
                className="px-3.5 py-2 bg-[#DD2A7B] hover:bg-[#C9226C] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus size={15} /> Launch Campaign
              </button>
              <div className="flex items-center gap-2 bg-[#FAFAFA] border border-[#DBDBDB] px-3.5 py-2 rounded-xl text-xs text-[#262626]">
                <ShieldCheck size={16} className="text-[#DD2A7B]" />
                <span>
                  <strong>Reviewer:</strong> {currentUser.role.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Strict Financial Ledger Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-[#DBDBDB]">
          <div className="bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl p-3.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
              <CheckCircle size={12} /> Confirmed Total
            </div>
            <div className="text-lg sm:text-xl font-black text-[#262626] font-mono mt-1">
              {totalConfirmedAmount.toLocaleString()} <span className="text-[10px] font-normal text-[#737373]">BDT</span>
            </div>
            <div className="text-[10px] text-[#737373] mt-0.5">Strictly certified funds</div>
          </div>

          <div className="bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl p-3.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
              <Clock size={12} /> Pending Verification
            </div>
            <div className="text-lg sm:text-xl font-black text-amber-700 font-mono mt-1">
              {totalPendingAmount.toLocaleString()} <span className="text-[10px] font-normal text-[#737373]">BDT</span>
            </div>
            <div className="text-[10px] text-amber-800 mt-0.5">{pendingDonations.length} in queue</div>
          </div>

          <div className="bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl p-3.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#737373] flex items-center gap-1">
              <Target size={12} className="text-[#DD2A7B]" /> Total Target
            </div>
            <div className="text-lg sm:text-xl font-black text-[#262626] font-mono mt-1">
              {totalFundraisingTarget.toLocaleString()} <span className="text-[10px] font-normal text-[#737373]">BDT</span>
            </div>
            <div className="text-[10px] text-[#737373] mt-0.5">Approved programs</div>
          </div>

          <div className="bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl p-3.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1">
              <TrendingUp size={12} /> Remaining Target
            </div>
            <div className="text-lg sm:text-xl font-black text-purple-800 font-mono mt-1">
              {totalRemainingTarget.toLocaleString()} <span className="text-[10px] font-normal text-[#737373]">BDT</span>
            </div>
            <div className="text-[10px] text-[#737373] mt-0.5">To goal completion</div>
          </div>

          <div className="bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl p-3.5 col-span-2 sm:col-span-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
              <Users size={12} /> Certified Donations
            </div>
            <div className="text-lg sm:text-xl font-black text-[#262626] font-mono mt-1">
              {totalConfirmedCount} <span className="text-[10px] font-normal text-[#737373]">Pledges</span>
            </div>
            <div className="text-[10px] text-[#737373] mt-0.5">Audited receipts</div>
          </div>
        </div>

        {/* Security Assurance Tagline */}
        <div className="bg-[#FAFAFA] rounded-xl p-2.5 text-[11px] text-[#737373] flex items-center gap-2 border border-[#DBDBDB]">
          <ShieldAlert size={14} className="text-[#DD2A7B] shrink-0" />
          <span>
            <strong>Stewardship Guarantee:</strong> Only verified payments count toward official campaign balances. Pending or rejected payments are strictly excluded.
          </span>
        </div>
      </div>

      {/* 2. Reviewer Workspace & Audit Ledger */}
      {canVerifyDonations && (
        <div className="bg-white border border-[#DBDBDB] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DBDBDB]">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h2 className="text-sm font-bold text-[#262626] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-[#DD2A7B]" />
                  Verification & Reconciliation Workspace
                </h2>
              </div>
              <p className="text-xs text-[#737373] mt-0.5">
                Restricted to authorized administrators. Compare TrxIDs with statements. Self-verification is blocked.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#FAFAFA] p-1 rounded-xl border border-[#DBDBDB]">
              <button
                onClick={() => setReviewerTab('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  reviewerTab === 'pending' ? 'bg-[#262626] text-white shadow-xs' : 'text-[#737373] hover:text-[#262626]'
                }`}
              >
                <span>Pending Queue</span>
                {pendingDonations.length > 0 && (
                  <span className="bg-[#DD2A7B] text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                    {pendingDonations.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setReviewerTab('confirmed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  reviewerTab === 'confirmed' ? 'bg-[#262626] text-white shadow-xs' : 'text-[#737373] hover:text-[#262626]'
                }`}
              >
                Confirmed ({confirmedDonations.length})
              </button>

              <button
                onClick={() => setReviewerTab('disputed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  reviewerTab === 'disputed' ? 'bg-[#262626] text-white shadow-xs' : 'text-[#737373] hover:text-[#262626]'
                }`}
              >
                Disputed
              </button>

              <button
                onClick={() => setReviewerTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  reviewerTab === 'all' ? 'bg-[#262626] text-white shadow-xs' : 'text-[#737373] hover:text-[#262626]'
                }`}
              >
                All ({donations.length})
              </button>
            </div>
          </div>

          {/* Verification Table */}
          {(() => {
            const list = donations.filter(d => {
              if (reviewerTab === 'pending') return d.status === 'pending';
              if (reviewerTab === 'confirmed') return d.status === 'confirmed' || d.status === 'verified';
              if (reviewerTab === 'disputed') return d.status === 'disputed';
              return true;
            });

            if (list.length === 0) {
              return (
                <div className="text-center py-10 text-[#737373] text-xs bg-[#FAFAFA] rounded-xl border border-[#DBDBDB]">
                  <CheckCircle2 size={30} className="mx-auto mb-2 text-emerald-600/50" />
                  No submissions in this verification category.
                </div>
              );
            }

            return (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#DBDBDB] bg-[#FAFAFA] text-[#737373] uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Donor & Contact</th>
                      <th className="py-2.5 px-3">Campaign</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Transaction ID</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DBDBDB]/60 text-[#262626]">
                    {list.map(don => {
                      const isSelf = don.userId === currentUser.uid;
                      const isConfirmed = don.status === 'confirmed' || don.status === 'verified';

                      return (
                        <tr key={don.id} className="hover:bg-[#FAFAFA] transition">
                          <td className="py-3 px-3 text-[#737373] whitespace-nowrap">
                            {don.paymentDate || new Date(don.submittedAt).toLocaleDateString()}
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-semibold text-[#262626] flex items-center gap-1.5 flex-wrap">
                              <span>{don.donorName}</span>
                              <VerifiedBadge userId={don.userId} size="xs" />
                              {isSelf && (
                                <span className="text-[9px] bg-amber-50 text-amber-800 px-1.5 py-0.2 rounded font-bold border border-amber-200">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#737373] font-mono">{don.donorMobile}</div>
                          </td>

                          <td className="py-3 px-3 max-w-[180px] truncate text-[#262626]" title={don.campaignTitle}>
                            {don.campaignTitle}
                          </td>

                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              don.method === 'bKash' ? 'bg-[#E2136E]/15 text-[#E2136E]' :
                              don.method === 'Nagad' ? 'bg-[#F7941D]/15 text-[#F7941D]' :
                              'bg-purple-50 text-purple-700'
                            }`}>
                              {don.method}
                            </span>
                          </td>

                          <td className="py-3 px-3 font-mono font-bold text-[#262626] tracking-wider">
                            {don.transactionId}
                          </td>

                          <td className="py-3 px-3 font-mono font-bold text-emerald-700 whitespace-nowrap">
                            {don.amount.toLocaleString()} BDT
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            {isConfirmed ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                <CheckCircle2 size={11} /> Confirmed
                              </span>
                            ) : don.status === 'pending' ? (
                              <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                <Clock size={11} /> Pending Review
                              </span>
                            ) : don.status === 'disputed' ? (
                              <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                <AlertTriangle size={11} /> Disputed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                <XCircle size={11} /> Rejected
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {don.paymentEvidenceUrl && (
                                <button
                                  onClick={() => setViewingEvidenceUrl(don.paymentEvidenceUrl!)}
                                  className="px-2 py-1 rounded bg-[#FAFAFA] hover:bg-[#F2F2F2] border border-[#DBDBDB] text-[#262626] text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                                  title="View Uploaded Payment Slip"
                                >
                                  <ImageIcon size={11} /> Slip
                                </button>
                              )}

                              {isSelf ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200 font-semibold" title="Strict Rule: Reviewers cannot verify their own submissions">
                                  <Lock size={10} /> Self-Verification Blocked
                                </span>
                              ) : don.status === 'pending' ? (
                                <>
                                  <button
                                    onClick={() => {
                                      setReviewModalDonation(don);
                                      setActionType('confirm');
                                      setActionReason('Payment verified against bank statement.');
                                    }}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <Check size={11} /> Confirm
                                  </button>
                                  <button
                                    onClick={() => {
                                      setReviewModalDonation(don);
                                      setActionType('reject');
                                      setActionReason('');
                                    }}
                                    className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <XCircle size={11} /> Reject
                                  </button>
                                  <button
                                    onClick={() => {
                                      setReviewModalDonation(don);
                                      setActionType('dispute');
                                      setActionReason('');
                                    }}
                                    className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <AlertTriangle size={11} /> Dispute
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => {
                                    setReviewModalDonation(don);
                                    setActionType('reverse');
                                    setActionReason('Reversing previous verification status for audit correction.');
                                  }}
                                  className="px-2.5 py-1 bg-[#FAFAFA] hover:bg-[#F2F2F2] border border-[#DBDBDB] text-[#262626] rounded-lg text-[10px] font-semibold transition flex items-center gap-1 cursor-pointer"
                                  title="Auditable Correction: Reverse this decision back to pending"
                                >
                                  <RotateCcw size={11} /> Reverse
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* 3. Published Fundraising Campaigns */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#262626] flex items-center gap-2">
              <Target size={16} className="text-[#DD2A7B]" />
              Fundraising Campaigns & Public Programs
            </h2>
            <p className="text-xs text-[#737373]">
              Approved programs including community aid, capital projects, retreats, picnics, and endowments.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" />
            <input
              type="text"
              value={campaignSearchQuery}
              onChange={e => setCampaignSearchQuery(e.target.value)}
              placeholder="Search by title, organizer, or topic..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#DBDBDB] rounded-xl text-[#262626] focus:outline-none focus:border-[#DD2A7B] transition"
            />
            {campaignSearchQuery && (
              <button
                onClick={() => setCampaignSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#262626] cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Dual Filter Bars: Status Tabs + Category Pills */}
        <div className="space-y-2 pt-1">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
              <Filter size={11} /> Status:
            </span>
            {(['all', 'active', 'closed', 'expired', 'archived'] as const).map(st => {
              const count = campaigns.filter(c => {
                if (st === 'all') return true;
                return getEffectiveCampaignStatus(c) === st;
              }).length;

              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-xl font-semibold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === st
                      ? 'bg-[#262626] text-white shadow-xs'
                      : 'bg-white text-[#737373] hover:text-[#262626] border border-[#DBDBDB]'
                  }`}
                >
                  <span className="capitalize">{st}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    statusFilter === st ? 'bg-white/20 text-white' : 'bg-[#FAFAFA] text-[#737373] border border-[#DBDBDB]'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider mr-1 shrink-0">
              Category:
            </span>
            {['all', 'community', 'picnic', 'club', 'event', 'relief', 'general'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-0.5 rounded-full text-[11px] font-semibold transition whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#DD2A7B] text-white shadow-xs'
                    : 'bg-white text-[#737373] hover:text-[#262626] border border-[#DBDBDB]'
                }`}
              >
                {cat === 'all' ? `All Categories` : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Campaign Cards Grid */}
        {filteredCampaigns.length === 0 ? (
          <div className="bg-white border border-[#DBDBDB] rounded-2xl p-8 text-center space-y-2">
            <AlertCircle size={28} className="mx-auto text-[#737373]" />
            <h3 className="text-sm font-bold text-[#262626]">No campaigns match your filter criteria</h3>
            <p className="text-xs text-[#737373] max-w-sm mx-auto">
              Try selecting a different status tab or clearing your search term to see other campaigns.
            </p>
            <button
              onClick={() => {
                setStatusFilter('all');
                setSelectedCategory('all');
                setCampaignSearchQuery('');
              }}
              className="mt-2 px-3 py-1.5 bg-[#FAFAFA] hover:bg-[#F2F2F2] border border-[#DBDBDB] text-xs font-semibold rounded-xl text-[#262626] cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCampaigns.map(camp => {
              const isSelected = camp.id === selectedCampaignId;
              const target = camp.targetAmount || 0;
              const progress = target > 0 ? Math.min(100, Math.round((camp.collectedAmount / target) * 100)) : 100;
              const remaining = Math.max(0, target - camp.collectedAmount);
              const campConfirmedCount = donations.filter(
                d => d.campaignId === camp.id && (d.status === 'confirmed' || d.status === 'verified')
              ).length;
              const catMeta = categoryLabels[camp.category] || categoryLabels.general;

              const effectiveStatus = getEffectiveCampaignStatus(camp);
              const acceptsDonations = canCampaignAcceptDonations(camp);
              const canEdit = canUserEditCampaign(camp, currentUser, isSystemController, callerLimits);
              const canDelete = canUserDeleteCampaign(camp, currentUser, isSystemController, permissionMatrix);
              const canManage = canUserManageCampaignStatus(camp, currentUser, isSystemController, callerLimits);
              const financialReport = checkCampaignFinancialRecords(camp.id, donations);

              return (
                <div
                  key={camp.id}
                  onClick={() => setSelectedCampaignId(camp.id)}
                  className={`p-5 rounded-2xl border transition flex flex-col justify-between cursor-pointer ${
                    isSelected 
                      ? 'bg-white border-[#DD2A7B] shadow-md ring-1 ring-[#DD2A7B]/20' 
                      : 'bg-white border-[#DBDBDB] hover:border-[#A8A8A8] shadow-xs'
                  }`}
                >
                  <div>
                    {/* Top Tags & Status */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${catMeta.color}`}>
                        {catMeta.label}
                      </span>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {/* Effective Status Badge */}
                        {effectiveStatus === 'active' && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                            ACTIVE
                          </span>
                        )}
                        {effectiveStatus === 'closed' && (
                          <span className="text-[10px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full font-bold border border-slate-300">
                            CLOSED
                          </span>
                        )}
                        {effectiveStatus === 'expired' && (
                          <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full font-bold border border-amber-300">
                            EXPIRED
                          </span>
                        )}
                        {effectiveStatus === 'archived' && (
                          <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-bold border border-purple-200">
                            ARCHIVED
                          </span>
                        )}

                        {isSelected && (
                          <span className="text-[10px] font-bold bg-[#DD2A7B] text-white px-2 py-0.5 rounded-full">
                            Selected
                          </span>
                        )}
                      </div>
                    </div>

                    {camp.imageUrl && (
                      <div className="mb-3 rounded-xl overflow-hidden max-h-48 bg-[#FAFAFA] border border-[#DBDBDB]/60">
                        <img 
                          src={camp.imageUrl} 
                          alt={camp.title} 
                          className="w-full h-36 sm:h-44 object-cover" 
                        />
                      </div>
                    )}

                    <h3 className="text-base font-bold text-[#262626] mb-1.5 leading-snug">{camp.title}</h3>
                    <p className="text-xs text-[#737373] leading-relaxed mb-3 line-clamp-3">
                      {camp.description}
                    </p>

                    {/* Organizer & Deadline Details */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-[#737373] bg-[#FAFAFA] p-2.5 rounded-xl border border-[#DBDBDB] mb-3">
                      <div>
                        <span className="text-[#737373] block text-[9px] uppercase font-bold">Organizer</span>
                        <div className="flex items-center gap-1 min-w-0 flex-wrap">
                          <span className="font-semibold text-[#262626] truncate block">{camp.organizerName}</span>
                          <VerifiedBadge userId={camp.organizerId} size="xs" />
                        </div>
                      </div>
                      <div>
                        <span className="text-[#737373] block text-[9px] uppercase font-bold">Deadline</span>
                        <span className={`font-mono font-semibold ${effectiveStatus === 'expired' ? 'text-amber-800' : 'text-[#DD2A7B]'}`}>
                          {camp.deadline || 'Ongoing'}
                          {effectiveStatus === 'expired' && ' (Ended)'}
                        </span>
                      </div>
                    </div>

                    {/* Audit Metadata Indicators (Notes, Closure, Archive reasons) */}
                    {(camp.lastEditNote || camp.closedReason || camp.archivedReason) && (
                      <div className="mb-3 space-y-1 text-[10px] bg-[#FAFAFA] border border-[#DBDBDB] p-2 rounded-xl">
                        {camp.lastEditNote && (
                          <div className="text-[#737373] flex items-center gap-1 truncate">
                            <Info size={11} className="text-[#DD2A7B] shrink-0" />
                            <span><strong>Edit Note:</strong> {camp.lastEditNote}</span>
                          </div>
                        )}
                        {camp.closedReason && (
                          <div className="text-slate-700 flex items-center gap-1 truncate">
                            <Lock size={11} className="text-slate-600 shrink-0" />
                            <span><strong>Closed:</strong> {camp.closedReason}</span>
                          </div>
                        )}
                        {camp.archivedReason && (
                          <div className="text-purple-700 flex items-center gap-1 truncate">
                            <Archive size={11} className="text-purple-600 shrink-0" />
                            <span><strong>Archived:</strong> {camp.archivedReason}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* bKash & Nagad Numbers with Copy Buttons */}
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center justify-between text-xs bg-[#FAFAFA] p-2 rounded-lg border border-[#DBDBDB]">
                        <span className="font-semibold text-[#E2136E]">bKash:</span>
                        <span className="font-mono text-[#262626] text-[11px]">{camp.bkashNumber}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(camp.bkashNumber.split(' ')[0], `bkash_${camp.id}`);
                          }}
                          className="text-[10px] text-[#262626] px-1.5 py-0.5 rounded bg-white border border-[#DBDBDB] cursor-pointer"
                        >
                          {copiedText === `bkash_${camp.id}` ? 'Copied' : 'Copy'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs bg-[#FAFAFA] p-2 rounded-lg border border-[#DBDBDB]">
                        <span className="font-semibold text-[#F7941D]">Nagad:</span>
                        <span className="font-mono text-[#262626] text-[11px]">{camp.nagadNumber}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(camp.nagadNumber.split(' ')[0], `nagad_${camp.id}`);
                          }}
                          className="text-[10px] text-[#262626] px-1.5 py-0.5 rounded bg-white border border-[#DBDBDB] cursor-pointer"
                        >
                          {copiedText === `nagad_${camp.id}` ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Financial Progress Meter with Instagram Gradient */}
                  <div className="space-y-2 pt-3 border-t border-[#DBDBDB]">
                    <div className="flex justify-between items-baseline text-xs">
                      <div>
                        <span className="text-emerald-700 font-mono font-bold text-sm">
                          {camp.collectedAmount.toLocaleString()} BDT
                        </span>
                        <span className="text-[10px] text-[#737373] ml-1">Confirmed</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#DD2A7B] font-bold text-xs">{progress}%</span>
                        {target > 0 && (
                          <span className="text-[10px] text-[#737373] ml-1">
                            of {target.toLocaleString()} BDT
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="w-full bg-[#FAFAFA] h-2.5 rounded-full overflow-hidden border border-[#DBDBDB]">
                      <div 
                        className="bg-gradient-to-r from-[#FCAF45] via-[#DD2A7B] to-[#8134AF] h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-[#737373] font-mono">
                      <span>Remaining: {remaining.toLocaleString()} BDT</span>
                      <span>{campConfirmedCount} certified gifts</span>
                    </div>

                    {/* Operational Management Action Toolbar for Authorized Coordinators */}
                    {(canEdit || canManage || canDelete) && (
                      <div 
                        className="pt-3 mt-2 border-t border-dashed border-[#DBDBDB] flex items-center justify-between gap-1.5 flex-wrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(camp)}
                              className="px-2.5 py-1 bg-white hover:bg-[#FAFAFA] border border-[#DBDBDB] text-[#262626] rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Edit campaign parameters, deadline, or financial targets"
                            >
                              <Edit3 size={11} className="text-[#DD2A7B]" /> Edit
                            </button>
                          )}

                          {canManage && effectiveStatus === 'active' && (
                            <button
                              onClick={() => {
                                setClosingCampaign(camp);
                                setCloseReason('');
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Close campaign and disable new donations"
                            >
                              <Lock size={11} className="text-slate-600" /> Close
                            </button>
                          )}

                          {canManage && (effectiveStatus === 'closed' || effectiveStatus === 'expired') && (
                            <button
                              onClick={() => {
                                setReopeningCampaign(camp);
                                setReopenDeadline(camp.deadline || '');
                                setReopenReason('');
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-700 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Reopen campaign for new member contributions"
                            >
                              <Unlock size={11} className="text-emerald-600" /> Reopen
                            </button>
                          )}

                          {canManage && effectiveStatus !== 'archived' && (
                            <button
                              onClick={() => {
                                setArchivingCampaign(camp);
                                setArchiveReason('');
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-purple-50 border border-purple-200 text-purple-700 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Archive campaign (preserves all transactions safely)"
                            >
                              <Archive size={11} className="text-purple-600" /> Archive
                            </button>
                          )}
                        </div>

                        {canDelete && (
                          <button
                            onClick={() => {
                              setDeletingCampaign(camp);
                              setDeleteReason('');
                              setDeleteError('');
                            }}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                            title={financialReport.hasRecords ? "Protected: Financial safeguard will prevent deletion" : "Delete campaign (0 financial records)"}
                          >
                            <Trash2 size={11} className="text-red-600" /> Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Payment Submission Form & Official Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step-by-Step Payment Instructions */}
        <div className="lg:col-span-5 bg-white border border-[#DBDBDB] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-[#262626]">
            <CreditCard size={18} className="text-[#DD2A7B]" />
            Official Send Money Instructions
          </div>

          <p className="text-xs text-[#737373] leading-relaxed">
            Follow these verified steps to contribute to the selected campaign: <strong>{activeCampaign.title}</strong>.
          </p>

          <div className="space-y-3">
            {/* bKash Instructions */}
            <div className={`p-4 rounded-xl border transition ${method === 'bKash' ? 'bg-pink-50/50 border-[#E2136E]/40' : 'bg-[#FAFAFA] border-[#DBDBDB]'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-[#E2136E] uppercase tracking-wider">bKash Send Money</span>
                <button
                  onClick={() => handleCopy(activeCampaign.bkashNumber.split(' ')[0], 'bkash_panel')}
                  className="text-xs text-[#262626] flex items-center gap-1 bg-white border border-[#DBDBDB] px-2 py-0.5 rounded cursor-pointer"
                >
                  {copiedText === 'bkash_panel' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copiedText === 'bkash_panel' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="font-mono text-sm font-bold text-[#262626]">{activeCampaign.bkashNumber}</div>
              <div className="text-[11px] text-[#737373] mt-1">Open bKash App &gt; Send Money &gt; Enter Amount &gt; Save Transaction ID (TrxID).</div>
            </div>

            {/* Nagad Instructions */}
            <div className={`p-4 rounded-xl border transition ${method === 'Nagad' ? 'bg-orange-50/50 border-[#F7941D]/40' : 'bg-[#FAFAFA] border-[#DBDBDB]'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-[#F7941D] uppercase tracking-wider">Nagad Send Money</span>
                <button
                  onClick={() => handleCopy(activeCampaign.nagadNumber.split(' ')[0], 'nagad_panel')}
                  className="text-xs text-[#262626] flex items-center gap-1 bg-white border border-[#DBDBDB] px-2 py-0.5 rounded cursor-pointer"
                >
                  {copiedText === 'nagad_panel' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copiedText === 'nagad_panel' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="font-mono text-sm font-bold text-[#262626]">{activeCampaign.nagadNumber}</div>
              <div className="text-[11px] text-[#737373] mt-1">Open Nagad App &gt; Send Money &gt; Enter Amount &gt; Note your SMS TrxID.</div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-800 flex items-start gap-2.5">
            <ShieldAlert size={16} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block mb-0.5">Strict Security Rule:</strong>
              Never enter or share your bKash/Nagad PIN, OTP, or passwords. The community platform only requests the public Transaction ID for bank reconciliation.
            </div>
          </div>
        </div>

        {/* Donation Submission Form */}
        <div className="lg:col-span-7 bg-white border border-[#DBDBDB] rounded-2xl p-5 sm:p-6 shadow-xs">
          <h2 className="text-sm font-bold text-[#262626] mb-3 flex items-center gap-2">
            <FileText size={16} className="text-[#DD2A7B]" />
            Submit Transaction for Verification
          </h2>
          <p className="text-xs text-[#737373] mb-4">
            Submissions are queued for administrator verification against bank statements before certification.
          </p>

          {(() => {
            const activeEffectiveStatus = activeCampaign ? getEffectiveCampaignStatus(activeCampaign) : 'closed';
            const activeAcceptsDonations = activeCampaign ? canCampaignAcceptDonations(activeCampaign) : false;

            return (
              <>
                {!activeAcceptsDonations && (
                  <div className="mb-4 bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                    <Lock size={16} className="text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>Donations Closed ({activeEffectiveStatus.toUpperCase()})</span>
                      </div>
                      <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                        {activeEffectiveStatus === 'expired'
                          ? 'This campaign has passed its closing deadline date. In accordance with community financial controls, new payment submissions and pledges are locked.'
                          : activeEffectiveStatus === 'closed'
                          ? 'This campaign was officially closed by campaign administration. New pledges are not being accepted.'
                          : 'This campaign is currently archived and inactive. Historical transactions remain viewable in the audit ledger.'}
                      </p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#262626] block mb-1">
                      Designated Campaign
                    </label>
                    <select
                      value={selectedCampaignId}
                      onChange={e => setSelectedCampaignId(e.target.value)}
                      className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none"
                    >
                      {campaigns.map(c => {
                        const st = getEffectiveCampaignStatus(c);
                        return (
                          <option key={c.id} value={c.id}>
                            {c.title} • [{st.toUpperCase()}]
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <fieldset disabled={!activeAcceptsDonations} className="space-y-4 disabled:opacity-60">
                    <div>
                      <label className="text-xs font-semibold text-[#262626] block mb-1.5">Payment Method</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(['bKash', 'Nagad', 'Rocket', 'Bank'] as DonationMethod[]).map(m => (
                          <button
                            key={m}
                            type="button"
                            disabled={!activeAcceptsDonations}
                            onClick={() => setMethod(m)}
                            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                              method === m 
                                ? 'bg-[#DD2A7B] text-white border-[#DD2A7B] shadow-xs' 
                                : 'bg-[#FAFAFA] text-[#737373] border-[#DBDBDB] hover:text-[#262626]'
                            }`}
                          >
                            <span>{m}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-[#262626] block mb-1">
                          Amount Contributed (BDT)
                        </label>
                        <input
                          type="number"
                          min="10"
                          step="100"
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                          required
                          disabled={!activeAcceptsDonations}
                          placeholder="e.g. 5000"
                          className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-sm text-[#262626] font-mono focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[#262626] block mb-1">
                          Sender Mobile Number
                        </label>
                        <input
                          type="tel"
                          value={mobile}
                          onChange={e => setMobile(e.target.value)}
                          required
                          disabled={!activeAcceptsDonations}
                          placeholder="01XXXXXXXXX"
                          className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-sm text-[#262626] font-mono focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-[#262626] block mb-1">
                          Transaction Reference (TrxID)
                        </label>
                        <input
                          type="text"
                          value={transactionId}
                          onChange={e => setTransactionId(e.target.value.toUpperCase())}
                          required
                          disabled={!activeAcceptsDonations}
                          placeholder="e.g. 9K4M82PQ10"
                          className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-sm text-[#262626] font-mono uppercase focus:outline-none tracking-wider"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[#262626] block mb-1">
                          Payment Date
                        </label>
                        <input
                          type="date"
                          value={paymentDate}
                          onChange={e => setPaymentDate(e.target.value)}
                          required
                          disabled={!activeAcceptsDonations}
                          className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#262626] block mb-1">
                        Dedication Note (Optional)
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        disabled={!activeAcceptsDonations}
                        placeholder="e.g. Family donation / Picnic seat (2 adults, 1 child)"
                        className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#262626] block mb-1 flex items-center gap-1.5">
                        <ImageIcon size={13} className="text-[#DD2A7B]" />
                        <span>Upload Payment Slip (Optional)</span>
                      </label>
                      <div className="bg-[#FAFAFA] p-3 rounded-xl border border-[#DBDBDB]">
                        <ImageUploadPicker
                          images={evidenceImages}
                          onChange={setEvidenceImages}
                          maxImages={1}
                        />
                      </div>
                    </div>
                  </fieldset>

                  {errorMsg && (
                    <div className="text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl flex items-center gap-2">
                      <AlertCircle size={14} /> {errorMsg}
                    </div>
                  )}

                  {successMsg && (
                    <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2.5 rounded-xl flex items-center gap-2">
                      <CheckCircle2 size={14} /> {successMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !canDonate || !activeAcceptsDonations}
                    className="w-full py-3 bg-[#DD2A7B] hover:bg-[#C9226C] disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowUpRight size={16} />
                    {isSubmitting 
                      ? 'Submitting Payment...' 
                      : !activeAcceptsDonations 
                      ? `Donation Closed (${activeEffectiveStatus.toUpperCase()})` 
                      : 'Submit Transaction ID for Verification'}
                  </button>
                </form>
              </>
            );
          })()}
        </div>
      </div>

      {/* 5. Member Personal Donation Ledger */}
      <div className="bg-white border border-[#DBDBDB] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-[#262626] flex items-center gap-2">
              <Clock size={16} className="text-[#DD2A7B]" />
              Your Personal Contribution Records
            </h2>
            <p className="text-xs text-[#737373]">
              Audited history of your submissions and real-time status updates.
            </p>
          </div>
          <span className="text-xs text-[#737373]">
            {userDonations.length} personal submissions
          </span>
        </div>

        {userDonations.length === 0 ? (
          <div className="text-center py-8 text-[#737373] text-xs bg-[#FAFAFA] rounded-xl border border-[#DBDBDB]">
            You haven't submitted any contribution records yet. Use the form above to participate in active campaigns.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#DBDBDB] bg-[#FAFAFA] text-[#737373] uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Campaign</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Trx ID</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Reviewer Certification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DBDBDB]/60 text-[#262626]">
                {userDonations.map(don => {
                  const isConfirmed = don.status === 'confirmed' || don.status === 'verified';
                  return (
                    <tr key={don.id} className="hover:bg-[#FAFAFA] transition">
                      <td className="py-3 px-3 text-[#737373] whitespace-nowrap">
                        {don.paymentDate || new Date(don.submittedAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-3 font-medium text-[#262626] max-w-xs truncate">
                        {don.campaignTitle}
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          don.method === 'bKash' ? 'bg-[#E2136E]/15 text-[#E2136E]' :
                          don.method === 'Nagad' ? 'bg-[#F7941D]/15 text-[#F7941D]' :
                          'bg-purple-50 text-purple-700'
                        }`}>
                          {don.method}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-[#262626]">
                        {don.transactionId}
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {don.amount.toLocaleString()} BDT
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {isConfirmed && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                            <CheckCircle2 size={11} /> Confirmed
                          </span>
                        )}
                        {don.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">
                            <Clock size={11} /> Pending Review
                          </span>
                        )}
                        {don.status === 'disputed' && (
                          <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-bold">
                            <AlertTriangle size={11} /> Disputed
                          </span>
                        )}
                        {don.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[10px] font-bold">
                            <XCircle size={11} /> Rejected
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-[#737373] text-[11px]">
                        <div className="flex items-center justify-between gap-2">
                          <span>
                            {isConfirmed ? (
                              <span className="text-emerald-800 inline-flex items-center gap-1 flex-wrap">
                                <span>Certified by {don.reviewedByName || 'Authorized Reviewer'}</span>
                                <VerifiedBadge userId={don.reviewedBy || undefined} size="xs" />
                                {don.reviewNotes && ` • ${don.reviewNotes}`}
                              </span>
                            ) : don.status === 'rejected' ? (
                              <span className="text-red-700">{don.rejectionReason}</span>
                            ) : don.status === 'disputed' ? (
                              <span className="text-purple-700">{don.disputeReason}</span>
                            ) : (
                              <span className="text-[#737373]">In reconciliation queue</span>
                            )}
                          </span>

                          {don.paymentEvidenceUrl && (
                            <button
                              onClick={() => setViewingEvidenceUrl(don.paymentEvidenceUrl!)}
                              className="px-2 py-0.5 rounded bg-pink-50 hover:bg-pink-100 text-[#DD2A7B] text-[10px] font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap border border-pink-200"
                            >
                              <ImageIcon size={11} /> View Slip
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reviewer Action Modal */}
      {reviewModalDonation && actionType && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#DBDBDB] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#DBDBDB]">
              <h3 className="text-sm font-bold text-[#262626] capitalize flex items-center gap-2">
                {actionType === 'confirm' && <CheckCircle2 size={16} className="text-emerald-600" />}
                {actionType === 'reject' && <XCircle size={16} className="text-red-600" />}
                {actionType === 'dispute' && <AlertTriangle size={16} className="text-purple-600" />}
                {actionType === 'reverse' && <RotateCcw size={16} className="text-amber-600" />}
                {actionType === 'confirm' ? 'Confirm Payment' :
                 actionType === 'reject' ? 'Reject Submission' :
                 actionType === 'dispute' ? 'Flag Payment Dispute' : 'Reverse Verification Status'}
              </h3>
              <button
                onClick={() => {
                  setReviewModalDonation(null);
                  setActionType(null);
                }}
                className="text-[#737373] hover:text-[#262626]"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#FAFAFA] p-3 rounded-xl border border-[#DBDBDB] space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#737373]">Donor:</span>
                <span className="font-semibold text-[#262626]">{reviewModalDonation.donorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">TrxID:</span>
                <span className="font-mono font-bold text-[#262626]">{reviewModalDonation.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Amount:</span>
                <span className="font-mono font-bold text-emerald-700">{reviewModalDonation.amount.toLocaleString()} BDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Campaign:</span>
                <span className="text-[#262626] truncate max-w-[200px]">{reviewModalDonation.campaignTitle}</span>
              </div>
            </div>

            <form onSubmit={handleExecuteReviewAction} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#262626] block mb-1">
                  {actionType === 'confirm' ? 'Verification Note:' :
                   actionType === 'reject' ? 'Reason for Rejection:' :
                   actionType === 'dispute' ? 'Dispute Details:' : 'Reason for Correction:'}
                </label>
                <textarea
                  rows={3}
                  required={actionType !== 'confirm'}
                  value={actionReason}
                  onChange={e => setActionReason(e.target.value)}
                  placeholder={
                    actionType === 'confirm' ? 'e.g. Verified against bank statement' :
                    actionType === 'reject' ? 'e.g. Transaction ID was not found in statement' :
                    actionType === 'dispute' ? 'e.g. Discrepancy between stated amount and SMS' :
                    'e.g. Reversing verification for correction'
                  }
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] rounded-xl p-2.5 text-xs text-[#262626] focus:outline-none focus:border-[#DD2A7B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DBDBDB]">
                <button
                  type="button"
                  onClick={() => {
                    setReviewModalDonation(null);
                    setActionType(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#EFEFEF] hover:bg-[#DBDBDB] text-[#262626] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold text-white transition ${
                    actionType === 'confirm' ? 'bg-emerald-600 hover:bg-emerald-700' :
                    actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                    actionType === 'dispute' ? 'bg-purple-600 hover:bg-purple-700' :
                    'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  Confirm Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateCampaignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#DBDBDB] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#DBDBDB]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-pink-50 text-[#DD2A7B] flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#262626]">Launch Campaign</h3>
                  <p className="text-[10px] text-[#737373]">Create an official community fundraising cause</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateCampaignModal(false)}
                className="text-[#737373] hover:text-[#262626] cursor-pointer"
              >
                <XCircle size={18} />
              </button>
            </div>

            {createCampaignError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{createCampaignError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCampaignSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#262626] block mb-1">Campaign Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Annual Family Gala & Fellowship Fund 2026"
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#262626] block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as CampaignCategory)}
                    className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none"
                  >
                    <option value="community">Community STEM & Aid</option>
                    <option value="club">Club House & Capital</option>
                    <option value="picnic">Picnic & Fellowship</option>
                    <option value="event">Gala & Banquet</option>
                    <option value="relief">Emergency Relief Drive</option>
                    <option value="general">General Fund</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#262626] block mb-1">Target Amount (BDT) *</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={1000}
                    value={newTarget}
                    onChange={e => setNewTarget(e.target.value)}
                    placeholder="250000"
                    className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#262626] block mb-1">Purpose & Description *</label>
                <textarea
                  rows={3}
                  required
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Detail the objectives and allocation of funds..."
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl p-2.5 text-xs text-[#262626] focus:outline-none resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#262626]">
                    Campaign Banner / Photo (Optional)
                  </label>
                  <span className="text-[10px] text-[#737373]">
                    Gallery or Camera • Max 5MB
                  </span>
                </div>
                <p className="text-[11px] text-[#737373] mb-2 leading-relaxed">
                  Select an image directly from your mobile gallery or device. If skipped, the campaign will publish with a clean text-first design.
                </p>
                <ImageUploadPicker
                  images={newCampaignImages}
                  onChange={setNewCampaignImages}
                  maxImages={1}
                  maxSizeBytes={5 * 1024 * 1024}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#262626] block mb-1">bKash Account Number *</label>
                  <input
                    type="text"
                    required
                    value={newBkash}
                    onChange={e => setNewBkash(e.target.value)}
                    placeholder="01711-000001 (Send Money)"
                    className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#262626] block mb-1">Nagad Account Number *</label>
                  <input
                    type="text"
                    required
                    value={newNagad}
                    onChange={e => setNewNagad(e.target.value)}
                    placeholder="01819-223344 (Send Money)"
                    className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#262626] block mb-1">Closing Deadline (Optional)</label>
                <input
                  type="date"
                  value={newDeadline}
                  onChange={e => setNewDeadline(e.target.value)}
                  className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DBDBDB]">
                <button
                  type="button"
                  onClick={() => setShowCreateCampaignModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#EFEFEF] hover:bg-[#DBDBDB] text-[#262626] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCampaign}
                  className="px-5 py-2 rounded-xl bg-[#DD2A7B] hover:bg-[#C9226C] disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus size={14} />
                  {isCreatingCampaign ? 'Launching...' : 'Publish Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* EDIT CAMPAIGN MODAL WITH 2-STEP DIFF & CONFIRMATION REVIEW     */}
      {/* ============================================================== */}
      {editingCampaign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-xl border border-[#DBDBDB] my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#DBDBDB]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-pink-50 text-[#DD2A7B] flex items-center justify-center">
                  <Edit3 size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#262626]">
                    {editStep === 'form' ? 'Edit Campaign Details' : 'Review & Confirm Changes'}
                  </h3>
                  <p className="text-[10px] text-[#737373]">
                    {editStep === 'form'
                      ? 'Update parameters, targets, deadlines, and payment channels'
                      : 'Audit preview of modifications before updating live records'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingCampaign(null)}
                className="text-[#737373] hover:text-[#262626] cursor-pointer"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Error notifications */}
            {editErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>Please resolve the following issues:</span>
                </div>
                <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                  {editErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* STEP 1: FORM EDITING */}
            {editStep === 'form' ? (
              <form onSubmit={handleProceedToReview} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-[#262626] block mb-1">Campaign Title *</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#262626] block mb-1">Category</label>
                    <select
                      value={editCategory}
                      onChange={e => setEditCategory(e.target.value as CampaignCategory)}
                      className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none"
                    >
                      <option value="community">Community STEM & Aid</option>
                      <option value="club">Club House & Capital</option>
                      <option value="picnic">Picnic & Fellowship</option>
                      <option value="event">Gala & Banquet</option>
                      <option value="relief">Emergency Relief Drive</option>
                      <option value="general">General Fund</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#262626] block mb-1">Target Amount (BDT) *</label>
                    <input
                      type="number"
                      required
                      min={1000}
                      step={1000}
                      value={editTarget}
                      onChange={e => setEditTarget(e.target.value)}
                      className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none font-mono"
                    />
                    <span className="text-[10px] text-[#737373] mt-0.5 block">
                      Collected funds ({editingCampaign.collectedAmount.toLocaleString()} BDT) remain protected.
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#262626] block mb-1">Purpose & Description *</label>
                  <textarea
                    rows={3}
                    required
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl p-2.5 text-xs text-[#262626] focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#262626]">
                      Campaign Image / Banner
                    </label>
                    <span className="text-[10px] text-[#737373]">
                      Max 1 Photo
                    </span>
                  </div>
                  <ImageUploadPicker
                    images={editImages}
                    onChange={setEditImages}
                    maxImages={1}
                    maxSizeBytes={5 * 1024 * 1024}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#262626] block mb-1">bKash Account Number *</label>
                    <input
                      type="text"
                      required
                      value={editBkash}
                      onChange={e => setEditBkash(e.target.value)}
                      className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#262626] block mb-1">Nagad Account Number *</label>
                    <input
                      type="text"
                      required
                      value={editNagad}
                      onChange={e => setEditNagad(e.target.value)}
                      className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#262626] block mb-1">
                    Donation Instructions & Guidelines (Optional)
                  </label>
                  <input
                    type="text"
                    value={editInstructions}
                    onChange={e => setEditInstructions(e.target.value)}
                    placeholder="e.g. Include your graduation year in the bKash reference"
                    className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#262626] block mb-1">Start Date</label>
                    <input
                      type="date"
                      value={editStartDate}
                      onChange={e => setEditStartDate(e.target.value)}
                      className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#262626] block mb-1">Closing Deadline</label>
                    <input
                      type="date"
                      value={editDeadline}
                      onChange={e => setEditDeadline(e.target.value)}
                      className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#262626] block mb-1">Status</label>
                    <select
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value as CampaignStatus)}
                      className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none font-bold"
                    >
                      <option value="active">Active (Accepting Pledges)</option>
                      <option value="closed">Closed (Donations Locked)</option>
                      <option value="archived">Archived (Soft Hidden)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DBDBDB]">
                  <button
                    type="button"
                    onClick={() => setEditingCampaign(null)}
                    className="px-4 py-2 rounded-xl bg-[#EFEFEF] hover:bg-[#DBDBDB] text-[#262626] text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#DD2A7B] hover:bg-[#C9226C] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>Review & Confirm Changes</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </form>
            ) : (
              /* STEP 2: REVIEW & CONFIRMATION DIFF */
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2">
                  <Info size={16} className="text-blue-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>Confirmation Review:</strong> Please examine the changes below. Once confirmed, these details will immediately update across campaign details, the social feed post, and donation submission pages.
                  </div>
                </div>

                {/* Diff table */}
                <div className="border border-[#DBDBDB] rounded-xl overflow-hidden text-xs">
                  <div className="bg-[#FAFAFA] px-3.5 py-2 border-b border-[#DBDBDB] font-bold text-[#262626] flex items-center justify-between">
                    <span>Field</span>
                    <span>Proposed Modification</span>
                  </div>
                  <div className="divide-y divide-[#DBDBDB]">
                    {editTitle !== editingCampaign.title && (
                      <div className="p-3 bg-white space-y-1">
                        <span className="font-bold text-[#737373] text-[10px] uppercase">Title:</span>
                        <div className="text-red-700 line-through text-[11px]">{editingCampaign.title}</div>
                        <div className="text-emerald-700 font-semibold">{editTitle}</div>
                      </div>
                    )}

                    {parseFloat(editTarget) !== (editingCampaign.targetAmount || 0) && (
                      <div className="p-3 bg-white space-y-1">
                        <span className="font-bold text-[#737373] text-[10px] uppercase">Target Amount:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-red-700 line-through font-mono">
                            {(editingCampaign.targetAmount || 0).toLocaleString()} BDT
                          </span>
                          <span>&rarr;</span>
                          <span className="text-emerald-700 font-mono font-bold">
                            {parseFloat(editTarget).toLocaleString()} BDT
                          </span>
                        </div>
                      </div>
                    )}

                    {editCategory !== editingCampaign.category && (
                      <div className="p-3 bg-white space-y-1">
                        <span className="font-bold text-[#737373] text-[10px] uppercase">Category:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-red-700 line-through">{editingCampaign.category}</span>
                          <span>&rarr;</span>
                          <span className="text-emerald-700 font-bold">{editCategory}</span>
                        </div>
                      </div>
                    )}

                    {editDeadline !== (editingCampaign.deadline || '') && (
                      <div className="p-3 bg-white space-y-1">
                        <span className="font-bold text-[#737373] text-[10px] uppercase">Closing Deadline:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-red-700 line-through font-mono">
                            {editingCampaign.deadline || 'None'}
                          </span>
                          <span>&rarr;</span>
                          <span className="text-emerald-700 font-mono font-bold">
                            {editDeadline || 'None'}
                          </span>
                        </div>
                      </div>
                    )}

                    {(editBkash !== editingCampaign.bkashNumber || editNagad !== editingCampaign.nagadNumber) && (
                      <div className="p-3 bg-white space-y-1">
                        <span className="font-bold text-[#737373] text-[10px] uppercase">Payment Accounts:</span>
                        <div className="text-xs space-y-0.5">
                          {editBkash !== editingCampaign.bkashNumber && (
                            <div>bKash: <span className="font-mono font-bold">{editBkash}</span></div>
                          )}
                          {editNagad !== editingCampaign.nagadNumber && (
                            <div>Nagad: <span className="font-mono font-bold">{editNagad}</span></div>
                          )}
                        </div>
                      </div>
                    )}

                    {editStatus !== editingCampaign.status && (
                      <div className="p-3 bg-white space-y-1">
                        <span className="font-bold text-[#737373] text-[10px] uppercase">Status:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-red-700 line-through uppercase font-bold">{editingCampaign.status}</span>
                          <span>&rarr;</span>
                          <span className="text-emerald-700 uppercase font-bold">{editStatus}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Guarantee Reminder */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start gap-2">
                  <ShieldCheck size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>Financial Integrity Guarantee:</strong>
                    <div className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                      Actual collected funds of <strong>{editingCampaign.collectedAmount.toLocaleString()} BDT</strong> and all existing donor submission records remain 100% intact and audited.
                    </div>
                  </div>
                </div>

                {/* Audit Reason Input */}
                <div>
                  <label className="text-xs font-semibold text-[#262626] block mb-1">
                    Audit Log Reason / Edit Note *
                  </label>
                  <input
                    type="text"
                    value={editReason}
                    onChange={e => setEditReason(e.target.value)}
                    placeholder="e.g. Adjusted deadline and updated target amount for picnic"
                    className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none"
                  />
                  <span className="text-[10px] text-[#737373] mt-0.5 block">
                    Recorded in the Association Audit Log with your admin timestamp.
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#DBDBDB]">
                  <button
                    type="button"
                    onClick={() => setEditStep('form')}
                    className="px-4 py-2 rounded-xl bg-[#EFEFEF] hover:bg-[#DBDBDB] text-[#262626] text-xs font-semibold cursor-pointer"
                  >
                    Back to Edit
                  </button>
                  <button
                    type="button"
                    disabled={isSavingEdit}
                    onClick={handleConfirmSaveEdit}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 size={14} />
                    {isSavingEdit ? 'Saving Changes...' : 'Confirm & Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DELETE CAMPAIGN / FINANCIAL INTEGRITY SAFEGUARD MODAL          */}
      {/* ============================================================== */}
      {deletingCampaign && (() => {
        const report = checkCampaignFinancialRecords(deletingCampaign.id, donations);

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-xl border border-[#DBDBDB]">
              {report.hasRecords ? (
                /* Financial Protection Shielded View: PERMANENT DELETE BLOCKED */
                <>
                  <div className="flex items-center gap-3 pb-3 border-b border-[#DBDBDB]">
                    <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                      <ShieldAlert size={22} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-red-800">
                        Financial Record Protection: Deletion Blocked
                      </h3>
                      <p className="text-[11px] text-[#737373]">
                        Permanent deletion is strictly prohibited by financial integrity controls.
                      </p>
                    </div>
                  </div>

                  <div className="bg-red-50/70 border border-red-200 rounded-xl p-3.5 space-y-2 text-xs text-red-900">
                    <p className="font-semibold leading-relaxed">
                      Campaign "<strong>{deletingCampaign.title}</strong>" has active financial ledger entries.
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                      <div className="bg-white/80 p-2 rounded-lg border border-red-200/60">
                        <div className="text-[10px] text-red-700 uppercase font-sans font-bold">Confirmed Total</div>
                        <div className="text-sm font-black text-emerald-800">{report.totalCollectedBdt.toLocaleString()} BDT</div>
                        <div className="text-[10px] text-[#737373]">{report.confirmedCount} verified gifts</div>
                      </div>
                      <div className="bg-white/80 p-2 rounded-lg border border-red-200/60">
                        <div className="text-[10px] text-red-700 uppercase font-sans font-bold">Total Transactions</div>
                        <div className="text-sm font-black text-[#262626]">{report.totalRecords} records</div>
                        <div className="text-[10px] text-[#737373]">{report.pendingCount} pending review</div>
                      </div>
                    </div>
                    <p className="text-[11px] text-red-800 leading-relaxed pt-1">
                      Deleting this campaign would produce orphan financial records, destroy donor payment references, and invalidate verified audit trails.
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-bold text-[#262626] block">
                      Recommended Safe Alternatives:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          const id = deletingCampaign.id;
                          setDeletingCampaign(null);
                          archiveCampaign(id, 'Archived via financial safeguard dialog');
                          setSuccessMsg(`Campaign "${deletingCampaign.title}" was safely archived.`);
                          setTimeout(() => setSuccessMsg(''), 4000);
                        }}
                        className="px-3 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Archive size={14} /> Archive Campaign
                      </button>

                      <button
                        onClick={() => {
                          const id = deletingCampaign.id;
                          setDeletingCampaign(null);
                          closeCampaign(id, 'Closed via financial safeguard dialog');
                          setSuccessMsg(`Campaign "${deletingCampaign.title}" was closed to new donations.`);
                          setTimeout(() => setSuccessMsg(''), 4000);
                        }}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Lock size={14} /> Close Campaign
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-[#DBDBDB]">
                    <button
                      onClick={() => setDeletingCampaign(null)}
                      className="px-4 py-2 rounded-xl bg-[#EFEFEF] hover:bg-[#DBDBDB] text-[#262626] text-xs font-semibold cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </>
              ) : (
                /* Safe Permanent Deletion View (0 records) */
                <>
                  <div className="flex items-center gap-3 pb-3 border-b border-[#DBDBDB]">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#262626]">
                        Confirm Permanent Campaign Deletion
                      </h3>
                      <p className="text-[10px] text-[#737373]">
                        Financial verification confirmed: 0 payments or donor records exist.
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-[#737373] leading-relaxed">
                    Are you sure you want to permanently delete "<strong>{deletingCampaign.title}</strong>"? Because this campaign has never received monetary transactions, it can be safely removed along with its social feed post reference.
                  </p>

                  {deleteError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{deleteError}</span>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-[#262626] block mb-1">
                      Reason for Deletion (Audit Trail) *
                    </label>
                    <input
                      type="text"
                      required
                      value={deleteReason}
                      onChange={e => setDeleteReason(e.target.value)}
                      placeholder="e.g. Created by mistake / Duplicate announcement"
                      className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-red-500 focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DBDBDB]">
                    <button
                      type="button"
                      onClick={() => {
                        setDeletingCampaign(null);
                        setDeleteReason('');
                        setDeleteError('');
                      }}
                      className="px-4 py-2 rounded-xl bg-[#EFEFEF] hover:bg-[#DBDBDB] text-[#262626] text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={handleConfirmDelete}
                      className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Trash2 size={14} />
                      {isDeleting ? 'Deleting...' : 'Confirm Permanent Deletion'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* ============================================================== */}
      {/* CLOSE CAMPAIGN PROMPT MODAL                                    */}
      {/* ============================================================== */}
      {closingCampaign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-xl border border-[#DBDBDB]">
            <div className="flex items-center gap-3 pb-3 border-b border-[#DBDBDB]">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#262626]">Close Campaign</h3>
                <p className="text-[10px] text-[#737373]">Stop new donation submissions</p>
              </div>
            </div>

            <p className="text-xs text-[#737373] leading-relaxed">
              Closing "<strong>{closingCampaign.title}</strong>" disables the public Donate Now button and prevents new pledge submissions. All existing verified totals ({closingCampaign.collectedAmount.toLocaleString()} BDT) and verification queues remain fully accessible.
            </p>

            <div>
              <label className="text-xs font-semibold text-[#262626] block mb-1">
                Reason for Closing (Optional)
              </label>
              <input
                type="text"
                value={closeReason}
                onChange={e => setCloseReason(e.target.value)}
                placeholder="e.g. Fundraising target reached / Program completed"
                className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DBDBDB]">
              <button
                type="button"
                onClick={() => setClosingCampaign(null)}
                className="px-4 py-2 rounded-xl bg-[#EFEFEF] hover:bg-[#DBDBDB] text-[#262626] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-black text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Lock size={14} /> Close Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* REOPEN CAMPAIGN PROMPT MODAL                                   */}
      {/* ============================================================== */}
      {reopeningCampaign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-xl border border-[#DBDBDB]">
            <div className="flex items-center gap-3 pb-3 border-b border-[#DBDBDB]">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Unlock size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#262626]">Reopen Campaign</h3>
                <p className="text-[10px] text-[#737373]">Enable new member contributions</p>
              </div>
            </div>

            <p className="text-xs text-[#737373] leading-relaxed">
              Reopening "<strong>{reopeningCampaign.title}</strong>" will restore active status and reactivate the Donate button on both the feed and campaign pages.
            </p>

            <div>
              <label className="text-xs font-semibold text-[#262626] block mb-1">
                New Closing Deadline (Optional)
              </label>
              <input
                type="date"
                value={reopenDeadline}
                onChange={e => setReopenDeadline(e.target.value)}
                className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#262626] block mb-1">
                Reason for Reopening (Optional)
              </label>
              <input
                type="text"
                value={reopenReason}
                onChange={e => setReopenReason(e.target.value)}
                placeholder="e.g. Extended drive for additional member requests"
                className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DBDBDB]">
              <button
                type="button"
                onClick={() => setReopeningCampaign(null)}
                className="px-4 py-2 rounded-xl bg-[#EFEFEF] hover:bg-[#DBDBDB] text-[#262626] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReopen}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Unlock size={14} /> Reopen Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ARCHIVE CAMPAIGN PROMPT MODAL                                  */}
      {/* ============================================================== */}
      {archivingCampaign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-xl border border-[#DBDBDB]">
            <div className="flex items-center gap-3 pb-3 border-b border-[#DBDBDB]">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Archive size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#262626]">Archive Campaign</h3>
                <p className="text-[10px] text-[#737373]">Preserve data & hide from active public listings</p>
              </div>
            </div>

            <p className="text-xs text-[#737373] leading-relaxed">
              Archiving "<strong>{archivingCampaign.title}</strong>" securely stores the campaign in the archive tab. All verified records ({archivingCampaign.collectedAmount.toLocaleString()} BDT), payment receipts, and financial audit logs will remain permanent and tamper-proof.
            </p>

            <div>
              <label className="text-xs font-semibold text-[#262626] block mb-1">
                Reason for Archiving (Optional)
              </label>
              <input
                type="text"
                value={archiveReason}
                onChange={e => setArchiveReason(e.target.value)}
                placeholder="e.g. Program concluded and accounts reconciled"
                className="w-full bg-[#FAFAFA] border border-[#DBDBDB] focus:border-[#DD2A7B] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#262626] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DBDBDB]">
              <button
                type="button"
                onClick={() => setArchivingCampaign(null)}
                className="px-4 py-2 rounded-xl bg-[#EFEFEF] hover:bg-[#DBDBDB] text-[#262626] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Archive size={14} /> Archive Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for viewing payment evidence slip */}
      {viewingEvidenceUrl && (
        <ImageLightbox
          images={[viewingEvidenceUrl]}
          initialIndex={0}
          onClose={() => setViewingEvidenceUrl(null)}
        />
      )}
    </div>
  );
};
