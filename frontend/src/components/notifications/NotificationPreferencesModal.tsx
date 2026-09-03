/**
 * GRAM-X Notification Preferences Modal
 * Enables citizens and administrators to toggle email and in-app alert subscriptions.
 */

import React, { useState, useEffect } from 'react';
import { X, Bell, Mail, ShieldCheck, Check } from 'lucide-react';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from '../../services/notificationService';
import { Button } from '../ui/Button';

export interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPreferencesModal = ({
  isOpen,
  onClose,
}: NotificationPreferencesModalProps) => {
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    user_id: '',
    email_enabled: true,
    in_app_enabled: true,
    status_updates: true,
    assignments: true,
    escalation_updates: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getNotificationPreferences().then((p) => setPrefs(p));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateNotificationPreferences(prefs);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
    } catch {
      alert('Failed to save preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white">Notification Preferences</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-sky-400" />
              <div>
                <p className="font-bold text-white">Email Notifications (Resend)</p>
                <p className="text-[10px] text-slate-400">Receive grievance milestone updates in your inbox.</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.email_enabled}
              onChange={() => handleToggle('email_enabled')}
              className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="font-bold text-white">In-App Live Alerts</p>
                <p className="text-[10px] text-slate-400">Display unread badge counters in the top navigation bar.</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.in_app_enabled}
              onChange={() => handleToggle('in_app_enabled')}
              className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <div>
                <p className="font-bold text-white">Status &amp; Verification Alerts</p>
                <p className="text-[10px] text-slate-400">Alert when your complaint is verified or marked in progress.</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.status_updates}
              onChange={() => handleToggle('status_updates')}
              className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
            {savedSuccess ? (
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Saved!
              </span>
            ) : (
              'Save Preferences'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferencesModal;
