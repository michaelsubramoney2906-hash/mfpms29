import React, { useState, useEffect } from 'react';
import { subscribeNetworkStatus } from '../utils/resilientFetch';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

export function NetworkResilienceToast() {
  const [status, setStatus] = useState<{ isReconnecting: boolean; message?: string }>({
    isReconnecting: false,
    message: ''
  });
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    let timeout: any;
    const unsubscribe = subscribeNetworkStatus((newStatus) => {
      if (!newStatus.isReconnecting && status.isReconnecting) {
        setShowResolved(true);
        timeout = setTimeout(() => setShowResolved(false), 3000);
      }
      setStatus(newStatus);
    });

    const handleOnline = () => {
      setShowResolved(true);
      setTimeout(() => setShowResolved(false), 3000);
    };

    const handleOffline = () => {
      setStatus({
        isReconnecting: true,
        message: 'Network offline. Your session is preserved; reconnecting...'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timeout) clearTimeout(timeout);
    };
  }, [status.isReconnecting]);

  if (!status.isReconnecting && !showResolved) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-3">
      {status.isReconnecting ? (
        <div className="flex items-center gap-3 bg-amber-950/90 border border-amber-600/40 text-amber-200 px-4 py-2.5 rounded-lg shadow-xl backdrop-blur-md text-xs font-medium max-w-md">
          <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
          <div className="flex flex-col">
            <span className="font-semibold text-amber-300">Syncing with server...</span>
            <span className="text-amber-200/80 text-[11px]">{status.message || "Your session is preserved; retrying seamlessly."}</span>
          </div>
        </div>
      ) : showResolved ? (
        <div className="flex items-center gap-3 bg-emerald-950/90 border border-emerald-600/40 text-emerald-200 px-4 py-2.5 rounded-lg shadow-xl backdrop-blur-md text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Connection active & in sync</span>
        </div>
      ) : null}
    </div>
  );
}
