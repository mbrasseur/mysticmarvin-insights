import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, maxWidth: 600, margin: '0 auto' }}>
          <div className="alert alert-red" style={{ marginBottom: 16, alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Something went wrong</div>
              <div style={{ fontWeight: 400, fontSize: 11, fontFamily: 'var(--mono)' }}>
                {this.state.error.message}
              </div>
            </div>
          </div>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              padding: '7px 16px', borderRadius: 'var(--radius)', border: 'none',
              background: 'var(--navy)', color: '#fff', fontSize: 13, fontWeight: 600,
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
