import React, { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

interface Slide {
  url: string;
  alt: string;
  tag?: string;
  caption?: string;
}

interface ImageSlideshowProps {
  slides: Slide[];
  /** ms between auto-advances. Default 6500 */
  interval?: number;
  /** aspect-ratio override e.g. "16/6". Default "16/7" */
  aspectRatio?: string;
  /** height override */
  height?: string;
  /** overlay darkness 0..1 */
  overlayOpacity?: number;
  /** show indicators dots */
  showIndicators?: boolean;
  /** show prev/next arrows */
  showArrows?: boolean;
  /** show caption text */
  showCaption?: boolean;
  /** show tag badge */
  showTag?: boolean;
  /** role color for CTA badge */
  accentColor?: string;
  className?: string;
}

const CROSSFADE_MS = 600;

export default function ImageSlideshow({
  slides,
  interval = 6500,
  height,
  overlayOpacity = 0.48,
  showIndicators = true,
  showArrows = true,
  showCaption = true,
  showTag = true,
  accentColor = "#155EEF",
  className = "",
}: ImageSlideshowProps) {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [fading, setFading] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // pointer swipe state
  const pointerStartX = useRef<number | null>(null);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const goTo = useCallback(
    (idx: number) => {
      if (fading || slides.length === 0) return;
      setPrev(current);
      setFading(true);
      setTimeout(() => {
        setCurrent(idx);
        setPrev(null);
        setFading(false);
      }, prefersReducedMotion ? 0 : CROSSFADE_MS);
    },
    [fading, current, slides.length, prefersReducedMotion]
  );

  const goPrev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [goTo, current, slides.length]);
  const goNext = useCallback(() => goTo((current + 1) % slides.length), [goTo, current, slides.length]);

  // Auto-advance
  useEffect(() => {
    if (!playing || hovered || slides.length < 2) return;
    timerRef.current = setTimeout(goNext, interval);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [playing, hovered, current, interval, goNext, slides.length]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement === containerRef.current || containerRef.current?.contains(document.activeElement as Node)) {
        if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
        if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
        if (e.key === " ") { e.preventDefault(); setPlaying(p => !p); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext]);

  // Touch / pointer swipe
  const onPointerDown = (e: React.PointerEvent) => { pointerStartX.current = e.clientX; };
  const onPointerUp = (e: React.PointerEvent) => {
    if (pointerStartX.current === null) return;
    const delta = e.clientX - pointerStartX.current;
    if (Math.abs(delta) > 40) { delta < 0 ? goNext() : goPrev(); }
    pointerStartX.current = null;
  };

  if (slides.length === 0) return null;

  const activeSlide = slides[current];
  const prevSlide = prev !== null ? slides[prev] : null;

  return (
    <div
      ref={containerRef}
      className={className}
      role="region"
      aria-label="Image slideshow"
      aria-roledescription="carousel"
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      style={{
        position: "relative",
        width: "100%",
        height: height || "100%",
        overflow: "hidden",
        outline: "none",
        borderRadius: "inherit",
        cursor: "grab",
        userSelect: "none",
      }}
    >
      {/* Previous slide (fading out) */}
      {prevSlide && !prefersReducedMotion && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0, zIndex: 1,
            backgroundImage: `url(${prevSlide.url})`,
            backgroundSize: "cover", backgroundPosition: "center",
            opacity: fading ? 0 : 1,
            transition: `opacity ${CROSSFADE_MS}ms ease`,
          }}
        />
      )}

      {/* Current slide */}
      <div
        aria-hidden="false"
        style={{
          position: "absolute", inset: 0, zIndex: 2,
          backgroundImage: `url(${activeSlide.url})`,
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: fading && !prefersReducedMotion ? 0 : 1,
          transform: !prefersReducedMotion ? (fading ? "scale(1.04)" : "scale(1)") : "none",
          transition: prefersReducedMotion ? "none" : `opacity ${CROSSFADE_MS}ms ease, transform ${CROSSFADE_MS}ms ease`,
        }}
      />

      {/* Overlay */}
      <div style={{ position: "absolute", inset: 0, zIndex: 3, background: `rgba(0,0,0,${overlayOpacity})` }} aria-hidden="true" />

      {/* Tag */}
      {showTag && activeSlide.tag && (
        <div
          aria-label={`Slide category: ${activeSlide.tag}`}
          style={{
            position: "absolute", top: 16, left: 16, zIndex: 5,
            background: accentColor, color: "#fff",
            fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.08em",
            padding: "3px 10px", borderRadius: 4,
            textTransform: "uppercase",
            opacity: fading && !prefersReducedMotion ? 0 : 1,
            transform: fading && !prefersReducedMotion ? "translateY(-6px)" : "translateY(0)",
            transition: prefersReducedMotion ? "none" : `opacity ${CROSSFADE_MS}ms ease, transform ${CROSSFADE_MS}ms ease`,
          }}
        >
          {activeSlide.tag}
        </div>
      )}

      {/* Caption */}
      {showCaption && activeSlide.caption && (
        <div
          style={{
            position: "absolute", bottom: showIndicators ? 52 : 16, left: 16, right: showArrows ? 80 : 16, zIndex: 5,
            opacity: fading && !prefersReducedMotion ? 0 : 1,
            transform: fading && !prefersReducedMotion ? "translateY(8px)" : "translateY(0)",
            transition: prefersReducedMotion ? "none" : `opacity ${CROSSFADE_MS}ms ease, transform ${CROSSFADE_MS}ms ease`,
          }}
        >
          <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.8rem", fontWeight: 500, lineHeight: 1.4, textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
            {activeSlide.caption}
          </p>
        </div>
      )}

      {/* Arrows */}
      {showArrows && slides.length > 1 && (
        <>
          <button
            onClick={goPrev}
            aria-label="Previous slide"
            style={{
              position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", zIndex: 6,
              background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff", borderRadius: "50%", width: 36, height: 36,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "background 0.2s",
              padding: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.6)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.35)")}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={goNext}
            aria-label="Next slide"
            style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", zIndex: 6,
              background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff", borderRadius: "50%", width: 36, height: 36,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "background 0.2s",
              padding: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.6)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.35)")}
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {/* Bottom controls row: indicators + play/pause */}
      {showIndicators && slides.length > 1 && (
        <div
          style={{
            position: "absolute", bottom: 12, left: 0, right: 0, zIndex: 6,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}: ${s.tag || s.alt}`}
              aria-current={i === current ? "true" : undefined}
              style={{
                width: i === current ? 20 : 7,
                height: 7, borderRadius: 4,
                background: i === current ? "#fff" : "rgba(255,255,255,0.4)",
                border: "none", cursor: "pointer", padding: 0,
                transition: "width 0.3s ease, background 0.3s ease",
              }}
            />
          ))}
          <button
            onClick={() => setPlaying(p => !p)}
            aria-label={playing ? "Pause slideshow" : "Play slideshow"}
            style={{
              marginLeft: 6,
              background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff", borderRadius: "50%", width: 22, height: 22,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", padding: 0,
            }}
          >
            {playing ? <Pause size={10} /> : <Play size={10} />}
          </button>
        </div>
      )}
    </div>
  );
}
