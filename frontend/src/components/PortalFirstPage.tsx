import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShieldCheck, Activity, ArrowRight, CheckCircle2,
  Globe, Droplets, Leaf, MapPin,
  Users2, Building, PhoneCall, ChevronLeft, ChevronRight,
  Pause, Play, BarChart3, Zap, Clock, TrendingUp
} from 'lucide-react';
import { IMAGE_MAP } from '../imageMap';
import LiveClock from './LiveClock';
import NotificationTicker from './NotificationTicker';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '../i18n';


// ─── Hero Slideshow Config ────────────────────────────────────────────────────
const SLIDES = [
  {
    url: IMAGE_MAP.serviceWater,
    alt: 'Village water supply infrastructure in rural India',
    tag: 'Water Infrastructure',
    caption: 'Tracking every water supply repair from citizen report to verified completion.',
  },
  {
    url: IMAGE_MAP.serviceRoad,
    alt: 'Rural road construction and maintenance in India',
    tag: 'Road & Infrastructure',
    caption: 'Real-time dispatch of field workers to road defects across Gram Panchayats.',
  },
  {
    url: IMAGE_MAP.citizenHero,
    alt: 'Panchayat community governance meeting in village',
    tag: 'Gram Sabha Governance',
    caption: 'Decentralized grievance resolution with transparent digital ledger workflows.',
  },
  {
    url: IMAGE_MAP.workerHero,
    alt: 'Field technician repairing rural infrastructure',
    tag: 'Field Operations',
    caption: 'SLA-tracked field operations with evidence submission and payout automation.',
  },
  {
    url: IMAGE_MAP.collectorHero,
    alt: 'Sustainable rural district landscape and development',
    tag: 'District Oversight',
    caption: 'Asset intelligence and macro governance across Raisen village clusters.',
  },
];

const INTERVAL_MS = 6500;

