/**
 * GRAM-X Shared UI Component Library
 * All government-grade reusable components in one file.
 * Import: import { Button, Badge, Skeleton, MetricCard, ... } from './ui/ui'
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: '6px', fontWeight: 600, borderRadius: '8px', cursor: loading || disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s cubic-bezier(0.4,0,0.2,1)',
    border: '1px solid transparent',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    opacity: disabled ? 0.45 : 1,
  };

  const sizes: Record<string, React.CSSProperties> = {
    sm: { height: '32px', padding: '0 12px', fontSize: '12px' },
    md: { height: '40px', padding: '0 18px', fontSize: '13px' },
    lg: { height: '48px', padding: '0 24px', fontSize: '14px' },
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: { background: '#0B1F3A', color: '#fff', borderColor: '#0B1F3A' },
    secondary: { background: '#fff', color: '#334155', borderColor: '#cbd5e1' },
    outline: { background: 'transparent', color: '#0B1F3A', borderColor: '#0B1F3A' },
    danger: { background: '#ef4444', color: '#fff', borderColor: '#ef4444' },
    ghost: { background: 'transparent', color: '#475569', borderColor: 'transparent' },
    success: { background: '#15803D', color: '#fff', borderColor: '#15803D' },
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={{ ...baseStyle, ...sizes[size], ...variants[variant], ...props.style }}
    >
      {loading && <Spinner size={14} color={variant === 'secondary' ? '#0B1F3A' : '#fff'} />}
      {!loading && leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <span style={{
      width: size, height: size,
      border: `2px solid ${color}30`,
      borderTopColor: color,
      borderRadius: '50%',
      display: 'inline-block',
      animation: 'spin 0.65s linear infinite',
      flexShrink: 0,
    }} aria-hidden="true" />
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = 'critical' | 'high' | 'medium' | 'low' | 'resolved' | 'info' | 'neutral' | 'live';

interface BadgeProps {
  variant?: BadgeVariant;
  label: string;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

const BADGE_STYLES: Record<BadgeVariant, { bg: string; color: string; border: string }> = {
  critical: { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' },
  high:     { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  medium:   { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  low:      { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  resolved: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  info:     { bg: '#f0f9ff', color: '#0284c7', border: '#bae6fd' },
  neutral:  { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
  live:     { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
};

export function Badge({ variant = 'neutral', label, dot = false, pulse = false }: BadgeProps) {
  const s = BADGE_STYLES[variant];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 8px', borderRadius: '5px',
      fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>
      {dot && (
        <span style={{
          width: '5px', height: '5px', borderRadius: '50%', background: s.color, display: 'inline-block',
          animation: pulse ? 'pulse-ring 1.8s ease-in-out infinite' : 'none',
        }} aria-hidden="true" />
      )}
      {label}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: number;
  className?: string;
}

export function Skeleton({ width = '100%', height = 16, radius = 6 }: SkeletonProps) {
  return (
    <span style={{
      display: 'block',
      width, height,
      borderRadius: radius,
      background: 'linear-gradient(90deg, #f1f5f9 25%, #e8ecf0 37%, #f1f5f9 63%)',
      backgroundSize: '400% 100%',
      animation: 'skeleton-shimmer 1.4s ease infinite',
    }} aria-hidden="true" />
  );
}

export function SkeletonCard() {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Skeleton width={36} height={36} radius={8} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Skeleton height={14} width="60%" />
          <Skeleton height={11} width="40%" />
        </div>
      </div>
      <Skeleton height={11} />
      <Skeleton height={11} width="80%" />
      <Skeleton height={32} radius={8} />
    </div>
  );
}

export function SkeletonKPI() {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Skeleton height={11} width="50%" />
      <Skeleton height={32} width="60%" />
      <Skeleton height={11} width="70%" />
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '56px 32px', textAlign: 'center',
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px',
    }}>
      {icon && (
        <div style={{ color: '#cbd5e1', marginBottom: '16px', fontSize: '2.5rem' }}>{icon}</div>
      )}
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>{title}</h3>
      {description && <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '320px', lineHeight: 1.5 }}>{description}</p>}
      {action && (
        <Button variant="primary" size="sm" onClick={action.onClick} style={{ marginTop: '20px' }}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

// ─── ErrorState ───────────────────────────────────────────────────────────────
interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Unable to load data', message, onRetry }: ErrorStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center',
      background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '12px',
    }}>
      <span style={{ fontSize: '2rem', marginBottom: '12px' }}>⚠️</span>
      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#991b1b', marginBottom: '6px' }}>{title}</h3>
      <p style={{ fontSize: '13px', color: '#dc2626', maxWidth: '360px', lineHeight: 1.5 }}>{message}</p>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry} style={{ marginTop: '16px' }}>
          Retry Connection
        </Button>
      )}
    </div>
  );
}

// ─── MetricCard (animated counter) ───────────────────────────────────────────
interface MetricCardProps {
  label: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  subLabel?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  accentColor?: string;
  loading?: boolean;
}

export function MetricCard({
  label, value, prefix = '', suffix = '', subLabel,
  icon, trend, accentColor = '#0B1F3A', loading = false,
}: MetricCardProps) {
  const [display, setDisplay] = useState(0);
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
  const isNumeric = typeof value === 'number';
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isNumeric || loading) return;
    const duration = 900;
    const start = performance.now();
    const from = 0;
    const to = numericValue;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [numericValue, isNumeric, loading]);

  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
      padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      display: 'flex', flexDirection: 'column', gap: '6px',
      transition: 'box-shadow 0.2s ease',
    }}
    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
    onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b' }}>
          {label}
        </span>
        {icon && (
          <span style={{ color: accentColor, opacity: 0.8 }}>{icon}</span>
        )}
      </div>

      {loading ? (
        <Skeleton height={32} width="60%" />
      ) : (
        <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
          {prefix}{isNumeric ? display.toLocaleString() : value}{suffix}
        </div>
      )}

      {subLabel && !loading && (
        <span style={{ fontSize: '12px', color: '#64748b' }}>{subLabel}</span>
      )}

      {trend && !loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700 }}>
          <span style={{ color: trend.value >= 0 ? '#15803d' : '#dc2626' }}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span style={{ color: '#94a3b8', fontWeight: 400 }}>{trend.label}</span>
        </div>
      )}
    </div>
  );
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────
interface ProgressBarProps {
  value: number;          // 0–100
  label?: string;
  showPercent?: boolean;
  color?: string;
  height?: number;
}

export function ProgressBar({ value, label, showPercent = true, color = '#0B1F3A', height = 8 }: ProgressBarProps) {
  const pct = Math.min(Math.max(0, value), 100);
  return (
    <div>
      {(label || showPercent) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          {label && <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>{label}</span>}
          {showPercent && <span style={{ fontSize: '12px', fontWeight: 700, color }}>{pct.toFixed(0)}%</span>}
        </div>
      )}
      <div style={{ height, background: '#e2e8f0', borderRadius: height, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: color,
          borderRadius: height, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  );
}

// ─── StatusDot ────────────────────────────────────────────────────────────────
export function StatusDot({ status }: { status: 'online' | 'offline' | 'degraded' }) {
  const colors: Record<string, string> = { online: '#10b981', offline: '#ef4444', degraded: '#f59e0b' };
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: colors[status] || '#94a3b8',
      animation: status === 'online' ? 'pulse-ring 2s ease-in-out infinite' : 'none',
    }} aria-hidden="true" />
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────
interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ eyebrow, title, subtitle, action }: SectionHeaderProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
      <div>
        {eyebrow && (
          <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', marginBottom: '4px' }}>
            {eyebrow}
          </span>
        )}
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: '13px', color: '#64748b', marginTop: '3px' }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── KPIRow ───────────────────────────────────────────────────────────────────
interface KPIRowProps {
  metrics: Array<{
    label: string;
    value: number | string;
    suffix?: string;
    prefix?: string;
    icon?: React.ReactNode;
    accentColor?: string;
    subLabel?: string;
    loading?: boolean;
  }>;
  columns?: number;
}

export function KPIRow({ metrics, columns }: KPIRowProps) {
  const cols = columns || Math.min(metrics.length, 6);
  return (
    <div
      className="kpi-grid-responsive"
      style={{ '--kpi-cols': String(cols) } as React.CSSProperties}
    >
      {metrics.map((m, i) => (
        <MetricCard key={i} {...m} />
      ))}
    </div>
  );
}

// ─── Fade-in wrapper ──────────────────────────────────────────────────────────
export function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ─── StaggerIn ────────────────────────────────────────────────────────────────
export function StaggerIn({ children, staggerDelay = 0.06 }: { children: React.ReactNode; staggerDelay?: number }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: staggerDelay } },
        hidden: {},
      }}
    >
      {React.Children.map(children, (child, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

export default {
  Button, Spinner, Badge, Skeleton, SkeletonCard, SkeletonKPI,
  EmptyState, ErrorState, MetricCard, ProgressBar, StatusDot,
  SectionHeader, KPIRow, FadeIn, StaggerIn,
};

// ─── SkeletonTable ─────────────────────────────────────────────────────────
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '12px', padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        {Array.from({ length: cols }).map((_, i) => <Skeleton key={i} height={12} width={i === 0 ? '60%' : '40%'} />)}
      </div>
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '12px', padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
          {Array.from({ length: cols }).map((_, ci) => (
            <Skeleton key={ci} height={14} width={ci === 0 ? '80%' : ci % 2 === 0 ? '50%' : '65%'} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── SkeletonTimeline ──────────────────────────────────────────────────────
export function SkeletonTimeline({ items = 4 }: { items?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '12px', paddingBottom: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <Skeleton width={12} height={12} radius={50} />
            {i < items - 1 && <div style={{ width: '2px', flex: 1, background: '#e2e8f0', marginTop: '4px' }} />}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '2px' }}>
            <Skeleton height={13} width="50%" />
            <Skeleton height={11} width="80%" />
            <Skeleton height={11} width="35%" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── SuccessState ─────────────────────────────────────────────────────────
interface SuccessStateProps {
  title: string;
  description?: string;
  reference?: string;
  action?: { label: string; onClick: () => void };
}

export function SuccessState({ title, description, reference, action }: SuccessStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '48px 32px', textAlign: 'center',
      background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '16px',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%', background: '#15803d',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: '1.75rem', marginBottom: '16px',
        animation: 'pop-in 0.3s ease-out',
      }} aria-hidden="true">✓</div>
      <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#14532d', marginBottom: '8px' }}>{title}</h3>
      {description && <p style={{ fontSize: '13px', color: '#166534', maxWidth: '320px', lineHeight: 1.5 }}>{description}</p>}
      {reference && (
        <div style={{ marginTop: '12px', padding: '6px 12px', background: '#dcfce7', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px', color: '#15803d', fontWeight: 700 }}>
          Ref: {reference}
        </div>
      )}
      {action && (
        <Button variant="success" size="sm" onClick={action.onClick} style={{ marginTop: '20px' }}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

// ─── OfflineBanner ────────────────────────────────────────────────────────
type OfflineBannerState = 'offline' | 'syncing' | 'synced' | null;

interface OfflineBannerProps {
  state: OfflineBannerState;
  pendingCount?: number;
  onDismissSynced?: () => void;
}

export function OfflineBanner({ state, pendingCount = 0, onDismissSynced }: OfflineBannerProps) {
  if (!state) return null;
  const configs = {
    offline: { bg: '#fef2f2', border: '#fca5a5', color: '#991b1b', icon: '📵', message: 'OFFLINE — Changes saved locally, will sync on reconnect.' },
    syncing: { bg: '#fffbeb', border: '#fde68a', color: '#92400e', icon: '🔄', message: `SYNCING — Uploading ${pendingCount} item${pendingCount !== 1 ? 's' : ''}...` },
    synced:  { bg: '#f0fdf4', border: '#a7f3d0', color: '#14532d', icon: '✅', message: 'SYNCED — All changes saved.' },
  };
  const cfg = configs[state];
  return (
    <div
      role="status"
      aria-live="assertive"
      aria-atomic="true"
      className="offline-banner"
      style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}
    >
      <span aria-hidden="true" style={{ fontSize: '1rem' }}>{cfg.icon}</span>
      <span style={{ flex: 1 }}>{cfg.message}</span>
      {state === 'synced' && onDismissSynced && (
        <button
          onClick={onDismissSynced}
          aria-label="Dismiss sync notification"
          style={{ background: 'none', border: 'none', color: cfg.color, cursor: 'pointer', padding: '0 4px', fontSize: '1rem', minHeight: '32px', minWidth: '32px' }}
        >×</button>
      )}
    </div>
  );
}
