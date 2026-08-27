import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, ArrowRight, ArrowLeft, Play, Pause, X, 
  MapPin, Camera, FileText, Check, Clock, Radio, 
  ShieldCheck, Wrench, AlertCircle, Sparkles, HelpCircle, UserCheck, Send, RotateCcw
} from 'lucide-react';
import { IMAGE_MAP } from '../imageMap';

interface ComplaintOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onStartComplaint: () => void;
}

export function ComplaintOnboarding({ isOpen, onClose, onStartComplaint }: ComplaintOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [typedText, setTypedText] = useState('');
  const [activeCategory, setActiveCategory] = useState<'water' | 'road' | 'sanitation' | 'electricity'>('water');
  
  const timerRef = useRef<any>(null);

  const steps = [
    {
      stepNumber: "01",
      title: "01 — SELECT",
      heading: "Choose Service Category",
      subtitle: "Pick from officially maintained Panchayat infrastructure domains",
      desc: "Select Water Supply, Roads & Paths, Sanitation, or Electricity. Category tags automatically match the skill set required for dispatch.",
      tag: "STEP 1 OF 7"
    },
    {
      stepNumber: "02",
      title: "02 — CAPTURE",
      heading: "Attach Photo / Evidence",
      subtitle: "Tamper-proof digital photographic capture",
      desc: "Uploaded photos are recorded with SHA-256 cryptographic hashes and GPS telemetry so technicians know the exact parts required before arrival.",
      tag: "STEP 2 OF 7"
    },
    {
      stepNumber: "03",
      title: "03 — DESCRIBE",
      heading: "Explain the Problem",
      subtitle: "Regional Voice Dictation & AI Translation",
      desc: "Speak naturally in Hindi or your local dialect — AI automatically translates speech to formal text and extracts severity and affected hamlets.",
      tag: "STEP 3 OF 7"
    },
    {
      stepNumber: "04",
      title: "04 — LOCATION",
      heading: "Confirm GPS Location",
      subtitle: "Automated Panchayat Ward Pinpoint",
      desc: "Location coordinates ensure the Smart Dispatch Desk routes the closest active field worker to your village sector immediately.",
      tag: "STEP 4 OF 7"
    },
    {
      stepNumber: "05",
      title: "05 — SUBMIT",
      heading: "Submit Complaint",
      subtitle: "Instant Reference ID & SLA Timer",
      desc: "One-click submission generates an authoritative tracking ID (e.g., INC-104) and activates the statutory 48-hour SLA resolution countdown.",
      tag: "STEP 5 OF 7"
    },
    {
      stepNumber: "06",
      title: "06 — TRACK",
      heading: "Real-Time Tracking",
      subtitle: "Live Field Operations Monitoring",
      desc: "Receive live milestone updates as the Panchayat Admin assigns a certified technician and work begins on-site.",
      tag: "STEP 6 OF 7"
    },
    {
      stepNumber: "07",
      title: "07 — RESOLVE",
      heading: "Receive Resolution & Verify",
      subtitle: "Citizen Verification & Fund Escrow Release",
      desc: "You review the before/after repair evidence. Only when you confirm satisfactory resolution is the technician payout disbursed.",
      tag: "STEP 7 OF 7"
    }
  ];

  // Auto-play timer
  useEffect(() => {
    if (!isOpen || !isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
    }, 4500);
    return () => clearInterval(timerRef.current);
  }, [isOpen, isPlaying, steps.length]);

  // Typing animation for Step 3
  useEffect(() => {
    if (currentStep === 2) {
      const fullText = "Handpump discharge valve broken near Ward B community center. Water leaking for 3 days.";
      let idx = 0;
      setTypedText('');
      const typeInterval = setInterval(() => {
        if (idx <= fullText.length) {
          setTypedText(fullText.slice(0, idx));
          idx++;
        } else {
          clearInterval(typeInterval);
        }
      }, 35);
      return () => clearInterval(typeInterval);
    }
  }, [currentStep]);

  // Category rotation for Step 1
  useEffect(() => {
    if (currentStep === 0) {
      const cats: Array<'water' | 'road' | 'sanitation' | 'electricity'> = ['water', 'road', 'sanitation', 'electricity'];
      let i = 0;
      const catInt = setInterval(() => {
        i = (i + 1) % cats.length;
        setActiveCategory(cats[i]);
      }, 1100);
      return () => clearInterval(catInt);
    }
  }, [currentStep]);

  if (!isOpen) return null;

  const handleFinish = () => {
    try {
      localStorage.setItem('gramx_onboarding_seen', 'true');
    } catch {}
    onClose();
    onStartComplaint();
  };

  return (
    <div className="onboarding-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="onboarding-heading">
      <div className="onboarding-modal-card">
        
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #0284c7, #059669)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
              GX
            </div>
            <div>
              <h3 id="onboarding-heading" style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                How to Raise a Complaint — 7-Step Interactive Walkthrough
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                Digital Rural Infrastructure Governance Standard
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              aria-label={isPlaying ? "Pause automated tour" : "Resume automated tour"}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              <span>{isPlaying ? 'Pause' : 'Auto-Play'}</span>
            </button>
            <button 
              onClick={() => { setCurrentStep(0); setIsPlaying(false); }}
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 10px', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Replay from Step 1"
            >
              <RotateCcw size={12} />
            </button>
            <button 
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              aria-label="Close walkthrough"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Step Progress Track */}
        <div className="onboarding-progress-track">
          <div 
            className="onboarding-progress-bar" 
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* 7-Step Pills Navigation Bar */}
        <div style={{ display: 'flex', background: '#f8fafc', padding: '10px 20px', borderBottom: '1px solid #f1f5f9', gap: '6px', overflowX: 'auto' }}>
          {steps.map((s, idx) => (
            <button
              key={idx}
              onClick={() => { setCurrentStep(idx); setIsPlaying(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '6px',
                border: currentStep === idx ? '1px solid #0284c7' : '1px solid transparent',
                background: currentStep === idx ? '#ffffff' : 'transparent',
                color: currentStep === idx ? '#0284c7' : '#64748b',
                fontWeight: currentStep === idx ? 700 : 500,
                fontSize: '0.725rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                boxShadow: currentStep === idx ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              <span style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: currentStep === idx ? '#0284c7' : currentStep > idx ? '#10b981' : '#e2e8f0',
                color: currentStep >= idx ? '#ffffff' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                fontWeight: 700
              }}>
                {currentStep > idx ? '✓' : idx + 1}
              </span>
              <span>{s.stepNumber} {s.title.split(' — ')[1]}</span>
            </button>
          ))}
        </div>

        {/* Main Step Canvas (Responsive 2-column on desktop, stacked on mobile) */}
        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'center' }}>
          
          {/* Left Column: Step Description & Guarantees */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0284c7', background: '#e0f2fe', padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.06em' }}>
                {steps[currentStep].tag}
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#15803d', background: '#dcfce7', padding: '3px 8px', borderRadius: '4px' }}>
                ✓ Official GIGW 3.0 Standard
              </span>
            </div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {steps[currentStep].heading}
            </h4>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', margin: 0 }}>
              {steps[currentStep].subtitle}
            </p>
            <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              {steps[currentStep].desc}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.725rem', color: '#0f172a', fontWeight: 600 }}>
                <ShieldCheck size={14} color="#15803d" />
                <span>Statutory 48-Hour SLA Guarantee with Automatic Escalation</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.725rem', color: '#0f172a', fontWeight: 600 }}>
                <UserCheck size={14} color="#0284c7" />
                <span>Citizen Verification Escrow: Technician payout requires your approval</span>
              </div>
            </div>
          </div>

          {/* Right Column: Realistic Animated UI Mockups */}
          <div className="mockup-container" style={{ minHeight: '270px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            
            {/* Step 01: SELECT Category */}
            {currentStep === 0 && (
              <div className="anim-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '2px' }}>
                  Select Infrastructure Category:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { key: 'water', label: '💧 Water Supply', desc: 'Pumps, Pipelines, Valves' },
                    { key: 'road', label: '🛣️ Roads & Paths', desc: 'Potholes, Pavers, Drains' },
                    { key: 'sanitation', label: '🗑️ Sanitation', desc: 'Waste, Toilets, Silt' },
                    { key: 'electricity', label: '💡 Power Grid', desc: 'Streetlights, Transformers' },
                  ].map(c => (
                    <div 
                      key={c.key} 
                      className={activeCategory === c.key ? 'mockup-chip-selected' : ''}
                      style={{
                        padding: '10px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        background: '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease'
                      }}
                    >
                      <strong style={{ fontSize: '0.8rem', display: 'block' }}>{c.label}</strong>
                      <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{c.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 02: CAPTURE Photo */}
            {currentStep === 1 && (
              <div className="anim-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '100%', height: '160px', borderRadius: '10px', overflow: 'hidden', border: '2px dashed #0284c7', background: '#f0f9ff' }}>
                  <img 
                    src={IMAGE_MAP.serviceWater} 
                    alt="Water Pump Evidence" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(15,23,42,0.85)', color: '#fff', fontSize: '0.65rem', padding: '3px 8px', borderRadius: '4px', fontWeight: 600, backdropFilter: 'blur(4px)' }}>
                    SHA-256: 5fe882be... (Verified)
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Camera size={14} /> Image Encrypted & Timestamped
                </span>
              </div>
            )}

            {/* Step 03: DESCRIBE Problem */}
            {currentStep === 2 && (
              <div className="anim-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Description:</span>
                  <span style={{ fontSize: '0.65rem', background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    🎤 Voice Dictation Active
                  </span>
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', minHeight: '80px', fontSize: '0.8rem', color: '#0f172a', lineHeight: 1.5 }}>
                  {typedText}
                  <span className="typing-cursor" />
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                  Auto-Detected: Hindi (Bundeli) • Dialect Confidence: 94%
                </div>
              </div>
            )}

            {/* Step 04: LOCATION Pinpoint */}
            {currentStep === 3 && (
              <div className="anim-fade-in" style={{ position: 'relative', width: '100%', height: '180px', background: '#e0f2fe', borderRadius: '10px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="radar-ring" />
                <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#ffffff', padding: '10px 16px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                  <MapPin size={24} color="#0284c7" />
                  <strong style={{ fontSize: '0.8rem', color: '#0f172a' }}>Piparli Ward B Center</strong>
                  <span style={{ fontSize: '0.65rem', color: '#64748b' }}>23.2845° N, 77.4521° E (GPS Locked)</span>
                </div>
              </div>
            )}

            {/* Step 05: SUBMIT Instant Confirmation */}
            {currentStep === 4 && (
              <div className="anim-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>Complaint Logged: INC-104</strong>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0 0' }}>
                    SLA Response Deadline: 48 Hours • Priority: HIGH
                  </p>
                </div>
                <div style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, color: '#334155' }}>
                  Dispatching technician Suresh Kumar (Plumbing Specialist)...
                </div>
              </div>
            )}

            {/* Step 06: TRACK Live Operations */}
            {currentStep === 5 && (
              <div className="anim-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a' }}>INC-104: Handpump Overhaul</span>
                    <span style={{ fontSize: '0.65rem', background: '#eff6ff', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>IN PROGRESS</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: '#475569' }}>
                    <Wrench size={12} color="#d97706" />
                    <span>Worker Suresh Kumar on-site with replacement washer parts.</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600, textAlign: 'center' }}>
                  ● Real-time GPS & Telemetry Connected
                </div>
              </div>
            )}

            {/* Step 07: RESOLVE & Citizen Verification */}
            {currentStep === 6 && (
              <div className="anim-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={28} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>Citizen Verification Approved</strong>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0 0' }}>
                    Handpump verified working. Rs. 450 GP fund escrow released to technician.
                  </p>
                </div>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '6px 14px', borderRadius: '6px', fontSize: '0.725rem', fontWeight: 700, color: '#166534' }}>
                  🎉 Case Completed & Audited to Ledger
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Bottom Actions Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
          <button
            onClick={() => {
              try { localStorage.setItem('gramx_onboarding_seen', 'true'); } catch {}
              onClose();
            }}
            style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Skip Tutorial
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            {currentStep > 0 && (
              <button
                onClick={() => { setCurrentStep(prev => prev - 1); setIsPlaying(false); }}
                style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155', fontSize: '0.8rem', fontWeight: 700, padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => { setCurrentStep(prev => prev + 1); setIsPlaying(false); }}
                style={{ background: '#0284c7', border: 'none', color: '#ffffff', fontSize: '0.8rem', fontWeight: 700, padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                Next Step ({steps[currentStep + 1].stepNumber}) <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                style={{ background: '#15803d', border: 'none', color: '#ffffff', fontSize: '0.8rem', fontWeight: 800, padding: '8px 22px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(21,128,61,0.3)' }}
              >
                Raise a Complaint Now <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
