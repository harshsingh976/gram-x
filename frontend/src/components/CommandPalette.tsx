import React, { useState, useEffect, useRef } from 'react';
import { Search, Compass, FileText, CheckSquare, Sparkles, LogOut, Globe, AlertTriangle, ArrowRight } from 'lucide-react';
import type { UserRole } from '../types';
import * as api from '../api';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  currentRole: UserRole;
  onLogout: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Knowledge' | 'Incident';
  icon: React.ReactNode;
  action: () => void;
  badge?: string;
}

export function CommandPalette({ isOpen, onClose, onNavigate, currentRole, onLogout }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [knowledgeResults, setKnowledgeResults] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setKnowledgeResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setKnowledgeResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.searchKnowledgeBase(query, undefined, 3);
        if (res?.results) {
          setKnowledgeResults(res.results);
        }
      } catch (e) {
        // Silent catch for search fallback
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  // Static navigation commands based on role
  const getBaseCommands = (): CommandItem[] => {
    const items: CommandItem[] = [];

    // Common Nav
    if (currentRole === 'citizen') {
      items.push({
        id: 'nav-citizen',
        title: 'Citizen Grievance & Tracking Portal',
        category: 'Navigation',
        icon: <Compass className="w-4 h-4 text-sky-500" />,
        action: () => { onNavigate('citizen_portal'); onClose(); },
        badge: 'Citizen'
      });
    } else if (currentRole === 'worker') {
      items.push({
        id: 'nav-worker',
        title: 'Technician Work Orders & Field Tasks',
        category: 'Navigation',
        icon: <CheckSquare className="w-4 h-4 text-amber-500" />,
        action: () => { onNavigate('worker_portal'); onClose(); },
        badge: 'Worker'
      });
    } else if (currentRole === 'district') {
      items.push({
        id: 'nav-collector',
        title: 'District Collector Command Center',
        category: 'Navigation',
        icon: <Sparkles className="w-4 h-4 text-indigo-500" />,
        action: () => { onNavigate('command_center'); onClose(); },
        badge: 'Collector'
      });
    } else {
      items.push({
        id: 'nav-admin',
        title: 'Gram Panchayat Admin Dashboard',
        category: 'Navigation',
        icon: <Compass className="w-4 h-4 text-blue-600" />,
        action: () => { onNavigate('village_dashboard'); onClose(); },
        badge: 'Admin'
      });
      items.push({
        id: 'nav-gis',
        title: 'GIS Rural Infrastructure Map',
        category: 'Navigation',
        icon: <Compass className="w-4 h-4 text-emerald-600" />,
        action: () => { onNavigate('gis_map'); onClose(); }
      });
      items.push({
        id: 'nav-budget',
        title: 'Panchayat Fund & Ledger Treasury',
        category: 'Navigation',
        icon: <FileText className="w-4 h-4 text-amber-600" />,
        action: () => { onNavigate('money_budget'); onClose(); }
      });
      items.push({
        id: 'nav-audit',
        title: 'Cryptographic Audit Hash Chain',
        category: 'Navigation',
        icon: <FileText className="w-4 h-4 text-indigo-600" />,
        action: () => { onNavigate('audit_accountability'); onClose(); }
      });
      items.push({
        id: 'nav-esg',
        title: 'ESG+ Sustainability & Integrity Dashboard',
        category: 'Navigation',
        icon: <FileText className="w-4 h-4 text-emerald-600" />,
        action: () => { onNavigate('esg_overview'); onClose(); },
        badge: 'ESG+'
      });
    }

    // Actions
    items.push({
      id: 'act-profile',
      title: 'View User Profile & Security Details',
      category: 'Actions',
      icon: <FileText className="w-4 h-4 text-slate-500" />,
      action: () => { onNavigate('profile'); onClose(); }
    });

    items.push({
      id: 'act-logout',
      title: 'Sign Out of GRAM-X Platform',
      category: 'Actions',
      icon: <LogOut className="w-4 h-4 text-red-500" />,
      action: () => { onLogout(); onClose(); }
    });

    return items;
  };

  const baseCommands = getBaseCommands();
  const filteredBase = baseCommands.filter(c => 
    c.title.toLowerCase().includes(query.toLowerCase()) || 
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  const knowledgeCommands: CommandItem[] = knowledgeResults.map((k, idx) => ({
    id: `know-${idx}`,
    title: `${k.title} (${k.department || 'Gov Scheme'})`,
    category: 'Knowledge',
    icon: <Sparkles className="w-4 h-4 text-purple-500" />,
    action: () => {
      alert(`[Government Knowledge Base Article]\n\nTitle: ${k.title}\nDepartment: ${k.department}\n\nSummary: ${k.summary || k.content}`);
      onClose();
    },
    badge: `Match ${(k.similarity_score * 100).toFixed(0)}%`
  }));

  const allItems = [...filteredBase, ...knowledgeCommands];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (allItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allItems.length) % (allItems.length || 1));
    } else if (e.key === 'Enter' && allItems[selectedIndex]) {
      e.preventDefault();
      allItems[selectedIndex].action();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cmd-palette-backdrop" onClick={onClose}>
      <div className="cmd-palette-modal" onClick={e => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="cmd-palette-header">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            className="cmd-palette-input"
            placeholder="Type a command, page, or search government schemes (e.g. water, JJM, tasks)..."
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
          />
          <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">ESC to close</span>
        </div>

        <div className="cmd-palette-results">
          {allItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No matching pages or schemes found. Try typing "water", "budget", or "profile".
            </div>
          ) : (
            allItems.map((item, index) => (
              <div
                key={item.id}
                className={`cmd-palette-item ${index === selectedIndex ? 'active' : ''}`}
                onClick={item.action}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && <span className="cmd-palette-badge">{item.badge}</span>}
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">{item.category}</span>
                  <ArrowRight className="w-3 h-3 text-slate-300" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
