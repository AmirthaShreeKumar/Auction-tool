import React from 'react';

/**
 * Catches render errors anywhere in the subtree and shows a recovery screen
 * instead of blanking the entire app.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unknown error' };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0c1220',
        color: '#ddeabf',
        fontFamily: 'system-ui, sans-serif',
        padding: '40px',
        textAlign: 'center',
        gap: '16px',
      }}>
        <div style={{ fontSize: 48 }}>🏸</div>
        <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 'normal', fontSize: 24, margin: 0 }}>
          Something went wrong
        </h2>
        <p style={{ color: '#6e8358', fontSize: 14, maxWidth: 400 }}>
          {this.state.message}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 8,
            padding: '10px 24px',
            background: '#d4fc34',
            color: '#0c1220',
            border: 'none',
            borderRadius: 4,
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Reload page
        </button>
      </div>
    );
  }
}