// ─── Service Cards Config ─────────────────────────────────────────────────────
const SERVICES = [
  {
    icon: '📋',
    img: IMAGE_MAP.citizenHero,
    title: 'Register Grievance',
    desc: 'Submit infrastructure complaints with voice, photo, or text in Hindi or English.',
    color: '#155EEF',
    bg: '#eff6ff',
  },
  {
    icon: '🔍',
    img: IMAGE_MAP.serviceWater,
    title: 'Track Resolution',
    desc: 'Follow your complaint through every stage — from registration to citizen verification.',
    color: '#15803D',
    bg: '#f0fdf4',
  },
  {
    icon: '🏛️',
    img: IMAGE_MAP.adminHero,
    title: 'Panchayat Command',
    desc: 'Dispatch field workers, manage village assets, and oversee SLA compliance.',
    color: '#0B1F3A',
    bg: '#f8fafc',
  },
  {
    icon: '🔧',
    img: IMAGE_MAP.workerHero,
    title: 'Field Operations',
    desc: 'Workers receive task dispatch, upload evidence, and receive digital payouts.',
    color: '#F97316',
    bg: '#fff7ed',
  },
  {
    icon: '🗺️',
    img: IMAGE_MAP.collectorHero,
    title: 'GIS District Map',
    desc: 'Real-time geographic intelligence across all Gram Panchayats and assets.',
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
];

// ─── Stats Config ─────────────────────────────────────────────────────────────
const TRANSPARENCY_STEPS = [
  { label: 'Citizen Reports', icon: '👤', color: '#155EEF' },
  { label: 'AI Triage', icon: '🤖', color: '#7c3aed' },
  { label: 'Panchayat Review', icon: '🏛️', color: '#0B1F3A' },
  { label: 'Field Dispatch', icon: '🔧', color: '#F97316' },
  { label: 'Repair & Evidence', icon: '📷', color: '#15803D' },
  { label: 'Citizen Verification', icon: '✅', color: '#15803D' },
];

export default function PortalFirstPage({ onLoginClick }: { onLoginClick: () => void }) {
  const { t } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = useCallback((idx: number) => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrent(idx);
      setTransitioning(false);
    }, 350);
  }, [transitioning]);

  const prev = () => go((current - 1 + SLIDES.length) % SLIDES.length);
  const next = useCallback(() => go((current + 1) % SLIDES.length), [current, go]);

  useEffect(() => {
    if (!playing) { if (timerRef.current) clearTimeout(timerRef.current); return; }
    timerRef.current = setTimeout(next, INTERVAL_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, playing, next]);

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === ' ') { e.preventDefault(); setPlaying(p => !p); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next]);

  // Touch swipe
  const touchStart = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { diff > 0 ? next() : prev(); }
  };

  const slide = SLIDES[current];

  return (
    <div className="min-h-screen bg-[#F6F8FB] font-sans text-slate-800 selection:bg-slate-200">

      {/* ── Tricolour Bar ── */}
      <div className="flex h-1.5 w-full overflow-hidden">
        <div className="bg-[#FF9933] flex-1" />
        <div className="bg-white flex-1" />
        <div className="bg-[#138808] flex-1" />
      </div>

      {/* ── Sticky Nav ── */}
      <nav className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0B1F3A] flex items-center justify-center rounded-lg">
              <span className="text-white font-extrabold text-base">🇮🇳</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-slate-900 tracking-tight">{t("brand.title")}</span>
                <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">{t("brand.badge")}</span>
              </div>
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block leading-none">{t("brand.subtitle")}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Native 4-Language Selector */}
            <LanguageSelector variant="compact" />

            <div className="hidden md:flex items-center gap-1.5 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span className="text-emerald-700">{t("system.operational")}</span>
            </div>
            <div className="hidden lg:block">
              <LiveClock variant="full" />
            </div>
            <button
              onClick={onLoginClick}
              className="text-xs font-bold text-white bg-[#0B1F3A] hover:bg-[#142e52] px-5 py-2.5 rounded-lg transition-all shadow-sm flex items-center gap-1.5"
            >
              {t("action.sign_in")} <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </nav>


      {/* ── Live Notification Ticker (replaces static announcement bar) ── */}
      <NotificationTicker />

      {/* ── HERO SECTION ── */}
      <section className="max-w-[1440px] mx-auto px-6 py-14 lg:py-20 grid lg:grid-cols-12 gap-12 items-center">

        {/* Left Content */}
        <div className="lg:col-span-6 space-y-7">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
            <Activity className="w-3 h-3" /> Operations live · Raisen District, M.P.
          </div>

          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
            Empowering Villages<br />
            Through{' '}
            <span style={{ color: '#0B1F3A' }}>Digital</span>{' '}
            <span style={{ color: '#F97316' }}>Governance</span>
          </h1>

          <p className="text-base text-slate-600 max-w-lg leading-relaxed">
            One platform connecting citizens, field workers, Panchayat administration, and district governance with transparent real-time workflows and cryptographic audit trails.
          </p>

          {/* Live stats strip */}
          <div className="grid grid-cols-3 gap-4 py-5 border-y border-slate-100">
            {[
              { label: 'Panchayats', value: '5', icon: <Building size={16} className="text-blue-600" /> },
              { label: 'Avg Response', value: '48h', icon: <Clock size={16} className="text-amber-600" /> },
              { label: 'SLA Rate', value: '94%', icon: <TrendingUp size={16} className="text-emerald-600" /> },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="flex justify-center mb-1">{s.icon}</div>
                <div className="text-xl font-black text-slate-900">{s.value}</div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              onClick={onLoginClick}
              style={{ background: '#0B1F3A', borderColor: '#0B1F3A' }}
              className="text-white font-bold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-sm border"
            >
              Access Grievance Desk <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onLoginClick}
              className="bg-white border border-slate-200 text-slate-700 font-bold text-sm px-6 py-3 rounded-xl hover:bg-slate-50 transition-all"
            >
              Explore Public Ledgers
            </button>
          </div>
        </div>

        {/* Right: Hero Slideshow */}
        <div className="lg:col-span-6 relative" role="region" aria-label="Government infrastructure image slideshow"
          onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

          {/* Main Slide */}
          <div className="aspect-[4/3] lg:aspect-[16/11] w-full rounded-2xl overflow-hidden shadow-xl relative border border-slate-200">
            <img
              src={slide.url}
              alt={slide.alt}
              className="w-full h-full object-cover transition-opacity duration-500"
              style={{ opacity: transitioning ? 0 : 1 }}
              loading="lazy"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/15 to-transparent" />

            {/* Slide caption */}
            <div className="absolute bottom-4 left-4 right-12 text-white" style={{ opacity: transitioning ? 0 : 1, transition: 'opacity 0.4s ease' }}>
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">{slide.tag}</span>
              <p className="text-xs text-slate-200 mt-1 font-semibold leading-tight">{slide.caption}</p>
            </div>

            {/* Controls */}
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5">
              <button
                onClick={() => setPlaying(p => !p)}
                aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}
                className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors border border-white/20"
              >
                {playing ? <Pause size={11} /> : <Play size={11} />}
              </button>
            </div>

            {/* Prev / Next */}
            <button
              onClick={prev}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/35 transition-colors border border-white/20"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={next}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/35 transition-colors border border-white/20"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Dot indicators */}
          <div className="flex justify-center gap-1.5 mt-4" role="tablist" aria-label="Slide navigation">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === current}
                aria-label={`Go to slide ${i + 1}: ${SLIDES[i].tag}`}
                onClick={() => go(i)}
                style={{
                  width: i === current ? '28px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  background: i === current ? '#0B1F3A' : '#cbd5e1',
                  transition: 'all 0.3s ease',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Service Cards ── */}
      <section className="bg-white border-y border-slate-200 py-14">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Citizen Services</span>
            <h2 className="text-2xl font-black text-slate-900 mt-1">What would you like to do today?</h2>
            <p className="text-sm text-slate-500 mt-1.5">All services are available 24/7 across Raisen District Panchayats</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {SERVICES.map((s) => (
              <button
                key={s.title}
                onClick={onLoginClick}
                className="group text-left rounded-2xl border border-slate-200 bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
              >
                <div className="h-28 overflow-hidden relative">
                  <img src={s.img} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute bottom-3 left-3 text-2xl" aria-hidden="true">{s.icon}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-sm text-slate-900 mb-1">{s.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                  <div className="flex items-center gap-1 mt-3 text-xs font-bold" style={{ color: s.color }}>
                    Get started <ArrowRight size={11} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Governance Transparency Timeline ── */}
      <section className="py-16 max-w-[1440px] mx-auto px-6">
        <div className="text-center mb-10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Transparency by Design</span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">How Every Complaint Gets Resolved</h2>
          <p className="text-sm text-slate-500 mt-1.5 max-w-xl mx-auto">
            Every stage is timestamped, audit-logged with SHA-256 tamper-evident hashing, and visible to the citizen and district collector simultaneously.
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-start gap-0">
          {TRANSPARENCY_STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center gap-2 px-4 py-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-sm border-2 border-white"
                  style={{ background: step.color + '18', borderColor: step.color + '40' }}
                >
                  {step.icon}
                </div>
                <span className="text-[11px] font-bold text-slate-700 text-center leading-tight max-w-[80px]">{step.label}</span>
              </div>
              {i < TRANSPARENCY_STEPS.length - 1 && (
                <div className="w-8 h-0.5 bg-slate-200 mb-5 hidden sm:block" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            { label: 'SLA Compliance', value: '94.8%', icon: <CheckCircle2 size={18} className="text-emerald-600" /> },
            { label: 'Avg Resolution', value: '48 hrs', icon: <Clock size={18} className="text-blue-600" /> },
            { label: 'Active Workers', value: '45+', icon: <Users2 size={18} className="text-slate-700" /> },
            { label: 'Audit Records', value: '100%', icon: <ShieldCheck size={18} className="text-amber-600" /> },
          ].map(s => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-2">{s.icon}</div>
              <div className="text-2xl font-black text-slate-900">{s.value}</div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Platform Features ── */}
      <section className="bg-white border-y border-slate-200 py-14">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Platform Capabilities</span>
            <h2 className="text-2xl font-black text-slate-900 mt-1">Built for Government-Grade Governance</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <BarChart3 size={20} />,
                color: '#155EEF',
                title: 'Real-Time Telemetry',
                desc: 'Live performance dashboards for every Panchayat — SLA, budget utilization, field worker status, and infrastructure health.',
              },
              {
                icon: <ShieldCheck size={20} />,
                color: '#15803D',
                title: 'Cryptographic Audit Trail',
                desc: 'Every governance event is SHA-256 hash-chained into a tamper-evident immutable audit log verifiable at any time.',
              },
              {
                icon: <Zap size={20} />,
                color: '#F97316',
                title: 'AI Resource Allocation',
                desc: 'Smart dispatch matches field workers to complaints by specialty, proximity, and current workload in real time.',
              },
            ].map(f => (
              <div key={f.title} className="rounded-2xl border border-slate-200 p-7 hover:shadow-md transition-shadow bg-white">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: f.color + '15', color: f.color }}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Helpline CTA ── */}
      <section className="py-12 max-w-[1440px] mx-auto px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
              <PhoneCall size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Need assistance? Call our helpline</h3>
              <p className="text-sm text-slate-500">Available Monday–Saturday, 9AM–6PM IST</p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="text-2xl font-black text-slate-900 tracking-tight">1800-212-GRAMX</div>
            <button onClick={onLoginClick} className="bg-[#0B1F3A] text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#142e52] transition-all">
              File Online →
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#0B1F3A' }} className="text-slate-400">
        <div className="flex h-1 overflow-hidden">
          <div className="bg-[#FF9933] flex-1" />
          <div className="bg-white flex-1" />
          <div className="bg-[#138808] flex-1" />
        </div>
        <div className="max-w-[1440px] mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🇮🇳</span>
                <span className="text-white font-black tracking-tight">GRAM-X</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Grassroots Resource, Action & Intelligence Network. Digital rural governance for Panchayati Raj.
              </p>
            </div>
            {[
              { title: 'Citizens', links: ['Register Grievance', 'Track Status', 'Verify Resolution', 'Help & Support'] },
              { title: 'Administration', links: ['Panchayat Portal', 'Collector Dashboard', 'Audit Reports', 'Field Operations'] },
              { title: 'Official Resources', links: ['Panchayati Raj Ministry', 'NIC Digital Services', 'GIGW Accessibility', 'RTI Portal'] },
            ].map(col => (
              <div key={col.title}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">{col.title}</p>
                <ul className="space-y-2">
                  {col.links.map(l => (
                    <li key={l}>
                      <button onClick={onLoginClick} className="text-xs text-slate-400 hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer font-normal">{l}</button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-700 pt-5 flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} GRAM-X — Government Digital Rural Governance Platform. All rights reserved.
            </p>
            <p className="text-xs text-slate-600">GIGW 3.0 Compliant · WCAG 2.1 AA · Powered by Open Standards</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
