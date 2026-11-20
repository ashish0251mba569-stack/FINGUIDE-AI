import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected error occurred.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('FinGuide AI ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl p-8 space-y-4">
            <h1 className="font-display text-xl font-bold text-[#0F2942]">
              Something went wrong
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              We ran into an unexpected application or database issue. Your financial data stays safe—please reload the page to continue.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-700 break-words">
              {this.state.message}
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0F2942] hover:bg-[#163A5F] rounded-lg transition-colors cursor-pointer"
            >
              Reload FinGuide AI
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
