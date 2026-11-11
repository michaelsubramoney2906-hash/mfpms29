import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Trash2, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Mzansi Flow PMS System:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleClearStorageAndReset = () => {
    try {
      localStorage.removeItem('currentUser');
      sessionStorage.removeItem('currentUser');
      localStorage.removeItem('originalAdminUser');
      sessionStorage.removeItem('originalAdminUser');
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 select-none font-sans">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-amber-500 to-emerald-600" />
            
            <div className="inline-flex p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl mb-6">
              <ShieldAlert className="w-10 h-10" />
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white mb-2">
              Mzansi Flow PMS System Recovery
            </h1>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              An unexpected display issue occurred in the active view session. Your data and database records remain 100% safe and unaffected.
            </p>

            {this.state.error && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-left font-mono text-xs text-rose-300 mb-6 max-h-32 overflow-y-auto break-all">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-5 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                onClick={this.handleClearStorageAndReset}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 px-5 rounded-xl transition flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-amber-400" />
                <span>Reset Local Session</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
