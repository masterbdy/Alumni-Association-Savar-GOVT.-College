import React from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, UserProfile } from '../types';

export interface VerifiedBadgeProps {
  userId?: string;
  user?: UserProfile | null;
  role?: UserRole;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export interface VerifiedBadgeInfo {
  isVerified: boolean;
  role: 'super_admin' | 'admin' | 'moderator';
  label: string;
  tooltip: string;
  ariaLabel: string;
  colorClass: string;
}

export const getAuthoritativeBadgeInfo = (
  user?: UserProfile | null,
  roleFallback?: UserRole
): VerifiedBadgeInfo | null => {
  // If user profile is provided, enforce that their status is approved
  if (user && user.status !== 'approved') {
    return null;
  }

  const role = user ? user.role : roleFallback;

  if (role === 'super_admin') {
    return {
      isVerified: true,
      role: 'super_admin',
      label: 'System Controller',
      tooltip: 'Verified Super Admin — System Controller',
      ariaLabel: 'Verified Super Admin (System Controller)',
      colorClass: 'text-[#1D9BF0]'
    };
  }

  if (role === 'admin') {
    return {
      isVerified: true,
      role: 'admin',
      label: 'Verified Admin',
      tooltip: 'Verified Administrator',
      ariaLabel: 'Verified Admin',
      colorClass: 'text-[#2563EB]'
    };
  }

  if (role === 'moderator') {
    return {
      isVerified: true,
      role: 'moderator',
      label: 'Verified Moderator',
      tooltip: 'Verified Moderator',
      ariaLabel: 'Verified Moderator',
      colorClass: 'text-[#38BDF8]'
    };
  }

  return null;
};

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  userId,
  user,
  role,
  size = 'sm',
  showLabel = false,
  className = ''
}) => {
  const { users } = useApp();

  // Authoritative Lookup: Always prioritize current real-time user record from AppContext
  let authoritativeUser: UserProfile | null | undefined = null;

  if (userId) {
    authoritativeUser = users.find(u => u.uid === userId);
  } else if (user) {
    authoritativeUser = users.find(u => u.uid === user.uid) || user;
  }

  const badgeInfo = getAuthoritativeBadgeInfo(authoritativeUser, !authoritativeUser ? role : undefined);

  if (!badgeInfo) {
    return null;
  }

  const sizeClasses: Record<string, string> = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const iconClass = sizeClasses[size] || sizeClasses.sm;

  const badgeIcon = (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${iconClass} ${badgeInfo.colorClass} shrink-0 drop-shadow-sm select-none`}
      aria-hidden="true"
    >
      {/* Premium 12-point Scalloped Official Verified Seal */}
      <path
        d="M10.29 2.31a2.4 2.4 0 0 1 3.42 0l.69.69a2.4 2.4 0 0 0 1.7.7h.97a2.4 2.4 0 0 1 2.4 2.4v.97a2.4 2.4 0 0 0 .7 1.7l.69.69a2.4 2.4 0 0 1 0 3.42l-.69.69a2.4 2.4 0 0 0-.7 1.7v.97a2.4 2.4 0 0 1-2.4 2.4h-.97a2.4 2.4 0 0 0-1.7.7l-.69.69a2.4 2.4 0 0 1-3.42 0l-.69-.69a2.4 2.4 0 0 0-1.7-.7h-.97a2.4 2.4 0 0 1-2.4-2.4v-.97a2.4 2.4 0 0 0-.7-1.7l-.69-.69a2.4 2.4 0 0 1 0-3.42l.69-.69a2.4 2.4 0 0 0 .7-1.7v-.97a2.4 2.4 0 0 1 2.4-2.4h.97a2.4 2.4 0 0 0 1.7-.7l.69-.69z"
        fill="currentColor"
      />
      {/* Crisp White Official Verification Checkmark */}
      <path
        d="M8.5 12.2l2.4 2.4 4.8-4.8"
        stroke="#FFFFFF"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (showLabel) {
    return (
      <span
        title={badgeInfo.tooltip}
        aria-label={badgeInfo.ariaLabel}
        role="img"
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-[11px] leading-tight shrink-0 select-none ${className}`}
      >
        {badgeIcon}
        <span>{badgeInfo.label}</span>
      </span>
    );
  }

  return (
    <span
      title={badgeInfo.tooltip}
      aria-label={badgeInfo.ariaLabel}
      role="img"
      className={`inline-flex items-center justify-center shrink-0 align-middle ${className}`}
    >
      {badgeIcon}
    </span>
  );
};
