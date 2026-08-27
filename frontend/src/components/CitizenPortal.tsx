import React, { useState } from 'react';
import { Camera, MapPin, CheckCircle, Clock, AlertTriangle, ChevronRight, X, UploadCloud, CheckCircle2 } from 'lucide-react';
import * as api from '../api';

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
    if (!title || !description) {
      notify('Please provide a title and description.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.reportIncident({
        title,
        description,
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
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen shadow-lg border-x border-gray-200 font-sans pb-10">
      
      {/* Header */}
      <header className="bg-emerald-700 text-white p-4 sticky top-0 z-10 shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight">GRAM-X Citizen</h1>
          <p className="text-emerald-100 text-xs">Panchayat Resolution Portal</p>
        </div>
        <span className="text-xs bg-emerald-800 text-emerald-100 px-2.5 py-1 rounded-full font-bold">
          {fullName}
        </span>
      </header>

      {/* VIEW: DASHBOARD */}
      {view === 'dashboard' && (
        <div className="p-4 space-y-6 animate-in fade-in">
          <button 
            onClick={() => setView('new_report')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Camera className="w-5 h-5" />
            Report New Issue
          </button>

          <div>
            <h2 className="text-gray-800 font-bold mb-3 flex items-center justify-between">
              Your Reports ({existingIncidents.length})
              <span className="text-xs font-normal text-gray-500 bg-gray-200 px-2 py-1 rounded-full">Live Database</span>
            </h2>
            
            <div className="space-y-3">
              {existingIncidents.length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  No open issues reported yet. Click above to report a community problem.
                </div>
              ) : (
                existingIncidents.map(inc => (
                  <div 
                    key={inc.id}
                    onClick={() => { setSelectedIncidentId(inc.id); setView('timeline'); }}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer active:scale-98 hover:border-emerald-300 transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        inc.status === 'resolved' || inc.status === 'completed' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inc.status}
                      </span>
                      <span className="text-gray-400 text-xs font-mono">INC-{inc.id}</span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm">{inc.title}</h3>
                    <p className="text-gray-500 text-xs flex items-center gap-1 mt-1 capitalize">
                      <MapPin className="w-3 h-3 text-gray-400" /> Category: {inc.category}
                    </p>
                    <div className="mt-3 bg-gray-50 p-2 rounded text-xs text-gray-600 flex justify-between items-center border border-gray-100">
                      <span>Priority: <strong>{inc.priority_score || 'Standard'}</strong></span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: NEW REPORT (WITH IMAGE UPLOAD) */}
      {view === 'new_report' && (
        <div className="p-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">New Service Request</h2>
            <button onClick={() => setView('dashboard')} className="p-2 bg-gray-200 rounded-full text-gray-600 cursor-pointer"><X className="w-5 h-5" /></button>
          </div>

          <form onSubmit={submitComplaint} className="space-y-4">
            
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Issue Title</label>
              <input 
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Handpump leaking on main road"
                className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Image Upload Area */}
            <div className="bg-white border-2 border-dashed border-emerald-300 rounded-xl p-6 text-center relative hover:bg-emerald-50 transition-colors">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {previewImage ? (
                <img src={previewImage} alt="Preview" className="mx-auto max-h-48 rounded object-contain" />
              ) : (
                <div className="flex flex-col items-center pointer-events-none">
                  <UploadCloud className="w-10 h-10 text-emerald-500 mb-2" />
                  <span className="font-semibold text-emerald-700 text-sm">Tap to attach photo evidence</span>
                  <span className="text-[11px] text-gray-500 mt-1">Direct upload to Panchayat dispatch system</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              >
                <option value="water">Water Infrastructure</option>
                <option value="electricity">Street Lighting / Power</option>
                <option value="sanitation">Sanitation / Drainage</option>
                <option value="roads">Road Infrastructure</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Description</label>
              <textarea 
                rows={3} 
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                placeholder="What is broken and how long has it been out of service?"
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-lg shadow-sm mt-4 cursor-pointer transition-colors"
            >
              {isSubmitting ? 'Submitting to Panchayat...' : 'Submit Official Report'}
            </button>
          </form>
        </div>
      )}

      {/* VIEW: CITIZEN TRUST TIMELINE */}
      {view === 'timeline' && selectedIncident && (
        <div className="p-4 animate-in fade-in slide-in-from-right-4 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => setView('dashboard')} className="p-2 bg-gray-200 rounded-full text-gray-600 cursor-pointer">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <div>
              <span className="text-[10px] font-mono text-gray-400 font-bold">INC-{selectedIncident.id}</span>
              <h2 className="text-base font-bold text-gray-800">{selectedIncident.title}</h2>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-6">
            <div className="relative border-l-2 border-emerald-200 ml-3 space-y-6">
              
              {/* Step 1 */}
              <div className="relative pl-6">
                <span className="absolute -left-[9px] top-1 bg-emerald-500 rounded-full w-4 h-4 border-2 border-white shadow-sm"></span>
                <h4 className="font-bold text-gray-800 text-sm">Complaint Received</h4>
                <p className="text-xs text-gray-500">{selectedIncident.created_at ? new Date(selectedIncident.created_at).toLocaleString() : 'Registered'}</p>
              </div>

              {/* Step 2 */}
              <div className="relative pl-6">
                <span className="absolute -left-[9px] top-1 bg-emerald-500 rounded-full w-4 h-4 border-2 border-white shadow-sm"></span>
                <h4 className="font-bold text-gray-800 text-sm">Priority Assessed</h4>
                <p className="text-xs text-gray-500">MCDA score: {selectedIncident.priority_score || 'Evaluated'}</p>
              </div>

              {/* Step 3 */}
              <div className="relative pl-6">
                <span className={`absolute -left-[9px] top-1 rounded-full w-4 h-4 border-2 border-white shadow-sm ${
                  selectedIncident.status !== 'open' && selectedIncident.status !== 'reported' ? 'bg-emerald-500' : 'bg-gray-300'
                }`}></span>
                <h4 className="font-bold text-gray-800 text-sm">Technician Dispatched</h4>
                <p className="text-xs text-gray-500">Assigned via Panchayat rules engine.</p>
              </div>

              {/* Step 4 */}
              <div className="relative pl-6">
                <span className={`absolute -left-[9px] top-1 rounded-full w-4 h-4 border-2 border-white shadow-sm ${
                  selectedIncident.status === 'resolved' || selectedIncident.status === 'completed' || selectedIncident.status === 'resolved_confirmed'
                    ? 'bg-emerald-500' 
                    : 'bg-amber-400 animate-pulse'
                }`}></span>
                <h4 className="font-bold text-gray-800 text-sm">Repair Status</h4>
                <p className="text-xs text-gray-600 mt-0.5 uppercase font-semibold">
                  Status: {selectedIncident.status}
                </p>
              </div>

            </div>
          </div>
          
          {/* Verification UI */}
          {(selectedIncident.status === 'pending_verification' || selectedIncident.status === 'completed') && (
            <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-emerald-900 text-sm">Confirm Field Resolution</h4>
              <p className="text-xs text-emerald-700">Does the repaired infrastructure operate normally now?</p>
              <div className="flex gap-2">
                <button 
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
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-bold text-xs shadow-sm cursor-pointer"
                >
                  Yes, Fixed
                </button>
                <button 
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
                  className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-lg font-bold text-xs shadow-sm cursor-pointer"
                >
                  No, Still Exists
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
