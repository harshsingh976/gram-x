/**
 * GRAM-X AI Recommendation Card Component
 * Advisory, non-overriding display of AI classification, priority suggestion, and department routing.
 */

import React from 'react';
import { Sparkles, Check, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import type { AIAnalysisResult } from '../../services/ai/types';
import type { GrievanceCategory, GrievancePriority } from '../../services/grievanceService';

export interface AIRecommendationCardProps {
  analysis: AIAnalysisResult | null;
  onApplyRecommendations?: (category: GrievanceCategory, priority: GrievancePriority) => void;
  className?: string;
}

export const AIRecommendationCard = ({
  analysis,
  onApplyRecommendations,
  className = '',
}: AIRecommendationCardProps) => {
  if (!analysis) return null;

  const confidencePct = Math.round(analysis.confidence_score * 100);

  return (
    <div
      className={`bg-slate-950 border border-sky-500/40 rounded-xl p-3.5 shadow-lg space-y-2.5 animate-in fade-in ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sky-400">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="text-xs font-bold text-white">AI Advisory Triage</span>
          <span className="text-[10px] font-mono bg-sky-950 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full">
            {confidencePct}% Confidence
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">
          Model: {analysis.model_name}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Suggested Category</span>
          <strong className="text-white capitalize">{analysis.suggested_category}</strong>
        </div>

        <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Suggested Priority</span>
          <strong className="text-amber-400 capitalize">{analysis.suggested_priority}</strong>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        {analysis.explanation}
      </p>

      {onApplyRecommendations && (
        <button
          type="button"
          onClick={() => onApplyRecommendations(analysis.suggested_category, analysis.suggested_priority)}
          className="w-full text-xs font-bold text-sky-300 hover:text-white bg-sky-950 hover:bg-sky-900/80 border border-sky-500/40 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
          Apply Suggested Category &amp; Priority
        </button>
      )}
    </div>
  );
};

export default AIRecommendationCard;
