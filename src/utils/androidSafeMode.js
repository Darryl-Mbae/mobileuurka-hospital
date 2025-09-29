/**
 * Android Safe Mode - Simplified app version for older devices
 * Minimal functionality to ensure app works on Android 10 and below
 */

import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter, Route, Routes } from "react-router-dom";

// Minimal safe mode app component
const SafeModeApp = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  
  React.useEffect(() => {
    // Simulate app loading with minimal operations
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (error) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, Roboto, Arial, sans-serif',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'white'
      }}>
        <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>
          Error Loading App
        </h2>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          {error.message || 'An error occurred while loading the application.'}
        </p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontFamily: 'inherit'
          }}
        >
          Reload App
        </button>
        <button 
          onClick={() => {
            localStorage.setItem('force-full-version', 'true');
            window.location.reload();
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#007bff',
            border: '1px solid #007bff',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: 'inherit',
            marginTop: '10px'
          }}
        >
          Try Full Version
        </button>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, Roboto, Arial, sans-serif',
        background: 'white',
        flexDirection: 'column'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Loading Safe Mode...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
  
  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, Roboto, Arial, sans-serif',
      minHeight: '100vh',
      background: 'white',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          color: '#333', 
          marginBottom: '20px',
          fontSize: '24px'
        }}>
          Mobileuurka - Safe Mode
        </h1>
        
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '6px',
          padding: '15px',
          marginBottom: '20px',
          textAlign: 'left'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#856404' }}>
            ⚠️ Compatibility Mode Active
          </h3>
          <p style={{ margin: '0', color: '#856404', fontSize: '14px' }}>
            Your device is running in safe mode for optimal performance. 
            Some features may be limited to ensure stability.
          </p>
        </div>
        
        <div style={{
          display: 'grid',
          gap: '15px',
          marginBottom: '30px'
        }}>
          <button
            onClick={() => {
              // Navigate to auth page
              window.location.href = '/auth';
            }}
            style={{
              padding: '15px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontFamily: 'inherit'
            }}
          >
            Login / Sign Up
          </button>
          
          <button
            onClick={() => {
              // Navigate to main app
              window.location.href = '/';
            }}
            style={{
              padding: '15px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontFamily: 'inherit'
            }}
          >
            Go to Dashboard
          </button>
        </div>
        
        <div style={{
          borderTop: '1px solid #ddd',
          paddingTop: '20px',
          fontSize: '14px',
          color: '#666'
        }}>
          <p>
            <strong>Safe Mode Features:</strong>
          </p>
          <ul style={{ 
            textAlign: 'left', 
            maxWidth: '400px', 
            margin: '10px auto',
            paddingLeft: '20px'
          }}>
            <li>Optimized for older Android devices</li>
            <li>Reduced memory usage</li>
            <li>Simplified interface</li>
            <li>Essential functionality only</li>
          </ul>
          
          <button
            onClick={() => {
              localStorage.setItem('force-full-version', 'true');
              window.location.reload();
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: '#007bff',
              border: '1px solid #007bff',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'inherit',
              marginTop: '15px'
            }}
          >
            Switch to Full Version (Not Recommended)
          </button>
        </div>
      </div>
    </div>
  );
};

// Create safe mode app
export const createSafeModeApp = async () => {
  console.log('🛡️ Creating safe mode app for older Android device');
  
  // Clear any existing content
  const root = document.getElementById('root');
  if (!root) {
    console.error('Root element not found');
    return;
  }
  
  // Remove loading screen
  const loadingScreen = document.getElementById('initial-loading');
  if (loadingScreen) {
    loadingScreen.remove();
  }
  
  // Apply safe mode styles
  document.body.classList.add('android-safe-mode');
  document.body.style.fontFamily = 'system-ui, -apple-system, Roboto, Arial, sans-serif';
  
  // Set safe CSS variables
  const safeFonts = 'system-ui, -apple-system, Roboto, Arial, sans-serif';
  document.documentElement.style.setProperty('--font-family-primary', safeFonts);
  document.documentElement.style.setProperty('--font-family-fallback', safeFonts);
  
  try {
    // Import React dynamically to avoid blocking
    const React = await import('react');
    window.React = React.default;
    
    // Create and render safe mode app
    const reactRoot = createRoot(root);
    reactRoot.render(React.createElement(SafeModeApp));
    
    console.log('✅ Safe mode app created successfully');
    
  } catch (error) {
    console.error('❌ Failed to create safe mode app:', error);
    
    // Fallback to plain HTML
    root.innerHTML = `
      <div style="
        padding: 20px;
        text-align: center;
        font-family: system-ui, -apple-system, Roboto, Arial, sans-serif;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: white;
      ">
        <h1 style="color: #333; margin-bottom: 20px;">Mobileuurka</h1>
        <p style="color: #666; margin-bottom: 20px;">
          Your device is running in compatibility mode.
        </p>
        <button onclick="window.location.href='/auth'" style="
          padding: 15px 30px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          margin: 10px;
        ">Login</button>
        <button onclick="window.location.href='/'" style="
          padding: 15px 30px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          margin: 10px;
        ">Dashboard</button>
      </div>
    `;
  }
};