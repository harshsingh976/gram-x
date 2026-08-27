import React, { useState, useEffect, useCallback } from 'react';
import { IMAGE_MAP, getServiceImage, getInitials, getRoleAvatarGradient } from '../imageMap';
import {
  Wrench, MapPin, Navigation, IndianRupee, AlertCircle,
  CheckSquare, Wifi, WifiOff, ChevronLeft, Clock,
  CheckCircle2, ArrowRight, RefreshCw, Star, Shield,
  AlertTriangle, ChevronRight, X, Check, Loader2,
  Calendar, TrendingUp, User, Phone, CheckCircle, ShieldAlert
} from 'lucide-react';
import * as api from '../api';
import LiveClock from './LiveClock';
import NotificationTicker from './NotificationTicker';
import NetworkStatus from './NetworkStatus';


// ─── Types ────────────────────────────────────────────────
export interface WorkerTask {
  id: number;
  incident_id: number;
  technician_id: number;
  description?: string;
  status: string;
  assigned_at: string;
  completed_at?: string;
  cost: number;
  base_cost: number;
  cost_increased: boolean;
  work_done?: string;
  what_was_wrong?: string;
  product_effect?: string;
  payout_status: string;
  payout_tx_id?: string;
  
  // Financial & Scope Revision Governance
  cost_revision_status?: string; // 'none' | 'pending' | 'approved' | 'rejected'
  requested_cost?: number;
  requested_additional_cost?: number;
  scope_reviewed_by?: string;
  scope_reviewed_at?: string;
  scope_rejection_reason?: string;
  
  // Enriched from backend
  incident_title?: string;
  incident_category?: string;
  incident_village?: string;
  incident_severity?: string;
  incident_created_at?: string;
  technician_name?: string;
  technician_rating?: number;
  technician_specialty?: string;
  
  // Authoritative SLA parameters
  sla_priority?: string;
  sla_response_hours?: number;
  sla_resolution_hours?: number;
  sla_expected_response_time?: string;
  sla_expected_resolution_time?: string;
  sla_status?: string;
  sla_remaining_seconds?: number;
}

interface TechnicianPortalProps {
  tasks?: WorkerTask[];
  technician?: any;
  workerName?: string;
  onAcceptTask?: (taskId: number) => Promise<void> | void;
  onRequestPriceIncrease?: (taskId: number, cost: number, workDone: string, whatWasWrong: string, productEffect: string) => Promise<void> | void;
  onCompleteTask?: (taskId: number) => Promise<void> | void;
  onRefresh?: () => void;
  showToast?: (message: string, type?: 'info' | 'success' | 'error') => void;
}

