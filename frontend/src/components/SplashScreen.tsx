import React, { useState, useEffect, useRef } from 'react';
import { Shield, Sparkles, ArrowRight, CheckCircle2, Star } from 'lucide-react';
import { useLanguage } from '../i18n';

interface SplashScreenProps {
  onComplete: () => void;
  isInitialized?: boolean;
}

const CIVIC_TICKER_MESSAGES = [
  'Track public-service requests in real time',
  'AI suggestions remain subject to official review',
  'Available in English, हिन्दी, தமிழ் and తెలుగు',
  'Secure, accountable rural governance',
  'Real-Time Spatial Bounding-Box GIS Live'
];

interface BurstParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  sparkle: boolean;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const { t } = useLanguage();
  const [fading, setFading] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [isBursting, setIsBursting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const burstParticles = useRef<BurstParticle[]>([]);
  const bgStars = useRef<any[]>([]);

  // Rotate ticker messages smoothly
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % CIVIC_TICKER_MESSAGES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  // Star canvas animation engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Initialize 60 ambient drifting stars
    bgStars.current = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.7 + 0.3,
      speedY: Math.random() * 0.3 + 0.1,
      color: Math.random() > 0.5 ? '#f59e0b' : '#38bdf8'
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw drifting ambient stars
      bgStars.current.forEach((st) => {
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.radius, 0, Math.PI * 2);
        ctx.fillStyle = st.color;
        ctx.globalAlpha = st.alpha;
        ctx.shadowBlur = 6;
        ctx.shadowColor = st.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        st.y -= st.speedY;
        if (st.y < 0) {
          st.y = canvas.height;
          st.x = Math.random() * canvas.width;
        }
      });

      // 2. Draw active burst explosion particles
      for (let i = burstParticles.current.length - 1; i >= 0; i--) {
        const p = burstParticles.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          burstParticles.current.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1.0;

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Trigger radiant starburst explosion
  const triggerStarBurst = (originX?: number, originY?: number) => {
    if (isBursting) return;
    setIsBursting(true);

    const canvas = canvasRef.current;
    const cx = originX || (canvas ? canvas.width / 2 : window.innerWidth / 2);
    const cy = originY || (canvas ? canvas.height / 2 : window.innerHeight / 2);

    const colors = ['#f59e0b', '#fbbf24', '#38bdf8', '#0284c7', '#ffffff', '#10b981'];
    const newParticles: BurstParticle[] = [];

    // Create 80 radiant spark particles
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 9 + 3;
      newParticles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3.5 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        decay: Math.random() * 0.02 + 0.015,
        sparkle: Math.random() > 0.4
      });
    }

    burstParticles.current = newParticles;

    // Smoothly fade out and complete
    setTimeout(() => {
      setFading(true);
      setTimeout(onComplete, 350);
    }, 450);
  };

  // Auto transition after 2.8s if not clicked
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isBursting) {
        triggerStarBurst();
      }
    }, 2800);
    return () => clearTimeout(timer);
  }, [isBursting]);

  // Handle keyboard skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        triggerStarBurst();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className={`splash-launch-overlay ${fading ? 'splash-fading' : ''}`}
      role="dialog"
      aria-label="Welcome to GRAM-X"
      aria-modal="true"
      onClick={(e) => {
        // Starburst at click position
        triggerStarBurst(e.clientX, e.clientY);
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'radial-gradient(ellipse at center, #0f172a 0%, #020617 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        transition: 'opacity 0.35s ease-out',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
        overflow: 'hidden'
      }}
    >
      {/* Background Interactive Star Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* Top National Tricolour Accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          display: 'flex',
          zIndex: 2
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
        onClick={(e) => {
          e.stopPropagation();
          triggerStarBurst(e.clientX, e.clientY);
        }}
        style={{
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(56, 189, 248, 0.15)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          position: 'relative',
          zIndex: 10,
          cursor: 'pointer'
        }}
      >
        {/* Interactive Star & Emblem Centerpiece */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 0 24px rgba(56, 189, 248, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
            border: '2px solid rgba(255, 255, 255, 0.25)',
            transform: isBursting ? 'scale(1.2)' : 'scale(1)',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          <Sparkles size={32} className={isBursting ? 'animate-spin' : ''} />
        </div>

        {/* Feature "New" Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <span
            style={{
              background: '#064e3b',
              color: '#34d399',
              border: '1px solid #059669',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Sparkles size={11} />
            New
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
            Real-Time Map Intelligence &amp; SLA Transparency
          </span>
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: '1.75rem',
            color: '#f8fafc',
            margin: '0 0 6px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
          }}
        >
          Welcome to GRAM-X
        </h1>

        <p
          style={{
            fontSize: '0.85rem',
            color: '#94a3b8',
            margin: '0 0 20px',
            lineHeight: 1.4
          }}
        >
          Grassroots Resource, Action &amp; Intelligence Network • Digital Rural Governance Platform
        </p>

        {/* Moving Left-to-Right Civic Ticker */}
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '8px 12px',
            marginBottom: '20px',
            overflow: 'hidden',
            position: 'relative',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            key={tickerIndex}
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#38bdf8',
              animation: 'tickerFade 0.4s ease-in-out',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>✨</span>
            <span>{CIVIC_TICKER_MESSAGES[tickerIndex]}</span>
          </div>
        </div>

        {/* Click-to-Burst Action */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerStarBurst(e.clientX, e.clientY);
            }}
            className="btn-gov btn-gov-primary"
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '0.9rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              boxShadow: '0 0 16px rgba(37, 99, 235, 0.4)',
              border: 'none',
              borderRadius: '10px'
            }}
          >
            <Star size={16} fill="#fbbf24" color="#fbbf24" />
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
          zIndex: 10
        }}
      >
        <CheckCircle2 size={13} style={{ color: '#10b981' }} />
        <span>Secure 256-bit Encrypted Session • DPDPA 2023 Compliant</span>
      </div>
    </div>
  );
}
