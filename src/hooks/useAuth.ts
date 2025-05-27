import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { logActivity } from '../store/activityStore';

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const { setCurrentUser } = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        await updateUserData(session);
      }
      setLoading(false);
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await updateUserData(session);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateUserData = async (session: any) => {
    try {
      // Fetch user profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError) throw profileError;

      setCurrentUser({
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata.name || 'User',
        role: profile?.role || 'user',
        createdAt: session.user.created_at,
        lastLogin: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Set default user data if profile fetch fails
      setCurrentUser({
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata.name || 'User',
        role: 'user',
        createdAt: session.user.created_at,
        lastLogin: new Date().toISOString()
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        // Fetch user profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        logActivity(
          'login',
          'user',
          data.user.id,
          data.user.email || 'Unknown',
          `User logged in: ${data.user.email}`
        );

        return { 
          data: { 
            ...data, 
            profile 
          }, 
          error: null 
        };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
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