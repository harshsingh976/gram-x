import React, { useState, useEffect, useCallback } from "react";
import { Bell, X, CheckCircle2, AlertTriangle, Clock, ArrowRight, Info, CheckCircle, Zap, Shield } from "lucide-react";
import * as api from "../api";
import { useLanguage } from "../i18n";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
  incidents: any[];
}

type FilterType = "all" | "urgent" | "tasks";

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  critical:    { icon: <AlertTriangle size={14} />, color: "#ef4444",  label: "CRITICAL" },
  sla_breach:  { icon: <Zap size={14} />,           color: "#dc2626",  label: "SLA" },
  urgent:      { icon: <AlertTriangle size={14} />, color: "#f97316",  label: "URGENT" },
  warning:     { icon: <AlertTriangle size={14} />, color: "#f59e0b",  label: "WARNING" },
  task:        { icon: <CheckCircle size={14} />,   color: "#6366f1",  label: "TASK" },
  approval:    { icon: <Shield size={14} />,         color: "#8b5cf6",  label: "APPROVAL" },
  success:     { icon: <CheckCircle2 size={14} />,  color: "#10b981",  label: "SUCCESS" },
  system:      { icon: <Info size={14} />,           color: "#64748b",  label: "SYSTEM" },
  info:        { icon: <Info size={14} />,           color: "#0ea5e9",  label: "INFO" },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] || TYPE_CONFIG["info"];
}

function formatRelativeTime(ts: string): string {
  if (!ts) return "";
  try {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch { return ""; }
}

export function NotificationCenter({ isOpen, onClose, onNavigateTab, incidents }: NotificationCenterProps) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<FilterType>("all");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      // Fallback: derive from active incidents
      const derived = incidents
        .filter(i => i.status !== "resolved" && i.status !== "completed" && i.status !== "resolved_confirmed")
        .map(i => ({
          id: i.id,
          title: `Incident #${i.id}: ${i.title}`,
          message: `${i.category?.toUpperCase()} • Severity: ${i.severity?.toUpperCase()} • Priority: ${i.priority_score}`,
          type: i.severity === "critical" ? "critical" : "warning",
          created_at: i.created_at,
          read_at: null,
          action_link: "incidents",
        }));
      setNotifications(derived);
    } finally {
      setLoading(false);
    }
  }, [incidents]);

  // Load when opened
  useEffect(() => {
    if (isOpen) loadNotifications();
  }, [isOpen, loadNotifications]);

  // 30-second polling while panel is open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [isOpen, loadNotifications]);

  const handleMarkAllRead = async () => {
    try { await api.markAllNotificationsRead(); } catch {}
    setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
  };

  const handleMarkOneRead = async (notif: any) => {
    if (!notif.read_at && notif.id) {
      try { await api.markNotificationRead(notif.id); } catch {}
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n));
    }
  };

  const handleNotificationClick = async (notif: any) => {
    await handleMarkOneRead(notif);
    onClose();
    onNavigateTab(notif.action_link || "incidents");
  };

  if (!isOpen) return null;

  const filteredList = notifications.filter(n => {
    if (filter === "urgent") return ["critical", "sla_breach", "urgent"].includes(n.type);
    if (filter === "tasks") return ["task", "approval"].includes(n.type);
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <div
      className="notify-drawer-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("notifications.title")}
    >
      <div className="notify-drawer" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Bell size={16} color="#0c1e36" />
            <h3 style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.875rem", margin: 0 }}>{t("notifications.title")}</h3>
            {unreadCount > 0 && (
              <span style={{
                background: "#ef4444", color: "#fff", fontSize: "0.6rem",
                fontWeight: 700, padding: "1px 6px", borderRadius: "99px",
                minWidth: "18px", textAlign: "center",
              }}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          <button onClick={onClose} aria-label="Close notifications" style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "4px", color: "#64748b" }}>
            <X size={16} />
          </button>
        </div>

        {/* ── Filters + Mark-All-Read ── */}
        <div style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            {(["all", "urgent", "tasks"] as FilterType[]).map(f => {
              const labels: Record<FilterType, string> = {
                all: t("notifications.filter.all"),
                urgent: t("notifications.filter.urgent"),
                tasks: t("notifications.filter.tasks"),
              };
              const activeColors: Record<FilterType, string> = { all: "#0c1e36", urgent: "#dc2626", tasks: "#6366f1" };
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "3px 10px",
                    fontSize: "0.7rem",
                    borderRadius: "99px",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    background: filter === f ? activeColors[f] : "#f1f5f9",
                    color: filter === f ? "#fff" : "#64748b",
                    transition: "all 0.15s",
                  }}
                >
                  {labels[f]}
                </button>
              );
            })}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              style={{ fontSize: "0.7rem", fontWeight: 700, color: "#0ea5e9", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              {t("notifications.mark_all_read")}
            </button>
          )}
        </div>

        {/* ── Notification List ── */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: "0.8rem" }}>
              <div style={{ marginBottom: "8px", fontSize: "1.5rem" }}>🔔</div>
              {t("notifications.loading")}
            </div>
          ) : filteredList.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center" }}>
              <CheckCircle2 size={32} color="#10b981" style={{ margin: "0 auto 10px", opacity: 0.5 }} />
              <p style={{ fontWeight: 700, color: "#334155", fontSize: "0.875rem", margin: "0 0 4px" }}>{t("notifications.empty")}</p>
              <p style={{ color: "#94a3b8", fontSize: "0.75rem", margin: 0 }}>{t("notifications.empty_sub")}</p>
            </div>
          ) : (
            filteredList.map(item => {
              const isUnread = !item.read_at;
              const cfg = getTypeConfig(item.type);
              return (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`notify-item ${isUnread ? "unread" : ""}`}
                  style={{ cursor: "pointer" }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === " ") handleNotificationClick(item); }}
                  aria-label={`${isUnread ? "Unread: " : ""}${item.title}`}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    {/* Type indicator */}
                    <div style={{
                      width: "28px", height: "28px", borderRadius: "6px",
                      background: `${cfg.color}18`,
                      color: cfg.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginTop: "1px",
                    }}>
                      {cfg.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Title row */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.05em",
                          background: `${cfg.color}18`, color: cfg.color,
                          padding: "1px 5px", borderRadius: "4px",
                        }}>{cfg.label}</span>
                        {isUnread && (
                          <span style={{
                            width: "6px", height: "6px", borderRadius: "50%",
                            background: "#3b82f6", flexShrink: 0,
                          }} />
                        )}
                      </div>
                      <h4 style={{ fontSize: "0.78rem", fontWeight: 700, color: "#0f172a", margin: "3px 0 2px", lineHeight: 1.3 }}>
                        {item.title}
                      </h4>
                      <p style={{ fontSize: "0.7rem", color: "#64748b", margin: 0, lineHeight: 1.4 }}>
                        {item.message}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "6px" }}>
                        <span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>
                          {formatRelativeTime(item.created_at)}
                        </span>
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#0ea5e9", display: "flex", alignItems: "center", gap: "2px" }}>
                          {t("notifications.view_details")} <ArrowRight size={10} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: "10px 16px", borderTop: "1px solid #f1f5f9", textAlign: "center" }}>
          <p style={{ fontSize: "0.65rem", color: "#94a3b8", margin: 0 }}>
            {unreadCount > 0 ? `${unreadCount} ${t("notifications.unread")}` : t("notifications.empty")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default NotificationCenter;
