
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

const DefaultFallback: React.FC<{ error?: Error }> = ({ error }) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-4">
    <h2 className="text-xl font-bold text-red-600 mb-2">Что-то пошло не так</h2>
    <p className="text-slate-700 mb-3">В этом разделе произошла ошибка. Попробуйте обновить страницу или вернуться позже.</p>
    {error && (
      <pre className="text-left text-xs bg-slate-100 text-slate-700 p-3 rounded-lg max-w-full overflow-auto mb-4">
        {error.message}
      </pre>
    )}
    <button
      onClick={() => window.location.reload()}
      className="mt-4 px-4 py-2 rounded-lg bg-emerald-500 text-white"
    >
      Перезагрузить
    </button>
  </div>
);

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in component:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <DefaultFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
