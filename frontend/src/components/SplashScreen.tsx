import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  isInitialized?: boolean;
}

const CIVIC_TICKER_MESSAGES = [
  'Track public-service requests in real time',
  'AI suggestions remain subject to official review',
  'Available in English, हिन्दी, தமிழ் and తెలుగు',
  'Secure, accountable rural governance',
  'Real-Time Spatial Bounding-Box GIS Live',
];

export default function SplashScreen({ onComplete, isInitialized = true }: SplashScreenProps) {
  const [fading, setFading] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);

  // Rotate ticker messages smoothly
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % CIVIC_TICKER_MESSAGES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  // Gracefully transition once initialized or after 1.8s timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setFading(true);
      setTimeout(() => {
        onComplete();
      }, 350);
    }, 1800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  // Handle keyboard escape or enter to immediately skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        setFading(true);
        setTimeout(onComplete, 100);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onComplete]);

  return (
    <div
      className={`splash-launch-overlay ${fading ? 'splash-fading' : ''}`}
      role="dialog"
      aria-label="Welcome to GRAM-X"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        transition: 'opacity 0.35s ease-out',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* Top National Tricolour Accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          display: 'flex',
        }}
        aria-hidden="true"
      >
        <div style={{ flex: 1, background: '#FF9933' }} />
        <div style={{ flex: 1, background: '#ffffff' }} />
        <div style={{ flex: 1, background: '#138808' }} />
      </div>

      {/* Main Official Content Box */}
      <div
        className="card-gov p-6 text-center anim-fade-up"
        style={{
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 10px 25px -5px rgba(0, 33, 71, 0.1), 0 8px 10px -6px rgba(0, 33, 71, 0.1)',
          borderRadius: '12px',
          border: '1px solid #cbd5e1',
          background: '#ffffff',
          position: 'relative',
        }}
      >
        {/* National Emblem Icon / Badge */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #002147 0%, #003366 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 4px 12px rgba(0, 33, 71, 0.2)',
          }}
        >
          <Shield size={28} />
        </div>

        {/* Feature "New" Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <span
            style={{
              background: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Sparkles size={11} />
            New
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Real-Time Map Intelligence &amp; SLA Transparency
          </span>
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: '1.65rem',
            color: '#002147',
            margin: '0 0 6px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
          }}
        >
          Welcome to GRAM-X
        </h1>

        <p
          style={{
            fontSize: '0.85rem',
            color: '#475569',
            margin: '0 0 20px',
            lineHeight: 1.4,
          }}
        >
          Grassroots Resource, Action &amp; Intelligence Network • Ministry of Panchayati Raj
        </p>

        {/* Moving Left-to-Right Civic Ticker */}
        <div
          style={{
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '8px 12px',
            marginBottom: '20px',
            overflow: 'hidden',
            position: 'relative',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            key={tickerIndex}
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#003366',
              animation: 'tickerFade 0.4s ease-in-out',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📢</span>
            <span>{CIVIC_TICKER_MESSAGES[tickerIndex]}</span>
          </div>
        </div>

        {/* Loading / Enter Action */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <button
            onClick={() => {
              setFading(true);
              setTimeout(onComplete, 100);
            }}
            className="btn-gov btn-gov-primary"
            style={{
              width: '100%',
              padding: '10px 16px',
              fontSize: '0.875rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span>Enter Platform</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Footer Security Notice */}
      <div
        style={{
          marginTop: '16px',
          fontSize: '0.75rem',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <CheckCircle2 size={13} style={{ color: '#16a34a' }} />
        <span>Secure 256-bit Encrypted Session • DPDPA 2023 Compliant</span>
      </div>
    </div>
  );
}
