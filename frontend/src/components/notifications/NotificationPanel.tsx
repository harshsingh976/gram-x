/**
 * GRAM-X Central Notification Panel
 * Interactive dropdown displaying categorized alerts, read toggles, and click-to-view navigation.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  CheckCheck,
  Clock,
  AlertOctagon,
  Wrench,
  CheckCircle2,
  FileText,
  ExternalLink,
  Settings,
} from 'lucide-react';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllAsRead,
  type NotificationItem,
} from '../../services/notificationService';
import { NotificationPreferencesModal } from './NotificationPreferencesModal';

export interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGrievance?: (grievanceId: string | number) => void;
}

export const NotificationPanel = ({
  isOpen,
  onClose,
  onSelectGrievance,
}: NotificationPanelProps) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPrefOpen, setIsPrefOpen] = useState<boolean>(false);

  const loadNotifs = async () => {
    setIsLoading(true);
    try {
      const data = await getUserNotifications();
      setNotifications(data);
    } catch {} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadNotifs();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkAll = async () => {
    await markAllAsRead();
    loadNotifs();
  };

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.read_at) {
      await markNotificationAsRead(notif.id);
    }
    if (notif.grievance_id && onSelectGrievance) {
      onSelectGrievance(notif.grievance_id);
    }
  };

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.read_at;
    return true;
  });

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'GRIEVANCE_RESOLVED':
      case 'GRIEVANCE_CLOSED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'GRIEVANCE_ESCALATED':
      case 'DEADLINE_MISSED':
        return <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'GRIEVANCE_ASSIGNED':
      case 'GRIEVANCE_STATUS_CHANGED':
        return <Wrench className="w-4 h-4 text-sky-400 shrink-0" />;
      default:
        return <FileText className="w-4 h-4 text-indigo-400 shrink-0" />;
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
        {/* Header */}
        <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold text-white">Notifications</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPrefOpen(true)}
              title="Notification Settings"
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleMarkAll}
              title="Mark all as read"
              className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 hover:underline px-1.5 py-0.5"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-3.5 py-2 bg-slate-900/90 border-b border-slate-800/80 flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
              filter === 'ALL'
                ? 'bg-sky-950 text-sky-300 border border-sky-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('UNREAD')}
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
              filter === 'UNREAD'
                ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Unread ({notifications.filter((n) => !n.read_at).length})
          </button>
        </div>

        {/* List Content */}
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading alerts...</div>
          ) : filteredNotifs.length === 0 ? (
            <div className="p-8 text-center space-y-1">
              <Bell className="w-6 h-6 text-slate-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-300">No notifications</p>
              <p className="text-[11px] text-slate-500">You're all caught up with your updates.</p>
            </div>
          ) : (
            filteredNotifs.map((notif) => {
              const isUnread = !notif.read_at;
              return (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3 transition-colors cursor-pointer flex items-start gap-2.5 hover:bg-slate-800/80 ${
                    isUnread ? 'bg-slate-800/40' : ''
                  }`}
                >
                  <div className="pt-0.5">{getNotifIcon(notif.type)}</div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className={`text-xs font-bold leading-tight ${isUnread ? 'text-white' : 'text-slate-300'}`}>
                        {notif.title}
                      </h4>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono block pt-0.5">
                      {new Date(notif.created_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <NotificationPreferencesModal
        isOpen={isPrefOpen}
        onClose={() => setIsPrefOpen(false)}
      />
    </>
  );
};

export default NotificationPanel;
