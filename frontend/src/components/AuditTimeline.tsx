import React from "react";
import { useLanguage } from "../i18n";

export interface AuditEvent {
  id: number | string;
  action: string;
  actor?: string;
  actor_role?: string;
  timestamp: string;
  status?: string;
  notes?: string;
}

interface AuditTimelineProps {
  events: AuditEvent[];
  loading?: boolean;
  compact?: boolean;
}

const PHASE_CONFIG: Record<string, { color: string; bg: string; border: string; icon: string; label: string }> = {
  submitted:           { color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", icon: "📋", label: "Submitted" },
  reported:            { color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", icon: "📋", label: "Reported" },
  pending:             { color: "#94a3b8", bg: "#f8fafc", border: "#e2e8f0", icon: "⏳", label: "Pending" },
  assigned:            { color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", icon: "👤", label: "Assigned" },
  accepted:            { color: "#f97316", bg: "#fff7ed", border: "#fed7aa", icon: "✅", label: "Accepted" },
  en_route:            { color: "#f97316", bg: "#fff7ed", border: "#fed7aa", icon: "🚗", label: "En Route" },
  in_progress:         { color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe", icon: "🔧", label: "In Progress" },
  completed:           { color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0", icon: "✔️", label: "Completed" },
  resolved:            { color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0", icon: "✔️", label: "Resolved" },
  verified:            { color: "#059669", bg: "#d1fae5", border: "#6ee7b7", icon: "🏆", label: "Verified" },
  resolved_confirmed:  { color: "#059669", bg: "#d1fae5", border: "#6ee7b7", icon: "🏆", label: "Confirmed" },
  escalated:           { color: "#ef4444", bg: "#fef2f2", border: "#fecaca", icon: "🚨", label: "Escalated" },
  sla_breach:          { color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", icon: "⚠️", label: "SLA Breach" },
  outcome_gap:         { color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", icon: "❌", label: "Outcome Gap" },
  pending_verification:{ color: "#0284c7", bg: "#e0f2fe", border: "#7dd3fc", icon: "🔍", label: "Pending Verification" },
  price_increase:      { color: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: "💰", label: "Price Revision" },
  evidence_uploaded:   { color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd", icon: "📸", label: "Evidence Uploaded" },
  voice_report:        { color: "#0369a1", bg: "#e0f2fe", border: "#7dd3fc", icon: "🎙️", label: "Voice Report" },
  login:               { color: "#64748b", bg: "#f8fafc", border: "#cbd5e1", icon: "🔐", label: "Login" },
  logout:              { color: "#64748b", bg: "#f8fafc", border: "#cbd5e1", icon: "🚪", label: "Logout" },
};

const ROLE_BADGES: Record<string, { label: string; color: string }> = {
  citizen:   { label: "Citizen",           color: "#0ea5e9" },
  worker:    { label: "Field Worker",       color: "#f59e0b" },
  admin:     { label: "Panchayat Admin",   color: "#6366f1" },
  district:  { label: "Collector",          color: "#8b5cf6" },
  system:    { label: "System",             color: "#64748b" },
  ai:        { label: "AI Engine",          color: "#ec4899" },
};

function formatTimestamp(ts: string): string {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    }) + " IST";
  } catch {
    return ts;
  }
}

function getPhaseConfig(status?: string, action?: string) {
  const key = (status || action || "").toLowerCase().replace(/[\s-]/g, "_");
  // Try direct match, then prefix match
  if (PHASE_CONFIG[key]) return PHASE_CONFIG[key];
  for (const k of Object.keys(PHASE_CONFIG)) {
    if (key.includes(k)) return PHASE_CONFIG[k];
  }
  return { color: "#64748b", bg: "#f8fafc", border: "#e2e8f0", icon: "📌", label: status || action || "Event" };
}

export function AuditTimeline({ events, loading, compact }: AuditTimelineProps) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", opacity: 0.4 }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#e2e8f0", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: "12px", background: "#e2e8f0", borderRadius: "6px", marginBottom: "6px", width: "60%" }} />
                <div style={{ height: "10px", background: "#f1f5f9", borderRadius: "5px", width: "40%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div style={{ padding: "32px", textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📋</div>
        <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>{t("timeline.no_events")}</p>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", padding: compact ? "0" : "8px 0" }}>
      {events.map((event, idx) => {
        const cfg = getPhaseConfig(event.status, event.action);
        const roleBadge = ROLE_BADGES[event.actor_role || "system"];
        const isLast = idx === events.length - 1;

        return (
          <div
            key={event.id || idx}
            style={{
              display: "flex",
              gap: "12px",
              position: "relative",
              paddingBottom: isLast ? 0 : "20px",
            }}
          >
            {/* Vertical connector line */}
            {!isLast && (
              <div style={{
                position: "absolute",
                left: "15px",
                top: "32px",
                bottom: 0,
                width: "2px",
                background: `linear-gradient(to bottom, ${cfg.color}40, #e2e8f080)`,
              }} />
            )}

            {/* Node dot */}
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: cfg.bg,
              border: `2px solid ${cfg.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: "0.9rem",
              boxShadow: `0 0 0 3px ${cfg.color}18`,
              zIndex: 1,
              position: "relative",
            }}>
              {cfg.icon}
            </div>

            {/* Content */}
            <div style={{
              flex: 1,
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              borderRadius: "10px",
              padding: compact ? "8px 12px" : "12px 14px",
              minWidth: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                <span style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: cfg.color,
                }}>
                  {cfg.label}
                </span>
                {event.timestamp && (
                  <span style={{ fontSize: "0.65rem", color: "#94a3b8", fontFamily: "monospace" }}>
                    🕐 {formatTimestamp(event.timestamp)}
                  </span>
                )}
              </div>

              {event.action && event.action !== event.status && (
                <p style={{ fontSize: "0.75rem", color: "#475569", margin: "2px 0 0", lineHeight: 1.4 }}>
                  {event.action.replace(/_/g, " ")}
                </p>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
                {event.actor && (
                  <span style={{
                    fontSize: "0.65rem",
                    background: roleBadge?.color ? `${roleBadge.color}18` : "#f1f5f9",
                    color: roleBadge?.color || "#64748b",
                    border: `1px solid ${roleBadge?.color ? roleBadge.color + "30" : "#e2e8f0"}`,
                    padding: "1px 6px",
                    borderRadius: "4px",
                    fontWeight: 700,
                  }}>
                    👤 {event.actor}
                  </span>
                )}
                {event.actor_role && (
                  <span style={{
                    fontSize: "0.6rem",
                    background: "#f8fafc",
                    color: "#94a3b8",
                    padding: "1px 5px",
                    borderRadius: "4px",
                    border: "1px solid #e2e8f0",
                  }}>
                    {roleBadge?.label || event.actor_role}
                  </span>
                )}
              </div>

              {event.notes && !compact && (
                <p style={{
                  marginTop: "6px",
                  fontSize: "0.7rem",
                  color: "#64748b",
                  background: "rgba(255,255,255,0.6)",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  lineHeight: 1.5,
                  borderLeft: `3px solid ${cfg.color}60`,
                }}>
                  {event.notes}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AuditTimeline;
