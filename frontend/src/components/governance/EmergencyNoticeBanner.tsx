/**
 * GRAM-X Disaster & Emergency Notice Banner
 * High-visibility banner displayed when an emergency notice or disaster mode is activated.
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { isFeatureEnabled } from '../../services/featureFlags';
import { getActivePublicNotices, type PublicNoticeItem } from '../../services/directoryService';

export const EmergencyNoticeBanner = () => {
  const [emergencyNotice, setEmergencyNotice] = useState<PublicNoticeItem | null>(null);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    isFeatureEnabled('EMERGENCY_MODE').then((enabled) => setIsEmergencyMode(enabled));
    getActivePublicNotices().then((notices) => {
      const emergency = notices.find((n) => n.is_emergency);
      if (emergency) setEmergencyNotice(emergency);
    });
  }, []);

  if (dismissed || (!isEmergencyMode && !emergencyNotice)) return null;

  return (
    <div className="bg-rose-950 border-b border-rose-500/50 text-rose-100 px-4 py-2.5 text-xs flex items-center justify-between sticky top-0 z-50 backdrop-blur-md animate-in slide-in-from-top">
      <div className="flex items-center gap-2 max-w-4xl mx-auto">
        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
        <div>
          <span className="font-bold text-rose-200">
            {isEmergencyMode ? 'EMERGENCY DISASTER MODE ACTIVE: ' : 'CIVIC ALERT: '}
          </span>
          <span>
            {emergencyNotice?.description ||
              'High-priority rural remediation mode is currently enforced by Panchayat Administration.'}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-rose-300 hover:text-white p-1 rounded-lg hover:bg-rose-900 transition-colors cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default EmergencyNoticeBanner;
