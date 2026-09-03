/**
 * GRAM-X Reopen / Appeal Grievance Modal
 * Enables a citizen to appeal a closed grievance with justification.
 */

import React, { useState } from 'react';
import { RefreshCw, X, AlertOctagon, Check } from 'lucide-react';
import { requestGrievanceReopen } from '../../services/reopenService';
import { Button } from '../ui/Button';

export interface ReopenGrievanceModalProps {
  isOpen: boolean;
  grievanceId: string | number;
  referenceNo: string;
  onClose: () => void;
  onReopenRequested?: () => void;
}

export const ReopenGrievanceModal = ({
  isOpen,
  grievanceId,
  referenceNo,
  onClose,
  onReopenRequested,
}: ReopenGrievanceModalProps) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    try {
      await requestGrievanceReopen(grievanceId, reason);
      setIsDone(true);
      setTimeout(() => {
        setIsDone(false);
        if (onReopenRequested) onReopenRequested();
        onClose();
      }, 1200);
    } catch {
      alert('Failed to request grievance reopening.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Appeal Grievance Closure</h3>
              <p className="text-[11px] text-slate-400 font-mono">{referenceNo}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isDone ? (
          <div className="py-8 text-center space-y-2 animate-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-white">Reopening Request Submitted</p>
            <p className="text-[11px] text-slate-400">
              Panchayat Administration has been notified to review your appeal.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 text-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[11px]">
                <AlertOctagon className="w-3.5 h-3.5" /> Official Review Required
              </div>
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                If the field remediation was incomplete or the issue has recurred, state your reason
                clearly for administrative evaluation.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Reason for Appeal *</label>
              <textarea
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this grievance should be reopened..."
                className="w-full h-24 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={isSubmitting}
                className="bg-amber-600 hover:bg-amber-500 text-white"
              >
                Submit Appeal
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReopenGrievanceModal;
