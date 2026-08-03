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
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#1E293B] border border-[#334155] rounded-xl p-8 shadow-xl text-center">
            <div className="w-16 h-16 bg-red-950/50 border border-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl text-red-500">⚠</span>
            </div>
            <h1 className="text-xl font-bold text-[#F8FAFC] mb-3">Application Render Crash</h1>
            <p className="text-sm text-[#CBD5E1] mb-6">
              A critical rendering error occurred in the user interface. Our engineering telemetry
              has logged this event.
            </p>
            {this.state.error && (
              <div className="bg-[#111827] border border-[#334155] rounded-lg p-3 text-left mb-6 overflow-auto max-h-32">
                <code className="text-xs text-red-400 block break-all whitespace-pre-wrap">
                  {this.state.error.toString()}
                </code>
              </div>
            )}
            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2 px-4 bg-[#3B82F6] hover:bg-[#2563EB] active:bg-[#1D4ED8] text-white font-semibold rounded-lg text-sm transition-all duration-200"
              >
                Reload Tab
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 py-2 px-4 bg-[#243244] hover:bg-[#334155] border border-[#334155] text-[#CBD5E1] font-semibold rounded-lg text-sm transition-all duration-200"
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
