/**
 * GRAM-X Worker Assignment Modal Component
 * Admin tool to select an active field worker and dispatch a task.
 */

import React, { useState, useEffect } from 'react';
import { X, UserCheck, Wrench, AlertCircle } from 'lucide-react';
import { getAvailableWorkers, assignGrievanceToWorker, type Grievance } from '../../services/grievanceService';
import { Button } from '../ui/Button';

export interface AssignWorkerModalProps {
  grievance: Grievance;
  isOpen: boolean;
  onClose: () => void;
  onAssigned: (updated: Grievance) => void;
}

export const AssignWorkerModal = ({
  grievance,
  isOpen,
  onClose,
  onAssigned,
}: AssignWorkerModalProps) => {
  const [workers, setWorkers] = useState<Array<{ id: string; name: string; specialty: string }>>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      getAvailableWorkers().then((list) => {
        setWorkers(list);
        if (list.length > 0) setSelectedWorkerId(list[0].id);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkerId) {
      setErrorMessage('Please select a field worker.');
      return;
    }
    const workerObj = workers.find((w) => w.id === selectedWorkerId);
    const workerName = workerObj?.name || 'Field Technician';

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const updated = await assignGrievanceToWorker(
        grievance.id,
        selectedWorkerId,
        workerName,
        notes.trim() || 'Dispatched for site resolution.'
      );
      onAssigned(updated);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to assign technician.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-bold text-white">Dispatch Field Technician</h3>
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
          <p className="text-slate-400 text-[11px] capitalize">Category: {grievance.category}</p>
        </div>

        <form onSubmit={handleAssign} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Select Available Technician *</label>
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.specialty})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Dispatch Instructions / Scope</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bring replacement 2-inch pipe joint and pressure wrench..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading} loadingText="Assigning...">
              Confirm Dispatch
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignWorkerModal;
