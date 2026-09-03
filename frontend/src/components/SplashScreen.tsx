import React, { useState, useEffect } from 'react';
import { ArrowRight, Landmark, Shield } from 'lucide-react';
import { useLanguage } from '../i18n';

interface SplashScreenProps {
  onComplete: () => void;
  isInitialized?: boolean;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const { t } = useLanguage();
  const [phase, setPhase] = useState<'logo' | 'tagline' | 'button' | 'fading'>('logo');
  const [reducedMotion, setReducedMotion] = useState(false);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Animation sequence: logo → tagline → button → (auto-dismiss at 1.8s)
  useEffect(() => {
    if (reducedMotion) {
      // Skip animations entirely, show static splash and auto-dismiss fast
      const t1 = setTimeout(() => setPhase('fading'), 600);
      const t2 = setTimeout(onComplete, 900);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }

    const t1 = setTimeout(() => setPhase('tagline'), 280);
    const t2 = setTimeout(() => setPhase('button'), 560);
    const t3 = setTimeout(() => { setPhase('fading'); }, 1800);
    const t4 = setTimeout(onComplete, 2100);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [reducedMotion, onComplete]);

  // Handle keyboard/click skip
  const handleSkip = () => {
    if (phase === 'fading') return;
    setPhase('fading');
    setTimeout(onComplete, 300);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['Escape', 'Enter', ' '].includes(e.key)) handleSkip();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase]);

  const transitionDuration = reducedMotion ? '0ms' : '320ms';
  const isVisible = phase !== 'fading';

  return (
    <div
      onClick={handleSkip}
      role="dialog"
      aria-label="Welcome to GRAM-X"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        opacity: isVisible ? 1 : 0,
        transition: `opacity ${transitionDuration} ease-out`,
        pointerEvents: phase === 'fading' ? 'none' : 'auto',
        cursor: 'pointer',
      }}
    >
      {/* Indian flag tricolour stripe at top */}
      <div
        aria-hidden="true"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', display: 'flex' }}
      >
        <div style={{ flex: 1, background: '#FF9933' }} />
        <div style={{ flex: 1, background: '#f1f5f9' }} />
        <div style={{ flex: 1, background: '#138808' }} />
      </div>

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: '360px',
          width: '100%',
          gap: '0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Logo mark */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #155EEF 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            marginBottom: '20px',
            boxShadow: '0 8px 32px rgba(21, 94, 239, 0.25)',
            opacity: phase === 'logo' || phase === 'tagline' || phase === 'button' ? 1 : 0,
            transform: phase === 'logo' && !reducedMotion ? 'scale(0.85)' : 'scale(1)',
            transition: `opacity ${transitionDuration} ease-out, transform ${transitionDuration} cubic-bezier(0.34, 1.56, 0.64, 1)`,
          }}
        >
          <Landmark style={{ width: '36px', height: '36px' }} />
        </div>

        {/* GRAM-X wordmark */}
        <div
          lang="en"
          style={{
            fontSize: 'clamp(2rem, 8vw, 2.75rem)',
            fontWeight: 800,
            color: '#0f172a',
            letterSpacing: '-0.04em',
            lineHeight: 1,
            marginBottom: '10px',
            fontFamily: "'Inter', system-ui, sans-serif",
            opacity: phase === 'logo' && !reducedMotion ? 0 : 1,
            transform: phase === 'logo' && !reducedMotion ? 'translateY(8px)' : 'translateY(0)',
            transition: `opacity ${transitionDuration} ease-out, transform ${transitionDuration} ease-out`,
          }}
        >
          GRAM-X
        </div>

        {/* Primary tagline */}
        <div
          style={{
            fontSize: 'clamp(0.95rem, 3vw, 1.1rem)',
            fontWeight: 600,
            color: '#155EEF',
            marginBottom: '6px',
            opacity: (phase === 'tagline' || phase === 'button') || reducedMotion ? 1 : 0,
            transform: phase === 'logo' && !reducedMotion ? 'translateY(6px)' : 'translateY(0)',
            transition: `opacity ${transitionDuration} ease-out 0.05s, transform ${transitionDuration} ease-out 0.05s`,
          }}
        >
          {t('splash.tagline')}
        </div>

        {/* Sub-tagline */}
        <div
          style={{
            fontSize: '0.85rem',
            color: '#64748b',
            marginBottom: '32px',
            opacity: (phase === 'tagline' || phase === 'button') || reducedMotion ? 1 : 0,
            transition: `opacity ${transitionDuration} ease-out 0.08s`,
          }}
        >
          {t('splash.sub_tagline')}
        </div>

        {/* CTA / Enter button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleSkip(); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 28px',
            background: 'linear-gradient(135deg, #155EEF 0%, #0284c7 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(21, 94, 239, 0.3)',
            fontFamily: 'inherit',
            opacity: phase === 'button' || reducedMotion ? 1 : 0,
            transform: (phase === 'logo' || phase === 'tagline') && !reducedMotion ? 'translateY(8px)' : 'translateY(0)',
            transition: `opacity ${transitionDuration} ease-out 0.1s, transform ${transitionDuration} ease-out 0.1s, box-shadow 0.2s ease`,
            minHeight: '48px',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 28px rgba(21, 94, 239, 0.45)';
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(21, 94, 239, 0.3)';
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
        >
          {t('splash.enter')}
          <ArrowRight style={{ width: '18px', height: '18px' }} />
        </button>

        {/* Subtle skip hint */}
        <div
          style={{
            marginTop: '20px',
            fontSize: '0.72rem',
            color: '#94a3b8',
            opacity: phase === 'button' || reducedMotion ? 1 : 0,
            transition: `opacity ${transitionDuration} ease-out 0.15s`,
          }}
        >
          {t('splash.skip')}
        </div>
      </div>

      {/* Bottom security notice */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '20px',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: '0.7rem',
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '0 20px',
          opacity: phase === 'button' || reducedMotion ? 1 : 0,
          transition: `opacity ${transitionDuration} ease-out 0.2s`,
        }}
      >
        <Shield style={{ width: '12px', height: '12px', color: '#16a34a' }} />
        <span>{t('splash.secure_notice')}</span>
      </div>
    </div>
  );
}
