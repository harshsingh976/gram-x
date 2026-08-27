import React, { useState, useEffect } from "react";
import { offlineStore } from "../utils/offlineStore";
import { realtimeService, type RealtimeStatus } from "../services/realtime";
import { useLanguage } from "../i18n";

type NetworkState = "online_live" | "online_polling" | "syncing" | "reconnecting" | "offline";

export default function NetworkStatus() {
  const { t } = useLanguage();
  const [networkState, setNetworkState] = useState<NetworkState>("online_live");
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const role = localStorage.getItem("role") || "citizen";
    realtimeService.connect(role);

    const updateCombinedState = async (rtStatus?: RealtimeStatus) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setNetworkState("offline");
        return;
      }
      try {
        const pending = await offlineStore.getPendingActions();
        const count = Array.isArray(pending) ? pending.length : 0;
        setPendingCount(count);

        if (count > 0) {
          setNetworkState("syncing");
          return;
        }

        const currentRt = rtStatus || realtimeService.getStatus();
        if (currentRt === "CONNECTED") {
          setNetworkState("online_live");
        } else if (currentRt === "RECONNECTING") {
          setNetworkState("reconnecting");
        } else {
          setNetworkState("online_polling");
        }
      } catch {
        setNetworkState(navigator.onLine ? "online_live" : "offline");
      }
    };

    const unsubRt = realtimeService.onStatusChange((rtStatus) => {
      updateCombinedState(rtStatus);
    });

    const handleOnline = () => {
      realtimeService.connect(localStorage.getItem("role") || "citizen");
      updateCombinedState();
    };
    const handleOffline = () => {
      setNetworkState("offline");
      setPendingCount(0);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    const timer = setInterval(() => updateCombinedState(), 8000);
    updateCombinedState();

    return () => {
      unsubRt();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(timer);
    };
  }, []);

  const config: Record<NetworkState, { emoji: string; label: string; bg: string; color: string; border: string }> = {
    online_live: { emoji: "🟢", label: `${t("network.online")} • Live`, bg: "#ecfdf5", color: "#15803d", border: "#a7f3d0" },
    online_polling: { emoji: "🔵", label: `${t("network.online")} • Polling`, bg: "#f0f9ff", color: "#0369a1", border: "#bae6fd" },
    syncing: { emoji: "🟠", label: t("network.syncing", { count: pendingCount }), bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
    reconnecting: { emoji: "🟡", label: "Reconnecting...", bg: "#fefce8", color: "#ca8a04", border: "#fef08a" },
    offline: { emoji: "🔴", label: t("network.offline"), bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  };
  const { emoji, label, bg, color, border } = config[networkState];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Network status: ${label}`}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "3px 10px", borderRadius: 20,
        background: bg, border: `1px solid ${border}`,
        fontSize: "0.72rem", fontWeight: 700, color,
        letterSpacing: "0.03em", userSelect: "none", flexShrink: 0,
      }}
    >
      <span aria-hidden="true">{emoji}</span>
      <span className="network-status-label">{label}</span>
    </div>
  );
}
