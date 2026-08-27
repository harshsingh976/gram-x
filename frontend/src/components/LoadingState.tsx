import React from "react";
import { useLanguage } from "../i18n";
import type { UserRole } from "../types";

type LoadingVariant = "fullscreen" | "overlay" | "inline" | "card";
type LoadingContext =
  | "default"
  | "citizen_complaints"
  | "worker_tasks"
  | "admin_data"
  | "collector_intel"
  | "camera"
  | "audio"
  | "ai_processing"
  | "uploading"
  | "syncing"
  | "authenticating"
  | "saving";

interface LoadingStateProps {
  variant?: LoadingVariant;
  context?: LoadingContext;
  role?: UserRole;
  message?: string;          // Override message
  subMessage?: string;
  progress?: number;         // 0–100, shows progress bar if set
}

const CONTEXT_ICONS: Record<LoadingContext, string> = {
  default:             "⚙️",
  citizen_complaints:  "📋",
  worker_tasks:        "🔧",
  admin_data:          "🏛️",
  collector_intel:     "⚖️",
  camera:              "📷",
  audio:               "🎙️",
  ai_processing:       "🤖",
  uploading:           "☁️",
  syncing:             "🔄",
  authenticating:      "🔐",
  saving:              "💾",
};

const ROLE_CONTEXT_MAP: Record<string, LoadingContext> = {
  citizen: "citizen_complaints",
  worker:  "worker_tasks",
  admin:   "admin_data",
  district:"collector_intel",
};

function Spinner({ color = "#3b82f6", size = 32 }: { color?: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size,
      border: `${size / 8}px solid ${color}20`,
      borderTop: `${size / 8}px solid ${color}`,
      borderRadius: "50%",
      animation: "gramx-spin 0.8s linear infinite",
    }} />
  );
}

export function LoadingState({
  variant = "inline",
  context,
  role,
  message,
  subMessage,
  progress,
}: LoadingStateProps) {
  const { t } = useLanguage();

  // Determine context from role if not explicit
  const resolvedContext = context || (role ? ROLE_CONTEXT_MAP[role] : "default") || "default";
  const icon = CONTEXT_ICONS[resolvedContext];

  // Determine message
  const resolvedMessage = message || (() => {
    try { return t(`loading.${resolvedContext}`); } catch { return "Loading..."; }
  })();

  const ROLE_COLORS: Record<string, string> = {
    citizen: "#0ea5e9",
    worker:  "#f59e0b",
    admin:   "#6366f1",
    district:"#8b5cf6",
  };
  const accentColor = role ? (ROLE_COLORS[role] || "#3b82f6") : "#3b82f6";

  const content = (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "16px",
      padding: "32px",
      textAlign: "center",
    }}>
      <div style={{ position: "relative", width: "64px", height: "64px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner color={accentColor} size={56} />
        <div style={{
          position: "absolute",
          fontSize: "1.5rem",
          animation: "gramx-pulse 1.5s ease-in-out infinite",
        }}>
          {icon}
        </div>
      </div>

      <div>
        <p style={{
          margin: 0,
          fontSize: "0.9rem",
          fontWeight: 700,
          color: "#1e293b",
          marginBottom: "4px",
        }}>
          {resolvedMessage}
        </p>
        {subMessage && (
          <p style={{ margin: 0, fontSize: "0.75rem", color: "#94a3b8" }}>
            {subMessage}
          </p>
        )}
      </div>

      {typeof progress === "number" && (
        <div style={{ width: "100%", maxWidth: "200px" }}>
          <div style={{
            height: "4px",
            background: "#e2e8f0",
            borderRadius: "2px",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${progress}%`,
              background: accentColor,
              borderRadius: "2px",
              transition: "width 0.3s ease",
            }} />
          </div>
          <p style={{ marginTop: "4px", fontSize: "0.65rem", color: "#94a3b8" }}>
            {progress}%
          </p>
        </div>
      )}
    </div>
  );

  if (variant === "fullscreen") {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, system-ui, sans-serif",
      }}>
        {/* India stripe */}
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "3px", display: "flex" }}>
          <div style={{ flex: 1, background: "#FF9933" }} />
          <div style={{ flex: 1, background: "#FFFFFF", opacity: 0.3 }} />
          <div style={{ flex: 1, background: "#138808" }} />
        </div>

        <div style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: "20px",
          padding: "48px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
          maxWidth: "400px",
          width: "90%",
        }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{
              width: "40px", height: "40px",
              background: accentColor,
              borderRadius: "10px",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 12px",
              fontSize: "1.2rem",
            }}>🇮🇳</div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>GRAM-X</h2>
            <p style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
              Digital Rural Governance Platform
            </p>
          </div>
          {content}
        </div>
      </div>
    );
  }

  if (variant === "overlay") {
    return (
      <div style={{
        position: "absolute", inset: 0, zIndex: 100,
        background: "rgba(248,250,252,0.85)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: "inherit",
      }}>
        {content}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        overflow: "hidden",
      }}>
        {content}
      </div>
    );
  }

  // inline
  return content;
}

export default LoadingState;
