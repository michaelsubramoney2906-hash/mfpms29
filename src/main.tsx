import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Prevent non-JSON (e.g. transient proxy HTML or empty body) responses from throwing SyntaxError in JSON.parse
if (typeof window !== 'undefined' && typeof Response !== 'undefined') {
  const originalJson = Response.prototype.json;
  Response.prototype.json = async function () {
    const text = await this.text();
    const trimmed = text ? text.trim() : '';
    const url = this.url || '';
    const isArrayEndpoint =
      url.includes('/municipalities') ||
      url.endsWith('/users') ||
      url.includes('/users?') ||
      url.includes('/azure-search') ||
      url.includes('/tickets');

    if (!trimmed || trimmed.startsWith('<')) {
      return isArrayEndpoint ? [] : {};
    }
    try {
      return JSON.parse(trimmed);
    } catch {
      return isArrayEndpoint ? [] : {};
    }
  };
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);