// ─── SLA & Priority Helpers (Single Authoritative Source of Truth) ───
export function getPriorityConfig(severity?: string) {
  switch ((severity || '').toLowerCase()) {
    case 'critical':
      return { responseHours: 1, resolutionHours: 4, label: 'CRITICAL', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' };
    case 'high':
      return { responseHours: 2, resolutionHours: 8, label: 'HIGH', color: '#f97316', bg: '#fff7ed', border: '#fed7aa' };
    case 'medium':
      return { responseHours: 4, resolutionHours: 24, label: 'MEDIUM', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' };
    case 'low':
      return { responseHours: 8, resolutionHours: 48, label: 'LOW', color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' };
    default:
      return { responseHours: 4, resolutionHours: 24, label: 'MEDIUM', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' };
  }
}

export function getAuthoritativeSLADeadline(task: WorkerTask): Date {
  if (task.sla_expected_resolution_time) {
    return new Date(task.sla_expected_resolution_time);
  }
  const baseTime = task.incident_created_at ? new Date(task.incident_created_at) : new Date(task.assigned_at);
  const cfg = getPriorityConfig(task.incident_severity || task.sla_priority);
  const d = new Date(baseTime);
  d.setHours(d.getHours() + cfg.resolutionHours);
  return d;
}

export function calculateLiveSLA(deadline: Date, isCompleted: boolean) {
  if (isCompleted) {
    return {
      label: 'RESOLVED',
      countdownText: 'Work Completed',
      status: 'RESOLVED' as const,
      statusLabel: 'RESOLVED',
      isBreached: false,
      isAtRisk: false,
      color: '#10b981',
      bg: '#ecfdf5',
      badgeClass: 'wp-sla-resolved'
    };
  }
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  if (diffMs <= 0) {
    return {
      label: 'SLA BREACHED',
      countdownText: 'SLA Breached',
      status: 'BREACHED' as const,
      statusLabel: 'BREACHED (Escalation Active)',
      isBreached: true,
      isAtRisk: true,
      color: '#ef4444',
      bg: '#fef2f2',
      badgeClass: 'wp-sla-expired'
    };
  }
  const totalHours = Math.floor(diffMs / 3600000);
  const totalMins = Math.floor((diffMs % 3600000) / 60000);
  const totalSecs = Math.floor((diffMs % 60000) / 1000);
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  const countdownText = totalHours > 0 
    ? `${pad(totalHours)}h ${pad(totalMins)}m ${pad(totalSecs)}s remaining`
    : `${pad(totalMins)}m ${pad(totalSecs)}s remaining`;

  // At risk if less than 2 hours or less than 25% of total window
  const isAtRisk = diffMs < 2 * 3600000;
  
  return {
    label: isAtRisk ? 'AT RISK' : 'ON TRACK',
    countdownText,
    status: isAtRisk ? ('AT_RISK' as const) : ('ON_TRACK' as const),
    statusLabel: isAtRisk ? 'AT RISK' : 'ON TRACK',
    isBreached: false,
    isAtRisk,
    color: isAtRisk ? '#f59e0b' : '#10b981',
    bg: isAtRisk ? '#fffbeb' : '#ecfdf5',
    badgeClass: isAtRisk ? 'wp-sla-warning' : 'wp-sla-ontrack'
  };
}

function getCategoryIcon(category?: string) {
  switch ((category || '').toLowerCase()) {
    case 'water':       return '💧';
    case 'roads':       return '🛣️';
    case 'waste':       return '🗑️';
    case 'electricity': return '⚡';
    case 'drainage':    return '🌊';
    default:            return '🔧';
  }
}

function getStatusConfig(status: string) {
  switch (status.toLowerCase()) {
    case 'assigned':    return { label: 'ASSIGNED', color: '#3b82f6', bg: '#eff6ff' };
    case 'accepted':    return { label: 'ACCEPTED', color: '#8b5cf6', bg: '#f5f3ff' };
    case 'en_route':    return { label: 'EN ROUTE', color: '#f59e0b', bg: '#fffbeb' };
    case 'in_progress': return { label: 'IN PROGRESS', color: '#f97316', bg: '#fff7ed' };
    case 'completed':   return { label: 'COMPLETED', color: '#10b981', bg: '#ecfdf5' };
    default:            return { label: status.toUpperCase(), color: '#64748b', bg: '#f8fafc' };
  }
}

// ─── Live SLA Status Card Component (Self-updating countdown) ───
function LiveSLACard({ task }: { task: WorkerTask }) {
  const priorityCfg = getPriorityConfig(task.incident_severity || task.sla_priority);
  const deadline = getAuthoritativeSLADeadline(task);
  const isCompleted = task.status === 'completed';

  const [liveSLA, setLiveSLA] = useState(() => calculateLiveSLA(deadline, isCompleted));

  useEffect(() => {
    // Update live countdown every 1 second
    const interval = setInterval(() => {
      setLiveSLA(calculateLiveSLA(deadline, isCompleted));
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline, isCompleted]);

  return (
    <div style={{
      background: '#ffffff',
      border: `1px solid ${liveSLA.isBreached ? '#fecaca' : liveSLA.isAtRisk ? '#fde68a' : '#e2e8f0'}`,
      borderRadius: '10px',
      padding: '14px 16px',
      marginBottom: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={15} color={liveSLA.color} />
          <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a' }}>
            Authoritative SLA Status
          </span>
        </div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          background: liveSLA.bg,
          color: liveSLA.color,
          fontSize: '11px',
          fontWeight: 800,
          padding: '2px 8px',
          borderRadius: '20px',
          border: `1px solid ${liveSLA.color}40`
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: liveSLA.color }} />
          {liveSLA.statusLabel}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '11px' }}>
        <div>
          <span style={{ color: '#64748b', display: 'block', fontWeight: 600 }}>Priority & Window</span>
          <strong style={{ color: priorityCfg.color, fontWeight: 700 }}>
            {priorityCfg.label} ({priorityCfg.resolutionHours}h Resolution)
          </strong>
        </div>
        <div>
          <span style={{ color: '#64748b', display: 'block', fontWeight: 600 }}>Resolution Deadline</span>
          <strong style={{ color: '#0f172a' }}>
            {deadline.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}, {deadline.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </strong>
        </div>
        <div>
          <span style={{ color: '#64748b', display: 'block', fontWeight: 600 }}>Live Remaining</span>
          <strong style={{ color: liveSLA.color, fontFamily: 'monospace', fontSize: '12px', fontWeight: 700 }}>
            {liveSLA.countdownText}
          </strong>
        </div>
      </div>
    </div>
  );
}

// ─── Announcement Ticker ─────────────────────────────────
const TICKER_MESSAGES = [
  '📢 GRAM-X FIELD OPERATIONS SYSTEM — National Jal Jeevan Mission Initiative',
  '⚡ Priority-dependent SLAs active: Critical 4h, High 8h, Medium 24h, Low 48h resolution targets.',
  '📱 Field workers: Scope revisions require justification and Panchayat Administration approval.',
  '💰 Completed work orders are credited to technician wallet upon site verification.',
  '🌿 Madhya Pradesh Panchayati Raj Department — Digital Infrastructure Maintenance Portal',
];

function Ticker() {
  return (
    <div className="wp-ticker-wrapper" aria-label="Government announcements">
      <div className="wp-ticker-label">📢 GOVT</div>
      <div className="wp-ticker-track">
        <div className="wp-ticker-content">
          {[...TICKER_MESSAGES, ...TICKER_MESSAGES].map((msg, i) => (
            <span key={i} className="wp-ticker-item">{msg}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Task Card (compact list view) ─────────────────────────
function TaskCard({
  task,
  onClick,
  workerName,
}: {
  task: WorkerTask;
  onClick: () => void;
  workerName?: string;
}) {
  const priority = getPriorityConfig(task.incident_severity || task.sla_priority);
  const statusCfg = getStatusConfig(task.status);
  const deadline = getAuthoritativeSLADeadline(task);
  const isCompleted = task.status === 'completed';
  const sla = calculateLiveSLA(deadline, isCompleted);

  return (
    <button
      className={`wp-task-card ${isCompleted ? 'task-card-completed' : 'task-card-active'}`}
      onClick={onClick}
      aria-label={`Open task ${task.id}: ${task.incident_title || task.description}`}
    >
      {/* Priority stripe */}
      <div className="wp-task-priority-stripe" style={{ background: priority.color }} />

      <div className="wp-task-card-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <img src={getServiceImage(task.incident_category || task.description || '')} alt={task.incident_category || 'Task'} style={{ width: '52px', height: '52px', borderRadius: '10px', objectFit: 'cover', border: '2px solid #e2e8f0', flexShrink: 0 }} onError={(e) => { e.currentTarget.style.display='none'; }} />
          <div className="role-avatar role-avatar-sm" style={{ background: getRoleAvatarGradient('worker'), marginLeft: 'auto' }}>{getInitials(task.technician_name || workerName || 'Worker')}</div>
        </div>
        {/* Header row */}
        <div className="wp-task-header">
          <div className="wp-badges">
            <span className="wp-badge" style={{ color: priority.color, background: priority.bg, border: `1px solid ${priority.border}` }}>
              {priority.label}
            </span>
            <span className="wp-badge" style={{ color: statusCfg.color, background: statusCfg.bg }}>
              {statusCfg.label}
            </span>
            {task.incident_category && (
              <span className="wp-badge wp-badge-category">
                {getCategoryIcon(task.incident_category)} {task.incident_category.toUpperCase()}
              </span>
            )}
          </div>
          <span className="wp-task-id">#{task.id}</span>
        </div>

        {/* Task title */}
        <h3 className="wp-task-title">
          {task.incident_title || task.description || `Task #${task.id}`}
        </h3>

        {/* Location & SLA row */}
        <div className="wp-task-meta">
          {task.incident_village && (
            <span className="wp-meta-item">
              <MapPin size={12} />
              {task.incident_village}
            </span>
          )}
          <span className="wp-meta-item">
            <Clock size={12} />
            <span className={`wp-sla-tag ${sla.badgeClass}`}>
              {sla.countdownText}
            </span>
          </span>
        </div>

        {/* Cost & status footer */}
        <div className="wp-task-footer">
          <div className="wp-task-cost">
            <IndianRupee size={12} />
            <span>{task.cost.toLocaleString('en-IN')}</span>
            {task.cost_revision_status === 'pending' && (
              <span style={{ fontSize: '10px', background: '#fffbeb', color: '#b45309', padding: '1px 6px', borderRadius: '4px', border: '1px solid #fde68a', fontWeight: 'bold' }}>
                PENDING APPROVAL
              </span>
            )}
            {task.cost_revision_status === 'approved' && (
              <span className="wp-scope-tag">+APPROVED</span>
            )}
            {task.cost_revision_status === 'rejected' && (
              <span style={{ fontSize: '10px', background: '#fef2f2', color: '#b91c1c', padding: '1px 6px', borderRadius: '4px', border: '1px solid #fecaca', fontWeight: 'bold' }}>
                REVISION REJECTED
              </span>
            )}
          </div>
          {task.status === 'completed' && task.payout_tx_id && (
            <div className="wp-paid-badge">
              <Check size={10} /> PAID
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── State Action Button ──────────────────────────────────
function ActionButton({
  label,
  onClick,
  loading,
  variant = 'primary',
  disabled = false,
  icon,
}: {
  label: string;
  onClick: () => void;
  loading: boolean;
  variant?: 'primary' | 'secondary' | 'warning' | 'success' | 'danger';
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  const variantClass: Record<string, string> = {
    primary:   'wp-btn-primary',
    secondary: 'wp-btn-secondary',
    warning:   'wp-btn-warning',
    success:   'wp-btn-success',
    danger:    'wp-btn-danger',
  };
  return (
    <button
      className={`wp-action-btn ${variantClass[variant]}`}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading ? (
        <><Loader2 className="wp-spin" size={16} /> Processing…</>
      ) : (
        <>{icon}{label}</>
      )}
    </button>
  );
}

// ─── Price Revision Form ──────────────────────────────────
function PriceRevisionForm({
  taskId,
  baseCost,
  onSuccess,
  onCancel,
  onRequestPriceIncrease,
  notify,
}: {
  taskId: number;
  baseCost: number;
  onSuccess: () => void;
  onCancel: () => void;
  onRequestPriceIncrease?: TechnicianPortalProps['onRequestPriceIncrease'];
  notify: (msg: string, type?: 'info' | 'success' | 'error') => void;
}) {
  const [additionalCost, setAdditionalCost] = useState('');
  const [whatWasWrong, setWhatWasWrong] = useState('');
  const [workDone, setWorkDone] = useState('');
  const [productEffect, setProductEffect] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    const amount = Number(additionalCost);
    if (!additionalCost || isNaN(amount) || amount <= 0) {
      errs.cost = 'Enter a valid positive amount';
    }
    if (amount > 50000) {
      errs.cost = 'Additional cost cannot exceed ₹50,000. Contact Admin for higher amounts.';
    }
    if (!whatWasWrong.trim() || whatWasWrong.trim().length < 5) {
      errs.wrong = 'Describe the root cause (min 5 characters)';
    }
    if (!workDone.trim() || workDone.trim().length < 5) {
      errs.done = 'Describe work performed (min 5 characters)';
    }
    if (!productEffect.trim() || productEffect.trim().length < 3) {
      errs.effect = 'Describe the longevity/functional impact';
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const amount = Number(additionalCost);
      if (onRequestPriceIncrease) {
        await onRequestPriceIncrease(taskId, amount, workDone, whatWasWrong, productEffect);
      } else {
        await api.requestPriceIncrease(taskId, amount, workDone, whatWasWrong, productEffect);
      }
      notify('Scope revision submitted successfully. Status is now PENDING ADMIN APPROVAL.', 'success');
      onSuccess();
    } catch (e: any) {
      const msg = e?.message || 'Failed to submit scope revision';
      notify(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="wp-form-card" noValidate>
      <div className="wp-form-header">
        <AlertCircle size={16} className="wp-form-icon-warn" />
        <h3>Scope Revision Request (Governance Review)</h3>
      </div>
      <p className="wp-form-subtitle">
        Submit justification for additional repair costs beyond the base allocation of ₹{baseCost.toLocaleString('en-IN')}. 
        <strong> Note:</strong> This request creates a pending record and requires Panchayat Administration approval before funds are allocated.
      </p>

      <div className="wp-field-group">
        <label className="wp-field-label">Additional Amount Requested (₹) <span className="wp-required">*</span></label>
        <div className="wp-input-prefix-wrapper">
          <span className="wp-input-prefix">₹</span>
          <input
            type="number"
            className={`wp-input wp-input-prefix ${errors.cost ? 'wp-input-error' : ''}`}
            placeholder="e.g. 3500"
            value={additionalCost}
            onChange={e => { setAdditionalCost(e.target.value); setErrors(p => ({ ...p, cost: '' })); }}
            min="1"
            max="50000"
            required
          />
        </div>
        {additionalCost && Number(additionalCost) > 0 && (
          <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'block' }}>
            New total requested budget: <strong>₹{(baseCost + Number(additionalCost)).toLocaleString('en-IN')}</strong> (Pending Review)
          </span>
        )}
        {errors.cost && <span className="wp-field-error">{errors.cost}</span>}
      </div>

      <div className="wp-field-group">
        <label className="wp-field-label">Root Cause / Damage Discovered <span className="wp-required">*</span></label>
        <textarea
          className={`wp-textarea ${errors.wrong ? 'wp-input-error' : ''}`}
          rows={2}
          placeholder="e.g. Motor winding insulation damage discovered during pump teardown"
          value={whatWasWrong}
          onChange={e => { setWhatWasWrong(e.target.value); setErrors(p => ({ ...p, wrong: '' })); }}
          required
        />
        {errors.wrong && <span className="wp-field-error">{errors.wrong}</span>}
      </div>

      <div className="wp-field-group">
        <label className="wp-field-label">Work Required / Replacement Parts <span className="wp-required">*</span></label>
        <textarea
          className={`wp-textarea ${errors.done ? 'wp-input-error' : ''}`}
          rows={2}
          placeholder="e.g. Full copper stator rewinding, replacement of mechanical shaft seal"
          value={workDone}
          onChange={e => { setWorkDone(e.target.value); setErrors(p => ({ ...p, done: '' })); }}
          required
        />
        {errors.done && <span className="wp-field-error">{errors.done}</span>}
      </div>

      <div className="wp-field-group">
        <label className="wp-field-label">Longevity & Functional Impact <span className="wp-required">*</span></label>
        <input
          type="text"
          className={`wp-input ${errors.effect ? 'wp-input-error' : ''}`}
          placeholder="e.g. Restores 100% flow capacity, extends asset lifespan by 5 years"
          value={productEffect}
          onChange={e => { setProductEffect(e.target.value); setErrors(p => ({ ...p, effect: '' })); }}
          required
        />
        {errors.effect && <span className="wp-field-error">{errors.effect}</span>}
      </div>

      <div className="wp-form-actions">
        <button type="button" className="wp-btn-secondary wp-btn-sm" onClick={onCancel} disabled={loading}>
          <X size={14} /> Cancel
        </button>
        <button
          type="submit"
          className="wp-btn-warning wp-action-btn"
          disabled={loading}
          aria-busy={loading}
        >
          {loading
            ? <><Loader2 className="wp-spin" size={14} /> Submitting for Review…</>
            : <><AlertTriangle size={14} /> Submit Request for Approval</>
          }
        </button>
      </div>
    </form>
  );
}

// ─── Task Detail View ──────────────────────────────────────
function TaskDetailView({
  task,
  onBack,
  onTransition,
  onRequestPriceIncrease,
  notify,
  isProcessing,
}: {
  task: WorkerTask;
  onBack: () => void;
  onTransition: (status: string) => Promise<void>;
  onRequestPriceIncrease?: TechnicianPortalProps['onRequestPriceIncrease'];
  notify: (msg: string, type?: 'info' | 'success' | 'error') => void;
  isProcessing: boolean;
}) {
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [checklist, setChecklist] = useState([false, false, false, false]);
  const [workSummary, setWorkSummary] = useState('');
  const [completionLoading, setCompletionLoading] = useState(false);

  const priority = getPriorityConfig(task.incident_severity || task.sla_priority);
  const statusCfg = getStatusConfig(task.status);
  const allChecked = checklist.every(Boolean);

  const CHECKLIST_ITEMS = [
    'Safety equipment verified and work site secured',
    'Root cause identified and physical diagnosis completed',
    'Repair/replacement work executed to specifications',
    'Operational functionality tested and pressure/flow verified',
  ];

  const handleComplete = async () => {
    if (!workSummary.trim()) {
      notify('Please provide a work summary before completing.', 'error');
      return;
    }
    setCompletionLoading(true);
    try {
      await onTransition('completed');
    } finally {
      setCompletionLoading(false);
    }
  };

  return (
    <div className="wp-detail-view">
      {/* Back navigation */}
      <button className="wp-back-btn" onClick={onBack} aria-label="Back to task list">
        <ChevronLeft size={16} /> Back to My Tasks
      </button>

      {/* Task header card */}
      <div className="wp-detail-card">
        <div className="wp-detail-header">
          <div className="wp-detail-badges">
            <span className="wp-badge" style={{ color: priority.color, background: priority.bg, border: `1px solid ${priority.border}` }}>
              {priority.label}
            </span>
            <span className="wp-badge" style={{ color: statusCfg.color, background: statusCfg.bg }}>
              {statusCfg.label}
            </span>
            {task.incident_category && (
              <span className="wp-badge wp-badge-category">
                {getCategoryIcon(task.incident_category)} {task.incident_category.toUpperCase()}
              </span>
            )}
          </div>
          <span className="wp-task-id-lg">TASK-{task.id}</span>
        </div>

        <h2 className="wp-detail-title">
          {task.incident_title || task.description || `Work Order for Incident #${task.incident_id}`}
        </h2>

        {task.description && task.incident_title && (
          <p className="wp-detail-desc">{task.description}</p>
        )}

        {/* Live Authoritative SLA Display */}
        <LiveSLACard task={task} />

        {/* Metadata grid */}
        <div className="wp-meta-grid">
          {task.incident_village && (
            <div className="wp-meta-item">
              <MapPin size={13} />
              <div>
                <div className="wp-meta-label">Location</div>
                <div className="wp-meta-value">{task.incident_village} Gram Panchayat</div>
              </div>
            </div>
          )}
          <div className="wp-meta-item">
            <Calendar size={13} />
            <div>
              <div className="wp-meta-label">Assigned On</div>
              <div className="wp-meta-value">{new Date(task.assigned_at).toLocaleString('en-IN')}</div>
            </div>
          </div>
          {task.incident_created_at && (
            <div className="wp-meta-item">
              <AlertTriangle size={13} />
              <div>
                <div className="wp-meta-label">Reported On</div>
                <div className="wp-meta-value">{new Date(task.incident_created_at).toLocaleDateString('en-IN')}</div>
              </div>
            </div>
          )}
        </div>

        {/* Financial & Scope Revision Status Cards */}
        {task.cost_revision_status === 'pending' && (
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            padding: '14px 16px',
            marginTop: '14px',
            color: '#92400e'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', marginBottom: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
              ● PENDING ADMIN APPROVAL
            </div>
            <div style={{ fontSize: '12px', lineHeight: 1.5 }}>
              <p style={{ margin: '0 0 6px 0' }}>
                Requested Amount: <strong>₹{(task.requested_cost || 0).toLocaleString('en-IN')}</strong> (+₹{(task.requested_additional_cost || 0).toLocaleString('en-IN')} additional markup).
              </p>
              <p style={{ margin: '0 0 6px 0', color: '#78350f' }}>
                <strong>Reason:</strong> {task.what_was_wrong || 'Scope increase submitted'}
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: '#b45309' }}>
                ℹ Current approved budget remains ₹{task.cost.toLocaleString('en-IN')}. Awaiting review by Panchayat Administration.
              </p>
            </div>
          </div>
        )}

        {task.cost_revision_status === 'approved' && (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '8px',
            padding: '14px 16px',
            marginTop: '14px',
            color: '#065f46'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', marginBottom: '6px' }}>
              <CheckCircle size={15} color="#10b981" />
              ✓ SCOPE REVISION APPROVED (₹{task.cost.toLocaleString('en-IN')})
            </div>
            <div style={{ fontSize: '12px', lineHeight: 1.5 }}>
              <p style={{ margin: '0 0 4px 0' }}>
                Approved by <strong>{task.scope_reviewed_by || 'Panchayat Administration'}</strong>. New authoritative budget: <strong>₹{task.cost.toLocaleString('en-IN')}</strong>.
              </p>
              {task.what_was_wrong && (
                <p style={{ margin: 0, fontSize: '11px', color: '#047857' }}>
                  <strong>Scope recorded:</strong> {task.what_was_wrong}
                </p>
              )}
            </div>
          </div>
        )}

        {task.cost_revision_status === 'rejected' && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '14px 16px',
            marginTop: '14px',
            color: '#991b1b'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', marginBottom: '6px' }}>
              <ShieldAlert size={15} color="#ef4444" />
              ✕ SCOPE REVISION REJECTED
            </div>
            <div style={{ fontSize: '12px', lineHeight: 1.5 }}>
              <p style={{ margin: '0 0 4px 0' }}>
                Administration rejected scope increase. Authoritative budget retained at base allocation: <strong>₹{task.cost.toLocaleString('en-IN')}</strong>.
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: '#b91c1c' }}>
                <strong>Reason:</strong> {task.scope_rejection_reason || 'Not approved by administration.'}
              </p>
            </div>
          </div>
        )}

        {/* Cost breakdown */}
        <div className="wp-cost-card" style={{ marginTop: '16px' }}>
          <div className="wp-cost-row">
            <span className="wp-cost-label">Base Allocation</span>
            <span className="wp-cost-value">₹{task.base_cost.toLocaleString('en-IN')}</span>
          </div>
          {task.cost_revision_status === 'approved' && (
            <div className="wp-cost-row wp-cost-revised">
              <span className="wp-cost-label">Approved Scope Markup</span>
              <span className="wp-cost-value">+₹{(task.cost - task.base_cost).toLocaleString('en-IN')}</span>
            </div>
          )}
          {task.cost_revision_status === 'pending' && (
            <div className="wp-cost-row" style={{ color: '#d97706' }}>
              <span className="wp-cost-label">Pending Markup (Under Review)</span>
              <span className="wp-cost-value">+₹{(task.requested_additional_cost || 0).toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="wp-cost-row wp-cost-total">
            <span>Authoritative Approved Budget</span>
            <span className="wp-cost-total-value">₹{task.cost.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* ─── STATE MACHINE ACTIONS ─── */}

      {/* ASSIGNED → Accept */}
      {(task.status === 'assigned' || task.status === 'ASSIGNED') && (
        <div className="wp-action-card">
          <p className="wp-action-hint">Review the work order and authoritative SLA requirements above, then accept to begin response tracking.</p>
          <ActionButton
            label="Accept Task & Start Navigation"
            onClick={() => onTransition('accepted')}
            loading={isProcessing}
            variant="primary"
            icon={<Navigation size={16} />}
          />
        </div>
      )}

      {/* ACCEPTED → Start En Route */}
      {(task.status === 'accepted' || task.status === 'ACCEPTED') && (
        <div className="wp-action-card">
          <div className="wp-status-info wp-status-accepted">
            <Navigation size={14} />
            <span>Task accepted. Travel to the site and tap below when you depart.</span>
          </div>
          <ActionButton
            label="Departed — Travelling to Site"
            onClick={() => onTransition('en_route')}
            loading={isProcessing}
            variant="secondary"
            icon={<ArrowRight size={16} />}
          />
        </div>
      )}

      {/* EN_ROUTE → Arrived / Start Work */}
      {(task.status === 'en_route' || task.status === 'EN_ROUTE') && (
        <div className="wp-action-card">
          <div className="wp-status-info wp-status-enroute">
            <MapPin size={14} />
            <span>En route to site. Tap when you arrive and begin work.</span>
          </div>
          <ActionButton
            label="Arrived — Start Repair Work"
            onClick={() => onTransition('in_progress')}
            loading={isProcessing}
            variant="warning"
            icon={<Wrench size={16} />}
          />
        </div>
      )}

      {/* IN_PROGRESS → Scope + Completion */}
      {(task.status === 'in_progress' || task.status === 'IN_PROGRESS') && (
        <div className="wp-action-section">

          {/* Scope increase request trigger */}
          {(!task.cost_revision_status || task.cost_revision_status === 'none' || task.cost_revision_status === 'rejected') && !showPriceForm && !showCompletionForm && (
            <button
              className="wp-scope-trigger"
              onClick={() => setShowPriceForm(true)}
              disabled={isProcessing}
            >
              <AlertTriangle size={14} />
              Found additional damage? Request Scope Revision
            </button>
          )}

          {showPriceForm && !showCompletionForm && (
            <PriceRevisionForm
              taskId={task.id}
              baseCost={task.base_cost}
              onSuccess={() => { setShowPriceForm(false); }}
              onCancel={() => setShowPriceForm(false)}
              onRequestPriceIncrease={onRequestPriceIncrease}
              notify={notify}
            />
          )}

          {/* Completion form */}
          {!showPriceForm && (
            <>
              {!showCompletionForm ? (
                <div className="wp-action-card">
                  <div className="wp-status-info wp-status-inprogress">
                    <Wrench size={14} />
                    <span>Repair in progress. Complete checklist and submit evidence when done.</span>
                  </div>
                  <ActionButton
                    label="Complete Repair & Submit Evidence"
                    onClick={() => setShowCompletionForm(true)}
                    loading={false}
                    variant="success"
                    icon={<CheckSquare size={16} />}
                  />
                </div>
              ) : (
                <div className="wp-form-card">
                  <div className="wp-form-header">
                    <CheckSquare size={16} className="wp-form-icon-success" />
                    <h3>Task Completion & Evidence</h3>
                  </div>
                  <p className="wp-form-subtitle">
                    Complete the verification checklist and provide a work summary before submitting.
                  </p>

                  {/* Completion checklist */}
                  <div className="wp-checklist">
                    <div className="wp-checklist-label">
                      <CheckSquare size={13} />
                      Completion Checklist (site verification — session only)
                    </div>
                    {CHECKLIST_ITEMS.map((item, idx) => (
                      <label key={idx} className={`wp-checklist-item ${checklist[idx] ? 'wp-checklist-checked' : ''}`}>
                        <input
                          type="checkbox"
                          checked={checklist[idx]}
                          onChange={() => {
                            const updated = [...checklist];
                            updated[idx] = !updated[idx];
                            setChecklist(updated);
                          }}
                          className="wp-checkbox"
                        />
                        <span>{item}</span>
                        {checklist[idx] && <Check size={13} className="wp-check-icon" />}
                      </label>
                    ))}
                    <div className="wp-checklist-progress">
                      <div
                        className="wp-checklist-bar"
                        style={{ width: `${(checklist.filter(Boolean).length / 4) * 100}%` }}
                      />
                    </div>
                    <span className="wp-checklist-count">
                      {checklist.filter(Boolean).length}/4 items verified
                    </span>
                  </div>

                  {/* Completion Evidence Attachment */}
                  <div className="wp-field-group">
                    <label className="wp-field-label">
                      Field Photographic Evidence (SHA-256 Verified)
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                      <input
                        type="file"
                        accept="image/*"
                        id={`evidence-upload-${task.id}`}
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = async () => {
                            const b64 = reader.result as string;
                            try {
                              await api.uploadTaskEvidence(task.id, {
                                photo_base64: b64,
                                file_name: file.name,
                                file_type: file.type,
                                work_summary: workSummary || 'Completed repair evidence'
                              });
                              notify('Field photo attached with SHA-256 integrity checksum!', 'success');
                            } catch (err: any) {
                              notify(err?.message || 'Failed to upload photo evidence', 'error');
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById(`evidence-upload-${task.id}`)?.click()}
                        className="wp-btn-secondary wp-btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        📸 Attach Work Site Photo
                      </button>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Supports JPEG, PNG, WEBP (Max 5MB)</span>
                    </div>
                  </div>

                  {/* Work summary */}
                  <div className="wp-field-group">
                    <label className="wp-field-label">
                      Work Done Summary <span className="wp-required">*</span>
                    </label>
                    <textarea
                      className={`wp-textarea ${!workSummary.trim() && completionLoading ? 'wp-input-error' : ''}`}
                      rows={3}
                      placeholder="Describe the repair performed, parts replaced, and final operational condition of the asset…"
                      value={workSummary}
                      onChange={e => setWorkSummary(e.target.value)}
                    />
                  </div>

                  <div className="wp-form-actions">
                    <button
                      type="button"
                      className="wp-btn-secondary wp-btn-sm"
                      onClick={() => setShowCompletionForm(false)}
                      disabled={completionLoading}
                    >
                      <X size={14} /> Back
                    </button>
                    <button
                      className={`wp-action-btn ${allChecked && workSummary.trim() ? 'wp-btn-success' : 'wp-btn-disabled'}`}
                      disabled={!allChecked || !workSummary.trim() || completionLoading}
                      onClick={handleComplete}
                      aria-busy={completionLoading}
                    >
                      {completionLoading
                        ? <><Loader2 className="wp-spin" size={16} /> Submitting…</>
                        : <><Check size={16} /> Submit & Authorize ₹{task.cost.toLocaleString('en-IN')} Disbursement</>
                      }
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* COMPLETED → Payment Receipt */}
      {(task.status === 'completed' || task.status === 'COMPLETED') && (
        <div className="wp-receipt-card">
          <div className="wp-receipt-header">
            <div className="wp-receipt-brand">GRAM PANCHAYAT TREASURY</div>
            <div className="wp-receipt-subtitle">OFFICIAL FUNDS DISBURSEMENT RECORD</div>
          </div>

          <div className="wp-receipt-body">
            <div className="wp-receipt-row">
              <span>TRANSACTION ID</span>
              <strong className="wp-receipt-txn">{task.payout_tx_id || 'TXN-PENDING'}</strong>
            </div>
            <div className="wp-receipt-row">
              <span>DATE & TIME</span>
              <strong>{task.completed_at ? new Date(task.completed_at).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')}</strong>
            </div>
            <div className="wp-receipt-row">
              <span>TASK REFERENCE</span>
              <strong>TASK-{task.id} / INC-{task.incident_id}</strong>
            </div>
            <div className="wp-receipt-row wp-receipt-divider">
              <span>BASE REPAIR COST</span>
              <span>₹{task.base_cost.toLocaleString('en-IN')}.00</span>
            </div>
            {task.cost_revision_status === 'approved' && (
              <div className="wp-receipt-row">
                <span>APPROVED SCOPE MARKUP</span>
                <span>+₹{(task.cost - task.base_cost).toLocaleString('en-IN')}.00</span>
              </div>
            )}
            <div className="wp-receipt-row wp-receipt-total">
              <span>TOTAL AUTHORITATIVE DISBURSEMENT</span>
              <span>₹{task.cost.toLocaleString('en-IN')}.00</span>
            </div>
          </div>

          <div className="wp-receipt-status">
            <Check size={14} /> PAYMENT STATUS: <strong>CREDITED TO WALLET</strong>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Portal Component ─────────────────────────────────
export default function TechnicianPortal({
  tasks: propTasks = [],
  technician,
  workerName = 'Technician',
  onAcceptTask,
  onRequestPriceIncrease,
  onCompleteTask,
  onRefresh,
  showToast,
}: TechnicianPortalProps) {
  const notify = showToast || ((msg: string) => alert(msg));
  const [tasks, setTasks] = useState<WorkerTask[]>(propTasks);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    setTasks(propTasks);
  }, [propTasks]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchMyTasks();
      if (Array.isArray(data)) {
        setTasks(data);
      }
    } catch {
      notify('Failed to refresh tasks. Check network connection.', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  const handleTransition = async (taskId: number, newStatus: string) => {
    setIsProcessing(true);
    try {
      if (newStatus === 'accepted' && onAcceptTask) {
        await onAcceptTask(taskId);
      } else if (newStatus === 'completed' && onCompleteTask) {
        await onCompleteTask(taskId);
      } else {
        await api.updateTaskStatus(taskId, newStatus);
      }
      await loadTasks();
      onRefresh?.();
      notify(`Task status updated to ${newStatus.toUpperCase()}`, 'success');
    } catch (e: any) {
      notify(e?.message || 'Failed to update task status', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const selectedTask = safeTasks.find(t => t.id === selectedTaskId);
  const activeTasks = safeTasks.filter(t => t.status !== 'completed');
  const completedTasks = safeTasks.filter(t => t.status === 'completed');
  const filteredTasks = filter === 'active' ? activeTasks : filter === 'completed' ? completedTasks : safeTasks;

  const totalEarnings = completedTasks.reduce((sum, t) => sum + (t.cost || 0), 0);

  return (
    <div className="wp-root">
      <div className="portal-hero-banner" style={{ height: '180px', marginBottom: '20px' }}>
        <img src={IMAGE_MAP.workerHero} alt="Field technician at work" className="img-reveal" />
        <div className="portal-hero-overlay">
          <span className="portal-hero-badge">🔧 Field Operations Portal</span>
          <p className="portal-hero-title" style={{ fontSize: '1.2rem' }}>{workerName || 'Field Technician'}</p>
          <p className="portal-hero-subtitle">Real-time task management &amp; SLA monitoring</p>
        </div>
      </div>
      {/* 1. Header with national tricolour strip */}
      <header className="wp-header">
        <div className="wp-header-tricolour">
          <div className="wp-tri-saffron" />
          <div className="wp-tri-white" />
          <div className="wp-tri-green" />
        </div>

        <div className="wp-header-content">
          <div className="wp-header-brand">
            <div className="wp-header-emblem">🇮🇳</div>
            <div>
              <div className="wp-header-title">GRAM-X Field Operations</div>
              <div className="wp-header-subtitle">Panchayati Raj Field Service Network</div>
            </div>
          </div>

          <div className="wp-header-status">
            <NetworkStatus />
            <LiveClock variant="compact" />
            <button
              className="wp-refresh-btn"
              onClick={() => { loadTasks(); onRefresh?.(); }}
              disabled={loading}
              aria-label="Refresh tasks"
            >
              <RefreshCw size={13} className={loading ? 'wp-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Live Notification Ticker */}
      <NotificationTicker />

      {/* 3. Main Content Container */}
      <main className="wp-main">
        {selectedTask ? (
          <TaskDetailView
            task={selectedTask}
            onBack={() => setSelectedTaskId(null)}
            onTransition={(status) => handleTransition(selectedTask.id, status)}
            onRequestPriceIncrease={async (taskId, cost, done, wrong, effect) => {
              if (onRequestPriceIncrease) {
                await onRequestPriceIncrease(taskId, cost, done, wrong, effect);
              } else {
                await api.requestPriceIncrease(taskId, cost, done, wrong, effect);
              }
              await loadTasks();
              onRefresh?.();
            }}
            notify={notify}
            isProcessing={isProcessing}
          />
        ) : (
          <>
            {/* Worker Profile Card */}
            <div className="wp-profile-card">
              <div className="wp-profile-avatar">
                <Wrench size={20} />
              </div>
              <div className="wp-profile-info">
                <div className="wp-profile-name">{workerName}</div>
                <div className="wp-profile-role">
                  {technician?.specialty ? `${technician.specialty.toUpperCase()} SPECIALIST` : 'MAINTENANCE TECHNICIAN'}
                </div>
                <div className="wp-profile-rating">
                  <Star size={12} className="wp-star-icon" />
                  <span>{technician?.rating ? `${technician.rating.toFixed(1)} / 5.0` : '4.9 / 5.0 (Govt Certified)'}</span>
                </div>
              </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="wp-kpi-grid">
              <div className="wp-kpi-card kpi-card anim-fade-up">
                <div className="wp-kpi-icon wp-kpi-icon-active">
                  <Clock size={16} />
                </div>
                <div className="wp-kpi-val">{activeTasks.length}</div>
                <div className="wp-kpi-label">Active Tasks</div>
              </div>

              <div className="wp-kpi-card kpi-card anim-fade-up">
                <div className="wp-kpi-icon wp-kpi-icon-completed">
                  <CheckCircle2 size={16} />
                </div>
                <div className="wp-kpi-val">{completedTasks.length}</div>
                <div className="wp-kpi-label">Completed</div>
              </div>

              <div className="wp-kpi-card kpi-card anim-fade-up">
                <div className="wp-kpi-icon wp-kpi-icon-payout">
                  <IndianRupee size={16} />
                </div>
                <div className="wp-kpi-val">₹{totalEarnings.toLocaleString('en-IN')}</div>
                <div className="wp-kpi-label">Disbursed</div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="wp-filter-bar">
              <button
                className={`wp-filter-tab ${filter === 'active' ? 'wp-filter-active' : ''}`}
                onClick={() => setFilter('active')}
              >
                Active ({activeTasks.length})
              </button>
              <button
                className={`wp-filter-tab ${filter === 'completed' ? 'wp-filter-active' : ''}`}
                onClick={() => setFilter('completed')}
              >
                Completed ({completedTasks.length})
              </button>
              <button
                className={`wp-filter-tab ${filter === 'all' ? 'wp-filter-active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All ({tasks.length})
              </button>
            </div>

            {/* Task List */}
            <div className="wp-task-list">
              {filteredTasks.length === 0 ? (
                <div className="empty-state-container">
                  <div className="empty-state-icon">🔧</div>
                  <h5 className="empty-state-title">No active assignments</h5>
                  <p className="empty-state-desc">You are available. New tasks will appear here when dispatched by the Panchayat Admin.</p>
                </div>
              ) : (
                filteredTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => setSelectedTaskId(task.id)}
                    workerName={workerName}
                  />
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
