/**
 * GRAM-X Public Transparency Portal
 * Route: /transparency
 * Shows public-safe, anonymized governance metrics, resolution velocity, and department breakdowns without citizen PII.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Activity,
  ArrowLeft,
  Building2,
  BarChart3,
  Droplets,
  Zap,
  Truck,
  Hammer,
} from 'lucide-react';
import {
  getPublicTransparencyStats,
  type PublicTransparencyStats,
} from '../services/transparencyService';

export const TransparencyPortal = () => {
  const [stats, setStats] = useState<PublicTransparencyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicTransparencyStats().then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'water': return <Droplets className="w-4 h-4 text-sky-400" />;
      case 'electricity': return <Zap className="w-4 h-4 text-amber-400" />;
      case 'roads': return <Truck className="w-4 h-4 text-emerald-400" />;
      case 'sanitation': return <Hammer className="w-4 h-4 text-rose-400" />;
      default: return <Building2 className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sky-400" />
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  GRAM-X Public Transparency Portal
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                Open governance dashboard for Panchayat citizen grievances &amp; SLA compliance.
              </p>
            </div>
          </div>

          <Link
            to="/login"
            className="text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold px-3.5 py-2 rounded-xl transition-all shadow-md"
          >
            Citizen Sign In
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Total Grievances</span>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {loading ? '...' : stats?.totalReceived}
            </div>
            <p className="text-[11px] text-slate-500">Logged across participating Panchayats</p>
          </div>

          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 space-y-1">
            <span className="text-xs text-emerald-400 font-medium">Resolved Complaints</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {loading ? '...' : stats?.totalResolved}
            </div>
            <p className="text-[11px] text-slate-500">
              {loading ? '...' : `${stats?.resolutionPercentage}% resolution rate`}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Avg Resolution Velocity</span>
            <div className="text-2xl sm:text-3xl font-black text-sky-400 font-mono">
              {loading ? '...' : `${stats?.averageResolutionDays} Days`}
            </div>
            <p className="text-[11px] text-slate-500">From submission to citizen confirmation</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
            <span className="text-xs text-slate-400 font-medium">SLA Adherence</span>
            <div className="text-2xl sm:text-3xl font-black text-indigo-400 font-mono">
              {loading ? '...' : `${stats?.slaAdherencePercentage}%`}
            </div>
            <p className="text-[11px] text-slate-500">Completed within statutory deadlines</p>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white">Department Workload &amp; Resolution</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats &&
              Object.entries(stats.byCategory).map(([catKey, val]) => (
                <div
                  key={catKey}
                  className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      {getCategoryIcon(catKey)}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        {catKey}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {val.resolvedCount} of {val.count} resolved
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-emerald-400">
                      {val.percentage}%
                    </span>
                    <div className="w-20 bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${val.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Panchayat Comparison Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Panchayat-Level Performance</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3 font-semibold">Panchayat Name</th>
                  <th className="p-3 font-semibold">Total Logged</th>
                  <th className="p-3 font-semibold">Resolved</th>
                  <th className="p-3 font-semibold">Resolution Rate</th>
                  <th className="p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {stats?.byPanchayat.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="p-3 font-sans font-medium text-white">{p.name}</td>
                    <td className="p-3 text-slate-300">{p.total}</td>
                    <td className="p-3 text-emerald-400 font-bold">{p.resolved}</td>
                    <td className="p-3 text-sky-400 font-bold">{p.rate}%</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TransparencyPortal;
