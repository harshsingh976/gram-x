import React from 'react';
import { 
  CheckCircle2, Clock, AlertTriangle, AlertCircle, 
  HelpCircle, RefreshCw, XCircle, ArrowRight, ShieldCheck 
} from 'lucide-react';
import { useLanguage } from '../../i18n';

// ─── 1. Unified Status Badge ────────────────────────────────
export interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, className = '', size = 'md' }: StatusBadgeProps) {
  const { t } = useLanguage();
  const normalized = (status || '').toLowerCase().trim();

  let bg = 'bg-slate-100 text-slate-700 border-slate-200';
  let icon = <Clock className="w-3.5 h-3.5" />;
  let labelKey = `status.${normalized}`;

  if (['resolved', 'completed', 'resolved_confirmed', 'paid', 'verified'].includes(normalized)) {
    bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
  } else if (['in_progress', 'accepted', 'dispatched', 'en_route'].includes(normalized)) {
    bg = 'bg-amber-50 text-amber-700 border-amber-200';
    icon = <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin-slow" />;
  } else if (['critical', 'sla_breach', 'rejected', 'failed'].includes(normalized)) {
    bg = 'bg-red-50 text-red-700 border-red-200';
    icon = <AlertTriangle className="w-3.5 h-3.5 text-red-600" />;
  } else if (['pending_verification', 'assigned', 'pending', 'submitted'].includes(normalized)) {
    bg = 'bg-blue-50 text-blue-700 border-blue-200';
    icon = <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />;
  }

  const text = t(labelKey);
  const displayText = text === labelKey ? status.replace(/_/g, ' ') : text;

  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-md border ${bg} ${sizeClass} ${className}`}>
      {icon}
      <span>{displayText}</span>
    </span>
  );
}

// ─── 2. Contextual Empty State ──────────────────────────────
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionText,
  onAction,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white border border-slate-200/80 rounded-2xl shadow-xs ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
        {icon || <HelpCircle className="w-7 h-7" />}
      </div>
      <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-1.5 leading-relaxed font-medium">
          {description}
        </p>
      )}
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-98 min-h-[44px]"
        >
          <span>{actionText}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ─── 3. Friendly Error State ────────────────────────────────
export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title,
  message,
  onRetry,
  className = ''
}: ErrorStateProps) {
  const { t } = useLanguage();
  return (
    <div className={`p-6 sm:p-8 bg-red-50/70 border border-red-200/90 rounded-2xl text-center flex flex-col items-center justify-center ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-3">
        <XCircle className="w-6 h-6" />
      </div>
      <h4 className="font-bold text-red-900 text-sm sm:text-base">
        {title || t('error.generic')}
      </h4>
      <p className="text-xs sm:text-sm text-red-700 max-w-md mt-1 font-medium leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all min-h-[40px]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t('error.retry')}</span>
        </button>
      )}
    </div>
  );
}

// ─── 4. Accessible Skeletons ────────────────────────────────
export function CardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs animate-pulse space-y-4">
      <div className="flex justify-between items-center">
        <div className="h-4 bg-slate-200 rounded w-1/3" />
        <div className="h-4 bg-slate-200 rounded w-16" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="h-3 bg-slate-100 rounded w-4/5" />
      </div>
      <div className="h-8 bg-slate-100 rounded-lg w-full" />
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs animate-pulse space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-3 bg-slate-200 rounded w-20" />
            <div className="w-8 h-8 rounded-lg bg-slate-100" />
          </div>
          <div className="h-7 bg-slate-200 rounded w-16" />
          <div className="h-2.5 bg-slate-100 rounded w-24" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs animate-pulse space-y-3">
      <div className="h-5 bg-slate-200 rounded w-1/4 mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-2 border-b border-slate-100">
          <div className="h-4 bg-slate-200 rounded w-12" />
          <div className="h-4 bg-slate-100 rounded flex-1" />
          <div className="h-4 bg-slate-200 rounded w-20" />
          <div className="h-4 bg-slate-100 rounded w-16" />
        </div>
      ))}
    </div>
  );
}

// ─── 5. Accessible Confirmation Modal ───────────────────────
export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isDestructive ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
          }`}>
            {isDestructive ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">{title}</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors min-h-[40px]"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs sm:text-sm font-bold text-white rounded-xl shadow-md transition-all min-h-[40px] ${
              isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
