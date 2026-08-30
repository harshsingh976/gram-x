import React, { useState } from 'react';
import { Camera, MapPin, CheckCircle, Clock, AlertTriangle, ChevronRight, X, UploadCloud, CheckCircle2, ArrowLeft } from 'lucide-react';
import * as api from '../api';
import { useLanguage } from '../i18n';
import { StatusBadge, EmptyState } from './common/UIComponents';

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
  fullName = 'Citizen'
}: CitizenPortalProps) {
  const { t } = useLanguage();
  const notify = showToast || ((msg: string) => alert(msg));
  const [view, setView] = useState<'dashboard' | 'new_report' | 'timeline'>('dashboard');
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);
  
  // Controlled Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('water');
  const [description, setDescription] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      notify('Please provide a title and description.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.reportIncident({
        title: title.trim(),
        description: description.trim(),
        category,
        village_id: villageId,
        reporter_name: fullName,
        latitude: 23.2845,
        longitude: 77.4521,
        evidence_photo: previewImage || undefined
      });
      notify('Complaint logged successfully in Panchayat system!', 'success');
      setTitle('');
      setDescription('');
      setPreviewImage(null);
      setView('dashboard');
      if (onReportSubmitted) onReportSubmitted();
    } catch (err: any) {
      notify(err.message || 'Failed to submit report', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedIncident = existingIncidents.find(i => i.id === selectedIncidentId) || existingIncidents[0] || null;

  return (
    <div className="w-full max-w-3xl mx-auto bg-slate-50 min-h-screen border-x border-slate-200 font-sans pb-16">
      
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 sm:p-5 sticky top-0 z-10 shadow-md flex justify-between items-center border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">{t('brand.title')} • {t('role.citizen')}</h1>
          </div>
          <p className="text-slate-400 text-xs mt-0.5">{t('citizen.overview')}</p>
        </div>
        <span className="text-xs bg-slate-800 text-slate-200 px-3 py-1.5 rounded-xl font-bold border border-slate-700">
          {fullName}
        </span>
      </header>

      {/* VIEW: DASHBOARD */}
      {view === 'dashboard' && (
        <div className="p-4 sm:p-6 space-y-6 animate-in fade-in">
          
          {/* Action Trigger Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">{t('greeting.welcome_back')}, {fullName}</h2>
              <p className="text-xs text-slate-500 mt-1">{t('citizen.feedback_prompt')}</p>
            </div>
            <button 
              type="button"
              onClick={() => setView('new_report')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[48px] active:scale-98 shrink-0"
            >
              <Camera className="w-5 h-5" />
              <span>{t('citizen.create_new')}</span>
            </button>
          </div>

          {/* Grievance List Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-slate-900 font-bold text-sm sm:text-base flex items-center gap-2">
                <span>{t('citizen.my_complaints_title')}</span>
                <span className="text-xs font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                  {existingIncidents.length}
                </span>
              </h2>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                ● {t('system.operational')}
              </span>
            </div>
            
            {existingIncidents.length === 0 ? (
              <EmptyState
                title={t('citizen.no_complaints_title')}
                description={t('citizen.no_complaints_desc')}
                actionText={t('citizen.create_new')}
                onAction={() => setView('new_report')}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {existingIncidents.map(inc => (
                  <div 
                    key={inc.id}
                    onClick={() => { setSelectedIncidentId(inc.id); setView('timeline'); }}
                    className="bg-white p-4 rounded-xl shadow-xs border border-slate-200/90 cursor-pointer active:scale-98 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <StatusBadge status={inc.status} size="sm" />
                        <span className="text-slate-400 text-xs font-mono shrink-0">#INC-{inc.id}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm line-clamp-2">{inc.title}</h3>
                      <p className="text-slate-500 text-xs flex items-center gap-1 mt-1 capitalize font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{t('citizen.category')}: <strong className="text-slate-700">{inc.category}</strong></span>
                      </p>
                    </div>

                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <span className="font-semibold text-slate-500">Priority: <strong className="text-slate-900">{inc.priority_score || 'Standard'}</strong></span>
                      <span className="text-blue-600 font-bold flex items-center gap-0.5 hover:underline">
                        {t('action.view_details')} <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: NEW REPORT (WITH IMAGE UPLOAD) */}
      {view === 'new_report' && (
        <div className="p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-4 space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => setView('dashboard')} 
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
                aria-label="Back to dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">{t('citizen.create_new')}</h2>
                <p className="text-xs text-slate-500">{t('official_notice')}</p>
              </div>
            </div>
          </div>

          <form onSubmit={submitComplaint} className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            
            <div>
              <label htmlFor="complaint-title" className="text-xs font-bold text-slate-700 block mb-1.5">
                {t('citizen.problem_title')} <span className="text-red-500">*</span>
              </label>
              <input 
                id="complaint-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('citizen.problem_title_ph')}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none min-h-[48px]"
              />
            </div>

            {/* Image Upload Area */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                {t('citizen.evidence_photo')}
              </label>
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 text-center relative transition-colors cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Upload photo evidence"
                />
                {previewImage ? (
                  <div className="space-y-2">
                    <img src={previewImage} alt="Uploaded Evidence Preview" className="mx-auto max-h-48 rounded-lg object-contain border border-slate-200" />
                    <p className="text-xs text-blue-600 font-bold">Tap to change image</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center pointer-events-none space-y-1">
                    <UploadCloud className="w-9 h-9 text-blue-500 mb-1" />
                    <span className="font-bold text-slate-800 text-sm">{t('citizen.upload_photo')}</span>
                    <span className="text-[11px] text-slate-500">Supports JPG, PNG direct camera capture</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="complaint-cat" className="text-xs font-bold text-slate-700 block">
                {t('citizen.category')} <span className="text-red-500">*</span>
              </label>
              <select 
                id="complaint-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm font-medium min-h-[48px]"
              >
                <option value="water">Water Supply / Pipeline</option>
                <option value="electricity">Street Lighting / Power Grid</option>
                <option value="sanitation">Sanitation / Drainage Waste</option>
                <option value="roads">Road Infrastructure & Bridges</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="complaint-desc" className="text-xs font-bold text-slate-700 block">
                {t('citizen.description')} <span className="text-red-500">*</span>
              </label>
              <textarea 
                id="complaint-desc"
                rows={3} 
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm"
                placeholder={t('citizen.description_ph')}
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md mt-4 cursor-pointer transition-all min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-5 h-5 animate-spin" />
                  <span>{t('citizen.submitting')}</span>
                </>
              ) : (
                <span>{t('citizen.submit_btn')}</span>
              )}
            </button>
          </form>
        </div>
      )}

      {/* VIEW: CITIZEN TRUST TIMELINE */}
      {view === 'timeline' && selectedIncident && (
        <div className="p-4 sm:p-6 animate-in fade-in slide-in-from-right-4 space-y-4">
          <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <button 
              type="button"
              onClick={() => setView('dashboard')} 
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="text-[10px] font-mono text-slate-400 font-bold">#INC-{selectedIncident.id}</span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1">{selectedIncident.title}</h2>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-5 sm:p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('nav.track_verify')}</span>
              <StatusBadge status={selectedIncident.status} />
            </div>

            <div className="relative border-l-2 border-blue-200 ml-3 space-y-6">
              
              {/* Step 1 */}
              <div className="relative pl-6">
                <span className="absolute -left-[9px] top-1 bg-blue-600 rounded-full w-4 h-4 border-2 border-white shadow-xs"></span>
                <h4 className="font-bold text-slate-900 text-sm">{t('timeline.submitted')}</h4>
                <p className="text-xs text-slate-500">{selectedIncident.created_at ? new Date(selectedIncident.created_at).toLocaleString() : 'Registered'}</p>
              </div>

              {/* Step 2 */}
              <div className="relative pl-6">
                <span className="absolute -left-[9px] top-1 bg-blue-600 rounded-full w-4 h-4 border-2 border-white shadow-xs"></span>
                <h4 className="font-bold text-slate-900 text-sm">{t('admin.ai_triage')}</h4>
                <p className="text-xs text-slate-500">MCDA Priority: {selectedIncident.priority_score || 'Evaluated'}</p>
              </div>

              {/* Step 3 */}
              <div className="relative pl-6">
                <span className={`absolute -left-[9px] top-1 rounded-full w-4 h-4 border-2 border-white shadow-xs ${
                  selectedIncident.status !== 'open' && selectedIncident.status !== 'reported' ? 'bg-blue-600' : 'bg-slate-300'
                }`}></span>
                <h4 className="font-bold text-slate-900 text-sm">{t('timeline.assigned')}</h4>
                <p className="text-xs text-slate-500">Certified technician routed by Gram Panchayat dispatch engine.</p>
              </div>

              {/* Step 4 */}
              <div className="relative pl-6">
                <span className={`absolute -left-[9px] top-1 rounded-full w-4 h-4 border-2 border-white shadow-xs ${
                  selectedIncident.status === 'resolved' || selectedIncident.status === 'completed' || selectedIncident.status === 'resolved_confirmed'
                    ? 'bg-emerald-600' 
                    : 'bg-amber-400 animate-pulse'
                }`}></span>
                <h4 className="font-bold text-slate-900 text-sm">{t('timeline.resolved')}</h4>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">
                  {selectedIncident.status === 'resolved' || selectedIncident.status === 'completed' || selectedIncident.status === 'resolved_confirmed' 
                    ? t('citizen.verified_success') 
                    : 'Field repair underway'}
                </p>
              </div>

            </div>
          </div>
          
          {/* Verification UI */}
          {(selectedIncident.status === 'pending_verification' || selectedIncident.status === 'completed') && (
            <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3 shadow-xs">
              <h4 className="font-bold text-emerald-950 text-sm sm:text-base">Confirm Field Resolution</h4>
              <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                Has the technician repaired the reported infrastructure satisfactorily?
              </p>
              <div className="flex gap-2.5 pt-1">
                <button 
                  type="button"
                  onClick={async () => {
                    try {
                      await api.verifyIncident(selectedIncident.id, 'verified', 'Citizen verified resolved successfully.', fullName);
                      notify('Verification confirmed in government audit logs!', 'success');
                      if (onReportSubmitted) onReportSubmitted();
                      setView('dashboard');
                    } catch (e: any) {
                      notify('Failed to verify incident', 'error');
                    }
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs sm:text-sm shadow-sm cursor-pointer min-h-[44px]"
                >
                  Yes, Satisfactorily Fixed
                </button>
                <button 
                  type="button"
                  onClick={async () => {
                    try {
                      await api.verifyIncident(selectedIncident.id, 'outcome_gap', 'Citizen flagged outcome gap: problem persists.', fullName);
                      notify('Outcome gap flagged and returned to dispatch desk!', 'info');
                      if (onReportSubmitted) onReportSubmitted();
                      setView('dashboard');
                    } catch (e: any) {
                      notify('Failed to flag outcome gap', 'error');
                    }
                  }}
                  className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-sm cursor-pointer min-h-[44px]"
                >
                  No, Problem Persists
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
