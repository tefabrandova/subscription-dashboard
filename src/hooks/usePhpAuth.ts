import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import api from '../api';

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const { setCurrentUser, currentUser } = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('auth_token');
    if (token) {
      // In a real app, you'd validate the token with the server
      // For now, we'll assume it's valid if it exists
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      
      if (response.success && response.data) {
        setCurrentUser(response.data.user);
        return { data: response.data, error: null };
      } else {
        return { data: null, error: { message: response.error || 'Login failed' } };
      }
    } catch (error: any) {
      return { data: null, error: { message: error.message || 'Login failed' } };
    }
  };

  const signOut = async () => {
    try {
      api.clearToken();
      setCurrentUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    loading,
    user: currentUser,
    signIn,
    signOut
  };
}