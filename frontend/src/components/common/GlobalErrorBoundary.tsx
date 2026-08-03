import { Component, type ErrorInfo, type ReactNode } from 'react';

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
        <div className="min-h-screen bg-background-primary flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-surface-card border border-border-default rounded-xl p-8 shadow-modal text-center">
            <div className="w-16 h-16 bg-status-error/10 border border-status-error rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl text-status-error">⚠</span>
            </div>
            <h1 className="text-xl font-bold text-text-primary mb-3">Application Render Crash</h1>
            <p className="text-sm text-text-muted mb-6">
              A critical rendering error occurred in the user interface. Our engineering telemetry
              has logged this event.
            </p>
            {this.state.error && (
              <div className="bg-surface-elevated border border-border-default rounded-lg p-3 text-left mb-6 overflow-auto max-h-32">
                <code className="text-xs text-status-error block break-all whitespace-pre-wrap">
                  {this.state.error.toString()}
                </code>
              </div>
            )}
            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2 px-4 bg-accent-primary hover:bg-accent-hover active:bg-accent-pressed text-white font-semibold rounded-lg text-sm transition-all duration-200"
              >
                Reload Tab
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 py-2 px-4 bg-surface-elevated hover:bg-surface-hover border border-border-default text-text-secondary font-semibold rounded-lg text-sm transition-all duration-200"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
