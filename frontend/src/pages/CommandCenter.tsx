import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  Shield,
  Activity,
  Users,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Database,
  Server,
  Layers,
  MapPin,
  Flame,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n';
import * as commandCenterService from '../services/commandCenterService';
import type { CommandCenterData } from '../services/commandCenterService';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

export const CommandCenter = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [activeTab, setActiveTab] = useState<'queue' | 'workload' | 'health' | 'anomalies' | 'summary' | 'system'>('queue');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const res = await commandCenterService.getCommandCenterData();
      setData(res);
    } catch (err) {
      console.error('[CommandCenter] Failed to load operational data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Spinner size="lg" className="text-blue-600 mb-3" />
        <p className="text-sm font-semibold text-slate-600">Loading Governance Command Intelligence...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {/* ── Top Command Bar ── */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight">Governance Command Center</h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700/50 uppercase">
                  {role} Scope
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Operational Triage, SLA Risk Intelligence & Decision Support
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              isLoading={refreshing}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
              className="text-slate-200 border-slate-700 hover:bg-slate-800"
            >
              <span className="hidden sm:inline">Sync Live</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/')}
            >
              Exit to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* ── Action Required Panel ── */}
        {data.actions_required.length > 0 && (
          <section aria-labelledby="action-required-heading" className="bg-white rounded-2xl border border-red-200 shadow-sm p-4 sm:p-5 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                <h2 id="action-required-heading" className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  Action Required Now ({data.actions_required.length} Urgent Situations)
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">Requires Official Decision</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {data.actions_required.map((act) => (
                <div
                  key={act.id}
                  className="bg-red-50/70 border border-red-200/80 rounded-xl p-3.5 flex flex-col justify-between hover:bg-red-50 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-600 text-white uppercase tracking-wider text-[10px]">
                        {act.urgency}
                      </span>
                      <span className="text-xs font-mono font-bold text-red-700">{act.count} items</span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 mt-1 leading-snug">{act.title}</h3>
                    <p className="text-xs text-slate-600 mt-1">{act.description}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(act.target_route)}
                    className="mt-3 inline-flex items-center justify-between w-full text-xs font-bold text-red-700 hover:text-red-800 hover:underline pt-2 border-t border-red-200/60"
                  >
                    <span>{act.action_label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Operational Summary KPI Bar ── */}
        <section aria-label="Operational Summary Overview" className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Active</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">{data.summary.total}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Pending Review</span>
            <span className="text-xl font-black text-amber-600 mt-1 block">{data.summary.pending}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">In Progress</span>
            <span className="text-xl font-black text-blue-600 mt-1 block">{data.summary.in_progress}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Resolved</span>
            <span className="text-xl font-black text-emerald-600 mt-1 block">{data.summary.resolved}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-red-200 shadow-sm bg-red-50/30">
            <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider block">Overdue SLA</span>
            <span className="text-xl font-black text-red-600 mt-1 block">{data.summary.overdue}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-purple-200 shadow-sm">
            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block">Escalated</span>
            <span className="text-xl font-black text-purple-600 mt-1 block">{data.summary.escalated}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">Critical P0</span>
            <span className="text-xl font-black text-rose-600 mt-1 block">{data.summary.critical}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-sm bg-amber-50/20">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">SLA Risk &lt;4h</span>
            <span className="text-xl font-black text-amber-700 mt-1 block">{data.summary.approaching_sla}</span>
          </div>
        </section>

        {/* ── Command Navigation Tabs ── */}
        <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'queue'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            🔥 Priority Operational Queue
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('workload')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'workload'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            👥 Worker Workload Intelligence
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('health')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'health'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            📈 Service Health &amp; Trends
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('anomalies')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'anomalies'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            ⚠️ Anomalies &amp; Recurring Issues
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'summary'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            ✨ Executive AI Summary
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'system'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            🛡️ System &amp; Data Quality
          </button>
        </nav>

        {/* ── Tab 1: Priority Queue ── */}
        {activeTab === 'queue' && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Ranked Priority Action Queue</h3>
                <p className="text-xs text-slate-500">
                  Deterministic multi-factor scoring based on SLA proximity, severity, escalation, and recurrence.
                </p>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60 self-start sm:self-auto">
                {data.priority_queue.length} Grievances Ranked
              </span>
            </div>

            <div className="space-y-3">
              {data.priority_queue.map((item) => (
                <div
                  key={item.id}
                  className="border border-slate-200 hover:border-blue-400 rounded-xl p-4 transition-all hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {item.reference_no}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/50">
                        {item.category}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {item.village_name}
                      </span>
                      {item.is_overdue && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-600 text-white uppercase">
                          OVERDUE
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 truncate">{item.title}</h4>

                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Priority Signals:</span>
                      {item.reasons.map((r, i) => (
                        <span key={i} className="text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60 px-2 py-0.5 rounded-md">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between md:justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Urgency Score</span>
                      <span className={`text-lg font-black ${item.score >= 85 ? 'text-red-600' : 'text-amber-600'}`}>
                        {item.score}/100
                      </span>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/?tab=incidents&id=${item.id}`)}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Process
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Tab 2: Worker Workload Intelligence ── */}
        {activeTab === 'workload' && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Technician Capacity &amp; Workload Balancing</h3>
              <p className="text-xs text-slate-500">
                Identifies technician overload and offers human-confirmed task rebalancing suggestions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.worker_workloads.map((w) => (
                <div
                  key={w.worker_id}
                  className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800">{w.worker_name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        w.workload_status === 'OVERLOADED'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : w.workload_status === 'UNDER_CAPACITY'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {w.workload_status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mb-3">{w.role}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Active In Progress</span>
                        <span className="font-bold text-slate-800 text-sm">{w.in_progress_count}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Avg Resolution</span>
                        <span className="font-bold text-slate-800 text-sm">{w.avg_resolution_hours} hrs</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Completed 30d</span>
                        <span className="font-bold text-slate-800 text-sm">{w.completed_last_30d}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Overdue Items</span>
                        <span className={`font-bold text-sm ${w.overdue_count > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {w.overdue_count}
                        </span>
                      </div>
                    </div>

                    {w.reassignment_suggestion && (
                      <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                        <span className="font-bold block mb-0.5">Recommendation:</span>
                        {w.reassignment_suggestion}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={() => navigate('/?tab=worker_management')}
                  >
                    Manage Allocations
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Tab 3: Service Health & Trends ── */}
        {activeTab === 'health' && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Department Performance &amp; Service Health Index</h3>
              <p className="text-xs text-slate-500">
                Composite service health calculated from SLA compliance, 30-day volume trends, and citizen feedback.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.service_health.map((s) => (
                <div key={s.category} className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">{s.category}</h4>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                        s.health_score >= 85 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {s.health_score}/100
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs bg-white p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[10px]">SLA Compliance</span>
                      <span className="font-bold text-slate-900">{s.sla_compliance_pct}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">30-Day Trend</span>
                      <span className={`font-bold flex items-center gap-0.5 ${s.trend_pct > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {s.trend_pct > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {s.trend_pct > 0 ? `+${s.trend_pct}%` : `${s.trend_pct}%`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Satisfaction</span>
                      <span className="font-bold text-slate-900">⭐ {s.citizen_satisfaction}/5.0</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <span className="font-bold text-slate-700 block text-[11px]">Key Contributing Drivers:</span>
                    {s.contributing_factors.map((f, i) => (
                      <p key={i} className="text-slate-500 pl-2 border-l-2 border-slate-300">{f}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Tab 4: Anomalies & Recurring Issues ── */}
        {activeTab === 'anomalies' && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Statistical Anomalies Detected</h3>
              <p className="text-xs text-slate-500">Unusual complaint surges requiring administrative verification.</p>

              <div className="mt-3 space-y-3">
                {data.anomalies.map((anom) => (
                  <div key={anom.id} className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        {anom.location} — {anom.category}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-600 text-white text-[11px]">
                        {anom.spike_factor}
                      </span>
                    </div>
                    <ul className="text-xs text-amber-800 list-disc list-inside space-y-1 pl-1">
                      {anom.possible_factors.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-base font-bold text-slate-900">Recurring Infrastructure Problem Clusters</h3>
              <p className="text-xs text-slate-500">Repetitive failures suggesting systemic root causes over one-off repairs.</p>

              <div className="mt-3 space-y-3">
                {data.recurring_issues.map((rec) => (
                  <div key={rec.id} className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-900">{rec.location}</span>
                      <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                        {rec.incident_count} Occurrences ({rec.timeframe})
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      <strong>Responsible Dept:</strong> {rec.department}
                    </p>
                    <div className="p-2 bg-white rounded-lg border border-purple-100 text-xs text-purple-950 font-medium">
                      💡 Recommended Action: {rec.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Tab 5: Executive AI Summary ── */}
        {activeTab === 'summary' && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Executive AI Governance Narrative</h3>
                  <p className="text-xs text-slate-500">Strictly derived from live verified PostgreSQL database metrics.</p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                AI Advisory Only
              </span>
            </div>

            <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 text-xs sm:text-sm text-slate-800 leading-relaxed space-y-3">
              <p>{data.executive_summary.ai_assisted_narrative}</p>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">CITED SOURCE METRICS:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Grievances</span>
                  <span className="font-bold text-slate-900">{data.executive_summary.total_received}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">SLA Compliance</span>
                  <span className="font-bold text-slate-900">{data.executive_summary.overall_sla_compliance_pct}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Top Surging</span>
                  <span className="font-bold text-amber-700">+{data.executive_summary.top_surging_pct}% ({data.executive_summary.top_surging_category})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Citizen Rating</span>
                  <span className="font-bold text-emerald-700">⭐ {data.executive_summary.citizen_satisfaction_avg}/5.0</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Tab 6: System & Data Quality Health ── */}
        {activeTab === 'system' && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">External Infrastructure Health Status</h3>
              <p className="text-xs text-slate-500">Real-time status of backend, storage, email, and AI providers.</p>

              <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                {Object.entries(data.system_health)
                  .filter(([k]) => k !== 'data_quality_issues')
                  .map(([service, status]) => (
                    <div key={service} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <span className="text-slate-400 uppercase text-[10px] font-bold block mb-1">
                        {service.replace('_', ' ')}
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {String(status)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-base font-bold text-slate-900">Data Quality &amp; Integrity Audit</h3>
              <p className="text-xs text-slate-500">Automated consistency checks on records and spatial boundaries.</p>

              <div className="mt-3 space-y-2">
                {data.system_health.data_quality_issues.map((issue, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      </main>
    </div>
  );
};

export default CommandCenter;
