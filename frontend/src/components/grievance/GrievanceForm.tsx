/**
 * GRAM-X Smart Grievance Submission Form Component (Phase 3)
 * Integrates:
 * - Real-time AI category & priority recommendation (Advisory)
 * - Duplicate & similar grievance detection
 * - Location Picker with GPS coordinates
 * - Evidence attachment upload (Cloudflare R2)
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  MapPin,
  Camera,
  UploadCloud,
  X,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Droplets,
  Zap,
  Hammer,
  Truck,
  Building2,
  HelpCircle,
} from 'lucide-react';
import {
  submitGrievance,
  getMyGrievances,
  type CreateGrievanceInput,
  type GrievanceCategory,
  type GrievancePriority,
  type Grievance,
} from '../../services/grievanceService';
import { classifyGrievance, findSimilarGrievances } from '../../services/ai/aiService';
import type { AIAnalysisResult, SimilarityMatch } from '../../services/ai/types';
import { AIRecommendationCard } from '../ai/AIRecommendationCard';
import { SimilarGrievancesWarning } from '../ai/SimilarGrievancesWarning';
import { LocationPicker } from '../maps/LocationPicker';
import { Button } from '../ui/Button';

export interface GrievanceFormProps {
  villageId?: number;
  onSuccess?: (grievance: Grievance) => void;
  onCancel?: () => void;
  className?: string;
}

const CATEGORIES: Array<{
  id: GrievanceCategory;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'water', label: 'Water Supply', desc: 'Pipes, Handpumps, Tanks', icon: Droplets },
  { id: 'electricity', label: 'Electricity Grid', desc: 'Poles, Transformers, Lights', icon: Zap },
  { id: 'roads', label: 'Roads & Drainage', desc: 'Potholes, Culverts, Silt', icon: Truck },
  { id: 'sanitation', label: 'Sanitation & Health', desc: 'Waste, Toilets, Fogging', icon: Hammer },
  { id: 'infrastructure', label: 'Public Buildings', desc: 'Schools, Community Centers', icon: Building2 },
  { id: 'other', label: 'General / Other', desc: 'Other Civic Enquiries', icon: HelpCircle },
];

export const GrievanceForm = ({
  villageId = 1,
  onSuccess,
  onCancel,
  className = '',
}: GrievanceFormProps) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GrievanceCategory>('water');
  const [priority, setPriority] = useState<GrievancePriority>('medium');
  const [description, setDescription] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [locationLat, setLocationLat] = useState(23.2845);
  const [locationLng, setLocationLng] = useState(77.4521);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Phase 3 Smart States
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [similarMatches, setSimilarMatches] = useState<SimilarityMatch[]>([]);
  const [existingGrievances, setExistingGrievances] = useState<Grievance[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getMyGrievances().then((list) => setExistingGrievances(list)).catch(() => {});
  }, []);

  // Debounced AI triage & similarity check as citizen writes
  useEffect(() => {
    if (title.trim().length >= 5 && description.trim().length >= 10) {
      const timer = setTimeout(async () => {
        try {
          const analysis = await classifyGrievance({
            title,
            description,
            category,
          });
          setAiAnalysis(analysis);

          const matches = await findSimilarGrievances(title, description, existingGrievances);
          setSimilarMatches(matches);
        } catch {}
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setAiAnalysis(null);
      setSimilarMatches([]);
    }
  }, [title, description, category, existingGrievances]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setFieldErrors((prev) => ({ ...prev, file: 'File size must not exceed 10 MB.' }));
        return;
      }
      setAttachmentFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeFile = () => {
    setAttachmentFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleApplyAISuggestions = (suggestedCat: GrievanceCategory, suggestedPri: GrievancePriority) => {
    setCategory(suggestedCat);
    setPriority(suggestedPri);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = 'Please provide a clear title for the issue.';
    if (title.trim().length < 5) errors.title = 'Title should be at least 5 characters.';
    if (!description.trim()) errors.description = 'Please describe the problem in detail.';
    if (description.trim().length < 15) errors.description = 'Description should be at least 15 characters.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setIsLoading(true);
    try {
      const payload: CreateGrievanceInput = {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        village_id: villageId,
        location_address: locationAddress.trim() || 'Ward Area, Gram Panchayat',
        location_lat: locationLat,
        location_lng: locationLng,
        attachmentFile: attachmentFile || undefined,
      };

      const result = await submitGrievance(payload);
      if (onSuccess) onSuccess(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit grievance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-5 ${className}`}>
      {errorMessage && (
        <div className="bg-rose-950/40 border border-rose-500/50 rounded-xl p-3 text-rose-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Duplicate / Similar Grievances Warning */}
      <SimilarGrievancesWarning matches={similarMatches} />

      {/* 1. Category Selection */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          Select Problem Category *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[72px] ${
                  isSelected
                    ? 'bg-sky-950/70 border-sky-500 text-white shadow-xs shadow-sky-500/30'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-sky-400' : 'text-slate-400'}`} />
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight">{cat.label}</div>
                  <div className="text-[10px] text-slate-500 truncate">{cat.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Recommendation Badge / Advisory Card */}
      {aiAnalysis && (
        <AIRecommendationCard
          analysis={aiAnalysis}
          onApplyRecommendations={handleApplyAISuggestions}
        />
      )}

      {/* 2. Title & Priority */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs font-semibold text-slate-300">
            Grievance Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Broken Handpump near Primary School"
            className={`w-full bg-slate-900 border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 ${
              fieldErrors.title ? 'border-rose-500' : 'border-slate-800'
            }`}
          />
          {fieldErrors.title && (
            <p className="text-[11px] text-rose-400 font-medium">{fieldErrors.title}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">
            Urgency / Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as GrievancePriority)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
          >
            <option value="low">Low (Standard)</option>
            <option value="medium">Medium (Normal)</option>
            <option value="high">High (Needs Attention)</option>
            <option value="critical">Critical (Emergency)</option>
          </select>
        </div>
      </div>

      {/* 3. Description */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-300 flex justify-between">
          <span>Detailed Description *</span>
          <span className="text-[10px] text-slate-500">{description.length}/500</span>
        </label>
        <textarea
          rows={3}
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what is broken, how long the issue has persisted, and affected households..."
          className={`w-full bg-slate-900 border rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none ${
            fieldErrors.description ? 'border-rose-500' : 'border-slate-800'
          }`}
        />
        {fieldErrors.description && (
          <p className="text-[11px] text-rose-400 font-medium">{fieldErrors.description}</p>
        )}
      </div>

      {/* 4. Location & Interactive Map Picker */}
      <LocationPicker
        initialLat={locationLat}
        initialLng={locationLng}
        initialAddress={locationAddress}
        onLocationSelected={(loc) => {
          setLocationLat(loc.lat);
          setLocationLng(loc.lng);
          if (loc.address) setLocationAddress(loc.address);
        }}
      />

      {/* 5. Photo Evidence Upload */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
          <Camera className="w-3.5 h-3.5 text-emerald-400" />
          Evidence Photo Attachment (Stored on Cloudflare R2 + OCR Scanned)
        </label>

        {!previewUrl ? (
          <label className="border border-dashed border-slate-700 hover:border-slate-500 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-900/40 transition-colors">
            <UploadCloud className="w-6 h-6 text-slate-400" />
            <span className="text-xs text-slate-300 font-medium">Click or Drag photo here to attach</span>
            <span className="text-[10px] text-slate-500">Supports JPG, PNG (Auto-text OCR extraction enabled)</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        ) : (
          <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={previewUrl} alt="Evidence Preview" className="w-12 h-12 object-cover rounded-lg" />
              <div>
                <p className="text-xs text-white font-medium truncate max-w-[200px]">
                  {attachmentFile?.name}
                </p>
                <p className="text-[10px] text-slate-400">
                  {attachmentFile ? (attachmentFile.size / 1024).toFixed(1) : 0} KB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          loadingText="Submitting to Panchayat..."
          className="w-full sm:w-auto"
        >
          Submit Grievance
        </Button>
      </div>
    </form>
  );
};

export default GrievanceForm;
