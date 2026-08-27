import React, { useState, useMemo, useEffect } from 'react';
import { 
  AlertTriangle, Clock, ShieldAlert, Activity, CheckCircle, 
  MapPin, Wrench, IndianRupee, AlertOctagon, TrendingUp, Cpu, 
  ChevronRight, ArrowLeft, Search, Filter, CheckCircle2, UserCheck, Eye,
  ShieldCheck, FileText, RefreshCw, Zap, AlertCircle
} from 'lucide-react';
import type { Incident, Asset, Village, Technician, Task } from '../types';
import * as api from '../api';
import { IMAGE_MAP, getServiceImage, getInitials, getRoleAvatarGradient } from '../imageMap';
import LiveClock from './LiveClock';
import NotificationTicker from './NotificationTicker';


interface AdminPortalProps {
  village?: Village;
  incidents?: any[];
  assets?: Asset[];
  technicians?: any[];
  tasks?: any[];
  onDispatch?: (incidentId: number, technicianId: number) => Promise<void> | void;
  onSelectIncident?: (incidentId: number) => void;
  onNavigateTab?: (tabName: string) => void;
  showToast?: (message: string, type?: 'info' | 'success' | 'error') => void;
  onRefresh?: () => void;
}

export default function AdminPortal({
  village,
  incidents = [],
  assets = [],
  technicians = [],
  tasks = [],
  onDispatch,
  onSelectIncident,
  onNavigateTab,
  showToast,
  onRefresh
}: AdminPortalProps) {
  const notify = showToast || ((msg: string) => alert(msg));
  const [view, setView] = useState<'dashboard' | 'incident_detail' | 'exceptions' | 'health' | 'audit'>('dashboard');
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isDispatching, setIsDispatching] = useState(false);
  const [approvingTaskId, setApprovingTaskId] = useState<number | null>(null);
  const [rejectingTaskId, setRejectingTaskId] = useState<number | null>(null);
  const [detailedIncident, setDetailedIncident] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [governanceHealth, setGovernanceHealth] = useState<any | null>(null);
  const [systemOperations, setSystemOperations] = useState<any | null>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditSearchTerm, setAuditSearchTerm] = useState('');
  const [isReconciling, setIsReconciling] = useState(false);

  useEffect(() => {
    api.fetchGovernanceHealth()
      .then(data => setGovernanceHealth(data))
      .catch(() => {});
    
    api.fetchSystemOperations()
      .then(data => setSystemOperations(data))
      .catch(() => {});

    api.fetchRecentGovernanceActivity(10)
      .then(data => setRecentActivities(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [tasks, incidents]);

  const loadAuditLogs = (page = 1) => {
    api.fetchAuditLogs({
      page: page,
      page_size: 15,
      action: auditActionFilter || undefined,
      actor: auditSearchTerm || undefined
    })
      .then(data => {
        if (data && data.items) {
          setAuditLogs(data.items);
          setAuditPage(data.page || 1);
          setAuditTotalPages(data.total_pages || 1);
        } else if (Array.isArray(data)) {
          setAuditLogs(data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (view === 'audit') {
      loadAuditLogs(auditPage);
    }
  }, [view, auditPage, auditActionFilter]);

  const handleRunReconcile = async () => {
    setIsReconciling(true);
    try {
      const res = await api.runGovernanceReconcile();
      notify(res.message || 'System state self-healed and reconciled!', 'success');
      const health = await api.fetchGovernanceHealth();
      setGovernanceHealth(health);
      onRefresh?.();
    } catch (e: any) {
      notify(e?.message || 'Failed to run reconciliation', 'error');
    } finally {
      setIsReconciling(false);
    }
  };

  React.useEffect(() => {
    if (selectedIncidentId) {
      setLoadingDetail(true);
      api.fetchIncidentDetail(selectedIncidentId)
        .then(data => {
          setDetailedIncident(data);
          setLoadingDetail(false);
        })
        .catch(() => setLoadingDetail(false));
    } else {
      setDetailedIncident(null);
    }
  }, [selectedIncidentId]);

  const pendingScopeTasks = useMemo(() => {
    return tasks.filter(t => t.cost_revision_status === 'pending');
  }, [tasks]);

  const handleApproveScope = async (taskId: number, requestedCost: number) => {
    setApprovingTaskId(taskId);
    try {
      await api.approveScopeIncrease(taskId);
      notify(`Scope revision approved! Budget updated to ₹${requestedCost.toLocaleString('en-IN')}.`, 'success');
      onRefresh?.();
    } catch (e: any) {
      notify(e?.message || 'Failed to approve scope revision', 'error');
    } finally {
      setApprovingTaskId(null);
    }
  };

  const handleRejectScope = async (taskId: number) => {
    const reason = window.prompt("Reason for scope rejection (optional):", "Scope increase exceeds standard maintenance threshold.");
    if (reason === null) return; // cancelled
    setRejectingTaskId(taskId);
    try {
      await api.rejectScopeIncrease(taskId, reason);
      notify(`Scope revision rejected. Retaining original base budget.`, 'info');
      onRefresh?.();
    } catch (e: any) {
      notify(e?.message || 'Failed to reject scope revision', 'error');
    } finally {
      setRejectingTaskId(null);
    }
  };

  // Compute live SLA statistics from real database records
  const slaStats = useMemo(() => {
    let onTrack = 0;
    let dueSoon = 0;
    let atRisk = 0;
    let breached = 0;

    incidents.forEach(inc => {
      const status = inc.status || 'open';
      const sla = inc.sla_status || (inc.priority_score && inc.priority_score > 80 ? 'breached' : 'on_track');
      
      if (status === 'resolved' || status === 'completed' || status === 'resolved_confirmed') {
        onTrack++;
      } else if (sla === 'breached') {
        breached++;
      } else if (sla === 'at_risk' || (inc.priority_score && inc.priority_score > 70)) {
        atRisk++;
      } else if (sla === 'due_soon' || (inc.priority_score && inc.priority_score > 50)) {
        dueSoon++;
      } else {
        onTrack++;
      }
    });

    return { onTrack, dueSoon, atRisk, breached };
  }, [incidents]);

  const criticalCount = useMemo(() => {
    return incidents.filter(i => i.severity === 'critical' || (i.priority_score && i.priority_score >= 80)).length;
  }, [incidents]);

  // Items requiring urgent attention
  const attentionItems = useMemo(() => {
    const list = [];

    // 1. SLA Breaches / Pending Unassigned Incidents
    const breachedInc = incidents.find(i => 
      (i.sla_status === 'breached' || (i.priority_score && i.priority_score >= 80)) && 
      (i.status === 'open' || i.status === 'reported')
    );
    if (breachedInc) {
      list.push({
        type: 'SLA_BREACH',
        badge: 'SLA Breach',
        badgeColor: 'text-red-700 bg-red-100 border-red-200',
        cardBg: 'bg-red-50 hover:bg-red-100 border-red-200',
        incidentId: breachedInc.id,
        code: `INC-${breachedInc.id}`,
        title: breachedInc.title,
        desc: `High priority ticket unassigned. Immediate worker dispatch required.`
      });
    }

    // 2. Price Revision / Scope markups
    const pendingTaskRevision = tasks.find(t => t.cost_increased || (t.cost && t.base_cost && t.cost > t.base_cost));
    if (pendingTaskRevision) {
      list.push({
        type: 'PRICE_REVISION',
        badge: 'Price Revision Request',
        badgeColor: 'text-amber-700 bg-amber-100 border-amber-200',
        cardBg: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
        incidentId: pendingTaskRevision.incident_id,
        code: `TASK-${pendingTaskRevision.id}`,
        title: 'Technician Scope Markup Logged',
        desc: `Base: ₹${pendingTaskRevision.base_cost || 15000} | Total: ₹${pendingTaskRevision.cost || 18000} (+₹${(pendingTaskRevision.cost || 18000) - (pendingTaskRevision.base_cost || 15000)})`
      });
    }

    // 3. Asset telemetry / degraded asset
    const degradedAsset = assets.find(a => a.status === 'degraded' || a.status === 'maintenance' || a.status === 'down');
    if (degradedAsset) {
      list.push({
        type: 'IOT_ANOMALY',
        badge: 'IoT Anomaly',
        badgeColor: 'text-purple-700 bg-purple-100 border-purple-200',
        cardBg: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
        incidentId: incidents.find(i => i.asset_id === degradedAsset.id)?.id || null,
        code: `AST-${degradedAsset.id}`,
        title: `${degradedAsset.name} telemetry alert`,
        desc: `Operating status: ${degradedAsset.status.toUpperCase()}. Scheduled review advised.`
      });
    }

    return list;
  }, [incidents, tasks, assets]);

  // Filtered active incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => {
      const matchesSearch = !searchQuery || 
        inc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(inc.id).includes(searchQuery) ||
        inc.category?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'ALL' || inc.category?.toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [incidents, searchQuery, categoryFilter]);

  const selectedIncident = useMemo(() => {
    if (!selectedIncidentId) return incidents[0] || null;
    return incidents.find(i => i.id === selectedIncidentId) || incidents[0] || null;
  }, [incidents, selectedIncidentId]);

  const selectedIncidentAsset = useMemo(() => {
    if (!selectedIncident?.asset_id) return null;
    return assets.find(a => a.id === selectedIncident.asset_id) || null;
  }, [assets, selectedIncident]);

  const handleDispatch = async (techId: number) => {
    if (!selectedIncident) return;
    setIsDispatching(true);
    try {
      if (onDispatch) {
        await onDispatch(selectedIncident.id, techId);
      } else {
        await api.dispatchWorker(selectedIncident.id, techId);
      }
      notify(`Technician successfully dispatched for INC-${selectedIncident.id}!`, 'success');
      setView('dashboard');
    } catch (e: any) {
      notify(e.message || 'Failed to dispatch technician', 'error');
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '80vh', background: '#f1f5f9', fontFamily: 'Inter, system-ui, sans-serif', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      <div className="portal-hero-banner" style={{ height: '180px', marginBottom: 0 }}>
        <img src={IMAGE_MAP.adminHero} alt="Government administration" className="img-reveal" />
        <div className="portal-hero-overlay" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '16px' }}>
          <span className="portal-hero-badge">🏛️ Panchayat Administration</span>
          <p className="portal-hero-title" style={{ fontSize: '1.2rem' }}>Admin Command Center</p>
          <p className="portal-hero-subtitle">Oversight, SLA monitoring &amp; governance audit</p>
        </div>
        <div style={{ position: 'absolute', top: 12, right: 16, zIndex: 5 }}>
          <LiveClock variant="compact" lightText />
        </div>
      </div>
      <NotificationTicker />
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-20">
        <div className="p-4 bg-slate-950 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white tracking-tight">GRAM-X Admin</h1>
          <p className="text-xs text-slate-400 mt-1">Panchayat: {village ? village.name : 'Piparli'}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1.5">
          <button 
            onClick={() => setView('dashboard')}
            className={`w-full text-left px-4 py-2 rounded-lg font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
              view === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Activity className="w-5 h-5" /> Command Center
          </button>

          <button 
            onClick={() => setView('exceptions')}
            className={`w-full text-left px-4 py-2 rounded-lg font-semibold flex items-center justify-between cursor-pointer transition-colors ${
              view === 'exceptions' ? 'bg-amber-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" /> Exceptions
            </span>
            {(governanceHealth?.operational_exceptions?.length || 0) > 0 && (
              <span className="bg-amber-500 text-slate-950 font-mono text-[10px] font-black px-2 py-0.5 rounded-full">
                {governanceHealth?.operational_exceptions?.length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setView('health')}
            className={`w-full text-left px-4 py-2 rounded-lg font-semibold flex items-center justify-between cursor-pointer transition-colors ${
              view === 'health' ? 'bg-emerald-700 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> System Integrity
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <button 
            onClick={() => setView('audit')}
            className={`w-full text-left px-4 py-2 rounded-lg font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
              view === 'audit' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <FileText className="w-5 h-5 text-indigo-400" /> Audit Trail
          </button>

          <button 
            onClick={() => onNavigateTab ? onNavigateTab('worker_portal') : setView('incident_detail')}
            className="w-full text-left px-4 py-2 hover:bg-slate-800 rounded-lg flex items-center gap-2 text-slate-300 cursor-pointer transition-colors"
          >
            <Wrench className="w-5 h-5 text-blue-400" /> Technicians ({technicians.length})
          </button>
          <button 
            onClick={() => onNavigateTab ? onNavigateTab('asset_intel') : notify(`Managing ${assets.length} village assets`, 'info')}
            className="w-full text-left px-4 py-2 hover:bg-slate-800 rounded-lg flex items-center gap-2 text-slate-300 cursor-pointer transition-colors"
          >
            <TrendingUp className="w-5 h-5 text-emerald-400" /> Asset Health ({assets.length})
          </button>
          <button 
            onClick={() => onNavigateTab ? onNavigateTab('money_budget') : notify(`Panchayat Budget: ₹${village?.budget_allocated?.toLocaleString() || '0'}`, 'info')}
            className="w-full text-left px-4 py-2 hover:bg-slate-800 rounded-lg flex items-center gap-2 text-slate-300 cursor-pointer transition-colors"
          >
            <IndianRupee className="w-5 h-5 text-amber-400" /> Treasury Ledger
          </button>
        </nav>
      </aside>

      {/* Main Content Area — natural scroll, no overflow-auto trap */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex bg-slate-100 rounded-lg px-3 py-2 w-96 border border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition-all">
            <Search className="w-5 h-5 text-slate-400 mr-2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Incident ID, Asset, or Category..." 
              className="bg-transparent outline-none w-full text-sm" 
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800">Gram Panchayat Officer</p>
              <p className="text-xs text-slate-500">{village ? village.name : 'Piparli'} Desk</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">A</div>
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto">
          
          {/* OPERATIONAL COMMAND CENTER ALERT RAIL */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-300 uppercase tracking-wider">
              <Activity className="w-4 h-4 text-blue-400" /> Operational Rail:
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => setView('exceptions')}
                className="flex items-center gap-1.5 bg-red-950/80 border border-red-800 text-red-300 px-3 py-1.5 rounded-lg font-bold hover:bg-red-900 transition-colors cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                🔴 {criticalCount} Critical
              </button>
              <button 
                onClick={() => setView('exceptions')}
                className="flex items-center gap-1.5 bg-amber-950/80 border border-amber-800 text-amber-300 px-3 py-1.5 rounded-lg font-bold hover:bg-amber-900 transition-colors cursor-pointer"
              >
                🟠 {slaStats.breached + slaStats.atRisk} SLA Risks
              </button>
              <button 
                onClick={() => setView('exceptions')}
                className="flex items-center gap-1.5 bg-yellow-950/80 border border-yellow-800 text-yellow-300 px-3 py-1.5 rounded-lg font-bold hover:bg-yellow-900 transition-colors cursor-pointer"
              >
                🟡 {governanceHealth?.summary?.citizen_outcome_gaps || 0} Outcome Gaps
              </button>
              <button 
                onClick={() => setView('health')}
                className="flex items-center gap-1.5 bg-indigo-950/80 border border-indigo-800 text-indigo-300 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-900 transition-colors cursor-pointer"
              >
                💰 {governanceHealth?.financial_reconciliation?.is_balanced === false ? '1 Financial Warning' : '0 Financial Mismatch'}
              </button>
              <button 
                onClick={() => setView('health')}
                className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-900 transition-colors cursor-pointer"
              >
                🟢 {governanceHealth?.status === 'healthy' ? '0 Integrity Failures' : '1 Integrity Attention'}
              </button>
            </div>
          </div>

          {/* VIEW: COMMAND CENTER DASHBOARD */}
          {view === 'dashboard' && (
            <div className="animate-in fade-in">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Operational Overview</h2>
                  <p className="text-slate-500 text-sm mt-1">Real-time SLA and Risk metrics based on current database state.</p>
                </div>
              </div>

              {/* Live SLA Management Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-emerald-500 kpi-card anim-fade-up anim-stagger-1" style={{ '--kpi-color': '#10b981' } as React.CSSProperties}>
                  <div className="card-icon-badge" style={{ backgroundColor: '#10b98120' }}>📁</div>
                  <p className="text-slate-500 text-sm font-semibold uppercase">On Track</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{slaStats.onTrack}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-blue-500 kpi-card anim-fade-up anim-stagger-2" style={{ '--kpi-color': '#3b82f6' } as React.CSSProperties}>
                  <div className="card-icon-badge" style={{ backgroundColor: '#3b82f620' }}>🔥</div>
                  <p className="text-slate-500 text-sm font-semibold uppercase">Due Soon</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{slaStats.dueSoon}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-amber-500 kpi-card anim-fade-up anim-stagger-3" style={{ '--kpi-color': '#f59e0b' } as React.CSSProperties}>
                  <div className="card-icon-badge" style={{ backgroundColor: '#f59e0b20' }}>✅</div>
                  <p className="text-slate-500 text-sm font-semibold uppercase">At Risk</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{slaStats.atRisk}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-red-600 bg-red-50 kpi-card anim-fade-up anim-stagger-4" style={{ '--kpi-color': '#dc2626' } as React.CSSProperties}>
                  <div className="card-icon-badge" style={{ backgroundColor: '#dc262620' }}>💰</div>
                  <p className="text-red-700 text-sm font-bold uppercase flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Breached</p>
                  <p className="text-3xl font-bold text-red-700 mt-1">{slaStats.breached}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* "What Needs Attention?" Panel */}
                <div className="col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[500px]">
                  <div className="p-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <AlertOctagon className="w-5 h-5 text-red-500" /> Requires Attention ({attentionItems.length})
                    </h3>
                  </div>
                  <div className="p-3 overflow-y-auto space-y-3 flex-1">
                    {attentionItems.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        No high-risk attention items currently flagged.
                      </div>
                    ) : (
                      attentionItems.map((item, idx) => (
                        <div 
                          key={idx}
                          onClick={() => {
                            if (item.incidentId) {
                              setSelectedIncidentId(item.incidentId);
                              setView('incident_detail');
                            } else {
                              notify(item.desc, 'info');
                            }
                          }}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${item.cardBg}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${item.badgeColor}`}>
                              {item.badge}
                            </span>
                            <span className="text-xs font-mono text-slate-500">{item.code}</span>
                          </div>
                          <p className="text-sm font-semibold text-slate-800 mt-2">{item.title}</p>
                          <p className="text-xs text-slate-600 mt-1">{item.desc}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Active Incidents Table */}
                <div className="col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[500px]">
                  <div className="p-4 border-b border-slate-200 bg-slate-50 rounded-t-xl flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">
                      Active Incidents ({filteredIncidents.length})
                    </h3>
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-slate-400" />
                      <select 
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="text-xs bg-white border border-slate-200 rounded px-2 py-1 outline-none font-semibold text-slate-700"
                      >
                        <option value="ALL">All Categories</option>
                        <option value="water">Water</option>
                        <option value="roads">Roads</option>
                        <option value="sanitation">Sanitation</option>
                        <option value="electricity">Electricity</option>
                      </select>
                    </div>
                  </div>
                  <div className="overflow-auto flex-1">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="p-3 font-semibold">Incident</th>
                          <th className="p-3 font-semibold">Category</th>
                          <th className="p-3 font-semibold">Priority Score</th>
                          <th className="p-3 font-semibold">Status</th>
                          <th className="p-3 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredIncidents.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                              <div className="empty-state-container">
                                <div className="empty-state-icon">🏛️</div>
                                <h5 className="empty-state-title">No incidents in this view</h5>
                                <p className="empty-state-desc">All grievances and tasks will appear here once reported.</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredIncidents.map(inc => (
                            <tr 
                              key={inc.id}
                              className="hover:bg-slate-50 cursor-pointer transition-colors"
                              onClick={() => {
                                setSelectedIncidentId(inc.id);
                                setView('incident_detail');
                              }}
                            >
                              <td className="p-3 font-mono text-blue-600 font-bold">
                                <img src={getServiceImage(inc.category || '')} alt={inc.category} className="incident-thumb" onError={(e) => { e.currentTarget.style.display='none'; }} />
                                INC-{inc.id}
                                <span className={`priority-badge priority-${(inc.severity || 'medium').toLowerCase()}`}>{inc.severity || 'MEDIUM'}</span>
                                <span className="block text-xs text-slate-700 font-sans font-normal mt-0.5">{inc.title}</span>
                              </td>
                              <td className="p-3 text-slate-700 capitalize">{inc.category}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                  (inc.priority_score && inc.priority_score >= 80) ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {inc.priority_score || '75.0'}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`text-xs font-bold uppercase ${
                                  inc.status === 'resolved' || inc.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'
                                }`}>
                                  {inc.status}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedIncidentId(inc.id);
                                    setView('incident_detail');
                                  }}
                                  className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded"
                                >
                                  Inspect &rarr;
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Financial Scope Revision Governance Review Panel */}
                <div className="col-span-3 bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden mt-2">
                  <div className="p-4 bg-amber-50 border-b border-amber-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="w-5 h-5 text-amber-700" />
                      <h3 className="font-bold text-amber-900 text-sm uppercase tracking-wide">
                        Financial Scope Revision Approvals ({pendingScopeTasks.length} Pending Review)
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded border border-amber-300">
                      Panchayat Treasury Governance
                    </span>
                  </div>

                  <div className="p-4">
                    {pendingScopeTasks.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-xs">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                        All technician work orders are operating within authorized baseline budgets. No pending scope markups.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingScopeTasks.map(task => (
                          <div key={task.id} className="p-4 rounded-lg border border-amber-200 bg-amber-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                                  TASK-{task.id}
                                </span>
                                <strong className="text-slate-800 text-sm">
                                  {task.incident_title || `Incident #${task.incident_id}`}
                                </strong>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-xs">
                                <div>
                                  <span className="text-slate-500 block">Baseline Allocation:</span>
                                  <strong className="text-slate-800">₹{(task.base_cost || 15000).toLocaleString('en-IN')}</strong>
                                </div>
                                <div>
                                  <span className="text-slate-500 block">Requested Amount:</span>
                                  <strong className="text-amber-700 font-bold">₹{(task.requested_cost || (task.base_cost + (task.requested_additional_cost || 0))).toLocaleString('en-IN')}</strong>
                                </div>
                                <div>
                                  <span className="text-slate-500 block">Additional Markup:</span>
                                  <strong className="text-amber-800">+₹{(task.requested_additional_cost || 0).toLocaleString('en-IN')}</strong>
                                </div>
                                <div>
                                  <span className="text-slate-500 block">Technician:</span>
                                  <strong className="text-slate-800">{task.technician_name || 'Assigned Worker'}</strong>
                                </div>
                              </div>

                              {task.what_was_wrong && (
                                <div className="mt-2 text-xs text-slate-700 bg-white p-2 rounded border border-amber-100">
                                  <p className="margin-0"><strong>Root Cause:</strong> {task.what_was_wrong}</p>
                                  {task.work_done && <p className="mt-1 text-slate-600"><strong>Work/Parts:</strong> {task.work_done}</p>}
                                  {task.product_effect && <p className="mt-1 text-slate-600"><strong>Impact:</strong> {task.product_effect}</p>}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 self-end md:self-center">
                              <button
                                onClick={() => handleRejectScope(task.id)}
                                disabled={rejectingTaskId === task.id || approvingTaskId === task.id}
                                className="px-3 py-1.5 text-xs font-bold bg-white text-red-700 border border-red-300 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              >
                                {rejectingTaskId === task.id ? 'Rejecting…' : '✕ REJECT'}
                              </button>
                              <button
                                onClick={() => handleApproveScope(task.id, task.requested_cost || (task.base_cost + (task.requested_additional_cost || 0)))}
                                disabled={approvingTaskId === task.id || rejectingTaskId === task.id}
                                className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded transition-colors shadow-sm cursor-pointer"
                              >
                                {approvingTaskId === task.id ? 'Approving…' : `✓ APPROVE ₹${(task.requested_cost || (task.base_cost + (task.requested_additional_cost || 0))).toLocaleString('en-IN')}`}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* RECENT GOVERNANCE ACTIVITY STREAM */}
                <div className="col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-2">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                        Recent Governance Activity Stream
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-slate-500">Live Authoritative System Feed</span>
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
                              onClick={() => {
                                setSelectedIncidentId(act.incident_id);
                                setView('incident_detail');
                              }}
                              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded cursor-pointer"
                            >
                              INC-{act.incident_id} &rarr;
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* VIEW: INCIDENT DETAIL & SMART DISPATCH */}
          {view === 'incident_detail' && selectedIncident && (
            <div className="animate-in slide-in-from-right-8">
              <button 
                onClick={() => setView('dashboard')} 
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold mb-4 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Incident Details & Risk */}
                <div className="col-span-2 space-y-6">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-800">{selectedIncident.title}</h2>
                        <p className="text-slate-500 font-mono mt-1">INC-{selectedIncident.id} • Category: <span className="capitalize font-semibold">{selectedIncident.category}</span></p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded text-sm font-bold border ${
                          selectedIncident.status === 'resolved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'
                        }`}>
                          STATUS: {selectedIncident.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* MCDA Priority Indicator */}
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">MCDA Priority</p>
                        <p className="text-lg font-bold text-slate-800">
                          {selectedIncident.priority_score && selectedIncident.priority_score >= 80 ? 'CRITICAL' : 'EVALUATED'} (Score: {selectedIncident.priority_score || '78.5'})
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Evaluated across affected population & asset criticality.</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Reporter Information</p>
                        <p className="text-lg font-bold text-slate-800">{selectedIncident.reporter_name || 'Citizen'}</p>
                        <p className="text-xs text-slate-500 mt-1">Reported: {selectedIncident.created_at ? new Date(selectedIncident.created_at).toLocaleString() : 'Recent'}</p>
                      </div>
                    </div>

                    {/* Asset Health Card */}
                    {selectedIncidentAsset && (
                      <div className="mt-6 border-t border-slate-200 pt-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                          <Cpu className="w-5 h-5 text-amber-500" /> Linked Asset: {selectedIncidentAsset.name}
                        </h3>
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                          <div className="flex items-center gap-2 text-amber-800 font-bold mb-2">
                            <AlertTriangle className="w-5 h-5" /> Operational Health: <span className="uppercase">{selectedIncidentAsset.status}</span>
                          </div>
                          <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                            <li>Asset Type: <strong className="capitalize">{selectedIncidentAsset.type}</strong></li>
                            <li>Current Utilization: {selectedIncidentAsset.current_utilization || 80}%</li>
                            <li>Capacity: {selectedIncidentAsset.capacity || 'Standard Village Unit'}</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Assigned Work Order & Execution Details */}
                    {detailedIncident?.tasks && detailedIncident.tasks.length > 0 && (
                      <div className="mt-6 border-t border-slate-200 pt-6 space-y-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <Wrench className="w-5 h-5 text-blue-600" /> Assigned Work Orders ({detailedIncident.tasks.length})
                        </h3>
                        {detailedIncident.tasks.map((task: any) => (
                          <div key={task.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-mono text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                  TASK-{task.id}
                                </span>
                                <span className="ml-2 text-sm font-bold text-slate-800">
                                  {task.technician_name || `Technician #${task.technician_id}`}
                                </span>
                              </div>
                              <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                                task.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {task.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div>
                                <span className="text-slate-400 block">Baseline Budget:</span>
                                <strong className="text-slate-700">₹{(task.base_cost || 15000).toLocaleString('en-IN')}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block">Authorized Cost:</span>
                                <strong className="text-emerald-700 font-bold">₹{task.cost.toLocaleString('en-IN')}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block">Payout Status:</span>
                                <strong className={`font-bold ${task.payout_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  {task.payout_status ? task.payout_status.toUpperCase() : 'PENDING'}
                                </strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block">Payout TXID:</span>
                                <span className="font-mono text-[11px] text-slate-600">{task.payout_tx_id || 'Pending Completion'}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Completion Evidence Panel */}
                    <div className="mt-6 border-t border-slate-200 pt-6">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Completion Evidence
                      </h3>
                      {detailedIncident?.evidence && detailedIncident.evidence.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {detailedIncident.evidence.map((ev: any) => (
                            <div key={ev.id} className="p-3 border border-slate-200 rounded-lg bg-slate-50 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] font-bold text-slate-700 uppercase">
                                  {ev.type === 'photo' ? '📸 Photo Evidence' : '🎙️ Voice Log'}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  ev.review_status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                                  ev.review_status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {ev.review_status ? ev.review_status.toUpperCase() : 'PENDING REVIEW'}
                                </span>
                              </div>
                              {ev.checksum && (
                                <div className="text-[10px] text-slate-400 font-mono">
                                  SHA-256: {ev.checksum.slice(0, 16)}...
                                </div>
                              )}
                              {ev.file_path && (
                                <div className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-100 font-mono">
                                  📁 {ev.file_path}
                                </div>
                              )}
                              {ev.recognized_text && <p className="text-xs text-slate-700 italic">"{ev.recognized_text}"</p>}
                              
                              {/* Evidence Review Actions */}
                              {ev.review_status === 'pending' && (
                                <div className="flex gap-2 pt-1 border-t border-slate-200">
                                  <button
                                    onClick={async () => {
                                      try {
                                        await api.reviewEvidence(ev.id, 'accepted', 'Verified compliant with Panchayat specs.');
                                        notify('Evidence approved in audit trail!', 'success');
                                        if (selectedIncidentId) {
                                          api.fetchIncidentDetail(selectedIncidentId).then(data => setDetailedIncident(data));
                                        }
                                      } catch (err: any) {
                                        notify(err?.message || 'Failed to approve evidence', 'error');
                                      }
                                    }}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-1 rounded cursor-pointer"
                                  >
                                    ✓ Accept Evidence
                                  </button>
                                  <button
                                    onClick={async () => {
                                      try {
                                        await api.reviewEvidence(ev.id, 'rejected', 'Evidence insufficient; re-submission requested.');
                                        notify('Evidence marked as rejected.', 'info');
                                        if (selectedIncidentId) {
                                          api.fetchIncidentDetail(selectedIncidentId).then(data => setDetailedIncident(data));
                                        }
                                      } catch (err: any) {
                                        notify(err?.message || 'Failed to reject evidence', 'error');
                                      }
                                    }}
                                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 text-[11px] font-bold py-1 rounded cursor-pointer"
                                  >
                                    ✕ Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : detailedIncident?.tasks && detailedIncident.tasks.some((t: any) => t.work_done || t.what_was_wrong) ? (
                        <div className="space-y-3">
                          {detailedIncident.tasks.map((t: any) => (
                            <div key={t.id} className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-lg text-xs space-y-1 text-slate-700">
                              <p><strong>Diagnosis:</strong> {t.what_was_wrong || 'Standard scheduled service.'}</p>
                              <p><strong>Work Executed:</strong> {t.work_done || 'Completed service checklist.'}</p>
                              <p><strong>System Impact:</strong> {t.product_effect || 'Restored to baseline specifications.'}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                          No completion evidence submitted.
                        </div>
                      )}
                    </div>

                    {/* Chronological Event Timeline */}
                    <div className="mt-6 border-t border-slate-200 pt-6">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-indigo-600" /> Authoritative Task Timeline
                      </h3>
                      {detailedIncident?.timeline_events && detailedIncident.timeline_events.length > 0 ? (
                        <div className="relative border-l-2 border-slate-200 ml-4 space-y-5">
                          {detailedIncident.timeline_events.map((event: any, idx: number) => (
                            <div key={idx} className="relative pl-6">
                              <span className="absolute -left-[7px] top-1 w-3 h-3 bg-indigo-600 rounded-full border-2 border-white" />
                              <div className="flex justify-between items-baseline">
                                <h4 className="font-bold text-slate-800 text-xs">{event.title}</h4>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {event.timestamp ? new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5">{event.details}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">Loading authoritative timeline...</p>
                      )}
                    </div>

                    {/* Citizen Verification & Outcome Gap */}
                    {detailedIncident?.verification_record && (
                      <div className="mt-6 border-t border-slate-200 pt-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                          <UserCheck className="w-5 h-5 text-blue-600" /> Citizen Final Verification
                        </h3>
                        <div className={`p-4 rounded-lg border ${
                          detailedIncident.verification_record.status === 'verified'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                        }`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold uppercase">
                              Status: {detailedIncident.verification_record.status}
                            </span>
                            <span className="text-[10px] font-mono">
                              {detailedIncident.verification_record.verified_at ? new Date(detailedIncident.verification_record.verified_at).toLocaleString() : ''}
                            </span>
                          </div>
                          <p className="text-xs">Remarks: {detailedIncident.verification_record.remarks}</p>
                          <p className="text-[10px] mt-1 opacity-80">Audited by: {detailedIncident.verification_record.verifier}</p>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* Right Column: Smart Dispatch */}
                <div className="col-span-1">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm sticky top-24">
                    <h3 className="font-bold text-slate-800 text-lg mb-4">Smart Dispatch Console</h3>
                    
                    {technicians.length === 0 ? (
                      <p className="text-xs text-slate-400">No technicians registered in current database.</p>
                    ) : (
                      <div className="space-y-4">
                        {technicians.map((tech) => {
                          const isAvailable = tech.availability !== false;
                          const name = tech.user?.name || tech.user?.username || `Technician #${tech.id}`;
                          const specialty = tech.specialty || 'General Maintenance';

                          return (
                            <div 
                              key={tech.id}
                              className={`p-4 border rounded-lg transition-all ${
                                isAvailable ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50 border-slate-200 opacity-60'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div className="role-avatar role-avatar-sm" style={{ background: getRoleAvatarGradient('worker'), flexShrink: 0 }}>{getInitials(name || 'W')}</div>
                                  <h4 className="font-bold text-slate-800 text-sm">{name}</h4>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {isAvailable ? 'AVAILABLE' : 'BUSY'}
                                </span>
                              </div>

                              <div className="mt-2 space-y-1 text-xs text-slate-600">
                                <p className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-blue-500" /> Specialty: {specialty}</p>
                                <p className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-blue-500" /> Rating: {tech.rating || 5.0}★</p>
                              </div>

                              <button 
                                disabled={!isAvailable || isDispatching}
                                onClick={() => handleDispatch(tech.id)}
                                className={`w-full mt-3 font-bold text-xs py-2 rounded-lg transition-colors cursor-pointer ${
                                  isAvailable && !isDispatching 
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                {isDispatching ? 'Dispatching...' : isAvailable ? `Dispatch ${name.split(' ')[0]}` : 'Unavailable'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                </div>

              </div>
            </div>
          )}

          {/* VIEW: OPERATIONAL EXCEPTIONS */}
          {view === 'exceptions' && (
            <div className="animate-in fade-in space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Operational Exceptions & Failure Center</h2>
                  <p className="text-slate-500 text-sm mt-1">Real-time governance breaches, pending approvals, and citizen resolution gaps requiring administrative intervention.</p>
                </div>
                <button
                  onClick={() => api.fetchGovernanceHealth().then(data => setGovernanceHealth(data))}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh Exceptions
                </button>
              </div>

              {(!governanceHealth?.operational_exceptions || governanceHealth.operational_exceptions.length === 0) ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h3 className="text-lg font-bold text-slate-800">Zero Active Operational Exceptions</h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    All SLA deadlines are on track, technician availability is synchronized, financial scopes are settled, and no citizen outcome gaps are open.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-mono border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">Exception / ID</th>
                        <th className="p-3.5">Incident / Subject</th>
                        <th className="p-3.5">Current State</th>
                        <th className="p-3.5">Responsible Role</th>
                        <th className="p-3.5">Age</th>
                        <th className="p-3.5">Required Action</th>
                        <th className="p-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {governanceHealth.operational_exceptions.map((ex: any) => (
                        <tr key={ex.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                              ex.severity === 'critical' ? 'bg-red-100 text-red-800 border border-red-200' :
                              ex.severity === 'high' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              {ex.type.replace(/_/g, ' ')}
                            </span>
                            <p className="text-[10px] font-mono text-slate-400 mt-1">{ex.id}</p>
                          </td>
                          <td className="p-3.5 font-semibold text-slate-800">
                            <p>{ex.title}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">INC-{ex.incident_id}</p>
                          </td>
                          <td className="p-3.5">
                            <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              {ex.current_state}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-600 font-medium">{ex.responsible_role}</td>
                          <td className="p-3.5 font-mono text-slate-600 font-bold">{ex.age_hours}h</td>
                          <td className="p-3.5">
                            <p className="font-medium text-slate-800">{ex.required_action}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{ex.action_history}</p>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => {
                                setSelectedIncidentId(ex.incident_id);
                                setView('incident_detail');
                              }}
                              className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded font-bold text-xs cursor-pointer"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* VIEW: GOVERNANCE HEALTH & SYSTEM INTEGRITY */}
          {view === 'health' && (
            <div className="animate-in fade-in space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">System Integrity & Governance Health</h2>
                  <p className="text-slate-500 text-sm mt-1">Automated relational consistency scanner and real-time backend operational monitoring.</p>
                </div>
                <button
                  disabled={isReconciling}
                  onClick={handleRunReconcile}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl shadow-sm cursor-pointer transition-all disabled:opacity-50"
                >
                  <Zap className="w-4 h-4" />
                  {isReconciling ? 'Reconciling State...' : '⚡ Run Self-Healing Reconciliation'}
                </button>
              </div>

              {/* SYSTEM OPERATIONS OBSERVABILITY PANEL */}
              <div className="bg-slate-900 text-slate-100 rounded-xl p-6 shadow-md border border-slate-800 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-base tracking-wide uppercase">System Operations & Engine Diagnostics</h3>
                  </div>
                  <button
                    onClick={() => api.fetchSystemOperations().then(d => setSystemOperations(d))}
                    className="text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh Telemetry
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400 uppercase">API Health</p>
                    <p className={`text-base font-black mt-1 ${systemOperations?.components?.api_health === 'HEALTHY' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {systemOperations?.components?.api_health || 'HEALTHY'}
                    </p>
                  </div>
                  <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Database</p>
                    <p className={`text-base font-black mt-1 ${systemOperations?.components?.database === 'HEALTHY' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {systemOperations?.components?.database || 'HEALTHY'}
                    </p>
                  </div>
                  <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Governance Engine</p>
                    <p className={`text-base font-black mt-1 ${systemOperations?.components?.governance_engine === 'HEALTHY' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {systemOperations?.components?.governance_engine || 'HEALTHY'}
                    </p>
                  </div>
                  <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Notification Engine</p>
                    <p className={`text-base font-black mt-1 ${systemOperations?.components?.notification_engine === 'HEALTHY' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {systemOperations?.components?.notification_engine || 'HEALTHY'}
                    </p>
                  </div>
                  <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400 uppercase">SLA Engine</p>
                    <p className={`text-base font-black mt-1 ${systemOperations?.components?.sla_engine === 'HEALTHY' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {systemOperations?.components?.sla_engine || 'HEALTHY'}
                    </p>
                  </div>
                  <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Reconciliation</p>
                    <p className={`text-base font-black mt-1 ${systemOperations?.components?.reconciliation === 'HEALTHY' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {systemOperations?.components?.reconciliation || 'HEALTHY'}
                    </p>
                  </div>
                  <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Failed Requests</p>
                    <p className="text-base font-black mt-1 font-mono text-amber-400">
                      {systemOperations?.components?.failed_requests ?? 0}
                    </p>
                  </div>
                  <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Critical Errors</p>
                    <p className="text-base font-black mt-1 font-mono text-red-400">
                      {systemOperations?.components?.critical_errors ?? 0}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <div>Total API Calls: <span className="text-slate-200 font-mono font-bold">{systemOperations?.total_requests || 0}</span></div>
                  <div>Avg Latency: <span className="text-slate-200 font-mono font-bold">{systemOperations?.average_response_time_ms || 0} ms</span></div>
                  <div>Slow Calls (&gt;500ms): <span className="text-slate-200 font-mono font-bold">{systemOperations?.slow_requests_count || 0}</span></div>
                  <div>Auth Issues (401/403): <span className="text-slate-200 font-mono font-bold">{(systemOperations?.auth_failures_count || 0) + (systemOperations?.authz_denials_count || 0)}</span></div>
                </div>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase">System Status</p>
                  <p className={`text-xl font-black mt-1 ${governanceHealth?.status === 'healthy' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {governanceHealth?.status === 'healthy' ? '✅ HEALTHY' : '⚠️ ATTENTION NEEDED'}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase">Total Disbursed Payouts</p>
                  <p className="text-xl font-black text-slate-800 mt-1">
                    ₹{(governanceHealth?.summary?.total_disbursed || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase">Ledger Debits Match</p>
                  <p className="text-xl font-black text-emerald-600 mt-1">
                    ₹{(governanceHealth?.summary?.total_budget_spent || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase">Audit Trail Events</p>
                  <p className="text-xl font-black text-indigo-600 mt-1 font-mono">
                    {governanceHealth?.summary?.total_audit_events || 0}
                  </p>
                </div>
              </div>

              {/* Health Checks Table */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-bold text-slate-800 text-sm">Authoritative System Integrity Verification Matrix</h3>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/50 text-slate-500 uppercase font-mono border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Integrity Check Parameter</th>
                      <th className="p-3.5">Diagnostic State</th>
                      <th className="p-3.5">Relational Audit Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {governanceHealth?.checks?.map((check: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-bold text-slate-800">{check.name}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded text-[11px] font-bold inline-flex items-center gap-1 ${
                            check.is_ok ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {check.is_ok ? '✅' : '⚠️'} {check.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600">{check.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: AUDIT TRAIL LOGS */}
          {view === 'audit' && (
            <div className="animate-in fade-in space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Immutable Audit Trail</h2>
                  <p className="text-slate-500 text-sm mt-1">Authoritative cryptographic audit records of all governance actions, approvals, disbursements, and directives.</p>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={api.getAuditExportUrl({ action: auditActionFilter, actor: auditSearchTerm })}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    📥 Export CSV Log
                  </a>
                  <button
                    onClick={() => loadAuditLogs(auditPage)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                  </button>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      placeholder="Search actor or details..."
                      value={auditSearchTerm}
                      onChange={(e) => setAuditSearchTerm(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') loadAuditLogs(1); }}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700 font-medium"
                    />
                  </div>
                  <select
                    value={auditActionFilter}
                    onChange={(e) => { setAuditActionFilter(e.target.value); setAuditPage(1); }}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none font-medium text-slate-700"
                  >
                    <option value="">All Audit Actions</option>
                    <option value="TASK_COMPLETED">TASK_COMPLETED</option>
                    <option value="SCOPE_APPROVED">SCOPE_APPROVED</option>
                    <option value="EVIDENCE_UPLOADED">EVIDENCE_UPLOADED</option>
                    <option value="INCIDENT_VERIFIED">INCIDENT_VERIFIED</option>
                    <option value="OUTCOME_GAP_FLAGGED">OUTCOME_GAP_FLAGGED</option>
                    <option value="COLLECTOR_DIRECTIVE">COLLECTOR_DIRECTIVE</option>
                    <option value="AUTHORIZATION_DENIED">AUTHORIZATION_DENIED</option>
                    <option value="SYSTEM_RECONCILIATION">SYSTEM_RECONCILIATION</option>
                  </select>
                  <button
                    onClick={() => loadAuditLogs(1)}
                    className="bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-slate-900 cursor-pointer"
                  >
                    Filter
                  </button>
                </div>

                {/* Pagination Status */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-mono">
                    Page {auditPage} of {auditTotalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={auditPage <= 1}
                      onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded text-slate-700 font-bold cursor-pointer"
                    >
                      &larr;
                    </button>
                    <button
                      disabled={auditPage >= auditTotalPages}
                      onClick={() => setAuditPage(p => Math.min(auditTotalPages, p + 1))}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded text-slate-700 font-bold cursor-pointer"
                    >
                      &rarr;
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-mono border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Timestamp</th>
                      <th className="p-3.5">Action</th>
                      <th className="p-3.5">User ID</th>
                      <th className="p-3.5">Audit Trail Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400">
                          No audit log records match the current filter criteria.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5 font-mono text-slate-500 whitespace-nowrap">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                          </td>
                          <td className="p-3.5">
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-slate-600">{log.user_id ? `USR-${log.user_id}` : 'SYSTEM'}</td>
                          <td className="p-3.5 text-slate-800">{log.details}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
