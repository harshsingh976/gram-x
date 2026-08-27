import React, { useState, useEffect, useRef } from 'react';
import { Shield, Activity, Power } from 'lucide-react';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [isBursting, setIsBursting] = useState(false);
  const [fadeAway, setFadeAway] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Particle list for canvas animation
  const particles = useRef<any[]>([]);
  const backgroundParticles = useRef<any[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Create background drifting star motes
    backgroundParticles.current = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      speedX: (Math.random() - 0.5) * 0.15,
      speedY: (Math.random() - 0.5) * 0.15,
      opacity: Math.random() * 0.5 + 0.2
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw drifting background particles
      backgroundParticles.current.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fill();

        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap around boundaries
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });

      // 2. Draw burst explosion particles if active
      if (particles.current.length > 0) {
        particles.current.forEach((p, index) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = p.glow;
          ctx.shadowColor = p.color;
          ctx.fill();
          ctx.shadowBlur = 0; // reset glow

          // Move particles
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.size *= 0.98; // shrink
          p.alpha -= 0.015;

          if (p.alpha <= 0 || p.size <= 0.2) {
            particles.current.splice(index, 1);
          }
        });
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Trigger the burst explosion
  const handleEnterPortal = () => {
    if (isBursting) return;
    setIsBursting(true);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const colors = [
      'rgba(99, 102, 241, 0.95)', // Indigo
      'rgba(20, 184, 166, 0.95)',  // Teal
      'rgba(168, 85, 247, 0.95)',  // Purple
      'rgba(255, 255, 255, 0.95)'   // White
    ];

    // Instantiate 160 high-velocity explosion particles
    particles.current = Array.from({ length: 160 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 12 + 4;
      return {
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        gravity: 0.05,
        glow: Math.random() * 15 + 5
      };
    });

    // Fade out splash layout and trigger complete callback
    setTimeout(() => {
      setFadeAway(true);
      setTimeout(() => {
        onComplete();
      }, 600);
    }, 900);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#040508',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadeAway ? 0 : 1,
        transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      {/* Background canvas */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

      {/* Floating blur orbs */}
      <style>{`
        @keyframes driftOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, 40px) scale(1.15); }
        }
        @keyframes driftOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, -30px) scale(1.1); }
        }
        @keyframes corePulse {
          0%, 100% { transform: scale(1); opacity: 0.95; filter: drop-shadow(0 0 15px rgba(99, 102, 241, 0.4)); }
          50% { transform: scale(1.05); opacity: 1; filter: drop-shadow(0 0 35px rgba(20, 184, 166, 0.6)); }
        }
        @keyframes spinRing {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .orb-blur-1 {
          animation: driftOrb1 15s infinite ease-in-out;
        }
        .orb-blur-2 {
          animation: driftOrb2 18s infinite ease-in-out;
        }
        .pulse-core {
          animation: ${isBursting ? 'none' : 'corePulse 4s infinite ease-in-out'};
          transition: all 0.5s ease-out;
        }
        .spin-ring {
          animation: spinRing 20s infinite linear;
        }
      `}</style>

      {/* Ambient background glows */}
      <div className="absolute w-[45%] h-[45%] bg-indigo-500/10 blur-[130px] rounded-full top-[-10%] left-[-15%] pointer-events-none orb-blur-1" />
      <div className="absolute w-[45%] h-[45%] bg-teal-500/10 blur-[130px] rounded-full bottom-[-10%] right-[-15%] pointer-events-none orb-blur-2" />

      {/* Interactive Core */}
      <div 
        onClick={handleEnterPortal}
        className="relative z-10 flex flex-col items-center justify-center cursor-pointer"
      >
        {/* Core Container */}
        <div 
          className="relative w-44 h-44 rounded-full flex items-center justify-center pulse-core"
          style={{
            background: 'rgba(255, 255, 255, 0.01)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: 'inset 0 0 30px rgba(255,255,255,0.02)',
            transform: isBursting ? 'scale(2.2)' : 'scale(1)',
            opacity: isBursting ? 0 : 1,
            transition: 'all 0.8s cubic-bezier(0.19, 1, 0.22, 1)'
          }}
        >
          {/* Outer spin ring */}
          <div className="absolute inset-2 border border-dashed border-teal-500/20 rounded-full spin-ring" />
          <div className="absolute inset-5 border border-white/[0.04] rounded-full" />

          {/* Central Holographic Icon */}
          <div className="relative z-20 flex flex-col items-center gap-1.5 text-zinc-100">
            <Power className="w-9 h-9 text-teal-400 mb-1" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Initialize</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-indigo-400">Oversight</span>
          </div>
        </div>

        {/* Text indicators */}
        <div 
          className="mt-10 text-center transition-all duration-500"
          style={{ 
            opacity: isBursting ? 0 : 0.7,
            transform: isBursting ? 'translateY(15px)' : 'translateY(0)'
          }}
        >
          <h1 className="text-xl font-bold text-white tracking-widest uppercase mb-1.5">GRAM-X</h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.25em]">Press core to enter network</p>
        </div>
      </div>

      {/* Bottom info registry details */}
      <div 
        className="absolute bottom-10 flex items-center gap-6 text-[9px] text-zinc-600 font-bold uppercase tracking-wider transition-opacity duration-300"
        style={{ opacity: isBursting ? 0 : 0.4 }}
      >
        <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> SECURE CONTEXT</div>
        <div className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> NIC ACTIVE STATE</div>
      </div>
    </div>
  );
}
