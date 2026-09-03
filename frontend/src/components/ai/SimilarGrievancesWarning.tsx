/**
 * GRAM-X Similar Grievances Warning Banner
 * Alerts citizens or admins to potential duplicate complaints without blocking submission.
 */

import React from 'react';
import { AlertTriangle, ExternalLink, CheckCircle } from 'lucide-react';
import type { SimilarityMatch } from '../../services/ai/types';
import { GrievanceStatusBadge } from '../grievance/GrievanceStatusBadge';

export interface SimilarGrievancesWarningProps {
  matches: SimilarityMatch[];
  onViewExisting?: (grievanceId: string | number) => void;
  className?: string;
}

export const SimilarGrievancesWarning = ({
  matches = [],
  onViewExisting,
  className = '',
}: SimilarGrievancesWarningProps) => {
  if (!matches || matches.length === 0) return null;

  return (
    <div
      className={`bg-amber-950/40 border border-amber-500/40 rounded-xl p-3.5 space-y-2.5 animate-in fade-in ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-bold">Similar Grievances Detected in Panchayat</span>
        </div>
        <span className="text-[10px] text-amber-400 font-semibold bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">
          {matches.length} Potential Match{matches.length > 1 ? 'es' : ''}
        </span>
      </div>

      <p className="text-[11px] text-slate-300">
        We found existing grievances with similar descriptions. If your issue is already being addressed, you can track it instead of submitting a duplicate:
      </p>

      <div className="space-y-1.5">
        {matches.map((m) => (
          <div
            key={m.grievance_id}
            className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between gap-2"
          >
            <div className="space-y-0.5 overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-sky-400 font-bold">{m.reference_no}</span>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded">
                  {Math.round(m.similarity_score * 100)}% match
                </span>
              </div>
              <p className="text-xs text-slate-200 font-medium truncate">{m.title}</p>
            </div>

            {onViewExisting && (
              <button
                type="button"
                onClick={() => onViewExisting(m.grievance_id)}
                className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 shrink-0 hover:underline px-2 py-1"
              >
                Track <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimilarGrievancesWarning;
