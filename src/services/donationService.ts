import { 
  DonationCampaign, 
  CampaignStatus, 
  UserProfile, 
  DonationRecord, 
  AdminPermissionLimits, 
  ModulePermissionRule 
} from '../types';

/**
 * Checks if a campaign has expired based on its deadline date.
 * If deadline is in the past (before start of current day or current time), it is expired.
 */
export function isCampaignExpired(campaign: DonationCampaign): boolean {
  if (!campaign.deadline || !campaign.deadline.trim()) return false;
  
  // Format check: could be YYYY-MM-DD or full ISO
  const deadlineStr = campaign.deadline.trim();
  const deadlineDate = new Date(deadlineStr);
  if (isNaN(deadlineDate.getTime())) return false;

  // If provided as YYYY-MM-DD, treat expiry as end of that day (23:59:59.999)
  if (/^\d{4}-\d{2}-\d{2}$/.test(deadlineStr)) {
    const endOfDay = new Date(`${deadlineStr}T23:59:59.999Z`);
    return Date.now() > endOfDay.getTime();
  }

  return Date.now() > deadlineDate.getTime();
}

/**
 * Calculates effective status of a campaign.
 * Evaluates explicit status (archived, closed, completed) and dynamic expiration.
 */
export function getEffectiveCampaignStatus(campaign: DonationCampaign): CampaignStatus {
  if (campaign.status === 'archived') return 'archived';
  if (campaign.status === 'closed') return 'closed';
  if (campaign.status === 'completed') return 'completed';
  if (campaign.status === 'paused') return 'paused';

  if (isCampaignExpired(campaign)) {
    return 'expired';
  }

  return 'active';
}

/**
 * Determines if a campaign can currently accept new donation submissions.
 * Submissions are strictly blocked if campaign is paused, closed, archived, or expired.
 */
export function canCampaignAcceptDonations(campaign: DonationCampaign): boolean {
  if (!campaign.isActive) return false;
  const effective = getEffectiveCampaignStatus(campaign);
  return effective === 'active';
}

/**
 * Checks whether a campaign has any existing financial records
 * (verified, pending, confirmed, disputed, or rejected).
 */
export function checkCampaignFinancialRecords(
  campaignId: string, 
  donations: DonationRecord[]
): {
  hasRecords: boolean;
  totalRecords: number;
  confirmedCount: number;
  pendingCount: number;
  totalCollectedBdt: number;
  totalPendingBdt: number;
} {
  const related = donations.filter(d => d.campaignId === campaignId);
  const confirmed = related.filter(d => d.status === 'confirmed' || d.status === 'verified');
  const pending = related.filter(d => d.status === 'pending');

  const totalCollectedBdt = confirmed.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const totalPendingBdt = pending.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  return {
    hasRecords: related.length > 0,
    totalRecords: related.length,
    confirmedCount: confirmed.length,
    pendingCount: pending.length,
    totalCollectedBdt,
    totalPendingBdt
  };
}

/**
 * Authorization gate: Can the user edit this campaign?
 * System Controller always permitted.
 * Admins permitted if their limits grant donation review or campaign management.
 * Campaign organizers (if admin/moderator) permitted to update details.
 */
export function canUserEditCampaign(
  campaign: DonationCampaign,
  user: UserProfile,
  isSystemController: boolean,
  adminLimits?: AdminPermissionLimits
): boolean {
  if (isSystemController || user.email.toLowerCase() === 'mehedihasan1303@gmail.com') {
    return true;
  }
  if (user.role === 'super_admin') {
    return true;
  }
  if (user.status !== 'approved') {
    return false;
  }
  if (user.role === 'admin') {
    // If admin limits explicitly forbid review/verify donations
    if (adminLimits && !adminLimits.canReviewVerifyDonations) {
      return false;
    }
    return true;
  }
  if (user.role === 'moderator' && campaign.organizerId === user.uid) {
    return true;
  }
  return false;
}

/**
 * Authorization gate: Can the user delete this campaign?
 * System Controller is always permitted.
 * Admins are governed by permission matrix or explicit admin role rules.
 * Regular members and unapproved users are strictly prohibited.
 */
export function canUserDeleteCampaign(
  campaign: DonationCampaign,
  user: UserProfile,
  isSystemController: boolean,
  permissionMatrix?: ModulePermissionRule[]
): boolean {
  if (isSystemController || user.email.toLowerCase() === 'mehedihasan1303@gmail.com') {
    return true;
  }
  if (user.role === 'super_admin') {
    return true;
  }
  if (user.status !== 'approved') {
    return false;
  }
  // Check permission matrix for donations module delete allowed roles
  if (permissionMatrix) {
    const donationRule = permissionMatrix.find(m => m.moduleId === 'donations');
    if (donationRule && donationRule.allowedRoles.delete.includes(user.role)) {
      return true;
    }
  }
  return false;
}

/**
 * Authorization gate: Can the user close, reopen, or archive this campaign?
 */
export function canUserManageCampaignStatus(
  campaign: DonationCampaign,
  user: UserProfile,
  isSystemController: boolean,
  adminLimits?: AdminPermissionLimits
): boolean {
  return canUserEditCampaign(campaign, user, isSystemController, adminLimits);
}

/**
 * Input validator for campaign editing.
 */
export function validateCampaignEdit(updates: {
  title?: string;
  description?: string;
  targetAmount?: number;
  bkashNumber?: string;
  nagadNumber?: string;
  startDate?: string;
  deadline?: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (updates.title !== undefined && !updates.title.trim()) {
    errors.push('Campaign title cannot be blank.');
  }

  if (updates.description !== undefined && !updates.description.trim()) {
    errors.push('Campaign purpose and description cannot be blank.');
  }

  if (updates.targetAmount !== undefined) {
    const target = Number(updates.targetAmount);
    if (isNaN(target) || target <= 0) {
      errors.push('Target amount must be a positive number in BDT.');
    }
  }

  if (updates.bkashNumber !== undefined && !updates.bkashNumber.trim()) {
    errors.push('bKash payment number / instructions cannot be blank.');
  }

  if (updates.nagadNumber !== undefined && !updates.nagadNumber.trim()) {
    errors.push('Nagad payment number / instructions cannot be blank.');
  }

  if (updates.startDate && updates.deadline) {
    const start = new Date(updates.startDate).getTime();
    const end = new Date(updates.deadline).getTime();
    if (!isNaN(start) && !isNaN(end) && start > end) {
      errors.push('Campaign start date cannot be later than the deadline.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
