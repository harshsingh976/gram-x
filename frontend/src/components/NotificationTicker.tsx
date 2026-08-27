import React, { useState, useEffect, useRef } from "react";
import * as api from "../api";
import { useLanguage } from "../i18n";

interface Notification {
  id: number;
  message: string;
  type?: string;
  created_at?: string;
  is_read?: boolean;
}

function isNew(createdAt?: string): boolean {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < 10 * 60 * 1000;
}

export default function NotificationTicker() {
  const { t } = useLanguage();
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async () => {
    try {
      const data = await api.fetchNotifications();
      setItems(Array.isArray(data) ? data : []);
      setError(false);
    } catch {
      setError(true);
    }
  };

  useEffect(() => {
    load();
    timerRef.current = setInterval(load, 30000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const displayItems: string[] = items.length > 0
    ? items.map(n => n.message)
    : error
      ? [t("ticker.error")]
      : [t("ticker.default")];

  const displayText = displayItems.join("  ·  ");

  return (
    <div
      role="region"
      aria-label="Live notification ticker"
      aria-live="polite"
      style={{
        width: "100%",
        overflow: "hidden",
        background: "linear-gradient(90deg, #0f172a 0%, #1e293b 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        height: "36px",
        display: "flex",
        alignItems: "center",
        position: "relative",
      }}
    >
      {/* Fade masks */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 60, background: "linear-gradient(90deg, #0f172a, transparent)", zIndex: 2, pointerEvents: "none" }} />
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 60, background: "linear-gradient(270deg, #0f172a, transparent)", zIndex: 2, pointerEvents: "none" }} />

      {/* NEW badge for recent notifications */}
      {items.some(n => isNew(n.created_at)) && (
        <div style={{
          position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
          background: "#ef4444", color: "#fff", fontSize: "0.6rem", fontWeight: 800,
          padding: "1px 6px", borderRadius: 4, letterSpacing: "0.08em", zIndex: 3,
          animation: "tickerNewPulse 2s ease-in-out infinite",
        }}>{t("ticker.badge_new")}</div>
      )}

      <div
        aria-hidden="true"
        style={{
          display: "flex",
          whiteSpace: "nowrap",
          animation: "tickerScroll 35s linear infinite",
          paddingLeft: "100%",
          gap: 0,
        }}
      >
        <span style={{ fontSize: "0.74rem", fontWeight: 600, color: "rgba(255,255,255,0.82)", letterSpacing: "0.025em" }}>
          📡&nbsp;&nbsp;{displayText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;📡&nbsp;&nbsp;{displayText}
        </span>
      </div>

      <style>{`
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes tickerNewPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
