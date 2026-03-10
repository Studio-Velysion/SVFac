import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '2rem',
            maxWidth: '600px',
            margin: '2rem auto',
            background: 'var(--color-card-bg)',
            border: '1px solid var(--color-danger)',
            borderRadius: '12px',
            color: 'var(--color-text-primary)',
          }}
        >
          <h2 style={{ margin: '0 0 1rem', color: 'var(--color-danger)' }}>
            Une erreur s'est produite
          </h2>
          <p style={{ margin: '0 0 0.5rem' }}>
            {this.state.error?.message || 'Erreur inconnue'}
          </p>
          <pre
            style={{
              margin: '1rem 0 0',
              padding: '1rem',
              background: 'var(--color-bg-dark)',
              borderRadius: '8px',
              fontSize: '0.8rem',
              overflow: 'auto',
            }}
          >
            {this.state.error?.stack}
          </pre>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
