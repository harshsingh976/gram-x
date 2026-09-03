import React, { useState, useEffect, useCallback } from 'react';
import {
  Camera,
  MapPin,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  X,
  UploadCloud,
  CheckCircle2,
  ArrowLeft,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../i18n';
import {
  getMyGrievances,
  type Grievance,
} from '../services/grievanceService';
import { GrievanceForm } from './grievance/GrievanceForm';
import { GrievanceList } from './grievance/GrievanceList';
import { GrievanceDetailModal } from './grievance/GrievanceDetailModal';
import { NotificationBell } from './notifications/NotificationBell';
import { NetworkIndicator } from './common/NetworkIndicator';
import { Button } from './ui/Button';

interface CitizenPortalProps {
  existingIncidents?: any[];
  villageId?: number;
  onReportSubmitted?: () => void;
  showToast?: (message: string, type?: 'info' | 'success' | 'error') => void;
  fullName?: string;
}

export default function CitizenPortal({
  existingIncidents = [],
  villageId = 1,
  onReportSubmitted,
  showToast,
  fullName = 'Citizen',
}: CitizenPortalProps) {
  const { t } = useLanguage();
  const notify = showToast || ((msg: string) => alert(msg));
  const [view, setView] = useState<'dashboard' | 'new_report'>('dashboard');
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const loadGrievances = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMyGrievances();
      setGrievances(data);
    } catch (err: any) {
      console.warn('[CitizenPortal] Grievance loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGrievances();
  }, [loadGrievances]);

  const handleGrievanceSubmitted = (newG: Grievance) => {
    notify('Grievance logged successfully in Panchayat system!', 'success');
    setView('dashboard');
    loadGrievances();
    if (onReportSubmitted) onReportSubmitted();
  };

  const handleOpenDetail = (g: Grievance) => {
    setSelectedGrievance(g);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-950 text-slate-100 min-h-screen border-x border-slate-800 font-sans pb-16">
      {/* Network Offline/Online Indicator Banner */}
      <NetworkIndicator />

      {/* Header */}
      <header className="bg-slate-900/90 backdrop-blur-md p-4 sm:p-5 sticky top-0 z-10 shadow-md flex justify-between items-center border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
              {t('brand.title')} • {t('role.citizen')}
            </h1>
          </div>
          <p className="text-slate-400 text-xs mt-0.5">{t('citizen.overview')}</p>
        </div>
        
        <div className="flex items-center gap-2.5">
          <NotificationBell
            onSelectGrievance={(gId) => {
              const target = grievances.find((g) => String(g.id) === String(gId));
              if (target) {
                setSelectedGrievance(target);
                setIsDetailModalOpen(true);
              }
            }}
          />
          <span className="text-xs bg-slate-800 text-slate-200 px-3 py-1.5 rounded-xl font-bold border border-slate-700">
            {fullName}
          </span>
        </div>
      </header>

      {/* VIEW: DASHBOARD */}
      {view === 'dashboard' && (
        <div className="p-4 sm:p-6 space-y-6 animate-in fade-in">
          {/* Action Trigger Card */}
          <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {t('greeting.welcome_back')}, {fullName}
              </h2>
              <p className="text-xs text-slate-400 mt-1">{t('citizen.feedback_prompt')}</p>
            </div>
            <button
              type="button"
              onClick={() => setView('new_report')}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[46px] active:scale-98 shrink-0 text-xs sm:text-sm"
            >
              <Camera className="w-4 h-4" />
              <span>{t('citizen.create_new')}</span>
            </button>
          </div>

          {/* Grievance List Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
                <span>{t('citizen.my_complaints_title')}</span>
                <span className="text-xs font-mono bg-slate-800 text-sky-400 px-2 py-0.5 rounded-full font-bold border border-slate-700">
                  {grievances.length}
                </span>
              </h2>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-0.5 rounded-md">
                ● {t('system.operational')}
              </span>
            </div>

            <GrievanceList
              grievances={grievances}
              isLoading={isLoading}
              onSelectGrievance={handleOpenDetail}
              emptyTitle={t('citizen.no_complaints_title')}
              emptySubtitle={t('citizen.no_complaints_desc')}
            />
          </div>
        </div>
      )}

      {/* VIEW: NEW GRIEVANCE SUBMISSION */}
      {view === 'new_report' && (
        <div className="p-4 sm:p-6 animate-in fade-in space-y-4">
          <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setView('dashboard')}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
                aria-label="Back to dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {t('citizen.create_new')}
                </h2>
                <p className="text-xs text-slate-400">{t('official_notice')}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
            <GrievanceForm
              villageId={villageId}
              onSuccess={handleGrievanceSubmitted}
              onCancel={() => setView('dashboard')}
            />
          </div>
        </div>
      )}

      {/* Grievance Detail & Resolution Modal */}
      <GrievanceDetailModal
        grievance={selectedGrievance}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        userRole="citizen"
        onGrievanceUpdated={(updated) => {
          setSelectedGrievance(updated);
          loadGrievances();
        }}
      />
    </div>
  );
}
