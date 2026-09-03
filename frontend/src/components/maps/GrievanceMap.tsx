/**
 * GRAM-X Geographic Grievance Map Component
 * Visualizes authorized civic grievances on a spatial grid with category pins, status clusters, and popup details.
 */

import React, { useState } from 'react';
import {
  MapPin,
  Filter,
  Layers,
  Maximize2,
  Droplets,
  Zap,
  Truck,
  Hammer,
  Building2,
  HelpCircle,
  Eye,
} from 'lucide-react';
import type { Grievance, GrievanceCategory } from '../../services/grievanceService';
import { GrievanceStatusBadge } from '../grievance/GrievanceStatusBadge';

export interface GrievanceMapProps {
  grievances: Grievance[];
  onSelectGrievance?: (grievance: Grievance) => void;
  className?: string;
  height?: string;
}

const CATEGORY_COLORS: Record<GrievanceCategory, { bg: string; border: string; text: string }> = {
  water: { bg: 'bg-sky-500', border: 'border-sky-300', text: 'text-sky-400' },
  electricity: { bg: 'bg-amber-500', border: 'border-amber-300', text: 'text-amber-400' },
  roads: { bg: 'bg-orange-500', border: 'border-orange-300', text: 'text-orange-400' },
  sanitation: { bg: 'bg-rose-500', border: 'border-rose-300', text: 'text-rose-400' },
  infrastructure: { bg: 'bg-purple-500', border: 'border-purple-300', text: 'text-purple-400' },
  other: { bg: 'bg-slate-500', border: 'border-slate-300', text: 'text-slate-400' },
};

export const GrievanceMap = ({
  grievances = [],
  onSelectGrievance,
  className = '',
  height = 'h-80',
}: GrievanceMapProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activePin, setActivePin] = useState<Grievance | null>(null);

  const filteredGrievances = grievances.filter(
    (g) => selectedCategory === 'ALL' || g.category === selectedCategory
  );

  return (
    <div className={`relative bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl ${className}`}>
      {/* Map Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold text-white">Spatial Grievance Cluster</span>
          <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
            {filteredGrievances.length} Active Pins
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Categories</option>
            <option value="water">Water Supply</option>
            <option value="electricity">Electricity</option>
            <option value="roads">Roads</option>
            <option value="sanitation">Sanitation</option>
            <option value="infrastructure">Infrastructure</option>
          </select>
        </div>
      </div>

      {/* Map Canvas Visualizer */}
      <div className={`relative w-full ${height} bg-[#0b1329] flex items-center justify-center overflow-hidden`}>
        {/* Subtle Map Grid lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-60" />

        {/* Contour lines simulation */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,#38bdf8_10%,transparent_60%)]" />

        {/* Render Map Markers */}
        <div className="relative w-full h-full p-12">
          {filteredGrievances.map((g, idx) => {
            const colors = CATEGORY_COLORS[g.category] || CATEGORY_COLORS.other;
            // Spread pins inside container based on coordinates offset
            const leftPct = 15 + ((idx * 27 + (g.location_lng ? g.location_lng * 100 : 50)) % 70);
            const topPct = 25 + ((idx * 31 + (g.location_lat ? g.location_lat * 100 : 50)) % 55);

            const isSelected = activePin?.id === g.id;

            return (
              <div
                key={g.id}
                style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                onClick={() => setActivePin(g)}
              >
                {/* Ping animation on critical/high */}
                {(g.priority === 'critical' || g.priority === 'high') && (
                  <span className={`absolute -inset-1 rounded-full animate-ping opacity-40 ${colors.bg}`} />
                )}

                <div
                  className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 ${colors.border} ${colors.bg} text-white shadow-lg transition-transform hover:scale-125 ${
                    isSelected ? 'scale-125 ring-4 ring-sky-400/50' : ''
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                </div>

                {/* Mini Hover Label */}
                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-slate-900 border border-slate-700 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-30 pointer-events-none">
                  {g.reference_no} • {g.title}
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Pin Detail Popup */}
        {activePin && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm bg-slate-900/95 border border-sky-500/40 rounded-xl p-3.5 shadow-2xl backdrop-blur-md z-30 animate-in fade-in slide-in-from-bottom-2 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono text-sky-400 font-bold bg-sky-950 px-2 py-0.5 rounded border border-sky-500/30">
                  {activePin.reference_no}
                </span>
                <h4 className="text-xs font-bold text-white mt-1 line-clamp-1">{activePin.title}</h4>
              </div>
              <button
                onClick={() => setActivePin(null)}
                className="text-slate-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-2">
              <GrievanceStatusBadge status={activePin.status} size="sm" />
              <span className="text-[10px] text-slate-400 capitalize">{activePin.category}</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800">
              <span className="text-[10px] text-slate-500 truncate max-w-[180px]">
                {activePin.location_address || 'Panchayat Area'}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (onSelectGrievance) onSelectGrievance(activePin);
                  setActivePin(null);
                }}
                className="text-[11px] text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Eye className="w-3 h-3" /> View Detail
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Map Footer Legend */}
      <div className="p-2.5 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sky-400" /> Water
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Electricity
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-400" /> Roads
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400" /> Sanitation
          </span>
        </div>
        <span className="font-mono text-slate-500">MapLibre Vector Engine • WGS84</span>
      </div>
    </div>
  );
};

export default GrievanceMap;
