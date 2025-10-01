import React, { createContext, useContext, useState, useEffect } from 'react';

// Create authentication context
const AuthContext = createContext();

// Custom hook to use authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Authentication provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // API base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Initialize authentication state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('ecoatlas_token');
        const storedUser = localStorage.getItem('ecoatlas_user');
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear corrupted data
        localStorage.removeItem('ecoatlas_token');
        localStorage.removeItem('ecoatlas_user');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Sign up function
  const signup = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      return { success: true, data };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message };
    }
  };

  // Verify account function
  const verifyAccount = async (email, verificationCode) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      return { success: true, data };
    } catch (error) {
      console.error('Verification error:', error);
      return { success: false, error: error.message };
    }
  };

  // Login function
  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store authentication data
      localStorage.setItem('ecoatlas_token', data.token);
      localStorage.setItem('ecoatlas_user', JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);

      return { success: true, data };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (token) {
        // Call logout endpoint to invalidate token on server
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('ecoatlas_token');
      localStorage.removeItem('ecoatlas_user');
      setToken(null);
      setUser(null);
    }
  };

  // Get user profile function
  const getProfile = async () => {
    try {
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch profile');
      }

      return { success: true, data };
    } catch (error) {
      console.error('Profile fetch error:', error);
      return { success: false, error: error.message };
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!token && !!user;
  };

  // Check if user is verified
  const isVerified = () => {
    return isAuthenticated() && user?.is_verified;
  };

  // Google OAuth login function
  const googleLogin = async (userInfo) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userInfo),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Handle non-JSON responses (like rate limiting errors)
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server error - please try again in a few minutes');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Google login failed');
      }

      // Store authentication data
      localStorage.setItem('ecoatlas_token', data.token);
      localStorage.setItem('ecoatlas_user', JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);

      return { success: true, data };
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Get authentication headers for API calls
  const getAuthHeaders = () => {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const value = {
    user,
    token,
    loading,
    signup,
    verifyAccount,
    login,
    googleLogin,
    logout,
    getProfile,
    isAuthenticated,
    isVerified,
    getAuthHeaders,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


