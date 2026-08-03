import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, ArrowRight } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in UI rendering:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background-primary flex items-center justify-center p-6 font-sans transition-colors duration-300">
          <div className="max-w-md w-full bg-surface-card border border-border-default rounded-2xl p-8 shadow-modal text-center">
            <div className="w-16 h-16 bg-status-error/10 border border-status-error/25 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={28} className="text-status-error" />
            </div>
            <h1 className="text-xl font-bold text-text-primary mb-3">Application Render Crash</h1>
            <p className="text-sm text-text-secondary mb-6">
              A critical rendering error occurred in the user interface. Our engineering telemetry
              has logged this event.
            </p>
            {this.state.error && (
              <div className="bg-background-secondary border border-border-default rounded-lg p-3 text-left mb-6 overflow-auto max-h-32">
                <code className="text-xs text-status-error block break-all whitespace-pre-wrap font-mono">
                  {this.state.error.toString()}
                </code>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-4 bg-accent-primary hover:bg-accent-hover active:bg-accent-pressed text-white font-medium rounded-lg text-sm transition-all duration-200 ease-enter shadow-card hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40"
              >
                <RotateCcw size={14} />
                Reload Tab
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-4 bg-background-secondary hover:bg-surface-elevated border border-border-default hover:border-border-strong text-text-primary font-medium rounded-lg text-sm transition-all duration-200 ease-enter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30"
              >
                <ArrowRight size={14} />
                Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
