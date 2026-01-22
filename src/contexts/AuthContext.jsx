import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const token = localStorage.getItem('magflow_token');
    const storedUser = localStorage.getItem('magflow_user');
    
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setSession({ access_token: token });
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('magflow_token');
        localStorage.removeItem('magflow_user');
      }
    }
    
    setLoading(false);
  }, []);

  const signUp = async (email, password, metadata = {}) => {
    const response = await api.post('/api/auth/register', {
      email,
      password,
      fullName: metadata.full_name || metadata.fullName,
      companyName: metadata.company_name || metadata.companyName
    });
    
    if (response.success) {
      const { token, user } = response;
      localStorage.setItem('magflow_token', token);
      localStorage.setItem('magflow_user', JSON.stringify(user));
      setUser(user);
      setSession({ access_token: token });
      return { user, session: { access_token: token } };
    } else {
      throw new Error(response.error || 'Registration failed');
    }
  };

  const signIn = async (email, password) => {
    const response = await api.post('/api/auth/login', {
      email,
      password
    });
    
    if (response.success) {
      const { token, user } = response;
      localStorage.setItem('magflow_token', token);
      localStorage.setItem('magflow_user', JSON.stringify(user));
      setUser(user);
      setSession({ access_token: token });
      return { user, session: { access_token: token } };
    } else {
      throw new Error(response.error || 'Login failed');
    }
  };

  const signOut = async () => {
    try {
      const token = localStorage.getItem('magflow_token');
      if (token) {
        await api.post('/api/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('magflow_token');
      localStorage.removeItem('magflow_user');
      setUser(null);
      setSession(null);
    }
  };

  const resetPassword = async (email) => {
    const response = await api.post('/api/auth/password-reset', { email });
    if (!response.success) {
      throw new Error(response.error || 'Password reset failed');
    }
  };

  const updatePassword = async (newPassword) => {
    const token = localStorage.getItem('magflow_token');
    const response = await api.post('/api/auth/password-update', 
      { newPassword },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.success) {
      throw new Error(response.error || 'Password update failed');
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
