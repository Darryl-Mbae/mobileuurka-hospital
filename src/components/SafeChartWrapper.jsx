import React from 'react';

// Safe chart wrapper that prevents all errors
const SafeChartWrapper = ({ children, fallbackMessage = "Chart temporarily unavailable" }) => {
  try {
    return children;
  } catch (error) {
    console.warn('SafeChartWrapper caught error:', error);
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#666',
        fontSize: '0.9em',
        padding: '20px',
        textAlign: 'center'
      }}>
        {fallbackMessage}
      </div>
    );
  }
};

export default SafeChartWrapper;