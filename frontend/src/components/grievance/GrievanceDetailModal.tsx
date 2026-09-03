/**
 * GRAM-X Grievance Detail Modal Component (Phase 3)
 * Displays:
 * - Full metadata, location coordinates, and status badge
 * - AI Generated Summaries & Routing Recommendations
 * - OCR Text Extraction on uploaded attachments
 * - Auditable Timeline & Comments
 * - Role-Driven Action Controls (Citizen, Worker, Admin, Collector)
 */

import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Search,
  ScanText,
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
import { summarizeGrievance, classifyGrievance } from '../../services/ai/aiService';
import type { AIAnalysisResult } from '../../services/ai/types';
import { extractTextFromAttachment, type OCRExtractionResult } from '../../services/ocr/ocrService';
import { GrievanceStatusBadge } from './GrievanceStatusBadge';
import { GrievanceTimeline } from './GrievanceTimeline';
import { AssignWorkerModal } from './AssignWorkerModal';
import { EscalateGrievanceModal } from './EscalateGrievanceModal';
import { AIRecommendationCard } from '../ai/AIRecommendationCard';
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

  // Phase 3 Smart Data
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [ocrResults, setOcrResults] = useState<Record<string, OCRExtractionResult>>({});

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [resolutionNoteInput, setResolutionNoteInput] = useState('');
  const [showResolutionBox, setShowResolutionBox] = useState(false);

  useEffect(() => {
    setCurrentGrievance(grievance);
    if (grievance) {
      // Fetch AI summary & classification
      summarizeGrievance(grievance.description).then((s) => setAiSummary(s));
      classifyGrievance({
        title: grievance.title,
        description: grievance.description,
        category: grievance.category,
      }).then((res) => setAiAnalysis(res));

      // Scan attachments with OCR
      if (grievance.attachments && grievance.attachments.length > 0) {
        grievance.attachments.forEach((att) => {
          extractTextFromAttachment(att.file_name).then((ocrRes) => {
            setOcrResults((prev) => ({ ...prev, [att.id]: ocrRes }));
          });
        });
      }
    }
  }, [grievance]);

  if (!isOpen || !currentGrievance) return null;

  const handleUpdateGrievance = (updated: Grievance) => {
    setCurrentGrievance(updated);
    if (onGrievanceUpdated) onGrievanceUpdated(updated);
  };

  // Add comment to timeline
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
            <span className="truncate">
              {currentGrievance.location_address || 'Panchayat Area'}
              {currentGrievance.location_lat && (
                <span className="text-[10px] font-mono text-slate-500 ml-1">
                  ({currentGrievance.location_lat.toFixed(3)}°N, {currentGrievance.location_lng?.toFixed(3)}°E)
                </span>
              )}
            </span>
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

        {/* AI Generated Concise Summary (Phase 3) */}
        {aiSummary && (
          <div className="bg-sky-950/30 border border-sky-500/30 rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                AI Generated Executive Summary
              </span>
              <span className="text-[9px] text-slate-500 font-mono">Factual Extraction</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed italic">
              "{aiSummary}"
            </p>
          </div>
        )}

        {/* Description Body */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Citizen Description</h4>
          <p className="text-xs sm:text-sm text-slate-200 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60 leading-relaxed break-words">
            {currentGrievance.description}
          </p>
        </div>

        {/* Attachments Section with OCR Results */}
        {currentGrievance.attachments && currentGrievance.attachments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ScanText className="w-3.5 h-3.5 text-emerald-400" />
              Evidence Attachments &amp; OCR Scans
            </h4>
            <div className="space-y-2">
              {currentGrievance.attachments.map((att) => {
                const ocr = ocrResults[att.id];
                return (
                  <div
                    key={att.id}
                    className="p-3 rounded-xl border border-slate-800 bg-slate-950 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                        <span className="text-xs text-slate-200 font-medium truncate">{att.file_name}</span>
                        <span className="text-[10px] text-slate-500">({(att.file_size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <a
                        href={att.public_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 hover:underline shrink-0"
                      >
                        View File <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {ocr && (
                      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 text-[11px] text-slate-300 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span className="font-bold text-emerald-400 flex items-center gap-1">
                            <ScanText className="w-3 h-3" /> OCR Extracted Text (Confidence: {Math.round(ocr.confidence * 100)}%)
                          </span>
                          <span className="uppercase font-mono">{ocr.language}</span>
                        </div>
                        <p className="text-slate-300 font-mono text-[10px] leading-relaxed break-words">
                          {ocr.extracted_text}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
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
