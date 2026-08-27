import React from "react";
import { ArrowRight, BarChart3, Users, Shield, Box } from "lucide-react";
import { IMAGE_MAP } from "../../imageMap";
import LiveClock from "../LiveClock";
import NotificationTicker from "../NotificationTicker";
import ImageSlideshow from "../ImageSlideshow";
import LanguageSelector from "../LanguageSelector";
import Landing3DScene from "../Landing3DScene";
import { useLanguage } from "../../i18n";

interface AdminLandingProps { onLoginClick: () => void; }

export default function AdminLanding({ onLoginClick }: AdminLandingProps) {
  const { t } = useLanguage();

  const slides = [
    { url: IMAGE_MAP.adminHero, alt: t("slideshow.governance_tag"), tag: t("slideshow.governance_tag"), caption: t("slideshow.governance_caption") },
    { url: IMAGE_MAP.serviceWater, alt: t("slideshow.water_tag"), tag: t("slideshow.water_tag"), caption: t("slideshow.water_caption") },
    { url: IMAGE_MAP.serviceRoad, alt: t("slideshow.road_tag"), tag: t("slideshow.road_tag"), caption: t("slideshow.road_caption") },
    { url: IMAGE_MAP.serviceElectricity, alt: t("category.power"), tag: t("category.power"), caption: t("admin.hero_subtitle") },
  ];

  const features = [
    { icon: "🏛️", title: t("admin.hero_title"), desc: t("admin.hero_subtitle") },
    { icon: "🤖", title: t("nav.smart_dispatch"), desc: t("admin.dispatch_desk") },
    { icon: "📊", title: t("kpi.sla_compliance"), desc: t("admin.requires_attention") },
    { icon: "🔗", title: t("nav.audit_ledger"), desc: t("admin.reconcile_btn") },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "Inter, Noto Sans Devanagari, Noto Sans Tamil, Noto Sans Telugu, system-ui, sans-serif" }}>
      <div style={{ background: "#0b1f3a", color: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 24px", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.04em", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "1.2rem" }}>🇮🇳</span>
          <span>{t("brand.platform_name")}</span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span>{t("nav.admin_portal")}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <LanguageSelector variant="compact" lightText />
          <LiveClock variant="compact" lightText />
          <button onClick={onLoginClick} style={{ background: "#155EEF", color: "#fff", border: "none", borderRadius: 6, padding: "5px 14px", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            {t("action.sign_in")} <ArrowRight size={12} />
          </button>
        </div>
      </div>

      <div style={{ position: "relative", height: 520 }}>
        <ImageSlideshow slides={slides} height="100%" overlayOpacity={0.55} accentColor="#155EEF" showCaption showTag showArrows showIndicators />
        <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", pointerEvents: "none" }}>
          <div style={{ background: "rgba(21,94,239,0.18)", border: "1px solid rgba(21,94,239,0.4)", borderRadius: 6, padding: "4px 12px", marginBottom: 16, backdropFilter: "blur(6px)" }}>
            <span style={{ color: "#bfdbfe", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{t("admin.hero_badge")}</span>
          </div>
          <h1 style={{ color: "#fff", fontSize: "clamp(1.8rem, 5vw, 3rem)", fontWeight: 900, textAlign: "center", lineHeight: 1.15, marginBottom: 12, textShadow: "0 2px 16px rgba(0,0,0,0.6)", maxWidth: 720 }}>
            {t("landing.admin_h1")}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "1.05rem", textAlign: "center", maxWidth: 540, lineHeight: 1.6, textShadow: "0 1px 6px rgba(0,0,0,0.5)", marginBottom: 28 }}>
            {t("landing.admin_sub")}
          </p>
          <button
            onClick={onLoginClick}
            style={{ pointerEvents: "all", background: "#155EEF", color: "#fff", border: "none", borderRadius: 10, padding: "14px 32px", fontSize: "1.05rem", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(21,94,239,0.5)" }}
          >
            {t("action.enter_portal")} <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <NotificationTicker />

      {/* 3D Panchayat Command Center Mesh Section */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 0" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#eff6ff", borderRadius: 20, padding: "4px 14px", marginBottom: 8 }}>
            <Box size={14} style={{ color: "#155EEF" }} />
            <span style={{ color: "#1d4ed8", fontSize: "0.74rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>3D Administrative Topology</span>
          </div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0b1f3a" }}>Multi-Panchayat Governance Mesh</h2>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Real-time telemetry of Panchayat clusters, dispatch queues, and audit blocks.</p>
        </div>
        <Landing3DScene role="admin" height={360} />
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 64px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#eff6ff", borderRadius: 20, padding: "4px 14px", marginBottom: 12 }}>
            <Shield size={14} style={{ color: "#155EEF" }} />
            <span style={{ color: "#1d4ed8", fontSize: "0.74rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>{t("official_notice")}</span>
          </div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0b1f3a", marginBottom: 8 }}>{t("admin.hero_title")}</h2>
          <p style={{ color: "#475569", fontSize: "0.95rem" }}>{t("landing.admin_sub")}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
          {features.map((f, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #e0e7ff", borderRadius: 14, padding: "24px 20px", textAlign: "center", boxShadow: "0 2px 12px rgba(21,94,239,0.06)" }}>
              <div style={{ fontSize: "2rem", marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontWeight: 800, color: "#0b1f3a", marginBottom: 6, fontSize: "0.95rem" }}>{f.title}</div>
              <div style={{ color: "#64748b", fontSize: "0.82rem", lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 40, display: "flex", alignItems: "center", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><BarChart3 size={15} style={{ color: "#155EEF" }} /><span style={{ color: "#475569", fontSize: "0.82rem", fontWeight: 600 }}>{t("kpi.sla_compliance")}</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Users size={15} style={{ color: "#155EEF" }} /><span style={{ color: "#475569", fontSize: "0.82rem", fontWeight: 600 }}>{t("admin.dispatch_desk")}</span></div>
        </div>
        <div style={{ textAlign: "center", marginTop: 36 }}>
          <button onClick={onLoginClick} style={{ background: "#155EEF", color: "#fff", border: "none", borderRadius: 10, padding: "14px 36px", fontSize: "1rem", fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 4px 16px rgba(21,94,239,0.35)" }}>
            {t("action.enter_portal")} <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <div style={{ background: "#0b1f3a", color: "rgba(255,255,255,0.75)", textAlign: "center", padding: "14px 24px", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.05em" }}>
        {t("brand.platform_name")} • {t("official_notice")}
      </div>
    </div>
  );
}
