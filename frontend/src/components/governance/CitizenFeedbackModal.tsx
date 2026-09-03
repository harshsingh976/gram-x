/**
 * GRAM-X Citizen Feedback Modal
 * Renders 1-5 star satisfaction rating and feedback textarea upon grievance resolution.
 */

import React, { useState } from 'react';
import { Star, X, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import { submitFeedback } from '../../services/feedbackService';
import { Button } from '../ui/Button';

export interface CitizenFeedbackModalProps {
  isOpen: boolean;
  grievanceId: string | number;
  referenceNo: string;
  onClose: () => void;
  onFeedbackSubmitted?: () => void;
}

export const CitizenFeedbackModal = ({
  isOpen,
  grievanceId,
  referenceNo,
  onClose,
  onFeedbackSubmitted,
}: CitizenFeedbackModalProps) => {
  const [rating, setRating] = useState<number>(5);
  const [isSatisfied, setIsSatisfied] = useState<boolean>(true);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitFeedback({
        grievance_id: grievanceId,
        rating,
        is_satisfied: isSatisfied,
        feedback_text: feedbackText,
      });
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        if (onFeedbackSubmitted) onFeedbackSubmitted();
        onClose();
      }, 1200);
    } catch {
      alert('Failed to submit feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white">Rate Remediation Quality</h3>
            <p className="text-[11px] text-slate-400 font-mono">{referenceNo}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-2 animate-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-white">Thank you for your feedback!</p>
            <p className="text-[11px] text-slate-400">
              Your rating helps improve Panchayat civic services.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* 5-Star Rating */}
            <div className="space-y-1.5 text-center py-2">
              <label className="block text-slate-300 font-semibold">
                How satisfied are you with the resolution?
              </label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 cursor-pointer transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Satisfaction Toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsSatisfied(true)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
                  isSatisfied
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" /> Issue Resolved
              </button>
              <button
                type="button"
                onClick={() => setIsSatisfied(false)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
                  !isSatisfied
                    ? 'bg-rose-950 text-rose-300 border-rose-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" /> Not Resolved
              </button>
            </div>

            {/* Feedback Textarea */}
            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Comments (Optional)</label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share any additional comments on the worker or service quality..."
                className="w-full h-20 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-sky-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={isSubmitting}>
                Submit Feedback
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CitizenFeedbackModal;
