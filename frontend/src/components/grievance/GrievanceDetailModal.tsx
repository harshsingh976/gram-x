/**
 * GRAM-X Grievance Detail Modal Component
 * Displays complete metadata, evidence attachments, auditable timeline, and role-driven action buttons.
 */

import React, { useState } from 'react';
import {
  X,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
  Wrench,
  AlertOctagon,
  CheckCircle2,
  Check,
  Send,
  MessageSquare,
  FileText,
  ExternalLink,
  Droplets,
  Zap,
  Truck,
  Hammer,
  Building2,
  HelpCircle,
} from 'lucide-react';
import type { Grievance, GrievanceStatus } from '../../services/grievanceService';
import {
  verifyGrievance,
  updateGrievanceStatus,
  addGrievanceComment,
} from '../../services/grievanceService';
import { GrievanceStatusBadge } from './GrievanceStatusBadge';
import { GrievanceTimeline } from './GrievanceTimeline';
import { AssignWorkerModal } from './AssignWorkerModal';
import { EscalateGrievanceModal } from './EscalateGrievanceModal';
import { Button } from '../ui/Button';
import type { UserRole } from '../../types';

export interface GrievanceDetailModalProps {
  grievance: Grievance | null;
  isOpen: boolean;
  onClose: () => void;
  userRole?: UserRole;
  onGrievanceUpdated?: (updated: Grievance) => void;
}

