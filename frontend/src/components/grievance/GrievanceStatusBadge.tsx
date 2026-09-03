/**
 * GRAM-X Grievance Status Badge
 * Accessible, color-coded badge indicating the current lifecycle phase.
 */

import React from 'react';
import {
  Clock,
  CheckCircle2,
  Wrench,
  ShieldCheck,
  Check,
  AlertOctagon,
  FileText,
} from 'lucide-react';
import type { GrievanceStatus } from '../../services/grievanceService';

export interface GrievanceStatusBadgeProps {
  status: GrievanceStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const GrievanceStatusBadge = ({
  status,
  size = 'md',
  className = '',
}: GrievanceStatusBadgeProps) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'SUBMITTED':
        return {
          label: 'Submitted',
          icon: FileText,
          bg: 'bg-amber-950/60 border-amber-500/40 text-amber-300',
        };
      case 'VERIFIED':
        return {
          label: 'Panchayat Verified',
          icon: ShieldCheck,
          bg: 'bg-sky-950/60 border-sky-500/40 text-sky-300',
        };
      case 'ASSIGNED':
        return {
          label: 'Technician Assigned',
          icon: Clock,
          bg: 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300',
        };
      case 'IN_PROGRESS':
        return {
          label: 'In Progress',
          icon: Wrench,
          bg: 'bg-blue-950/60 border-blue-500/40 text-blue-300 animate-pulse',
        };
      case 'RESOLVED':
        return {
          label: 'Field Resolved',
          icon: CheckCircle2,
          bg: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
        };
      case 'CLOSED':
        return {
          label: 'Citizen Confirmed & Closed',
          icon: Check,
          bg: 'bg-teal-950/60 border-teal-500/40 text-teal-300',
        };
      case 'ESCALATED':
        return {
          label: 'Escalated to District',
          icon: AlertOctagon,
          bg: 'bg-rose-950/60 border-rose-500/40 text-rose-300 font-bold',
        };
      default:
        return {
          label: status,
          icon: Clock,
          bg: 'bg-slate-900 border-slate-700 text-slate-300',
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border shadow-xs ${config.bg} ${sizeClasses} ${className}`}
      role="status"
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
};

export default GrievanceStatusBadge;
