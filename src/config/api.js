// API utility functions for secure authenticated requests
const SERVER = import.meta.env.VITE_SERVER_URL;

/**
 * Enhanced fetch function with automatic token handling
 * @param {string} url - The API endpoint URL
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<Response>} - The fetch response
 */
export const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('access_token');
  
  console.log('token', token);
  const defaultOptions = {
    credentials: 'include', // For cookies
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }), // Add token header if available
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  // Handle token expiration
  if (response.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('access_token');
    // Redirect to login page
    window.location.href = '/auth';
    throw new Error('Authentication expired. Please login again.');
  }

  return response;
};

/**
 * GET request with authentication
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {object} options - Additional fetch options
 * @returns {Promise<any>} - Parsed JSON response
 */
export const apiGet = async (endpoint, options = {}) => {
  try {
    const response = await fetchWithAuth(`${SERVER}${endpoint}`, {
      method: 'GET',
      ...options,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error(`GET ${endpoint} error:`, error);
    throw error;
  }
};

/**
 * POST request with authentication
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {object} body - Request body data
 * @param {object} options - Additional fetch options
 * @returns {Promise<any>} - Parsed JSON response
 */
export const apiPost = async (endpoint, body = {}, options = {}) => {
  try {
    const response = await fetchWithAuth(`${SERVER}${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error(`POST ${endpoint} error:`, error);
    throw error;
  }
};

/**
 * PUT request with authentication
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {object} body - Request body data
 * @param {object} options - Additional fetch options
 * @returns {Promise<any>} - Parsed JSON response
 */
export const apiPut = async (endpoint, body = {}, options = {}) => {
  try {
    const response = await fetchWithAuth(`${SERVER}${endpoint}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error(`PUT ${endpoint} error:`, error);
    throw error;
  }
};

/**
 * DELETE request with authentication
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {object} options - Additional fetch options
 * @returns {Promise<any>} - Parsed JSON response
 */
export const apiDelete = async (endpoint, options = {}) => {
  try {
    const response = await fetchWithAuth(`${SERVER}${endpoint}`, {
      method: 'DELETE',
      ...options,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error(`DELETE ${endpoint} error:`, error);
    throw error;
  }
};

/**
 * Fetch current user data with authentication
 * @returns {Promise<any>} - User data
 */
export const fetchCurrentUser = async () => {
  try {
    const userData = await apiGet('/users');
    return userData;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} - True if token exists
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};

/**
 * Logout user by clearing tokens and redirecting
 */
export const logout = async () => {
  try {
    // Call logout endpoint to invalidate server-side session
    await fetchWithAuth(`${SERVER}/auth/logout`, {
      method: 'POST',
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear local storage regardless of server response
    localStorage.removeItem('access_token');
    // Redirect to login
    window.location.href = '/auth';
  }
};

/**
 * Refresh token if needed
 * @returns {Promise<string|null>} - New token or null if refresh failed
 */
export const refreshToken = async () => {
  try {
    const response = await fetch(`${SERVER}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.token) {
        localStorage.setItem('access_token', data.token);
        return data.token;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
};