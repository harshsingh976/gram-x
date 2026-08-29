import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'elevated' | 'glass' | 'accent';
  header?: React.ReactNode;
  footer?: React.ReactNode;
  badge?: React.ReactNode;
  hoverEffect?: boolean;
}

export function Card({
  variant = 'default',
  header,
  footer,
  badge,
  hoverEffect = true,
  children,
  className = '',
  style,
  ...props
}: CardProps) {
  const variantStyles: Record<string, string> = {
    default: 'bg-white border border-slate-200 shadow-xs',
    flat: 'bg-slate-50 border border-slate-200/80',
    elevated: 'bg-white border border-slate-100 shadow-md',
    glass: 'bg-white/80 backdrop-blur-md border border-white/40 shadow-sm',
    accent: 'bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-slate-700 shadow-lg',
  };

  return (
    <div
      className={`rounded-xl p-4 sm:p-5 w-full transition-all duration-200 min-w-0 ${variantStyles[variant]} ${
        hoverEffect ? 'hover:shadow-md hover:-translate-y-0.5' : ''
      } ${className}`}
      style={{
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
        ...style,
      }}
      {...props}
    >
      {(header || badge) && (
        <div className="flex items-start justify-between gap-3 mb-3 border-b border-slate-100/80 pb-3">
          {header && <div className="font-bold text-slate-900 text-sm sm:text-base">{header}</div>}
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
      )}
      <div className="text-slate-700 text-xs sm:text-sm leading-relaxed">{children}</div>
      {footer && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
}

export interface StatCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  subtext?: string;
  accentColor?: string;
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  subtext,
  accentColor = '#0c4a6e',
}: StatCardProps) {
  return (
    <Card variant="default" className="h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">{label}</span>
          {icon && (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
            >
              {icon}
            </div>
          )}
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</div>
      </div>
      {(trend || subtext) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={`font-bold px-1.5 py-0.5 rounded-sm ${
                trend.value >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
          {subtext && <span className="text-slate-500 text-[11px] truncate">{subtext}</span>}
        </div>
      )}
    </Card>
  );
}

export interface ComplaintCardProps {
  id: number;
  trackingCode?: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  createdAt: string;
  villageName?: string;
  onViewDetails?: () => void;
}

export function ComplaintCard({
  id,
  trackingCode,
  title,
  category,
  severity,
  status,
  createdAt,
  villageName,
  onViewDetails,
}: ComplaintCardProps) {
  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    submitted: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    assigned: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    in_progress: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    resolved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  };

  const currentStatus = statusColors[status.toLowerCase()] || statusColors.submitted;

  return (
    <Card
      variant="default"
      className="cursor-pointer hover:border-sky-300"
      onClick={onViewDetails}
      header={
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">#{trackingCode || `GX-${id}`}</span>
          <span className="font-bold text-slate-900 line-clamp-1">{title}</span>
        </div>
      }
      badge={
        <span
          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}`}
        >
          {status.replace(/_/g, ' ')}
        </span>
      }
      footer={
        <>
          <div className="flex items-center gap-2 text-slate-500">
            <span className="font-semibold text-slate-700">{category}</span>
            {villageName && <span>• {villageName}</span>}
          </div>
          <span className="text-[11px] text-slate-400">
            {new Date(createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        </>
      }
    >
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span className="font-medium">Severity: <strong className="uppercase text-slate-900">{severity}</strong></span>
        {onViewDetails && (
          <button
            type="button"
            className="text-sky-600 font-bold hover:underline min-h-[36px] flex items-center px-1"
          >
            View Tracker →
          </button>
        )}
      </div>
    </Card>
  );
}

export interface TaskCardProps {
  id: number;
  incidentTitle: string;
  category: string;
  status: string;
  villageName?: string;
  assignedAt: string;
  cost: number;
  onAccept?: () => void;
  onComplete?: () => void;
  onView?: () => void;
}

export function TaskCard({
  id,
  incidentTitle,
  category,
  status,
  villageName,
  assignedAt,
  cost,
  onAccept,
  onComplete,
  onView,
}: TaskCardProps) {
  return (
    <Card
      variant="default"
      header={
        <div>
          <span className="text-xs text-slate-400 font-mono">Task #{id}</span>
          <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{incidentTitle}</h4>
        </div>
      }
      badge={
        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200">
          {status.replace(/_/g, ' ')}
        </span>
      }
      footer={
        <div className="w-full flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-700">₹{cost.toFixed(0)} Payout</span>
          <div className="flex items-center gap-2">
            {status === 'assigned' && onAccept && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept();
                }}
                className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-700 min-h-[36px]"
              >
                Accept Task
              </button>
            )}
            {status === 'in_progress' && onComplete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete();
                }}
                className="bg-sky-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-sky-700 min-h-[36px]"
              >
                Submit Evidence
              </button>
            )}
            {onView && (
              <button
                type="button"
                onClick={onView}
                className="text-slate-600 font-bold text-xs hover:text-slate-900 min-h-[36px] px-2"
              >
                Details
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="text-xs text-slate-500 space-y-1 mb-2">
        <p>Location: <strong className="text-slate-700">{villageName || 'Piparli Panchayat'}</strong></p>
        <p>Dispatched: <span className="text-slate-700">{new Date(assignedAt).toLocaleString()}</span></p>
      </div>
    </Card>
  );
}
