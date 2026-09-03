/**
 * GRAM-X Grievance List Component
 * Searchable, filterable list of grievances with status badges, metadata, and pagination.
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  ChevronRight,
  Droplets,
  Zap,
  Hammer,
  Truck,
  Building2,
  HelpCircle,
  FileQuestion,
} from 'lucide-react';
import type { Grievance, GrievanceCategory, GrievanceStatus } from '../../services/grievanceService';
import { GrievanceStatusBadge } from './GrievanceStatusBadge';

export interface GrievanceListProps {
  grievances: Grievance[];
  isLoading?: boolean;
  onSelectGrievance?: (grievance: Grievance) => void;
  emptyTitle?: string;
  emptySubtitle?: string;
  className?: string;
}

export const GrievanceList = ({
  grievances = [],
  isLoading = false,
  onSelectGrievance,
  emptyTitle = 'No grievances found',
  emptySubtitle = 'There are currently no reported civic grievances in this category.',
  className = '',
}: GrievanceListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredGrievances = useMemo(() => {
    return grievances.filter((g) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.reference_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.location_address && g.location_address.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = categoryFilter === 'ALL' || g.category === categoryFilter;
      const matchesStatus = statusFilter === 'ALL' || g.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [grievances, searchQuery, categoryFilter, statusFilter]);

  const getCategoryIcon = (category: GrievanceCategory) => {
    switch (category) {
      case 'water':
        return Droplets;
      case 'electricity':
        return Zap;
      case 'roads':
        return Truck;
      case 'sanitation':
        return Hammer;
      case 'infrastructure':
        return Building2;
      default:
        return HelpCircle;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400 font-medium">Loading Panchayat records...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by keyword, reference (GX-2026-...), or location..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Categories</option>
            <option value="water">Water Supply</option>
            <option value="electricity">Electricity Grid</option>
            <option value="roads">Roads & Drainage</option>
            <option value="sanitation">Sanitation</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="other">Other</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="VERIFIED">Verified</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
            <option value="ESCALATED">Escalated</option>
          </select>
        </div>
      </div>

      {/* Grievance Card Grid */}
      {filteredGrievances.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-10 text-center space-y-2">
          <FileQuestion className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">{emptyTitle}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{emptySubtitle}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredGrievances.map((grievance) => {
            const CatIcon = getCategoryIcon(grievance.category);

            return (
              <div
                key={grievance.id}
                onClick={() => onSelectGrievance && onSelectGrievance(grievance)}
                className="bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800/90 hover:border-sky-500/50 rounded-xl p-4 transition-all cursor-pointer shadow-xs group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-sky-400 bg-sky-950/60 border border-sky-500/30 px-2 py-0.5 rounded-md">
                        {grievance.reference_no}
                      </span>
                      <GrievanceStatusBadge status={grievance.status} size="sm" />
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-md">
                        <CatIcon className="w-3 h-3 text-slate-300" />
                        <span className="capitalize">{grievance.category}</span>
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                      {grievance.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {grievance.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-800/60">
                    <div className="text-left sm:text-right text-[11px] text-slate-500 space-y-0.5">
                      <div className="flex items-center gap-1 sm:justify-end">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{formatDate(grievance.created_at)}</span>
                      </div>
                      {grievance.location_address && (
                        <div className="flex items-center gap-1 sm:justify-end text-[10px] text-slate-400 max-w-[160px] truncate">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{grievance.location_address}</span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-sky-400 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GrievanceList;
