/**
 * GRAM-X Grievance Escalation Modal Component
 * Allows Admin or Worker to escalate complex, stalled, or high-risk issues to District Collector.
 */

import React, { useState } from 'react';
import { X, AlertOctagon, AlertCircle } from 'lucide-react';
import { escalateGrievance, type Grievance } from '../../services/grievanceService';
import { Button } from '../ui/Button';

export interface EscalateGrievanceModalProps {
  grievance: Grievance;
  isOpen: boolean;
  onClose: () => void;
  onEscalated: (updated: Grievance) => void;
}

export const EscalateGrievanceModal = ({
  grievance,
  isOpen,
  onClose,
  onEscalated,
}: EscalateGrievanceModalProps) => {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEscalate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 10) {
      setErrorMessage('Please provide a substantive justification for escalation (min 10 characters).');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const updated = await escalateGrievance(grievance.id, reason.trim());
      onEscalated(updated);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to escalate grievance.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-slate-900 border border-rose-500/30 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertOctagon className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white">Escalate to District Collector</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="bg-rose-950/40 border border-rose-500/50 rounded-xl p-3 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 text-xs space-y-1">
          <span className="text-[10px] font-mono text-sky-400 font-bold">{grievance.reference_no}</span>
          <p className="font-semibold text-white truncate">{grievance.title}</p>
          <p className="text-slate-400 text-[11px]">Current Status: {grievance.status}</p>
        </div>

        <form onSubmit={handleEscalate} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              Reason for District Escalation *
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this requires District Collector intervention (e.g. Budget overhaul, inter-departmental conflict, SLA breach, contractor non-compliance)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              loadingText="Escalating..."
              className="bg-rose-600 hover:bg-rose-500 text-white"
            >
              Confirm Escalation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EscalateGrievanceModal;
