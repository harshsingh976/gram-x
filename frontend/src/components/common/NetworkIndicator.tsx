/**
 * GRAM-X Network Status Indicator Banner
 * Renders non-intrusive alerts when network state transitions to Offline or Weak Connection.
 */

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { networkService, type NetworkStatusType } from '../../services/networkService';

export const NetworkIndicator = () => {
  const [status, setStatus] = useState<NetworkStatusType>('ONLINE');
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    let wasOffline = false;

    const unsubscribe = networkService.subscribe((newStatus) => {
      if (newStatus === 'OFFLINE' || newStatus === 'WEAK_CONNECTION') {
        wasOffline = true;
      } else if (newStatus === 'ONLINE' && wasOffline) {
        setShowRestored(true);
        const timer = setTimeout(() => setShowRestored(false), 4000);
        return () => clearTimeout(timer);
      }
      setStatus(newStatus);
    });

    return () => unsubscribe();
  }, []);

  if (status === 'OFFLINE') {
    return (
      <div className="bg-rose-950/90 border-b border-rose-500/40 text-rose-200 px-4 py-2 text-xs flex items-center justify-center gap-2 sticky top-0 z-50 backdrop-blur-sm animate-in slide-in-from-top">
        <WifiOff className="w-4 h-4 text-rose-400 animate-pulse" />
        <span className="font-semibold">You are currently offline.</span>
        <span className="text-[11px] text-rose-300/80">
          Forms will save drafts locally on your device until signal is restored.
        </span>
      </div>
    );
  }

  if (status === 'WEAK_CONNECTION') {
    return (
      <div className="bg-amber-950/80 border-b border-amber-500/40 text-amber-200 px-4 py-1.5 text-xs flex items-center justify-center gap-2 sticky top-0 z-50 backdrop-blur-sm">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        <span>Weak network signal detected. Low-bandwidth optimization is active.</span>
      </div>
    );
  }

  if (showRestored) {
    return (
      <div className="bg-emerald-950/90 border-b border-emerald-500/40 text-emerald-200 px-4 py-2 text-xs flex items-center justify-center gap-2 sticky top-0 z-50 backdrop-blur-sm animate-in slide-in-from-top">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <span className="font-semibold">Connection restored. You are back online!</span>
      </div>
    );
  }

  return null;
};

export default NetworkIndicator;
