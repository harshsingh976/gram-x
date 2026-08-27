import React from "react";
import { ArrowRight, Wrench, MapPin, IndianRupee, Box } from "lucide-react";
import { IMAGE_MAP } from "../../imageMap";
import LiveClock from "../LiveClock";
import NotificationTicker from "../NotificationTicker";
import ImageSlideshow from "../ImageSlideshow";
import LanguageSelector from "../LanguageSelector";
import Landing3DScene from "../Landing3DScene";
import { useLanguage } from "../../i18n";

interface WorkerLandingProps { onLoginClick: () => void; }

export default function WorkerLanding({ onLoginClick }: WorkerLandingProps) {
  const { t } = useLanguage();

  const slides = [
    { url: IMAGE_MAP.workerHero, alt: t("slideshow.worker_tag"), tag: t("slideshow.worker_tag"), caption: t("slideshow.worker_caption") },
    { url: IMAGE_MAP.serviceElectricity, alt: t("category.power"), tag: t("category.power"), caption: t("worker.hero_subtitle") },
    { url: IMAGE_MAP.serviceRoad, alt: t("slideshow.road_tag"), tag: t("slideshow.road_tag"), caption: t("slideshow.road_caption") },
    { url: IMAGE_MAP.serviceWater, alt: t("slideshow.water_tag"), tag: t("slideshow.water_tag"), caption: t("slideshow.water_caption") },
  ];

  const features = [
    { icon: "📋", title: t("nav.my_tasks"), desc: t("worker.empty_tasks_desc") },
    { icon: "🗺️", title: t("nav.gps_navigation"), desc: t("worker.start_task") },
    { icon: "📷", title: t("worker.upload_proof"), desc: t("worker.checklist_step4") },
    { icon: "💰", title: t("nav.my_earnings"), desc: t("worker.complete_task") },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#fffbeb", fontFamily: "Inter, Noto Sans Devanagari, Noto Sans Tamil, Noto Sans Telugu, system-ui, sans-serif" }}>
      {/* Top gov bar */}
      <div style={{ background: "#78350f", color: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 24px", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.04em", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "1.2rem" }}>🇮🇳</span>
          <span>{t("brand.platform_name")}</span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span>{t("nav.worker_portal")}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <LanguageSelector variant="compact" lightText />
          <LiveClock variant="compact" lightText />
          <button onClick={onLoginClick} style={{ background: "#d97706", color: "#fff", border: "none", borderRadius: 6, padding: "5px 14px", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            {t("action.sign_in")} <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Hero */}
      <div style={{ position: "relative", height: 520 }}>
        <ImageSlideshow slides={slides} height="100%" overlayOpacity={0.5} accentColor="#d97706" showCaption showTag showArrows showIndicators />
        <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", pointerEvents: "none" }}>
          <div style={{ background: "rgba(217,119,6,0.18)", border: "1px solid rgba(217,119,6,0.4)", borderRadius: 6, padding: "4px 12px", marginBottom: 16, backdropFilter: "blur(6px)" }}>
            <span style={{ color: "#fde68a", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{t("worker.hero_badge")}</span>
          </div>
          <h1 style={{ color: "#fff", fontSize: "clamp(1.8rem, 5vw, 3rem)", fontWeight: 900, textAlign: "center", lineHeight: 1.15, marginBottom: 12, textShadow: "0 2px 16px rgba(0,0,0,0.5)", maxWidth: 720 }}>
            {t("landing.worker_h1")}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "1.05rem", textAlign: "center", maxWidth: 540, lineHeight: 1.6, textShadow: "0 1px 6px rgba(0,0,0,0.4)", marginBottom: 28 }}>
            {t("landing.worker_sub")}
          </p>
          <button
            onClick={onLoginClick}
            style={{ pointerEvents: "all", background: "#d97706", color: "#fff", border: "none", borderRadius: 10, padding: "14px 32px", fontSize: "1.05rem", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(217,119,6,0.5)" }}
          >
            {t("nav.my_tasks")} <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <NotificationTicker />

      {/* 3D Field Operations Digital Twin Section */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 0" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fef3c7", borderRadius: 20, padding: "4px 14px", marginBottom: 8 }}>
            <Box size={14} style={{ color: "#d97706" }} />
            <span style={{ color: "#b45309", fontSize: "0.74rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>3D Field Route Topology</span>
          </div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#78350f" }}>Real-Time Dispatch &amp; Waypoint Telemetry</h2>
          <p style={{ color: "#78716c", fontSize: "0.9rem" }}>Interact with GPS field vectors, proof checkpoints, and payout escrow nodes.</p>
        </div>
        <Landing3DScene role="worker" height={360} />
      </div>

      {/* Features */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 64px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fef3c7", borderRadius: 20, padding: "4px 14px", marginBottom: 12 }}>
            <Wrench size={14} style={{ color: "#d97706" }} />
            <span style={{ color: "#b45309", fontSize: "0.74rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>{t("worker.profile_title")}</span>
          </div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#78350f", marginBottom: 8 }}>{t("worker.hero_subtitle")}</h2>
          <p style={{ color: "#78716c", fontSize: "0.95rem" }}>{t("landing.worker_sub")}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
          {features.map((f, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #fef3c7", borderRadius: 14, padding: "24px 20px", textAlign: "center", boxShadow: "0 2px 12px rgba(217,119,6,0.07)" }}>
              <div style={{ fontSize: "2rem", marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontWeight: 800, color: "#78350f", marginBottom: 6, fontSize: "0.95rem" }}>{f.title}</div>
              <div style={{ color: "#78716c", fontSize: "0.82rem", lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 40, display: "flex", alignItems: "center", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><MapPin size={15} style={{ color: "#d97706" }} /><span style={{ color: "#57534e", fontSize: "0.82rem", fontWeight: 600 }}>{t("nav.gps_navigation")}</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><IndianRupee size={15} style={{ color: "#10b981" }} /><span style={{ color: "#57534e", fontSize: "0.82rem", fontWeight: 600 }}>{t("kpi.funds_disbursed")}</span></div>
        </div>
        <div style={{ textAlign: "center", marginTop: 36 }}>
          <button onClick={onLoginClick} style={{ background: "#d97706", color: "#fff", border: "none", borderRadius: 10, padding: "14px 36px", fontSize: "1rem", fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 4px 16px rgba(217,119,6,0.35)" }}>
            {t("action.enter_portal")} <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <div style={{ background: "#78350f", color: "rgba(255,255,255,0.75)", textAlign: "center", padding: "14px 24px", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.05em" }}>
        {t("brand.platform_name")} • {t("official_notice")}
      </div>
    </div>
  );
}
