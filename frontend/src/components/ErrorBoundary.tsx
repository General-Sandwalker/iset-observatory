import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, maxWidth: 900, margin: '0 auto', fontFamily: 'monospace' }}>
          <h1 style={{ color: '#dc2626', fontSize: 22 }}>Runtime Error</h1>
          <pre style={{ background: '#fef2f2', padding: 16, borderRadius: 8, overflow: 'auto', fontSize: 13, color: '#991b1b', whiteSpace: 'pre-wrap' }}>
            {this.state.error?.toString()}
          </pre>
          <h2 style={{ fontSize: 16, marginTop: 24 }}>Component Stack</h2>
          <pre style={{ background: '#f8fafc', padding: 16, borderRadius: 8, overflow: 'auto', fontSize: 12, color: '#334155', whiteSpace: 'pre-wrap' }}>
            {this.state.errorInfo?.componentStack}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{ marginTop: 16, padding: '8px 20px', borderRadius: 6, border: '1px solid #d1d5db', cursor: 'pointer', fontSize: 14 }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
