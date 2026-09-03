/**
 * GRAM-X Official Bulk Operations Bar
 * Provides bulk assignment, status updates, and scoped CSV/JSON exports with confirmation guards.
 */

import React, { useState } from 'react';
import { CheckSquare, Download, Wrench, ShieldAlert, X } from 'lucide-react';
import type { Grievance, GrievanceStatus } from '../../services/grievanceService';
import { exportGrievancesAsCSV, exportGrievancesAsJSON } from '../../services/exportService';
import { Button } from '../ui/Button';

export interface BulkOperationsBarProps {
  selectedGrievances: Grievance[];
  onClearSelection: () => void;
  onBulkStatusUpdate?: (status: GrievanceStatus) => Promise<void>;
  onBulkAssign?: () => void;
}

export const BulkOperationsBar = ({
  selectedGrievances,
  onClearSelection,
  onBulkStatusUpdate,
  onBulkAssign,
}: BulkOperationsBarProps) => {
  const [isUpdating, setIsUpdating] = useState(false);

  if (selectedGrievances.length === 0) return null;

  const handleExportCSV = () => {
    exportGrievancesAsCSV(selectedGrievances, `gramx_bulk_export_${Date.now()}.csv`);
  };

  const handleExportJSON = () => {
    exportGrievancesAsJSON(selectedGrievances, `gramx_bulk_export_${Date.now()}.json`);
  };

  const handleStatusChange = async (status: GrievanceStatus) => {
    if (!confirm(`Are you sure you want to mark ${selectedGrievances.length} grievances as "${status}"?`)) {
      return;
    }
    if (onBulkStatusUpdate) {
      setIsUpdating(true);
      try {
        await onBulkStatusUpdate(status);
        onClearSelection();
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <div className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:right-8 z-40 max-w-xl bg-slate-900 border border-sky-500/50 rounded-2xl shadow-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-bottom-4">
      <div className="flex items-center gap-2 text-xs">
        <span className="w-6 h-6 rounded-full bg-sky-950 text-sky-400 border border-sky-500/40 flex items-center justify-center font-bold font-mono">
          {selectedGrievances.length}
        </span>
        <span className="font-semibold text-white">Grievances selected</span>
      </div>

      <div className="flex items-center flex-wrap gap-2 text-xs">
        {onBulkAssign && (
          <button
            type="button"
            onClick={onBulkAssign}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl border border-slate-700 flex items-center gap-1.5 font-semibold transition-colors cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5 text-sky-400" /> Assign
          </button>
        )}

        <button
          type="button"
          onClick={handleExportCSV}
          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl border border-slate-700 flex items-center gap-1.5 font-semibold transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
        </button>

        <button
          type="button"
          onClick={onClearSelection}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Clear selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default BulkOperationsBar;
