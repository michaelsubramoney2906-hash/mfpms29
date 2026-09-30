import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { isUserUnrestricted, isCopyAllowed, shouldHideWatermark } from '../utils/unrestrictedHelper';

interface DLPProps {
  user: User | null;
  children: React.ReactNode;
}

export function DataLossPreventionWrapper({ user, children }: DLPProps) {
  const [isBlurred, setIsBlurred] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Mouse tracking state for Focus Masking
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [secureLensActive, setSecureLensActive] = useState(false);

  const unrestricted = isUserUnrestricted(user);
  const copyAllowed = isCopyAllowed(user);
  const hideWatermark = shouldHideWatermark(user);

  // Check if current user is subject to DLP rules
  const dlpEnabled = (() => {
    if (!user || !user.email) return false;
    if (unrestricted) return false;
    const lowerEmail = user.email.trim().toLowerCase();
    
    // Explicit exclusions
    const excludedEmails = [
      'mike@mzansiflow.co.za',
      'qiniso@mzansiflow.co.za',
      'audrey@mzansiflow.co.za',
      'delphine@mzansiflow.co.za',
      'ryanw@mzansiflow.co.za',
      'bongani@mzansiflow.co.za',
      'bonganim@mzansiflow.co.za',
      'mike@massivedynamixdistributors.com'
    ];
    
    if (excludedEmails.includes(lowerEmail)) {
      return false;
    }

    // If copying is allowed and watermark is hidden, check if other DLP rules apply
    return lowerEmail.endsWith('@nkangaladm.gov.za') || lowerEmail.endsWith('@mzansiflow.co.za');
  })();

  // Track mouse coordinates for focus mask lens if active
  useEffect(() => {
    if (!dlpEnabled && !secureLensActive) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [dlpEnabled, secureLensActive]);

  // Keep watermark timestamp updated every second
  useEffect(() => {
    if (!dlpEnabled || hideWatermark) return;
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [dlpEnabled, hideWatermark]);

  // Block Page Printing & PDF Export, Clipboard management, and Key interceptors
  useEffect(() => {
    if (!dlpEnabled) return;

    // A. Inject print restriction CSS stylesheets dynamically
    const styleElement = document.createElement('style');
    styleElement.id = 'dlp-print-block-styles';
    styleElement.innerHTML = `
      @media print {
        html, body, #root, .min-h-screen {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          overflow: hidden !important;
          opacity: 0 !important;
        }
        body::after {
          content: "CONFIDENTIAL SYSTEM WORKSPACE. PRINTING IS STRICTLY PROHIBITED.";
          display: block !important;
          visibility: visible !important;
          position: fixed !important;
          top: 40% !important;
          left: 0 !important;
          width: 100% !important;
          text-align: center !important;
          font-size: 28px !important;
          font-weight: 900 !important;
          color: #ef4444 !important;
          font-family: sans-serif !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
        }
      }
    `;
    document.head.appendChild(styleElement);

    // B. Intercept manual window.print calls
    const originalPrint = window.print;
    window.print = () => {
      alert("Printing is disabled on this secure municipality workspace due to document protection rules.");
    };

    // C. Intercept and wipe Clipboard if copying is NOT allowed
    let clipboardInterval: any = null;
    const clearClipboard = async () => {
      if (copyAllowed) return;
      try {
        await navigator.clipboard.writeText(`SECURE WORKSPACE - COPY/PASTE IS RESTRICTED FOR ${user?.email}`);
      } catch (e) {
        // Silently fail if browser permissions restrict clip access
      }
    };

    const handleCopyEvent = (e: ClipboardEvent) => {
      if (copyAllowed) return; // Allow copying for @mzansiflow.co.za users
      e.preventDefault();
      clearClipboard();
    };

    if (!copyAllowed) {
      clipboardInterval = setInterval(clearClipboard, 3000);
      window.addEventListener('focus', clearClipboard);
      window.addEventListener('copy', handleCopyEvent);
    }

    // D. Intercept keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      
      // 1. Block PrintScreen / Fn + PrintScreen keycode 44 / key "PrintScreen"
      if (e.key === 'PrintScreen' || e.keyCode === 44 || e.code === 'PrintScreen') {
        e.preventDefault();
        e.stopPropagation();
        if (!copyAllowed) clearClipboard();
        alert("Screenshots and PrintScreen commands are prohibited on this secure municipality workspace.");
      }

      // 2. Block Ctrl+P / Cmd+P
      if ((e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === 'p') {
        e.preventDefault();
        e.stopPropagation();
        alert("Printing and PDF exporting are strictly restricted under municipal DLP guidelines.");
      }

      // 3. Block OS Snipping Tools (Win + Shift + S or Cmd + Shift + 4 / 3)
      if (
        (isMac && e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) ||
        (!isMac && e.metaKey && e.shiftKey && e.key?.toLowerCase() === 's') ||
        (e.ctrlKey && e.shiftKey && e.key?.toLowerCase() === 's')
      ) {
        e.preventDefault();
        e.stopPropagation();
        if (!copyAllowed) clearClipboard();
        alert("Snipping and active screen capturing tools are blocked.");
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      // Cleanup styles and window methods
      const style = document.getElementById('dlp-print-block-styles');
      if (style) style.remove();
      window.print = originalPrint;
      
      if (clipboardInterval) clearInterval(clipboardInterval);
      window.removeEventListener('focus', clearClipboard);
      window.removeEventListener('copy', handleCopyEvent);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [dlpEnabled, user, copyAllowed]);

  // Privacy Blur Screen on Tab Defocus / Mouse Exit
  useEffect(() => {
    if (!dlpEnabled) return;

    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);
    
    // Blur when mouse leaves the document boundaries (proactive Snipping defense)
    const handleMouseLeave = () => setIsBlurred(true);
    const handleMouseEnter = () => setIsBlurred(false);

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        setIsBlurred(true);
      } else {
        setIsBlurred(false);
      }
    });

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [dlpEnabled]);

  // If DLP is disabled for user, render standard children bypass
  if (!dlpEnabled) {
    return <>{children}</>;
  }

  // Format watermark string for standard low-opacity grid watermarks
  const watermarkText = `SECURE WORKSPACE • NKANGALA DISTRICT • ${user?.email} • CONFIDENTIAL SYSTEM • ${currentTime.toLocaleDateString()} ${currentTime.toLocaleTimeString()}`;

  // 1. Digital Forensic Stenographic Invisible Watermark String
  const forensicText = `${user?.email} • MUNICIPAL CONFIDENTIAL • SECURE LOG: [${currentTime.toISOString()}]`;
  const forensicGrid = Array.from({ length: 120 }).map((_, i) => (
    <span 
      key={i} 
      className="text-[4px] font-mono tracking-tighter select-none pointer-events-none text-slate-950/[0.003] dark:text-slate-50/[0.002] whitespace-nowrap p-1"
    >
      {forensicText}
    </span>
  ));

  // Generate standard dynamic watermarks repeating across the screen
  const watermarks = Array.from({ length: 48 }).map((_, i) => (
    <div 
      key={i} 
      className="text-[11px] font-black tracking-widest text-slate-500/8 uppercase whitespace-nowrap select-none origin-center transform -rotate-25 p-8"
      style={{
        textShadow: '0.5px 0.5px 0 rgba(255,255,255,0.03)'
      }}
    >
      {watermarkText}
    </div>
  ));

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      
      {/* Moire Effect Interrupter Mesh (if watermark is not hidden) */}
      {!hideWatermark && (
        <div 
          className="fixed inset-0 pointer-events-none z-[998] select-none"
          style={{
            background: 'repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.006) 0px, rgba(255, 255, 255, 0.006) 1px, transparent 1px, transparent 4px)',
            mixBlendMode: 'overlay'
          }}
        />
      )}

      {/* Digital Forensic Stenographic Background Grid (if watermark is not hidden) */}
      {!hideWatermark && (
        <div className="fixed inset-0 pointer-events-none z-[1] flex flex-wrap justify-center overflow-hidden leading-none select-none">
          {forensicGrid}
        </div>
      )}

      {/* Privacy Blur Overlay Screen */}
      {isBlurred && (
        <div className="fixed inset-0 bg-slate-950/90 z-[9999] flex flex-col items-center justify-center text-center p-8 backdrop-blur-2xl transition-all duration-300">
          <div className="bg-red-950/20 border border-red-500/30 px-8 py-10 rounded-2xl max-w-md shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
              <span className="text-red-500 text-3xl font-black">🔒</span>
            </div>
            <h3 className="text-white font-black text-xl uppercase tracking-wider mb-3">Workspace Restricted</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 font-medium">
              System access is protected. Bring the tab back to active focus to resume secure operations.
            </p>
            <div className="text-[10px] text-red-400/80 uppercase font-black tracking-widest bg-red-950/40 px-3 py-1 rounded border border-red-900/30">
              Municipal Data Protection (DLP) Enabled
            </div>
          </div>
        </div>
      )}

      {/* 3. Restricted Viewport (Focus Masking Lens) centered at user's cursor */}
      {secureLensActive && (
        <div 
          className="fixed inset-0 pointer-events-none z-[997] select-none transition-all duration-75"
          style={{
            background: `radial-gradient(circle 200px at ${mousePos.x}px ${mousePos.y}px, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 80%, rgba(3,7,18,0.96) 100%)`
          }}
        />
      )}

      {/* Main content body with conditional blur state */}
      <div 
        className={`w-full min-h-screen flex flex-col transition-all duration-300 ${
          isBlurred ? 'filter blur-3xl scale-98 pointer-events-none' : ''
        }`}
      >
        {children}
      </div>

      {/* Dynamic Transparent Watermarking overlay (if watermark is not hidden) */}
      {!hideWatermark && (
        <div className="fixed inset-0 pointer-events-none z-[996] overflow-hidden flex flex-wrap justify-center items-center content-center gap-12 select-none">
          {watermarks}
        </div>
      )}

      {/* Note: Arrow / floating watermark following cursor with username is removed for all users */}

      {/* Focus Mask Lens Toggle (Fixed control on bottom right) */}
      <div className="fixed bottom-4 right-4 z-[99999] flex items-center gap-2">
        <button
          onClick={() => setSecureLensActive(!secureLensActive)}
          className={`flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-xl border cursor-pointer transition-all duration-200 ${
            secureLensActive 
              ? 'bg-red-600 border-red-500 text-white animate-pulse' 
              : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
          }`}
        >
          <span>👁️</span>
          <span>{secureLensActive ? 'Disable Secure Focus Lens' : 'Enable Secure Focus Lens'}</span>
        </button>
      </div>
    </div>
  );
}
