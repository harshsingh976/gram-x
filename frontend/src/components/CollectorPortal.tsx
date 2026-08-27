import React, { useState, useMemo } from 'react';
import { 
  Activity, AlertTriangle, ShieldAlert, Map, 
  Download, FileText, ChevronRight, TrendingDown, 
  TrendingUp, BarChart3, AlertOctagon, Eye, CheckCircle2,
  Clock, ArrowLeft, Send, ShieldCheck, Layers, Wrench,
  GitFork, RefreshCw, HelpCircle, AlertCircle
} from 'lucide-react';
import type { Village, Incident, Task } from '../types';
import { IMAGE_MAP, getServiceImage, getInitials, getRoleAvatarGradient } from '../imageMap';
import { DigitalTwinViewer } from './DigitalTwinViewer';
import * as api from '../api';
import LiveClock from './LiveClock';
import NotificationTicker from './NotificationTicker';


interface CollectorPortalProps {
  villages?: Village[];
  incidents?: any[];
  tasks?: any[];
  onSelectVillage?: (villageId: number) => void;
  onSelectIncident?: (incidentId: number) => void;
  onRefresh?: () => void;
  showToast?: (message: string, type?: 'info' | 'success' | 'error') => void;
  districtName?: string;
}

export default function CollectorPortal({
  villages = [],
  incidents = [],
  tasks = [],
  onSelectVillage,
  onSelectIncident,
  onRefresh,
  showToast,
  districtName = 'Raisen'
}: CollectorPortalProps) {
  const notify = showToast || ((msg: string) => alert(msg));
  const [selectedEscalationId, setSelectedEscalationId] = useState<number | null>(null);
  const [directiveText, setDirectiveText] = useState('');
  const [priorityOverride, setPriorityOverride] = useState('critical');
  const [isSubmittingDirective, setIsSubmittingDirective] = useState(false);
  const [governanceHealth, setGovernanceHealth] = useState<any | null>(null);
  const [collectorSummary, setCollectorSummary] = useState<any | null>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [detailedEscalation, setDetailedEscalation] = useState<any | null>(null);

  // Recurring Problems & Root-Cause Intelligence State
  const [recurringClusters, setRecurringClusters] = useState<any[]>([]);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [selectedClusterDetail, setSelectedClusterDetail] = useState<any | null>(null);
  const [selectedClusterIncidents, setSelectedClusterIncidents] = useState<any[]>([]);
  const [clusterDirectiveText, setClusterDirectiveText] = useState('');
  const [isIssuingClusterDirective, setIsIssuingClusterDirective] = useState(false);
  const [isLoadingClusters, setIsLoadingClusters] = useState(false);

  const loadClusters = () => {
    setIsLoadingClusters(true);
    api.fetchRecurringProblems()
      .then(res => {
        setRecurringClusters(res.clusters || []);
        setIsLoadingClusters(false);
      })
      .catch(() => setIsLoadingClusters(false));
  };

  React.useEffect(() => {
    api.fetchGovernanceHealth()
      .then(data => setGovernanceHealth(data))
      .catch(() => {});

    api.fetchCollectorExecutiveSummary()
      .then(data => setCollectorSummary(data))
      .catch(() => {});

    api.fetchRecentGovernanceActivity(8)
      .then(data => setRecentActivities(Array.isArray(data) ? data : []))
      .catch(() => {});

    loadClusters();
  }, [incidents, tasks]);

  React.useEffect(() => {
    if (selectedClusterId) {
      api.fetchRecurringProblemDetail(selectedClusterId)
        .then(data => setSelectedClusterDetail(data))
        .catch(() => setSelectedClusterDetail(null));

      api.fetchRecurringProblemIncidents(selectedClusterId)
        .then(data => setSelectedClusterIncidents(Array.isArray(data) ? data : []))
        .catch(() => setSelectedClusterIncidents([]));
    } else {
      setSelectedClusterDetail(null);
      setSelectedClusterIncidents([]);
    }
  }, [selectedClusterId]);

  const handleIssueClusterDirective = async (clusterId: string) => {
    if (!clusterDirectiveText.trim()) {
      notify('Please enter structural intervention instructions before issuing.', 'error');
      return;
    }
    setIsIssuingClusterDirective(true);
    try {
      await api.issueClusterDirective(clusterId, clusterDirectiveText, 'critical');
      notify(`Official Structural Intervention Directive issued for cluster ${clusterId}!`, 'success');
      setClusterDirectiveText('');
      loadClusters();
      onRefresh?.();
    } catch (e: any) {
      notify(e?.message || 'Failed to issue structural directive', 'error');
    } finally {
      setIsIssuingClusterDirective(false);
    }
  };

  React.useEffect(() => {
    if (selectedEscalationId) {
      api.fetchIncidentDetail(selectedEscalationId)
        .then(data => setDetailedEscalation(data))
        .catch(() => {});
    } else {
      setDetailedEscalation(null);
    }
  }, [selectedEscalationId]);

  const handleIssueDirective = async (incidentId: number) => {
    if (!directiveText.trim()) {
      notify('Please write directive instructions before issuing.', 'error');
      return;
    }
    setIsSubmittingDirective(true);
    try {
      await api.issueCollectorDirective(incidentId, directiveText, priorityOverride);
      notify('Collector Administrative Directive issued and logged in district audit logs!', 'success');
      setDirectiveText('');
      onRefresh?.();
      if (selectedEscalationId) {
        api.fetchIncidentDetail(selectedEscalationId).then(data => setDetailedEscalation(data));
      }
    } catch (e: any) {
      notify(e?.message || 'Failed to issue administrative directive', 'error');
    } finally {
      setIsSubmittingDirective(false);
    }
  };

  // Compute live district metrics from actual database collections
  const totalIncidents = incidents.length;
  const resolvedIncidents = incidents.filter(i => 
    i.status === 'resolved' || i.status === 'completed' || i.status === 'resolved_confirmed'
  ).length;
  const unresolvedCount = totalIncidents - resolvedIncidents;
  const resolutionRate = totalIncidents > 0 
    ? Math.round((resolvedIncidents / totalIncidents) * 100) 
    : 100;

  const criticalIncidentsList = incidents.filter(i => 
    i.severity === 'critical' || i.severity === 'high' || (i.priority_score && i.priority_score >= 70)
  );
  const criticalCount = criticalIncidentsList.length;

  // SLA compliance: incidents resolved or on track
  const breachedIncidents = incidents.filter(i => 
    i.sla_status === 'breached' || i.sla_status === 'at_risk' || (i.status === 'pending_verification')
  );
  const slaCompliance = totalIncidents > 0 
    ? Math.max(0, Math.round(((totalIncidents - breachedIncidents.length) / totalIncidents) * 100))
    : 95;

  // District total budget utilization
  const totalAllocated = villages.reduce((acc, v) => acc + (v.budget_allocated || 0), 0);
  const totalSpent = villages.reduce((acc, v) => acc + (v.budget_spent || 0), 0);
  const remainingDistrictBudget = totalAllocated - totalSpent;
  const budgetUtilization = totalAllocated > 0 
    ? Math.min(100, Math.round((totalSpent / totalAllocated) * 100)) 
    : 0;

  // Panchayat ranking by unresolved incidents
  const panchayatRanking = useMemo(() => {
    return villages.map(v => {
      const vIncs = incidents.filter(i => i.village_id === v.id);
      const vUnresolved = vIncs.filter(i => i.status !== 'resolved' && i.status !== 'resolved_confirmed');
      const vBreached = vIncs.filter(i => i.sla_status === 'breached');
      const vSpent = v.budget_spent || 0;
      const vAlloc = v.budget_allocated || 0;
      return {
        village: v,
        total: vIncs.length,
        unresolved: vUnresolved.length,
        breached: vBreached.length,
        spent: vSpent,
        allocated: vAlloc,
        remaining: vAlloc - vSpent,
        utilization: vAlloc > 0 ? Math.round((vSpent / vAlloc) * 100) : 0
      };
    }).sort((a, b) => b.unresolved - a.unresolved);
  }, [villages, incidents]);

  // District Health classification
  const districtHealth = useMemo(() => {
    if (slaCompliance >= 85 && resolutionRate >= 80) return { label: 'OPTIMAL', color: 'emerald', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-400' };
    if (slaCompliance >= 65 && resolutionRate >= 60) return { label: 'WATCH', color: 'amber', text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-400' };
    return { label: 'CRITICAL', color: 'red', text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-400' };
  }, [slaCompliance, resolutionRate]);

  // Dynamic Governance Insights
  const insights = useMemo(() => {
    const list = [];
    
    // Top village with most incidents
    const villageCounts: { [key: number]: number } = {};
    incidents.forEach(i => {
      villageCounts[i.village_id] = (villageCounts[i.village_id] || 0) + 1;
    });
    let topVillageId = 0;
    let topCount = 0;
    Object.entries(villageCounts).forEach(([vid, count]) => {
      if (count > topCount) {
        topCount = count;
        topVillageId = Number(vid);
      }
    });
    const topVillage = villages.find(v => v.id === topVillageId);
    if (topVillage) {
      list.push({
        icon: AlertOctagon,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-100',
        title: `${topVillage.name} has the highest active incident load.`,
        desc: `Currently tracking ${topCount} service tickets across panchayat infrastructure.`
      });
    }

    // Water category share
    const waterCount = incidents.filter(i => i.category === 'water').length;
    const waterPct = totalIncidents > 0 ? Math.round((waterCount / totalIncidents) * 100) : 0;
    list.push({
      icon: Activity,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      title: `Water infrastructure represents ${waterPct}% of service load.`,
      desc: `${waterCount} total water issues registered in current operating cycle.`
    });

    // Verification rate
    const verifiedCount = incidents.filter(i => i.status === 'resolved_confirmed' || i.status === 'verified').length;
    const verificationPct = resolvedIncidents > 0 ? Math.round((verifiedCount / resolvedIncidents) * 100) : 100;
    list.push({
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      title: `Citizen Verification Rate is ${verificationPct}%.`,
      desc: `${verifiedCount} resolutions physically verified by citizen audits.`
    });

    // Budget insight
    list.push({
      icon: ShieldAlert,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      title: `District treasury expenditure at ₹${totalSpent.toLocaleString()} (${budgetUtilization}%).`,
      desc: `Total allocated capital ₹${totalAllocated.toLocaleString()} across ${villages.length} Gram Panchayats.`
    });

    return list;
  }, [incidents, villages, totalIncidents, resolvedIncidents, totalSpent, totalAllocated, budgetUtilization]);

  // Critical Escalations List (Real DB data)
  const activeEscalations = useMemo(() => {
    return incidents.filter(i => 
      i.status === 'pending_verification' || 
      i.sla_status === 'breached' || 
      i.severity === 'critical' || 
      (i.priority_score && i.priority_score >= 80)
    ).slice(0, 5);
  }, [incidents]);

  // Export District CSV Report
  const handleExportReport = () => {
    const headers = ['Incident_ID', 'Village_ID', 'Village_Name', 'Title', 'Category', 'Severity', 'Status', 'Priority_Score', 'Created_At'];
    const rows = incidents.map(i => {
      const v = villages.find(vil => vil.id === i.village_id);
      return [
        `INC-${i.id}`,
        i.village_id,
        `"${v ? v.name : 'Unknown'}"`,
        `"${(i.title || '').replace(/"/g, '""')}"`,
        i.category,
        i.severity,
        i.status,
        i.priority_score || 'N/A',
        i.created_at || 'N/A'
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GRAM_X_${districtName.toUpperCase()}_DISTRICT_GOVERNANCE_REPORT_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedEscalation = incidents.find(i => i.id === selectedEscalationId);

  return (
    <div className="w-full bg-slate-50 font-sans pb-12 rounded-xl overflow-hidden border border-slate-200">
      <div className="portal-hero-banner" style={{ height: '200px', marginBottom: 0 }}>
        <img src={IMAGE_MAP.collectorHero} alt="District aerial view" className="img-reveal" />
        <div className="portal-hero-overlay">
          <span className="portal-hero-badge">🌏 District Collector Command</span>
          <p className="portal-hero-title">District Governance Overview</p>
          <p className="portal-hero-subtitle">Raisen District &bull; Real-time intelligence &amp; oversight</p>
        </div>
        <div style={{ position: 'absolute', top: 12, right: 16, zIndex: 5 }}>
          <LiveClock variant="compact" lightText />
        </div>
      </div>
      
      {/* Live Notification Ticker */}
      <NotificationTicker />
      
      {/* Top Navbar */}
      <header className="bg-indigo-950 text-white p-4 sticky top-0 z-20 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-800 p-2 rounded-lg"><Map className="w-6 h-6 text-indigo-200" /></div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">GRAM-X District Oversight</h1>
            <p className="text-indigo-300 text-xs mt-0.5">District: {districtName} | Collectorate Command Center</p>
          </div>
        </div>
        
        {/* Real CSV Export Button */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:block">
            <LiveClock variant="full" lightText />
          </div>
          <button 
            onClick={handleExportReport}
            className="flex items-center gap-2 bg-indigo-800 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export District Report ({incidents.length} Records)
          </button>
          <div className="flex items-center gap-3 border-l border-indigo-800 pl-4">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold">District Magistrate</p>
              <p className="text-xs text-indigo-300">Level 4 Oversight Authority</p>
            </div>
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center font-bold shadow-inner">DM</div>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* DISTRICT COMMAND CENTER OPERATIONAL ALERT RAIL */}
        <div className="bg-indigo-950 border border-indigo-900 rounded-xl p-3 shadow-sm flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-indigo-200 uppercase tracking-wider">
            <Activity className="w-4 h-4 text-indigo-400" /> District Operational Rail:
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-red-950/80 border border-red-800 text-red-300 px-3 py-1.5 rounded-lg font-bold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              🔴 {criticalCount} Critical
            </div>
            <div className="flex items-center gap-1.5 bg-amber-950/80 border border-amber-800 text-amber-300 px-3 py-1.5 rounded-lg font-bold">
              🟠 {breachedIncidents.length} SLA Risks
            </div>
            <div className="flex items-center gap-1.5 bg-yellow-950/80 border border-yellow-800 text-yellow-300 px-3 py-1.5 rounded-lg font-bold">
              🟡 {governanceHealth?.summary?.citizen_outcome_gaps || 0} Outcome Gaps
            </div>
            <div className="flex items-center gap-1.5 bg-indigo-900/80 border border-indigo-700 text-indigo-200 px-3 py-1.5 rounded-lg font-bold">
              💰 {governanceHealth?.financial_reconciliation?.is_balanced === false ? '1 Financial Warning' : '0 Financial Mismatch'}
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 px-3 py-1.5 rounded-lg font-bold">
              🟢 {governanceHealth?.status === 'healthy' ? '0 Integrity Failures' : '1 Integrity Attention'}
            </div>
          </div>
        </div>

        {/* 3D GOVERNMENT DIGITAL TWIN & SPATIAL SIMULATION SPHERE */}
        <div style={{ marginBottom: '24px' }}>
          <DigitalTwinViewer />
        </div>

        {/* DISTRICT EXECUTIVE SUMMARY (5 Core Governance Questions) */}
        <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-700" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">District Executive Summary</h2>
            </div>
            <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full font-bold">
              Authoritative District Telemetry
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs">
            {/* 1. What is Happening? */}
            <div className="collector-stat-block anim-fade-up anim-stagger-1 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div className="card-icon-badge">🔄</div>
              <span className="font-bold text-indigo-900 uppercase text-[10px] block mb-1.5">1. What is Happening?</span>
              <p className="text-slate-700"><strong>{collectorSummary?.what_is_happening?.active_unresolved ?? unresolvedCount}</strong> Unresolved Complaints</p>
              <p className="text-slate-600 mt-1"><strong>{collectorSummary?.what_is_happening?.completed_resolved ?? (incidents.length - unresolvedCount)}</strong> Confirmed Resolved</p>
              <p className="text-slate-500 mt-1 text-[11px]">Active Tasks: {collectorSummary?.what_is_happening?.active_tasks ?? 0}</p>
            </div>

            {/* 2. Where is it Happening? */}
            <div className="collector-stat-block anim-fade-up anim-stagger-2 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div className="card-icon-badge">⚠️</div>
              <span className="font-bold text-indigo-900 uppercase text-[10px] block mb-1.5">2. Where is it Happening?</span>
              <p className="text-slate-800 font-semibold">
                Top Load: <strong>{collectorSummary?.where_is_it_happening?.[0]?.name || 'Piparli'}</strong>
              </p>
              <p className="text-amber-700 mt-1">
                Highest Risks: {collectorSummary?.where_is_it_happening?.[0]?.unresolved_count || 0} Open Tickets
              </p>
              <p className="text-slate-500 mt-1 text-[11px]">Ranked across {villages.length} Panchayats</p>
            </div>

            {/* 3. What is Going Wrong? */}
            <div className="collector-stat-block anim-fade-up anim-stagger-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div className="card-icon-badge">💥</div>
              <span className="font-bold text-red-900 uppercase text-[10px] block mb-1.5">3. What is Going Wrong?</span>
              <p className="text-red-700"><strong>{collectorSummary?.what_is_going_wrong?.sla_breaches ?? breachedIncidents.length}</strong> SLA Breaches</p>
              <p className="text-amber-700 mt-1"><strong>{collectorSummary?.what_is_going_wrong?.citizen_outcome_gaps ?? (governanceHealth?.summary?.citizen_outcome_gaps || 0)}</strong> Outcome Gaps</p>
              <p className="text-slate-500 mt-1 text-[11px]">
                {collectorSummary?.what_is_going_wrong?.financial_variance_detected ? '⚠️ Ledger Variance' : '✓ Financial Balanced'}
              </p>
            </div>

            {/* 4. How Much is it Costing? */}
            <div className="collector-stat-block anim-fade-up anim-stagger-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div className="card-icon-badge">📝</div>
              <span className="font-bold text-emerald-900 uppercase text-[10px] block mb-1.5">4. How Much is it Costing?</span>
              <p className="text-slate-800">Spent: <strong>₹{(collectorSummary?.how_much_is_costing?.total_spent || totalSpent).toLocaleString('en-IN')}</strong></p>
              <p className="text-emerald-700 mt-1">Remaining: <strong>₹{(collectorSummary?.how_much_is_costing?.total_remaining || (totalAllocated - totalSpent)).toLocaleString('en-IN')}</strong></p>
              <p className="text-slate-500 mt-1 text-[11px]">Utilization: {collectorSummary?.how_much_is_costing?.budget_utilization_pct || budgetUtilization}%</p>
            </div>

            {/* 5. What Needs Intervention? */}
            <div className="bg-amber-50/60 p-3.5 rounded-lg border border-amber-200">
              <span className="font-bold text-amber-900 uppercase text-[10px] block mb-1.5">5. What Needs Intervention?</span>
              <p className="text-amber-900 font-bold">
                {collectorSummary?.what_needs_intervention?.length || 0} Priority Escalations
              </p>
              <p className="text-amber-800 mt-1 text-[11px]">
                {collectorSummary?.what_needs_intervention?.[0]?.title?.slice(0, 30) || 'Active dispatch monitoring'}...
              </p>
              <p className="text-amber-700 mt-1 text-[10px] font-mono">Requires Collector Directive</p>
            </div>
          </div>
        </div>

        {/* TOP ROW: Health Score & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* District Health Card */}
          <div className="col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-1.5 ${districtHealth.border.replace('border-', 'bg-')}`}></div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 text-center">District Operational Health</h2>
            
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${districtHealth.bg} border-4 ${districtHealth.border} ${districtHealth.text} mb-2 shadow-sm`}>
                <Activity className="w-10 h-10" />
              </div>
              <h3 className={`text-3xl font-black ${districtHealth.text} tracking-tight`}>{districtHealth.label}</h3>
              <p className="text-xs text-slate-500 mt-1">Live from SQLite database ({villages.length} Panchayats)</p>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm border-t border-slate-100 pt-4">
              <div>
                <p className="text-slate-500 text-xs font-semibold">SLA Compliance</p>
                <p className="font-bold text-slate-800 text-lg">
                  {slaCompliance}% {slaCompliance < 80 ? <TrendingDown className="w-3 h-3 inline text-red-500"/> : <TrendingUp className="w-3 h-3 inline text-emerald-500"/>}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs font-semibold">Resolution Rate</p>
                <p className="font-bold text-slate-800 text-lg">
                  {resolutionRate}% <TrendingUp className="w-3 h-3 inline text-emerald-500"/>
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs font-semibold">Critical Incidents</p>
                <p className={`font-bold text-lg ${criticalCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                  {criticalCount}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs font-semibold">Budget Utilization</p>
                <p className="font-bold text-slate-800 text-lg">{budgetUtilization}%</p>
              </div>
            </div>
          </div>

          {/* Governance Insights Cards */}
          <div className="col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50 rounded-t-xl">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-800">Automated Governance Insights (Live)</h2>
            </div>
            <div className="p-5 flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className={`${item.bg} border ${item.border} p-4 rounded-lg flex gap-3`}>
                    <Icon className={`w-5 h-5 ${item.color} shrink-0 mt-0.5`} />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-600 mt-1">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* MIDDLE ROW: Critical Escalations */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-red-50 rounded-t-xl">
            <h2 className="font-bold text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Critical Escalations Requiring Review
            </h2>
            <span className="bg-red-200 text-red-800 text-xs font-bold px-3 py-1 rounded-full">
              {activeEscalations.length} Active Escalation{activeEscalations.length === 1 ? '' : 's'}
            </span>
          </div>
          
          <div className="divide-y divide-slate-100">
            {activeEscalations.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-sm">No critical escalations pending across {districtName} district.</p>
                <p className="text-xs text-slate-400 mt-1">All high-priority tickets are within regular operating thresholds.</p>
              </div>
            ) : (
              activeEscalations.map(esc => {
                const v = villages.find(vil => vil.id === esc.village_id);
                return (
                  <div key={esc.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 transition-colors gap-4">
                    <div className="flex gap-6 items-center">
                      <div className="text-center min-w-[100px]">
                        <span className="block text-xs text-slate-500 font-mono">INC-{esc.id}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                          esc.status === 'pending_verification' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'
                        }`}>
                          {esc.status}
                        </span>
                      </div>
                      
                      <div>
                        <h3 className="text-base font-bold text-slate-800">{esc.title}</h3>
                        <div className="flex flex-wrap gap-4 text-xs text-slate-600 mt-1">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Map className="w-3 h-3" /> {v ? v.name : `Village #${esc.village_id}`}
                          </span>
                          <span>Category: <strong className="capitalize">{esc.category}</strong></span>
                          {esc.priority_score && (
                            <span className="text-red-600 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3"/> Score: {esc.priority_score}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => {
                          if (onSelectIncident) {
                            onSelectIncident(esc.id);
                          } else {
                            setSelectedEscalationId(esc.id);
                          }
                        }}
                        className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all cursor-pointer"
                      >
                        <Eye className="w-4 h-4" /> Open Case
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RECURRING PROBLEMS & ROOT-CAUSE INTELLIGENCE */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap justify-between items-center bg-gradient-to-r from-slate-900 to-indigo-950 text-white gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600/40 rounded-lg border border-indigo-400/30">
                <Layers className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <h2 className="font-black text-white text-base flex items-center gap-2">
                  RECURRING PROBLEMS & ROOT CAUSES
                  <span className="bg-indigo-500/30 text-indigo-200 text-[10px] uppercase px-2 py-0.5 rounded border border-indigo-400/30 font-mono font-bold">
                    Problem Management v1
                  </span>
                </h2>
                <p className="text-xs text-indigo-200/80">
                  Statistical Recurrence Clustering & Structural Intervention Intelligence ({districtName} District)
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={loadClusters}
                disabled={isLoadingClusters}
                className="flex items-center gap-1.5 bg-indigo-800 hover:bg-indigo-700 text-indigo-100 text-xs font-bold px-3 py-1.5 rounded-lg border border-indigo-600/50 cursor-pointer transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingClusters ? 'animate-spin' : ''}`} />
                {isLoadingClusters ? 'Analyzing...' : 'Refresh Intelligence'}
              </button>
              <span className="bg-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 font-mono">
                {recurringClusters.length} Active Cluster{recurringClusters.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <div className="p-5">
            {isLoadingClusters ? (
              <div className="p-10 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin text-indigo-600" />
                <p className="font-semibold text-sm text-slate-600">Analyzing historical complaints & clustering systemic problem patterns...</p>
                <p className="text-xs text-slate-400 font-mono">Scanning SQLite database for temporal & geographic concentration</p>
              </div>
            ) : recurringClusters.length === 0 ? (
              <div className="empty-state-container">
                <div className="empty-state-icon">🌏</div>
                <h5 className="empty-state-title">No district data available</h5>
                <p className="empty-state-desc">Data will appear as panchayats report incidents and field workers resolve them.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {recurringClusters.map((cluster) => {
                  const isCritical = cluster.recurrence_level === 'CRITICAL';
                  const isHigh = cluster.recurrence_level === 'HIGH';
                  const isMedium = cluster.recurrence_level === 'MEDIUM';

                  const badgeColor = isCritical 
                    ? 'bg-red-100 text-red-800 border-red-200' 
                    : isHigh 
                    ? 'bg-amber-100 text-amber-800 border-amber-200' 
                    : isMedium 
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200' 
                    : 'bg-slate-100 text-slate-700 border-slate-200';

                  const cardBorder = isCritical 
                    ? 'border-red-200 hover:border-red-300' 
                    : isHigh 
                    ? 'border-amber-200 hover:border-amber-300' 
                    : 'border-slate-200 hover:border-indigo-200';

                  return (
                    <div 
                      key={cluster.cluster_id} 
                      className={`service-card bg-white rounded-xl border ${cardBorder} p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between`}
                    >
                      <img src={getServiceImage(cluster.category || '')} alt={cluster.category} className="service-card-img" onError={(e) => { e.currentTarget.style.display='none'; }} />
                      <div className="priority-badge">{cluster.recurrence_level}</div>
                      <div>
                        {/* Header Badge Strip */}
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                              {cluster.cluster_id}
                            </span>
                            <span className="text-xs font-bold text-slate-500 uppercase">
                              {cluster.category}
                            </span>
                          </div>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border font-mono ${badgeColor}`}>
                            {cluster.recurrence_level} RECURRENCE ({cluster.recurrence_score}%)
                          </span>
                        </div>

                        {/* Title & Panchayat */}
                        <h3 className="font-bold text-slate-900 text-sm mb-1">
                          {cluster.subcategory}
                        </h3>
                        <p className="text-xs text-slate-600 flex items-center gap-1 mb-3">
                          <Map className="w-3.5 h-3.5 text-indigo-500" />
                          <strong>Panchayat:</strong> {cluster.village_name} ({cluster.district})
                        </p>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-lg p-2.5 text-xs mb-3 border border-slate-100">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Related Cases</span>
                            <span className="font-black text-slate-800 text-sm">{cluster.incident_count} tickets</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Outcome-Gaps</span>
                            <span className={`font-black text-sm ${cluster.outcome_gap_count > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                              {cluster.outcome_gap_count} ({cluster.outcome_gap_rate}%)
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Reactive Cost</span>
                            <span className="font-black text-slate-800 text-sm font-mono">
                              {cluster.reactive_expenditure > 0 
                                ? `₹${cluster.reactive_expenditure.toLocaleString('en-IN')}` 
                                : 'INCOMPLETE'}
                            </span>
                          </div>
                        </div>

                        {/* Structural Intervention Estimation */}
                        {cluster.structural_intervention && (
                          <div className="bg-indigo-50/70 border border-indigo-100 rounded-lg p-2.5 text-xs mb-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-indigo-950 flex items-center gap-1 text-[11px]">
                                <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                                {cluster.structural_intervention.intervention_title}
                              </span>
                              <span className="text-[9px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded uppercase font-mono">
                                {cluster.structural_intervention.method}
                              </span>
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-600 font-mono">
                              <span>Est. Capex: <strong>₹{cluster.structural_intervention.estimated_intervention_cost.toLocaleString('en-IN')}</strong></span>
                              <span className="text-emerald-700 font-bold">Est. 2-Yr Net Saving: ₹{cluster.structural_intervention.estimated_potential_reduction.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                        <span className={`text-[11px] font-bold ${
                          cluster.recommended_action === 'STRUCTURAL_INTERVENTION_RECOMMENDED'
                            ? 'text-amber-700 flex items-center gap-1'
                            : 'text-slate-500'
                        }`}>
                          {cluster.recommended_action === 'STRUCTURAL_INTERVENTION_RECOMMENDED' ? '⚠️ Structural Fix Recommended' : '🔍 Routine Monitoring'}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedClusterId(cluster.cluster_id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Inspect Cluster
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* CLUSTER DRILL-DOWN DETAIL MODAL */}
        {selectedClusterDetail && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-slate-200">
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200">
                      {selectedClusterDetail.cluster_id}
                    </span>
                    <span className="text-xs font-bold uppercase text-slate-500">
                      {selectedClusterDetail.category} Problem Cluster
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border font-mono ${
                      selectedClusterDetail.recurrence_level === 'CRITICAL' ? 'bg-red-100 text-red-800 border-red-200' :
                      selectedClusterDetail.recurrence_level === 'HIGH' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                      'bg-indigo-100 text-indigo-800 border-indigo-200'
                    }`}>
                      {selectedClusterDetail.recurrence_level} RECURRENCE
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900">
                    {selectedClusterDetail.subcategory}
                  </h3>
                  <p className="text-xs text-slate-600 flex items-center gap-1">
                    <Map className="w-3.5 h-3.5 text-indigo-500" />
                    <strong>Location:</strong> {selectedClusterDetail.village_name} Panchayat, {selectedClusterDetail.district} District
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedClusterId(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Explainable Recurrence Diagnostic Breakdown */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-600" /> Explainable Recurrence Score & Diagnostic Breakdown
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Recurrence Score</span>
                    <span className="text-base font-black text-indigo-700">{selectedClusterDetail.recurrence_score} / 100</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Historical Range</span>
                    <span className="text-xs font-bold text-slate-700 block">
                      {selectedClusterDetail.first_reported_at ? new Date(selectedClusterDetail.first_reported_at).toLocaleDateString() : 'N/A'} &rarr; {selectedClusterDetail.latest_reported_at ? new Date(selectedClusterDetail.latest_reported_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Outcome Gaps</span>
                    <span className={`text-base font-black ${selectedClusterDetail.outcome_gap_count > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                      {selectedClusterDetail.outcome_gap_count} cases ({selectedClusterDetail.outcome_gap_rate}%)
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Affected Population</span>
                    <span className="text-base font-black text-slate-800">
                      {selectedClusterDetail.affected_population?.toLocaleString('en-IN')} citizens
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Semantics: Reactive Expenditure vs Structural Intervention */}
              <div className="bg-gradient-to-br from-indigo-50/50 to-slate-50 rounded-xl p-4 border border-indigo-100 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-indigo-700" /> Structural Intervention vs Reactive Expenditure
                  </h4>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded font-mono">
                    METHOD: {selectedClusterDetail.structural_intervention?.method || 'ESTIMATE'}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Reactive Expenditure (Paid/Completed)</span>
                    <span className="text-base font-black text-red-600 font-mono">
                      ₹{selectedClusterDetail.reactive_expenditure?.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Status: {selectedClusterDetail.cost_status}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Structural Capex (Estimate)</span>
                    <span className="text-base font-black text-indigo-700 font-mono">
                      ₹{selectedClusterDetail.structural_intervention?.estimated_intervention_cost?.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{selectedClusterDetail.structural_intervention?.intervention_title}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Projected 2-Yr Net Relief</span>
                    <span className="text-base font-black text-emerald-600 font-mono">
                      ₹{selectedClusterDetail.structural_intervention?.estimated_potential_reduction?.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">Structural Preventive Yield</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 italic">
                  * {selectedClusterDetail.structural_intervention?.disclaimer || 'Model-based planning estimate. Not a guaranteed financial commitment.'}
                </p>
              </div>

              {/* Related Complaints List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Related Incidents in this Cluster ({selectedClusterIncidents.length})</span>
                  <span className="text-[10px] text-slate-400 font-normal">Click any case to inspect details</span>
                </h4>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                  {selectedClusterIncidents.map((inc) => (
                    <div 
                      key={inc.id} 
                      className="pt-2 flex items-center justify-between text-xs hover:bg-slate-50 p-2 rounded transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500 font-bold">INC-{inc.id}</span>
                          <span className="font-bold text-slate-800">{inc.title}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            inc.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {inc.status}
                          </span>
                          {inc.verification_status === 'outcome_gap' && (
                            <span className="text-[9px] bg-red-100 text-red-800 font-bold px-1.5 py-0.2 rounded">
                              Outcome Gap Flagged
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Reported: {inc.created_at ? new Date(inc.created_at).toLocaleDateString() : 'N/A'} | Severity: <strong className="capitalize">{inc.severity}</strong> | Reactive Cost: <strong className="font-mono">₹{inc.reactive_cost?.toLocaleString('en-IN')}</strong>
                        </p>
                      </div>

                      {onSelectIncident && (
                        <button
                          onClick={() => {
                            onSelectIncident(inc.id);
                            setSelectedClusterId(null);
                          }}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded cursor-pointer"
                        >
                          View &rarr;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Collector Administrative Directive for this Cluster */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-700" />
                  <h4 className="font-bold text-xs text-indigo-900 uppercase">
                    Issue Structural Intervention Directive for Cluster {selectedClusterDetail.cluster_id}
                  </h4>
                </div>
                <textarea 
                  rows={2}
                  value={clusterDirectiveText}
                  onChange={(e) => setClusterDirectiveText(e.target.value)}
                  placeholder={`e.g. Sanction urgent capital project for ${selectedClusterDetail.subcategory} in Panchayat ${selectedClusterDetail.village_name}. Mobilize District Engineering Team.`}
                  className="w-full bg-white border border-indigo-200 rounded-lg p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-500"
                />
                <div className="flex justify-between items-center">
                  <p className="text-[11px] text-indigo-700/80">
                    Will log <span className="font-mono font-bold">STRUCTURAL_INTERVENTION_RECOMMENDED</span> in immutable audit trail.
                  </p>
                  <button
                    disabled={isIssuingClusterDirective}
                    onClick={() => handleIssueClusterDirective(selectedClusterDetail.cluster_id)}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm cursor-pointer transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isIssuingClusterDirective ? 'Dispatching...' : 'Authorize Structural Directive'}
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button 
                  onClick={() => setSelectedClusterId(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Close
                </button>
                {onSelectVillage && (
                  <button 
                    onClick={() => {
                      onSelectVillage(selectedClusterDetail.village_id);
                      setSelectedClusterId(null);
                    }}
                    className="px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-lg cursor-pointer"
                  >
                    Open Panchayat Workspace
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* RECENT GOVERNANCE ACTIVITY STREAM (COLLECTOR OVERSIGHT) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                Recent District Governance Activity Stream
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500">Live Cross-Panchayat Audit Feed</span>
          </div>
          
          <div className="p-4 divide-y divide-slate-100">
            {recentActivities.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No recent governance events recorded.
              </div>
            ) : (
              recentActivities.map(act => (
                <div key={act.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/80 px-2 rounded transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-400 text-[11px]">
                      {act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                    <span className="font-bold text-slate-700 font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {act.action}
                    </span>
                    <span className="text-slate-600">{act.details}</span>
                  </div>
                  {act.incident_id && (
                    <button
                      onClick={() => setSelectedEscalationId(act.incident_id)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded cursor-pointer"
                    >
                      INC-{act.incident_id} &rarr;
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal: Incident Detail if viewed directly */}
        {selectedEscalation && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <span className="text-xs font-bold text-slate-400 font-mono">INC-{selectedEscalation.id}</span>
                  <h3 className="text-lg font-bold text-slate-900">{selectedEscalation.title}</h3>
                </div>
                <button 
                  onClick={() => setSelectedEscalationId(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-slate-400 font-bold uppercase">Category</p>
                  <p className="font-semibold text-slate-800 text-sm capitalize">{selectedEscalation.category}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-slate-400 font-bold uppercase">Status</p>
                  <p className="font-semibold text-slate-800 text-sm capitalize">{selectedEscalation.status}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-slate-400 font-bold uppercase">MCDA Priority Score</p>
                  <p className="font-bold text-red-600 text-sm">{selectedEscalation.priority_score || 'Standard'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-slate-400 font-bold uppercase">Reporter</p>
                  <p className="font-semibold text-slate-800 text-sm">{selectedEscalation.reporter_name || 'Citizen'}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
                <p className="text-slate-400 font-bold uppercase">Description</p>
                <p className="text-slate-700">{selectedEscalation.description || 'No additional details logged.'}</p>
              </div>

              {/* Responsible Officer & Assigned Worker */}
              {detailedEscalation?.tasks && detailedEscalation.tasks.length > 0 && (
                <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 text-xs space-y-1">
                  <p className="text-blue-900 font-bold uppercase">Assigned Field Unit / Officer</p>
                  <p className="text-slate-800">
                    <strong>{detailedEscalation.tasks[0].technician_name || 'Assigned Technician'}</strong> (Specialty: {detailedEscalation.tasks[0].technician_specialty || 'General'})
                  </p>
                  <p className="text-slate-500 text-[11px]">Task State: <span className="font-bold uppercase text-blue-700">{detailedEscalation.tasks[0].status}</span> | Payout: {detailedEscalation.tasks[0].payout_status || 'Pending'}</p>
                </div>
              )}

              {/* Authoritative Event Timeline */}
              {detailedEscalation?.timeline_events && detailedEscalation.timeline_events.length > 0 && (
                <div className="border border-slate-200 rounded-xl p-3 text-xs space-y-2 bg-slate-50">
                  <p className="text-slate-700 font-bold uppercase flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" /> Chronological Governance Trail ({detailedEscalation.timeline_events.length} events)
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                    {detailedEscalation.timeline_events.map((ev: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-start text-[11px] border-b border-slate-100 pb-1">
                        <span className="font-bold text-slate-800">{ev.title}</span>
                        <span className="text-slate-400 font-mono text-[10px] whitespace-nowrap ml-2">
                          {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Collector Administrative Directive Panel */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-700" />
                  <h4 className="font-bold text-xs text-indigo-900 uppercase">
                    Issue Collector Administrative Directive
                  </h4>
                </div>
                <textarea 
                  rows={2}
                  value={directiveText}
                  onChange={(e) => setDirectiveText(e.target.value)}
                  placeholder="e.g. Deploy standby mobile tanker immediately and expedite pump replacement under District Disaster Reserve Fund."
                  className="w-full bg-white border border-indigo-200 rounded-lg p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-500"
                />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-600 font-semibold">Priority Override:</span>
                    <select
                      value={priorityOverride}
                      onChange={(e) => setPriorityOverride(e.target.value)}
                      className="bg-white border border-indigo-200 rounded px-2 py-1 text-xs font-bold text-indigo-900"
                    >
                      <option value="critical">🔴 CRITICAL (Immediate)</option>
                      <option value="high">🟠 HIGH (8 Hours)</option>
                      <option value="medium">🟡 MEDIUM (24 Hours)</option>
                    </select>
                  </div>
                  <button
                    disabled={isSubmittingDirective}
                    onClick={() => handleIssueDirective(selectedEscalation.id)}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm cursor-pointer transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSubmittingDirective ? 'Dispatching...' : 'Dispatch Directive'}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => setSelectedEscalationId(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Close
                </button>
                {onSelectIncident && (
                  <button 
                    onClick={() => {
                      onSelectIncident(selectedEscalation.id);
                      setSelectedEscalationId(null);
                    }}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                  >
                    Open Incident Workspace
                  </button>
                )}
                {onSelectVillage && (
                  <button 
                    onClick={() => {
                      onSelectVillage(selectedEscalation.village_id);
                      setSelectedEscalationId(null);
                    }}
                    className="px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-lg"
                  >
                    Switch to Panchayat View
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DISTRICT GOVERNANCE HEALTH & SYSTEM INTEGRITY MATRIX */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div>
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" /> District Governance Health & System Integrity
              </h2>
              <p className="text-xs text-slate-500">Automated Relational Consistency Checks across Raisen Collectorate</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              governanceHealth?.status === 'healthy' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {governanceHealth?.status === 'healthy' ? '✅ OPTIMAL INTEGRITY' : '⚠️ ATTENTION NEEDED'}
            </span>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {governanceHealth?.checks?.slice(0, 4).map((c: any, idx: number) => (
              <div key={idx} className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-bold text-slate-700">{c.name}</p>
                  <span className="text-xs">{c.is_ok ? '✅' : '⚠️'}</span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">{c.details}</p>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM ROW: Ranked Panchayat Comparison */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div>
              <h2 className="font-bold text-slate-800">Panchayat Escalation & Performance Matrix</h2>
              <p className="text-xs text-slate-500">Ranked by active unresolved complaints and SLA risk</p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              {villages.length} Panchayats Connected
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-semibold uppercase tracking-wider text-xs">Panchayat</th>
                  <th className="p-4 font-semibold uppercase tracking-wider text-xs">Population</th>
                  <th className="p-4 font-semibold uppercase tracking-wider text-xs">Unresolved</th>
                  <th className="p-4 font-semibold uppercase tracking-wider text-xs">SLA Breaches</th>
                  <th className="p-4 font-semibold uppercase tracking-wider text-xs">Spent / Alloc.</th>
                  <th className="p-4 font-semibold uppercase tracking-wider text-xs">Remaining</th>
                  <th className="p-4 font-semibold uppercase tracking-wider text-xs text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {panchayatRanking.map(({ village: v, unresolved, breached, spent, allocated, remaining, utilization }) => {
                  const riskScore = unresolved > 0 ? (breached / unresolved) * 100 : 0;
                  const riskClass = riskScore > 70 ? 'sla-risk-critical' : riskScore > 40 ? 'sla-risk-warning' : 'sla-risk-ok';
                  return (
                  <tr key={v.id} className={`hover:bg-slate-50 transition-colors ${riskClass}`}>
                    <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                      <Map className="w-4 h-4 text-indigo-500" /> {v.name}
                    </td>
                    <td className="p-4 text-slate-600">{v.population ? v.population.toLocaleString() : 'N/A'}</td>
                    <td className="p-4">
                      <span className={`font-bold ${unresolved > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {unresolved}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`font-bold ${breached > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                        {breached}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700">
                      ₹{spent.toLocaleString('en-IN')} / ₹{allocated.toLocaleString('en-IN')}
                      <span className="text-[11px] text-slate-400 block font-mono">({utilization}% utilized)</span>
                    </td>
                    <td className="p-4 font-bold text-emerald-700">
                      ₹{remaining.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 text-right">
                      {onSelectVillage && (
                        <button 
                          onClick={() => onSelectVillage(v.id)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                        >
                          Inspect &rarr;
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
