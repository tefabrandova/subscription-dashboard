import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { logActivity } from '../store/activityStore';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const { users, setCurrentUser } = useUserStore();
  const navigate = useNavigate();

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Find user in local store
      const user = users.find(u => u.email === email && u.password === password);
      
      if (!user) {
        return { 
          data: null, 
          error: { message: 'Invalid login credentials' }
        };
      }

      // Update last login time
      const updatedUser = {
        ...user,
        lastLogin: new Date().toISOString()
      };

      setCurrentUser(updatedUser);

      logActivity(
        'login',
        'user',
        user.id,
        user.email,
        `User logged in: ${user.email}`
      );

      return { 
        data: { user: updatedUser }, 
        error: null 
      };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setCurrentUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    loading,
    signIn,
    signOut
  };
}