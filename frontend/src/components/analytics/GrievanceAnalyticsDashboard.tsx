/**
 * GRAM-X Grievance Analytics & AI Insights Dashboard
 * Renders real aggregate metrics, category breakdowns, resolution rates, and data-backed AI insights.
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertOctagon,
  TrendingUp,
  BarChart3,
  Sparkles,
  Droplets,
  Zap,
  Truck,
  Hammer,
  Building2,
  HelpCircle,
} from 'lucide-react';
import type { Grievance, GrievanceCategory } from '../../services/grievanceService';
import { generateDashboardInsights } from '../../services/ai/aiService';
import type { AIInsightMetric } from '../../services/ai/types';

export interface GrievanceAnalyticsDashboardProps {
  grievances: Grievance[];
  title?: string;
  className?: string;
}

export const GrievanceAnalyticsDashboard = ({
  grievances = [],
  title = 'Panchayat Grievance Analytics & AI Insights',
  className = '',
}: GrievanceAnalyticsDashboardProps) => {
  const [aiInsights, setAiInsights] = useState<AIInsightMetric[]>([]);

  // Compute actual database statistics
  const stats = useMemo(() => {
    const total = grievances.length;
    let pending = 0;
    let inProgress = 0;
    let resolved = 0;
    let escalated = 0;

    const byCategory: Record<GrievanceCategory, number> = {
      water: 0,
      electricity: 0,
      roads: 0,
      sanitation: 0,
      infrastructure: 0,
      other: 0,
    };

    const byPriority: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    for (const g of grievances) {
      if (g.status === 'SUBMITTED' || g.status === 'VERIFIED') pending++;
      else if (g.status === 'ASSIGNED' || g.status === 'IN_PROGRESS') inProgress++;
      else if (g.status === 'RESOLVED' || g.status === 'CLOSED') resolved++;
      else if (g.status === 'ESCALATED') escalated++;

      if (byCategory[g.category] !== undefined) byCategory[g.category]++;
      if (byPriority[g.priority] !== undefined) byPriority[g.priority]++;
    }

    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 100;

    return {
      total,
      pending,
      inProgress,
      resolved,
      escalated,
      resolutionRate,
      byCategory,
      byPriority,
    };
  }, [grievances]);

  useEffect(() => {
    generateDashboardInsights(stats).then((insights) => {
      setAiInsights(insights);
    });
  }, [stats]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Header & Quick Stat Cards */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sky-400" />
            {title}
          </h3>
          <p className="text-xs text-slate-400">
            Real-time aggregate data computed across {stats.total} logged ward records.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Total Received</span>
          <div className="text-xl font-extrabold text-white">{stats.total}</div>
          <span className="text-[10px] text-slate-500 font-mono">100% recorded</span>
        </div>

        <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-3.5 space-y-1">
          <span className="text-[11px] text-amber-300 font-medium">Pending Triage</span>
          <div className="text-xl font-extrabold text-amber-400">{stats.pending}</div>
          <span className="text-[10px] text-amber-500/80 font-mono">Requires verification</span>
        </div>

        <div className="bg-slate-900/90 border border-blue-500/30 rounded-xl p-3.5 space-y-1">
          <span className="text-[11px] text-blue-300 font-medium">In Remediation</span>
          <div className="text-xl font-extrabold text-blue-400">{stats.inProgress}</div>
          <span className="text-[10px] text-blue-500/80 font-mono">Field technicians active</span>
        </div>

        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-3.5 space-y-1">
          <span className="text-[11px] text-emerald-300 font-medium">Resolution Rate</span>
          <div className="text-xl font-extrabold text-emerald-400">{stats.resolutionRate}%</div>
          <span className="text-[10px] text-emerald-500/80 font-mono">{stats.resolved} issues fixed</span>
        </div>
      </div>

      {/* 2. Category Distribution Breakdown */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Grievance Volume by Infrastructure Category
        </h4>

        <div className="space-y-3">
          {Object.entries(stats.byCategory).map(([cat, count]) => {
            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            return (
              <div key={cat} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="capitalize font-semibold text-slate-200">{cat}</span>
                  <span className="text-slate-400 font-mono">
                    {count} ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    style={{ width: `${pct}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      cat === 'water'
                        ? 'bg-sky-500'
                        : cat === 'electricity'
                        ? 'bg-amber-500'
                        : cat === 'roads'
                        ? 'bg-orange-500'
                        : cat === 'sanitation'
                        ? 'bg-rose-500'
                        : 'bg-purple-500'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. AI Data-Driven Executive Insights */}
      {aiInsights.length > 0 && (
        <div className="bg-slate-900/80 border border-sky-500/30 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              AI Executive Triage &amp; Pattern Insights
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">Derived from live metrics</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {aiInsights.map((ins) => (
              <div
                key={ins.id}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{ins.title}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      ins.severity === 'success'
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                        : ins.severity === 'warning'
                        ? 'bg-amber-950/60 text-amber-400 border-amber-500/30'
                        : 'bg-sky-950/60 text-sky-400 border-sky-500/30'
                    }`}
                  >
                    {ins.value}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{ins.description}</p>
                <span className="text-[10px] text-slate-500 font-mono block pt-1">
                  Source: {ins.based_on_metric}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GrievanceAnalyticsDashboard;
