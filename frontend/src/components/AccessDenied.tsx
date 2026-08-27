import React from "react";
import { useLanguage } from "../i18n";

interface AccessDeniedProps {
  requestedRole: string;
  actualRole: string;
  displayName?: string;
  onLogout: () => void;
}

const PORTAL_URLS: Record<string, { url: string; label: string; emoji: string; color: string }> = {
  citizen:   { url: "https://citizen.gramx.gov.in",   label: "Citizen Portal",          emoji: "🏘️", color: "#0ea5e9" },
  worker:    { url: "https://worker.gramx.gov.in",    label: "Field Worker Portal",      emoji: "🔧", color: "#f59e0b" },
  admin:     { url: "https://admin.gramx.gov.in",     label: "Admin (Panchayat) Portal", emoji: "🏛️", color: "#6366f1" },
  district:  { url: "https://collector.gramx.gov.in", label: "Collector Portal",         emoji: "⚖️", color: "#8b5cf6" },
  collector: { url: "https://collector.gramx.gov.in", label: "Collector Portal",         emoji: "⚖️", color: "#8b5cf6" },
};

const ROLE_LABELS: Record<string, string> = {
  citizen:   "Citizen",
  worker:    "Field Worker",
  admin:     "Panchayat Admin",
  district:  "District Collector",
  collector: "District Collector",
};

export default function AccessDenied({ requestedRole, actualRole, displayName, onLogout }: AccessDeniedProps) {
  const { t } = useLanguage();
  const correctPortal = PORTAL_URLS[actualRole];
  const attemptedPortal = PORTAL_URLS[requestedRole];
  const actualLabel = ROLE_LABELS[actualRole] || actualRole;
  const requestedLabel = ROLE_LABELS[requestedRole] || requestedRole;

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      fontFamily: "Inter, system-ui, sans-serif",
      padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: "520px", display: "flex", marginBottom: "32px", borderRadius: "4px", overflow: "hidden", height: "4px" }}>
        <div style={{ flex: 1, background: "#FF9933" }} />
        <div style={{ flex: 1, background: "#FFFFFF" }} />
        <div style={{ flex: 1, background: "#138808" }} />
      </div>

      <div style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "20px",
        padding: "40px",
        maxWidth: "520px",
        width: "100%",
        textAlign: "center",
        boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
      }}>
        <div style={{
          width: "72px", height: "72px", borderRadius: "50%",
          background: "rgba(239,68,68,0.15)",
          border: "2px solid rgba(239,68,68,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
          fontSize: "2rem",
        }}>🚫</div>

        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f8fafc", marginBottom: "8px" }}>
          {t("access_denied.title")}
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#94a3b8", lineHeight: 1.6, marginBottom: "24px" }}>
          {t("access_denied.message")
            .replace("{name}", displayName || "User")
            .replace("{actual}", actualLabel)
            .replace("{requested}", requestedLabel)}
        </p>

        <div style={{
          background: "rgba(255,255,255,0.06)", borderRadius: "12px",
          padding: "16px", marginBottom: "24px", textAlign: "left",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Authenticated As</span>
            <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Attempting To Access</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.4rem" }}>{correctPortal?.emoji || "👤"}</span>
              <div>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#e2e8f0" }}>{actualLabel}</div>
                <div style={{ fontSize: "0.65rem", color: "#475569" }}>{displayName}</div>
              </div>
            </div>
            <span style={{ color: "#475569", fontSize: "1.2rem" }}>→</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", opacity: 0.6 }}>
              <span style={{ fontSize: "1.4rem" }}>{attemptedPortal?.emoji || "🏛️"}</span>
              <div>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#e2e8f0" }}>{requestedLabel}</div>
                <div style={{ fontSize: "0.65rem", color: "#ef4444" }}>Access Denied</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {correctPortal && (
            <a
              href={correctPortal.url}
              style={{
                display: "block", background: correctPortal.color, color: "#fff",
                padding: "13px 20px", borderRadius: "10px", fontSize: "0.875rem",
                fontWeight: 700, textDecoration: "none",
              }}
            >
              {correctPortal.emoji} Go to My Portal — {actualLabel}
            </a>
          )}
          <button
            onClick={onLogout}
            style={{
              display: "block", width: "100%",
              background: "rgba(239,68,68,0.12)", color: "#fca5a5",
              border: "1px solid rgba(239,68,68,0.25)",
              padding: "13px 20px", borderRadius: "10px", fontSize: "0.875rem",
              fontWeight: 700, cursor: "pointer",
            }}
          >
            Sign Out &amp; Return to Landing
          </button>
        </div>

        <p style={{ marginTop: "20px", fontSize: "0.65rem", color: "#475569" }}>
          GRAM-X • Digital Rural Governance Platform • NIC Compliant
        </p>
      </div>
    </div>
  );
}
