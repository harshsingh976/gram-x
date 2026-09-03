/**
 * GRAM-X Grievance Auditable Timeline Component
 * Chronological visualization of state transitions, actor updates, and administrative notes.
 */

import React from 'react';
import { Clock, User, Shield, Wrench, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import type { GrievanceUpdate } from '../../services/grievanceService';
import { GrievanceStatusBadge } from './GrievanceStatusBadge';

export interface GrievanceTimelineProps {
  updates?: GrievanceUpdate[];
  className?: string;
}

export const GrievanceTimeline = ({ updates = [], className = '' }: GrievanceTimelineProps) => {
  if (!updates || updates.length === 0) {
    return (
      <div className="py-6 text-center text-slate-500 text-xs">
        No progress events recorded yet.
      </div>
    );
  }

  const getActorIcon = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes('admin') || r.includes('secretary')) return Shield;
    if (r.includes('worker') || r.includes('technician') || r.includes('plumber')) return Wrench;
    if (r.includes('collector') || r.includes('district')) return AlertTriangle;
    return User;
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-sky-400" />
        Audit Trail &amp; Resolution History
      </h4>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {updates.map((update, idx) => {
          const ActorIcon = getActorIcon(update.actor_role);
          const isLatest = idx === updates.length - 1;

          return (
            <div key={update.id || idx} className="relative group">
              {/* Timeline Marker Dot */}
              <div
                className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isLatest
                    ? 'bg-sky-600 border-sky-400 text-white shadow-sm shadow-sky-500/50'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                <ActorIcon className="w-2.5 h-2.5" />
              </div>

              {/* Event Content Box */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 shadow-xs hover:border-slate-700 transition-all">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">
                      {update.actor_name}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700/60 font-medium">
                      {update.actor_role}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {formatTime(update.created_at)}
                  </span>
                </div>

                {/* Status Transition Badges */}
                {update.new_status && (
                  <div className="flex items-center gap-1.5 my-2">
                    {update.old_status && (
                      <>
                        <GrievanceStatusBadge status={update.old_status} size="sm" />
                        <ArrowRight className="w-3 h-3 text-slate-600" />
                      </>
                    )}
                    <GrievanceStatusBadge status={update.new_status} size="sm" />
                  </div>
                )}

                {/* Message Body */}
                <p className="text-xs text-slate-300 leading-relaxed break-words">
                  {update.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GrievanceTimeline;