export const GrievanceDetailModal = ({
  grievance,
  isOpen,
  onClose,
  userRole = 'citizen',
  onGrievanceUpdated,
}: GrievanceDetailModalProps) => {
  const [currentGrievance, setCurrentGrievance] = useState<Grievance | null>(grievance);
  const [newComment, setNewComment] = useState('');
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [resolutionNoteInput, setResolutionNoteInput] = useState('');
  const [showResolutionBox, setShowResolutionBox] = useState(false);

  React.useEffect(() => {
    setCurrentGrievance(grievance);
  }, [grievance]);

  if (!isOpen || !currentGrievance) return null;

  const handleUpdateGrievance = (updated: Grievance) => {
    setCurrentGrievance(updated);
    if (onGrievanceUpdated) onGrievanceUpdated(updated);
  };

  // Add a comment to the timeline
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsCommentLoading(true);
    try {
      const actorRoleFormatted =
        userRole === 'admin'
          ? 'Panchayat Secretary'
          : userRole === 'worker'
          ? 'Field Worker'
          : userRole === 'district'
          ? 'District Collector'
          : 'Citizen';

      await addGrievanceComment(currentGrievance.id, newComment.trim(), actorRoleFormatted);
      setNewComment('');
      // Update local timeline
      const updated = { ...currentGrievance };
      updated.updates = [
        ...(updated.updates || []),
        {
          id: `u_${Date.now()}`,
          grievance_id: currentGrievance.id,
          actor_name: typeof localStorage !== 'undefined' ? localStorage.getItem('fullName') || 'User' : 'User',
          actor_role: actorRoleFormatted,
          message: newComment.trim(),
          created_at: new Date().toISOString(),
        },
      ];
      handleUpdateGrievance(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to add comment.');
    } finally {
      setIsCommentLoading(false);
    }
  };

  // Workflow actions
  const handleVerify = async () => {
    setActionLoading(true);
    try {
      const updated = await verifyGrievance(currentGrievance.id);
      handleUpdateGrievance(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to verify grievance.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartWork = async () => {
    setActionLoading(true);
    try {
      const updated = await updateGrievanceStatus(
        currentGrievance.id,
        'IN_PROGRESS',
        'Field technician accepted task and commenced site remediation.',
        'Field Worker'
      );
      handleUpdateGrievance(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!resolutionNoteInput.trim()) {
      alert('Please specify what work was done to resolve the grievance.');
      return;
    }
    setActionLoading(true);
    try {
      const updated = await updateGrievanceStatus(
        currentGrievance.id,
        'RESOLVED',
        resolutionNoteInput.trim(),
        'Field Worker'
      );
      handleUpdateGrievance(updated);
      setShowResolutionBox(false);
      setResolutionNoteInput('');
    } catch (err: any) {
      alert(err.message || 'Failed to resolve grievance.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCitizenClose = async () => {
    setActionLoading(true);
    try {
      const updated = await updateGrievanceStatus(
        currentGrievance.id,
        'CLOSED',
        'Citizen verified on-site fix and confirmed satisfactory grievance closure.',
        'Citizen'
      );
      handleUpdateGrievance(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to close grievance.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCitizenOutcomeGap = async () => {
    setActionLoading(true);
    try {
      const updated = await updateGrievanceStatus(
        currentGrievance.id,
        'IN_PROGRESS',
        'Citizen flagged outcome gap: issue persists or requires further rectification.',
        'Citizen'
      );
      handleUpdateGrievance(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to flag outcome gap.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-6 my-auto max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950/70 border border-sky-500/30 px-2.5 py-0.5 rounded-md">
                {currentGrievance.reference_no}
              </span>
              <GrievanceStatusBadge status={currentGrievance.status} size="sm" />
              <span className="text-[11px] font-semibold text-slate-400 capitalize bg-slate-800 px-2 py-0.5 rounded-md">
                {currentGrievance.category}
              </span>
              <span className="text-[11px] font-semibold text-amber-400 capitalize bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-500/30">
                Priority: {currentGrievance.priority}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white pt-1">
              {currentGrievance.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Location & Metadata Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="truncate">{currentGrievance.location_address || 'Piparli Ward Area'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300 sm:justify-end">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Reported:{' '}
              {new Date(currentGrievance.created_at).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Description Body */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</h4>
          <p className="text-xs sm:text-sm text-slate-200 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60 leading-relaxed break-words">
            {currentGrievance.description}
          </p>
        </div>

        {/* Attachments Section */}
        {currentGrievance.attachments && currentGrievance.attachments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Evidence Attachments (Cloudflare R2)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentGrievance.attachments.map((att) => (
                <a
                  key={att.id}
                  href={att.public_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:border-sky-500/50 transition-colors group"
                >
                  <FileText className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
                  <div className="overflow-hidden">
                    <p className="text-xs text-slate-200 font-medium truncate">{att.file_name}</p>
                    <p className="text-[10px] text-slate-500">{(att.file_size / 1024).toFixed(1)} KB</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-sky-400 ml-auto shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Role-Driven Workflow Actions Box */}
        <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            Authority Action Controls ({userRole.toUpperCase()})
          </h4>

          {/* CITIZEN CONTROLS */}
          {userRole === 'citizen' && (
            <div className="flex flex-wrap gap-2.5">
              {currentGrievance.status === 'RESOLVED' && (
                <>
                  <Button
                    variant="primary"
                    onClick={handleCitizenClose}
                    isLoading={actionLoading}
                    className="bg-teal-600 hover:bg-teal-500 text-xs"
                  >
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    Confirm Resolution &amp; Close
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleCitizenOutcomeGap}
                    isLoading={actionLoading}
                    className="text-xs text-rose-400 hover:bg-rose-950/40"
                  >
                    Flag Outcome Gap (Problem Persists)
                  </Button>
                </>
              )}
              {currentGrievance.status !== 'RESOLVED' && currentGrievance.status !== 'CLOSED' && (
                <p className="text-xs text-slate-400">
                  Your grievance is actively being processed by the Gram Panchayat team. You will be notified when the worker submits resolution proof.
                </p>
              )}
              {currentGrievance.status === 'CLOSED' && (
                <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> This grievance is closed and archived in the Panchayat record.
                </p>
              )}
            </div>
          )}

          {/* WORKER CONTROLS */}
          {userRole === 'worker' && (
            <div className="space-y-2.5">
              {currentGrievance.status === 'ASSIGNED' && (
                <Button
                  variant="primary"
                  onClick={handleStartWork}
                  isLoading={actionLoading}
                  className="w-full sm:w-auto text-xs"
                >
                  <Wrench className="w-3.5 h-3.5 mr-1.5" />
                  Accept Task &amp; Start Remediation
                </Button>
              )}

              {currentGrievance.status === 'IN_PROGRESS' && !showResolutionBox && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="primary"
                    onClick={() => setShowResolutionBox(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Mark Grievance Resolved
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setIsEscalateModalOpen(true)}
                    className="text-rose-400 text-xs hover:bg-rose-950/40"
                  >
                    <AlertOctagon className="w-3.5 h-3.5 mr-1.5" />
                    Escalate to Collector
                  </Button>
                </div>
              )}

              {showResolutionBox && (
                <div className="space-y-2 bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <label className="text-xs font-semibold text-slate-300">
                    Resolution Notes / Work Performed *
                  </label>
                  <textarea
                    rows={2}
                    value={resolutionNoteInput}
                    onChange={(e) => setResolutionNoteInput(e.target.value)}
                    placeholder="Describe parts replaced, pressure tested, or repairs completed..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setShowResolutionBox(false)}
                      disabled={actionLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleResolve}
                      isLoading={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-500 text-xs"
                    >
                      Submit Resolution
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PANCHAYAT ADMIN CONTROLS */}
          {userRole === 'admin' && (
            <div className="flex flex-wrap gap-2">
              {currentGrievance.status === 'SUBMITTED' && (
                <Button
                  variant="primary"
                  onClick={handleVerify}
                  isLoading={actionLoading}
                  className="bg-sky-600 hover:bg-sky-500 text-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                  Verify Grievance
                </Button>
              )}

              {(currentGrievance.status === 'VERIFIED' || currentGrievance.status === 'SUBMITTED') && (
                <Button
                  variant="primary"
                  onClick={() => setIsAssignModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-xs"
                >
                  <Wrench className="w-3.5 h-3.5 mr-1.5" />
                  Assign Field Worker
                </Button>
              )}

              <Button
                variant="ghost"
                onClick={() => setIsEscalateModalOpen(true)}
                className="text-rose-400 text-xs hover:bg-rose-950/40"
              >
                <AlertOctagon className="w-3.5 h-3.5 mr-1.5" />
                Escalate to District Collector
              </Button>
            </div>
          )}

          {/* DISTRICT COLLECTOR CONTROLS */}
          {userRole === 'district' && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={() => setIsAssignModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-xs"
              >
                Re-assign Authority
              </Button>
              <Button
                variant="ghost"
                onClick={async () => {
                  const directive = prompt('Enter District Collector Directive:');
                  if (directive) {
                    const updated = await updateGrievanceStatus(
                      currentGrievance.id,
                      'IN_PROGRESS',
                      `District Collector Directive Issued: ${directive}`,
                      'District Collector'
                    );
                    handleUpdateGrievance(updated);
                  }
                }}
                className="text-xs text-sky-400 hover:bg-sky-950/40"
              >
                Issue District Order
              </Button>
            </div>
          )}
        </div>

        {/* Auditable Timeline */}
        <GrievanceTimeline updates={currentGrievance.updates} />

        {/* Add Comment Box */}
        <form onSubmit={handleAddComment} className="flex gap-2 border-t border-slate-800 pt-4">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add an update note or comment to this grievance record..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
          <Button
            type="submit"
            variant="primary"
            isLoading={isCommentLoading}
            className="shrink-0 text-xs"
          >
            <Send className="w-3.5 h-3.5 mr-1" /> Post
          </Button>
        </form>
      </div>

      {/* Sub-modals for assignment & escalation */}
      <AssignWorkerModal
        grievance={currentGrievance}
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssigned={handleUpdateGrievance}
      />

      <EscalateGrievanceModal
        grievance={currentGrievance}
        isOpen={isEscalateModalOpen}
        onClose={() => setIsEscalateModalOpen(false)}
        onEscalated={handleUpdateGrievance}
      />
    </div>
  );
};

export default GrievanceDetailModal;
