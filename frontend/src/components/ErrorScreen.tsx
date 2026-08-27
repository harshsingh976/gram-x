import React from "react";
import { useLanguage } from "../i18n";
import { RefreshCw, Home, LogOut, Settings, Wifi, Camera, Mic, ShieldAlert, FileQuestion, ServerCrash } from "lucide-react";

type ErrorType =
  | "403"
  | "404"
  | "500"
  | "network"
  | "session_expired"
  | "camera_denied"
  | "mic_denied"
  | "upload_failed"
  | "ai_failed"
  | "generic";

interface ErrorScreenProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  onHome?: () => void;
  onLogout?: () => void;
  /** If true, renders in a contained card rather than fullscreen */
  inline?: boolean;
}

interface ErrorConfig {
  icon: React.ReactNode;
  color: string;
  bg: string;
  defaultTitle: string;
  defaultMessage: string;
  primaryAction?: string;
  primaryIcon?: React.ReactNode;
}

export function ErrorScreen({
  type = "generic",
  title,
  message,
  onRetry,
  onHome,
  onLogout,
  inline = false,
}: ErrorScreenProps) {
  const { t } = useLanguage();

  const CONFIG: Record<ErrorType, ErrorConfig> = {
    "403": {
      icon: <ShieldAlert size={32} color="#dc2626" />,
      color: "#dc2626",
      bg: "#fef2f2",
      defaultTitle: t("error.403"),
      defaultMessage: t("error.403_msg"),
      primaryAction: t("error.go_home"),
      primaryIcon: <Home size={16} />,
    },
    "404": {
      icon: <FileQuestion size={32} color="#f59e0b" />,
      color: "#f59e0b",
      bg: "#fffbeb",
      defaultTitle: t("error.404"),
      defaultMessage: t("error.404_msg"),
      primaryAction: t("error.go_home"),
      primaryIcon: <Home size={16} />,
    },
    "500": {
      icon: <ServerCrash size={32} color="#7c3aed" />,
      color: "#7c3aed",
      bg: "#f5f3ff",
      defaultTitle: t("error.500"),
      defaultMessage: t("error.500_msg"),
      primaryAction: t("error.retry"),
      primaryIcon: <RefreshCw size={16} />,
    },
    "network": {
      icon: <Wifi size={32} color="#0ea5e9" />,
      color: "#0ea5e9",
      bg: "#f0f9ff",
      defaultTitle: t("error.network"),
      defaultMessage: t("error.network_msg"),
      primaryAction: t("error.retry"),
      primaryIcon: <RefreshCw size={16} />,
    },
    "session_expired": {
      icon: <ShieldAlert size={32} color="#ef4444" />,
      color: "#ef4444",
      bg: "#fef2f2",
      defaultTitle: t("error.session_expired"),
      defaultMessage: t("error.session_expired_msg"),
      primaryAction: t("error.sign_in_again"),
      primaryIcon: <LogOut size={16} />,
    },
    "camera_denied": {
      icon: <Camera size={32} color="#64748b" />,
      color: "#64748b",
      bg: "#f8fafc",
      defaultTitle: t("error.camera_denied"),
      defaultMessage: t("error.camera_denied_msg"),
      primaryAction: t("error.open_settings"),
      primaryIcon: <Settings size={16} />,
    },
    "mic_denied": {
      icon: <Mic size={32} color="#64748b" />,
      color: "#64748b",
      bg: "#f8fafc",
      defaultTitle: t("error.mic_denied"),
      defaultMessage: t("error.mic_denied_msg"),
      primaryAction: t("error.open_settings"),
      primaryIcon: <Settings size={16} />,
    },
    "upload_failed": {
      icon: <RefreshCw size={32} color="#f97316" />,
      color: "#f97316",
      bg: "#fff7ed",
      defaultTitle: t("error.upload_failed"),
      defaultMessage: t("error.upload_failed_msg"),
      primaryAction: t("error.retry"),
      primaryIcon: <RefreshCw size={16} />,
    },
    "ai_failed": {
      icon: <span style={{ fontSize: "2rem" }}>🤖</span>,
      color: "#ec4899",
      bg: "#fdf2f8",
      defaultTitle: t("error.ai_failed"),
      defaultMessage: t("error.ai_failed_msg"),
      primaryAction: t("error.retry"),
      primaryIcon: <RefreshCw size={16} />,
    },
    "generic": {
      icon: <ShieldAlert size={32} color="#64748b" />,
      color: "#64748b",
      bg: "#f8fafc",
      defaultTitle: t("error.generic"),
      defaultMessage: t("error.generic_msg"),
      primaryAction: t("error.retry"),
      primaryIcon: <RefreshCw size={16} />,
    },
  };

  const cfg = CONFIG[type];

  const handlePrimaryAction = () => {
    if (type === "session_expired" && onLogout) { onLogout(); return; }
    if ((type === "403" || type === "404") && onHome) { onHome(); return; }
    if (type === "camera_denied" || type === "mic_denied") {
      // Open browser settings hint
      alert("Please open your browser Settings and allow camera/microphone access for this site.");
      return;
    }
    if (onRetry) onRetry();
  };

  const inner = (
    <div style={{
      background: cfg.bg,
      border: `1px solid ${cfg.color}30`,
      borderRadius: inline ? "12px" : "20px",
      padding: inline ? "24px" : "40px 48px",
      textAlign: "center",
      maxWidth: inline ? "100%" : "460px",
      width: "100%",
      fontFamily: "Inter, system-ui, sans-serif",
    }}>
      {/* Icon */}
      <div style={{
        width: "64px", height: "64px", borderRadius: "50%",
        background: `${cfg.color}18`,
        border: `2px solid ${cfg.color}40`,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 20px",
      }}>
        {cfg.icon}
      </div>

      <h2 style={{ fontSize: inline ? "1rem" : "1.25rem", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
        {title || cfg.defaultTitle}
      </h2>
      <p style={{ fontSize: "0.875rem", color: "#64748b", lineHeight: 1.6, marginBottom: "24px" }}>
        {message || cfg.defaultMessage}
      </p>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {(onRetry || onHome || onLogout || type === "camera_denied" || type === "mic_denied") && (
          <button
            onClick={handlePrimaryAction}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              background: cfg.color, color: "#fff",
              border: "none", padding: "12px 20px",
              borderRadius: "10px", fontSize: "0.875rem",
              fontWeight: 700, cursor: "pointer", width: "100%",
            }}
          >
            {cfg.primaryIcon}
            {cfg.primaryAction}
          </button>
        )}
        {onHome && type !== "403" && type !== "404" && (
          <button
            onClick={onHome}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              background: "transparent", color: "#64748b",
              border: "1px solid #e2e8f0", padding: "10px 20px",
              borderRadius: "10px", fontSize: "0.875rem",
              fontWeight: 600, cursor: "pointer", width: "100%",
            }}
          >
            <Home size={14} /> {t("error.go_home")}
          </button>
        )}
        {onLogout && type !== "session_expired" && (
          <button
            onClick={onLogout}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              background: "transparent", color: "#ef4444",
              border: "1px solid #fecaca", padding: "10px 20px",
              borderRadius: "10px", fontSize: "0.875rem",
              fontWeight: 600, cursor: "pointer", width: "100%",
            }}
          >
            <LogOut size={14} /> {t("error.sign_out")}
          </button>
        )}
      </div>
    </div>
  );

  if (inline) return inner;

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
      padding: "24px",
    }}>
      {inner}
    </div>
  );
}

export default ErrorScreen;
