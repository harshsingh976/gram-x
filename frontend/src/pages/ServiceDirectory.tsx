/**
 * GRAM-X Government Service Directory & Public Notices Page
 * Route: /services
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Phone,
  Clock,
  ArrowLeft,
  Bell,
  CheckCircle2,
  ShieldCheck,
  Search,
} from 'lucide-react';
import {
  getGovernmentServices,
  getActivePublicNotices,
  type GovernmentServiceItem,
  type PublicNoticeItem,
} from '../services/directoryService';

export const ServiceDirectory = () => {
  const [services, setServices] = useState<GovernmentServiceItem[]>([]);
  const [notices, setNotices] = useState<PublicNoticeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getGovernmentServices(), getActivePublicNotices()]).then(([srvs, ntcs]) => {
      setServices(srvs);
      setNotices(ntcs);
      setLoading(false);
    });
  }, []);

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                <Building2 className="w-5 h-5 text-sky-400" />
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Panchayat Services Directory &amp; Notices
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                Official department helplines, SLA benchmarks, and village civic notices.
              </p>
            </div>
          </div>

          <Link
            to="/transparency"
            className="text-xs bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm"
          >
            Public Transparency
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Active Notices Section */}
        {notices.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Active Public Notices &amp; Maintenance Drives
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4.5 space-y-2 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-500/40">
                      {notice.location_scope}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(notice.created_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white leading-snug">{notice.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{notice.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services Directory Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Government Departments &amp; Helplines</h2>
              <p className="text-xs text-slate-400">
                Authorized public departments responsible for rural maintenance and statutory SLAs.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between hover:border-slate-750 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-sky-400 border border-slate-700">
                      {service.category}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-400" />
                      {service.sla_days} Days SLA
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white leading-snug">{service.name}</h3>
                  <p className="text-[11px] text-slate-400">{service.department}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Nodal Officer:</span>
                    <span className="font-medium text-slate-200">{service.nodal_officer}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Official Helpline:</span>
                    <a
                      href={`tel:${service.helpline}`}
                      className="text-sky-400 hover:underline flex items-center gap-1 font-mono font-bold"
                    >
                      <Phone className="w-3 h-3" /> {service.helpline}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ServiceDirectory;
