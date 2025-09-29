import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Check if it's a font-related error
    const isFontError = error.message && (
      error.message.includes('font') ||
      error.message.includes('CFF') ||
      error.message.includes('OTS parsing error') ||
      error.message.includes('Invalid font data')
    );
    
    if (isFontError) {
      console.warn('Font-related error detected, applying fallback fonts');
      document.body.classList.add('font-fallback');
      document.documentElement.style.setProperty(
        '--font-family-primary', 
        'system-ui, -apple-system, Roboto, sans-serif'
      );
    }
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Apply emergency font fix immediately
      document.body.style.fontFamily = 'system-ui, -apple-system, Roboto, Arial, sans-serif';
      
      // Fallback UI with safe fonts
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'system-ui, -apple-system, Roboto, Arial, sans-serif',
          visibility: 'visible'
        }}>
          <h2 style={{ 
            color: '#dc3545', 
            marginBottom: '20px',
            fontFamily: 'system-ui, -apple-system, Roboto, Arial, sans-serif'
          }}>
            Something went wrong
          </h2>
          <p style={{ 
            marginBottom: '20px', 
            color: '#6c757d',
            fontFamily: 'system-ui, -apple-system, Roboto, Arial, sans-serif'
          }}>
            The application encountered an error. This might be due to browser compatibility issues.
          </p>
          <button 
            onClick={() => {
              // Clear any font-related storage before reload
              try {
                localStorage.removeItem('fontCache');
                sessionStorage.clear();
              } catch (e) {}
              window.location.reload();
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontFamily: 'system-ui, -apple-system, Roboto, Arial, sans-serif'
            }}
          >
            Reload Page
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '20px', textAlign: 'left' }}>
              <summary style={{ fontFamily: 'system-ui, -apple-system, Roboto, Arial, sans-serif' }}>
                Error Details (Development)
              </summary>
              <pre style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '10px', 
                borderRadius: '5px',
                fontSize: '12px',
                overflow: 'auto',
                maxWidth: '90vw',
                fontFamily: 'monospace'
              }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;