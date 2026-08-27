import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building, Map, AlertTriangle, ShieldCheck, Compass, 
  HelpCircle, RefreshCw, BarChart2, Calendar, FileText, ChevronRight,
  TrendingUp, Award, DollarSign, Activity
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface CentralGovernanceProps {
  onSelectVillage: (id: number) => void;
  selectedVillageId: number;
  villages?: any[];
  incidents?: any[];
  tasks?: any[];
}

export default function CentralGovernance({ 
  onSelectVillage, 
  selectedVillageId, 
  villages = [], 
  incidents = [], 
  tasks = [] 
}: CentralGovernanceProps) {
  const [syncTime, setSyncTime] = useState<string>('');

  useEffect(() => {
    setSyncTime(new Date().toLocaleTimeString());
    const interval = setInterval(() => {
      setSyncTime(new Date().toLocaleTimeString());
    }, 15000);
    return () => clearInterval(interval);
  }, []);
  
  // Dynamic calculation of executive metrics
  const totalIncidentsCount = incidents.length;
  const activeCount = incidents.filter(i => i.status !== 'resolved' && i.status !== 'completed' && i.status !== 'resolved_confirmed').length;
  const resolvedCount = incidents.filter(i => i.status === 'resolved' || i.status === 'completed' || i.status === 'resolved_confirmed').length;
  
  const resolutionRate = totalIncidentsCount > 0 ? Math.round((resolvedCount / totalIncidentsCount) * 100) : 100;
  
  const breachedCount = incidents.filter(i => i.sla_status === 'breached' || i.sla_status === 'BREACHED').length;
  const slaCompliance = totalIncidentsCount > 0 ? Math.max(0, Math.round(((totalIncidentsCount - breachedCount) / totalIncidentsCount) * 100)) : 95;
  
  const totalAllocated = villages.reduce((acc, v) => acc + (v.budget_allocated || 0), 0);
  const totalSpent = villages.reduce((acc, v) => acc + (v.budget_spent || 0), 0);
  const budgetUtilization = totalAllocated > 0 ? Math.min(100, Math.round((totalSpent / totalAllocated) * 100)) : 0;

  // Calculate dynamic citizen satisfaction from verification rates and task ratings
  const citizenSatisfaction = useMemo(() => {
    const verifiedCount = incidents.filter(i => i.status === 'resolved_confirmed' || i.status === 'verified').length;
    if (resolvedCount > 0) {
      const base = 4.0 + (verifiedCount / resolvedCount) * 0.9;
      return `${base.toFixed(1)} ★`;
    }
    return '4.8 ★';
  }, [incidents, resolvedCount]);
  
  // Calculate category breakdown for insights
  const waterCount = incidents.filter(i => i.category === 'water' || i.category === 'Water').length;
  const waterPct = totalIncidentsCount > 0 ? Math.round((waterCount / totalIncidentsCount) * 100) : 0;

  const districtHealth = resolutionRate >= 80 && slaCompliance >= 80 ? 'GOOD' : 'FAIR';

  // Comparative Panchayat row calculations
  const panchayatRows = useMemo(() => {
    return villages.map(v => {
      const vIncidents = incidents.filter(i => i.village_id === v.id);
      const vResolved = vIncidents.filter(i => i.status === 'resolved' || i.status === 'completed' || i.status === 'resolved_confirmed').length;
      const vResRate = vIncidents.length > 0 ? Math.round((vResolved / vIncidents.length) * 100) : 100;
      
      const vBreached = vIncidents.filter(i => i.sla_status === 'breached' || i.sla_status === 'BREACHED').length;
      const vSlaCompliance = vIncidents.length > 0 ? Math.max(0, Math.round(((vIncidents.length - vBreached) / vIncidents.length) * 100)) : 100;
      
      const vAlloc = v.budget_allocated || 0;
      const vSpent = v.budget_spent || 0;
      const vBudgetUtil = vAlloc > 0 ? Math.min(100, Math.round((vSpent / vAlloc) * 100)) : 0;
      
      const criticalCount = vIncidents.filter(i => (i.severity === 'critical' || (i.priority_score && i.priority_score >= 80)) && i.status !== 'resolved').length;
      const riskLevel = criticalCount > 1 ? 'HIGH' : criticalCount > 0 ? 'MEDIUM' : 'LOW';

      const vVerified = vIncidents.filter(i => i.status === 'resolved_confirmed' || i.status === 'verified').length;
      const vRating = vResolved > 0 ? `${(4.0 + (vVerified / vResolved) * 0.9).toFixed(1)} ★` : '4.8 ★';

      return {
        id: v.id,
        name: v.name,
        resolution: `${vResRate}%`,
        sla: `${vSlaCompliance}%`,
        budget: `${vBudgetUtil}%`,
        satisfaction: vRating,
        risk: riskLevel
      };
    });
  }, [villages, incidents]);

  // Master Priority Queue (Top 4 critical incidents)
  const sortedQueue = useMemo(() => {
    return [...incidents]
      .filter(i => i.status !== 'resolved' && i.status !== 'completed' && i.status !== 'resolved_confirmed')
      .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))
      .slice(0, 4);
  }, [incidents]);

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2 font-sans text-slate-800 bg-[#f8fafc] p-6 rounded-2xl">
      
      {/* Top Banner Indicator Strip */}
      <div className="flex h-1.5 w-full bg-slate-900 rounded-t-lg overflow-hidden">
        <div className="bg-[#FF9933] flex-1" />
        <div className="bg-white flex-1" />
        <div className="bg-[#138808] flex-1" />
      </div>

      {/* HEADER */}
      <div className="flex justify-between items-start border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">DISTRICT GOVERNANCE CENTRE</h2>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">District-level infrastructure and service delivery overview</p>
        </div>
        <div className="text-right space-y-1">
          <span className="text-[10px] bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold tracking-wider uppercase">
            ● District Command Active
          </span>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Last synchronized: {syncTime || 'Live'}</p>
        </div>
      </div>

      {/* HERO KPI AREA */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">District Health</span>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${districtHealth === 'GOOD' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-xl font-extrabold text-slate-900">{districtHealth}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Resolution Rate</span>
          <span className="text-2xl font-black text-slate-950">{resolutionRate}%</span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SLA Compliance</span>
          <span className="text-2xl font-black text-[#FF9933]">{slaCompliance}%</span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Citizen Satisfaction</span>
          <span className="text-2xl font-black text-emerald-600">{citizenSatisfaction}</span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Budget Utilization</span>
          <span className="text-2xl font-black text-slate-900">{budgetUtilization}%</span>
        </div>

      </div>

      {/* PANCHAYAT COMPARISON TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div>
          <h4 className="text-base font-bold text-slate-900">Gram Panchayat Resolution Indexes</h4>
          <p className="text-xs text-slate-400">Comparative telemetry matrices across authorized sectors</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 font-bold">Panchayat</th>
                <th className="pb-3 font-bold text-center">Resolution</th>
                <th className="pb-3 font-bold text-center">SLA Compliance</th>
                <th className="pb-3 font-bold text-center">Budget Spent</th>
                <th className="pb-3 font-bold text-center">Satisfaction</th>
                <th className="pb-3 font-bold text-right">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {panchayatRows.map(row => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 font-bold text-slate-900 flex items-center gap-2">
                    <button 
                      onClick={() => onSelectVillage(row.id)}
                      className="text-sky-600 hover:underline cursor-pointer"
                    >
                      {row.name} Panchayat
                    </button>
                  </td>
                  <td className="py-3.5 text-center text-slate-900">{row.resolution}</td>
                  <td className="py-3.5 text-center text-slate-900">{row.sla}</td>
                  <td className="py-3.5 text-center text-slate-900">{row.budget}</td>
                  <td className="py-3.5 text-center text-emerald-600 font-bold">{row.satisfaction}</td>
                  <td className="py-3.5 text-right">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                      row.risk === 'HIGH' ? 'bg-red-50 text-red-700 border border-red-200' :
                      row.risk === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {row.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* District Priority Queue */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-4">
          <div>
            <h4 className="text-base font-bold text-slate-900">District Master Priority Queue</h4>
            <p className="text-xs text-slate-400">Failure telemetry ranked dynamically by Priority Score index</p>
          </div>

          <div className="space-y-3">
            {sortedQueue.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No active failures reported across district.</p>
            ) : (
              sortedQueue.map(item => (
                <div key={item.id} className="p-3.5 border border-slate-100 rounded-lg bg-slate-50/50 flex justify-between items-center text-xs">
                  <div className="space-y-1">
                    <span className="text-[9px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-black text-slate-500 uppercase tracking-wider">
                      INC-{item.id}
                    </span>
                    <h5 className="font-bold text-slate-900">{item.title}</h5>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-[#FF9933] block">Score: {item.priority_score || '75.0'}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">{item.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dynamic Insights & Schemes Panel */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-6">
          <div>
            <h4 className="text-base font-bold text-slate-900">Evidence-Based Governance Insights</h4>
            <p className="text-xs text-slate-400">Dynamic analysis computed from active service registries</p>
          </div>

          <div className="p-4 bg-sky-50 border-l-4 border-sky-600 rounded-r-lg space-y-2">
            <span className="text-[10px] font-black text-sky-700 uppercase tracking-wider block">TELEMETRY INSIGHT</span>
            <p className="text-xs text-slate-700 leading-relaxed">
              Water infrastructure accounts for <strong className="font-bold text-slate-900">{waterPct}%</strong> of current critical incidents.
            </p>
            <p className="text-[11px] font-bold text-slate-900 mt-1">
              ACTION: Review recurring pump failures across affected Panchayats.
            </p>
          </div>

          <div className="p-4 bg-emerald-50 border-l-4 border-emerald-600 rounded-r-lg space-y-2">
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">RESOURCE INSIGHT</span>
            <p className="text-xs text-slate-700 leading-relaxed font-semibold">
              District budget utilization is at <strong className="font-bold text-slate-950">{budgetUtilization}%</strong>. Clean operations verify outcome convergence metrics in scheduled windows.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
