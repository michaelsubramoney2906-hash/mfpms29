import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Suppress known Vite HMR WebSocket errors in AI Studio iframe proxy
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (e) => {
    const msg = e.reason?.message || String(e.reason || '');
    const stack = e.reason?.stack || '';
    if (msg.includes('WebSocket') || stack.includes('@vite/client') || msg.includes('vite:ws')) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);
}

import App from './App.tsx';
import './index.css';
import { installResilientNetworkInterceptor } from './utils/resilientFetch';

// Initialize zero-kickout resilient network & fetch interceptor (Layer 3: Network Resilience)
installResilientNetworkInterceptor();

// Prevent cross-origin stylesheet security errors when inspecting document.styleSheets
if (typeof window !== 'undefined' && 'CSSStyleSheet' in window) {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(CSSStyleSheet.prototype, 'cssRules');
    if (descriptor && descriptor.get) {
      const originalGet = descriptor.get;
      Object.defineProperty(CSSStyleSheet.prototype, 'cssRules', {
        get() {
          try {
            return originalGet.call(this);
          } catch {
            return [] as unknown as CSSRuleList;
          }
        },
        configurable: true,
        enumerable: true,
      });
    }
  } catch {
    // Ignore environments where CSSStyleSheet cannot be redefined
  }

  try {
    const rulesDesc = Object.getOwnPropertyDescriptor(CSSStyleSheet.prototype, 'rules');
    if (rulesDesc && rulesDesc.get) {
      const originalRulesGet = rulesDesc.get;
      Object.defineProperty(CSSStyleSheet.prototype, 'rules', {
        get() {
          try {
            return originalRulesGet.call(this);
          } catch {
            return [] as unknown as CSSRuleList;
          }
        },
        configurable: true,
        enumerable: true,
      });
    }
  } catch {
    // Ignore
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

