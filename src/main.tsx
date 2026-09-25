import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

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

