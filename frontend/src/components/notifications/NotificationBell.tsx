/**
 * GRAM-X Notification Bell Component
 * Header icon displaying live unread notification badge counter and opening the notification panel.
 */

import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { getUnreadCount } from '../../services/notificationService';
import { NotificationPanel } from './NotificationPanel';

export interface NotificationBellProps {
  onSelectGrievance?: (grievanceId: string | number) => void;
  className?: string;
}

export const NotificationBell = ({
  onSelectGrievance,
  className = '',
}: NotificationBellProps) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);

  const refreshCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch {}
  };

  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, 20000); // 20s polling
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        aria-label={`Notifications (${unreadCount} unread)`}
        className="relative p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 transition-colors cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white font-mono text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-slate-900 shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isPanelOpen && (
        <NotificationPanel
          isOpen={isPanelOpen}
          onClose={() => {
            setIsPanelOpen(false);
            refreshCount();
          }}
          onSelectGrievance={(id) => {
            setIsPanelOpen(false);
            refreshCount();
            if (onSelectGrievance) onSelectGrievance(id);
          }}
        />
      )}
    </div>
  );
};

export default NotificationBell;
