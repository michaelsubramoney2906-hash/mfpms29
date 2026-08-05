const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf8');

const errorBoundary = `
import React from 'react';
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', background: '#fee' }}>
          <h1>Something went wrong.</h1>
          <pre id="react-error-boundary-msg">{this.state.error.message}</pre>
          <pre>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
`;

code = errorBoundary + code.replace('<App />', '<ErrorBoundary><App /></ErrorBoundary>');
fs.writeFileSync('src/main.tsx', code);
