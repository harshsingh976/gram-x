import React from 'react';
import { CheckCircle2, Wrench, ShieldCheck, UserCheck, AlertCircle, Radio } from 'lucide-react';

export interface TimelineStep {
  label: string;
  sublabel?: string;
  status: 'completed' | 'active' | 'pending';
  date?: string;
  actor?: string;
  icon: React.ReactNode;
}

interface WorkflowTimelineProps {
  currentStatus: string;
  createdAt?: string;
  assignedAt?: string;
  completedAt?: string;
  verifiedAt?: string;
  technicianName?: string;
  citizenName?: string;
}

export function WorkflowTimeline({
  currentStatus,
  createdAt,
  assignedAt,
  completedAt,
  verifiedAt,
  technicianName,
  citizenName
}: WorkflowTimelineProps) {
  
  const isAssigned    = ['assigned', 'in_progress', 'completed', 'resolved', 'resolved_confirmed'].includes(currentStatus);
  const isInProgress  = ['in_progress', 'completed', 'resolved', 'resolved_confirmed'].includes(currentStatus);
  const isCompleted   = ['completed', 'resolved', 'resolved_confirmed'].includes(currentStatus);
  const isVerified    = currentStatus === 'resolved_confirmed' || !!verifiedAt;

  const steps: TimelineStep[] = [
    { label: 'Reported',   sublabel: citizenName ? `By ${citizenName}` : 'Grievance Logged', status: 'completed', date: createdAt ? new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : undefined, icon: <Radio size={14} /> },
    { label: 'Dispatched', sublabel: technicianName ? `-> ${technicianName}` : 'Field Tech Assigned', status: isAssigned ? (isInProgress ? 'completed' : 'active') : 'pending', date: assignedAt ? new Date(assignedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : undefined, icon: <AlertCircle size={14} /> },
    { label: 'In Progress', sublabel: 'On-site Repair', status: isInProgress ? (isCompleted ? 'completed' : 'active') : 'pending', icon: <Wrench size={14} /> },
    { label: 'Evidence',   sublabel: 'Photo & Inspection', status: isCompleted ? (isVerified ? 'completed' : 'active') : 'pending', date: completedAt ? new Date(completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : undefined, icon: <ShieldCheck size={14} /> },
    { label: 'Verified',   sublabel: 'Grievance Resolved', status: isVerified ? 'completed' : 'pending', date: verifiedAt ? new Date(verifiedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : undefined, icon: <UserCheck size={14} /> }
  ];

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm my-4 anim-fade-up">
      <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-sky-600" />
          Service Request Lifecycle
        </h4>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 capitalize">
          {currentStatus.replace(/_/g, ' ')}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const connDone = step.status === 'completed' && idx < steps.length - 1;
          return (
            <React.Fragment key={idx}>
              <div className={`anim-fade-up anim-stagger-${Math.min(idx + 1, 6)}`}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minWidth: '64px', flex: 1 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 12, transition: 'all 0.3s ease',
                  background: step.status === 'completed' ? '#15803d' : step.status === 'active' ? '#0284c7' : '#f1f5f9',
                  color: step.status === 'pending' ? '#94a3b8' : '#ffffff',
                  border: step.status === 'active' ? '3px solid #bae6fd' : step.status === 'pending' ? '2px solid #e2e8f0' : 'none',
                  boxShadow: step.status === 'active' ? '0 0 0 4px rgba(2,132,199,0.15)' : step.status === 'completed' ? '0 2px 8px rgba(21,128,61,0.3)' : 'none',
                }}>
                  {step.status === 'completed' ? <CheckCircle2 size={16} /> : step.icon}
                </div>
                <p style={{ fontSize: 11, fontWeight: 700, color: step.status === 'pending' ? '#94a3b8' : '#0f172a', marginTop: 6, lineHeight: 1.2 }}>{step.label}</p>
                {step.sublabel && <p style={{ fontSize: 9, color: '#64748b', marginTop: 2, lineHeight: 1.3, maxWidth: 68 }}>{step.sublabel}</p>}
                {step.date && <span style={{ fontSize: 9, fontWeight: 600, color: '#0284c7', background: '#e0f2fe', padding: '1px 5px', borderRadius: 4, marginTop: 4, display: 'inline-block' }}>{step.date}</span>}
              </div>
              {!isLast && (
                <div style={{ flex: 0, alignSelf: 'flex-start', marginTop: 17, minWidth: 12, width: 16 }}>
                  <div style={{ height: 2, width: '100%', borderRadius: 2, background: connDone ? '#15803d' : '#e2e8f0', transition: 'background 0.5s ease' }} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div style={{ marginTop: 16 }}>
        <div className="progress-bar-animated">
          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 10, color: '#64748b' }}>{completedCount}/{steps.length} stages completed</span>
          <span style={{ fontSize: 10, color: '#64748b' }}>{progressPct}% complete</span>
        </div>
      </div>
    </div>
  );
}
