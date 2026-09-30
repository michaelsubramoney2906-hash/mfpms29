import React, { useEffect, useState } from 'react';
import { ShieldAlert, AlertTriangle, EyeOff } from 'lucide-react';
import { isUserUnrestricted, isCopyAllowed, shouldHideWatermark } from '../utils/unrestrictedHelper';

interface SecurityShieldProps {
  user: {
    email: string;
    role?: string;
    systemRole?: string;
    jobFunction?: string;
    tenantId?: string;
  };
  children: React.ReactNode;
}

export function SecurityShield({ user, children }: SecurityShieldProps) {
  const [isBlurred, setIsBlurred] = useState(false);
  const [clientIp, setClientIp] = useState('127.0.0.1');
  const [showWarning, setShowWarning] = useState(false);
  const [warningCount, setWarningCount] = useState(0);

  const unrestricted = isUserUnrestricted(user);
  const copyAllowed = isCopyAllowed(user);
  const hideWatermark = shouldHideWatermark(user);

  useEffect(() => {
    if (unrestricted) return;

    // 1. Fetch visitor IP to populate watermark
    fetch('/api/auth/client-ip')
      .then(res => res.ok ? res.json() : ({} as any))
      .then((data: any) => {
        if (data && data.ip) {
          setClientIp(data.ip);
        }
      })
      .catch(() => {});

    // 2. Prevent right-click context menu (only for restricted users)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setIsBlurred(true);
      setTimeout(() => setIsBlurred(false), 800);
    };
    document.addEventListener('contextmenu', handleContextMenu);

    // 3. Prevent copying, cutting of page content only if copy is NOT allowed
    const handleCopyCut = (e: ClipboardEvent) => {
      if (copyAllowed) return;
      e.preventDefault();
      alert("Nkangala Municipal Guard: Copying sensitive compliance content is restricted.");
    };
    if (!copyAllowed) {
      document.addEventListener('copy', handleCopyCut);
      document.addEventListener('cut', handleCopyCut);
    }

    // 4. Handle Escape and click on warning
    const handleKeyDown = (e: KeyboardEvent) => {
      // Intercept key combinations for Printing or saving: Ctrl+P, Cmd+P, Ctrl+S, Cmd+S, Ctrl+Shift+I, F12
      if (
        (e.ctrlKey && e.key === 'p') || 
        (e.metaKey && e.key === 'p') ||
        (e.ctrlKey && e.key === 's') ||
        (e.metaKey && e.key === 's') ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.metaKey && e.altKey && e.key === 'i')
      ) {
        e.preventDefault();
        setShowWarning(true);
        setWarningCount(c => c + 1);
        return false;
      }

      // Check for PrintScreen button press (on older keyboards or browsers recognizing it)
      if (e.key === 'PrintScreen' || e.key === 'Snapshot') {
        e.preventDefault();
        if (!copyAllowed) {
          navigator.clipboard?.writeText?.("prohibited");
        }
        setShowWarning(true);
        setWarningCount(c => c + 1);
        setIsBlurred(true);
        setTimeout(() => setIsBlurred(false), 2000);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // 5. Detect when page is hidden (switched to another tab)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
      } else {
        setIsBlurred(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      if (!copyAllowed) {
        document.removeEventListener('copy', handleCopyCut);
        document.removeEventListener('cut', handleCopyCut);
      }
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [unrestricted, copyAllowed]);

  if (unrestricted) {
    return <>{children}</>;
  }

  // Watermark text
  const watermarkText = `${user.email} | CLASSIFIED | IP: ${clientIp} | SECURE ARCHIVE`;

  return (
    <div id="security-canvas-container" className="relative min-h-screen selection:bg-emerald-600 selection:text-white">
      {/* 1. Print Media Query Injection */}
      <style>{`
        @media print {
          body {
            display: none !important;
          }
          #security-canvas-container {
            display: none !important;
          }
          * {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `}</style>

      {/* 2. Transparent Tiled Security Watermark Grid (Hidden for @nkangaladm.gov.za and mzansiflow.co.za users) */}
      {!hideWatermark && (
        <div 
          id="bg-security-watermark-overlay" 
          className="pointer-events-none fixed inset-0 z-40 overflow-hidden opacity-[0.04] select-none flex flex-wrap justify-between gap-x-20 gap-y-16 p-8"
        >
          {Array.from({ length: 120 }).map((_, i) => (
            <span 
              key={i} 
              className="text-[11px] font-mono font-extrabold uppercase tracking-widest text-slate-800 transform -rotate-12 select-none"
            >
              {watermarkText}
            </span>
          ))}
        </div>
      )}

      {/* 3. Screen content container - supports focus blurs */}
      <div 
        className={`transition-all duration-300 ${isBlurred ? 'blur-[30px] saturate-50 select-none scale-[0.99] pointer-events-none' : ''}`}
      >
        {children}
      </div>

      {/* 4. Overlay for screen focus theft/blur warning */}
      {isBlurred && (
        <div className="fixed inset-0 z-50 bg-gray-950/20 backdrop-blur-md flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 border border-red-200/80 p-5 rounded-2xl shadow-2xl flex flex-col items-center gap-3 max-w-sm text-center animate-fade-in pointer-events-auto">
            <div className="p-3 bg-red-100 rounded-full text-red-600">
              <EyeOff className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Protected Workspace Hidden</h4>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                Mzansi Flow security policy obscuring live screen contents during system focal change or application defocusing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. Prohibited Key Shortcut Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl border border-red-250 shadow-2xl overflow-hidden animate-bounce-subtle p-6 flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-red-100 text-red-700 rounded-full animate-bounce">
              <ShieldAlert className="w-8 h-8" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-red-800 uppercase tracking-tight">Digital Guard Alert</h3>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Copying, printing, or capturing digital assets here are strictly prohibited. These action matrices protect confidential record structures from off-premises storage leaks.
              </p>
            </div>

            <div className="bg-red-50/80 border border-red-150/80 rounded-2xl p-4 w-full text-left space-y-2 text-xs text-red-800">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="font-bold">Compliance Incident Flagged:</span>
              </div>
              <ul className="space-y-1 list-disc list-inside font-mono text-[10px] text-red-700/90 leading-tight">
                <li>Operator ID: {user.email}</li>
                <li>Digital Node IP: {clientIp}</li>
                <li>Device OS Code: Captured</li>
                <li>Incident Violations: #{warningCount}</li>
              </ul>
            </div>

            <button 
              onClick={() => setShowWarning(false)}
              className="w-full bg-red-650 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg shadow-red-200/50"
            >
              Acknowledge & Sync Protocols
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
