import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, logout, fetchCurrentUser } from '../config/api.js';

/**
 * Custom hook for authentication management
 * @returns {object} Authentication state and methods
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (isAuthenticated()) {
          const userData = await fetchCurrentUser();
          setUser(userData);
        } else {
          navigate('/auth');
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setError(err.message);
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // Login method
  const login = async (email, password, rememberMe = false) => {
    setLoading(true);
    setError(null);

    try {
      const { apiPost } = await import('../config/api.js');
      const userData = await apiPost('/auth/login', {
        email,
        password,
        rememberMe,
      });

      // Store token if provided
      if (userData.token) {
        localStorage.setItem('access_token', userData.token);
      }

      setUser(userData.user || userData);
      navigate('/');
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout method
  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      // Still clear local state even if server logout fails
      setUser(null);
      localStorage.removeItem('access_token');
      navigate('/auth');
    }
  };

  // Check if user is authenticated
  const authenticated = !!user && isAuthenticated();

  return {
    user,
    loading,
    error,
    authenticated,
    login,
    logout: handleLogout,
    setError,
  };
};

export default useAuth;