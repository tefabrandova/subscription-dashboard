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
      // Fetch user profile data using maybeSingle() to handle no profile case
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, display_name')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Create user object with default role if profile doesn't exist
      const userData = {
        id: session.user.id,
        email: session.user.email!,
        name: profile?.display_name || session.user.user_metadata.name || session.user.email?.split('@')[0] || 'User',
        role: profile?.role || 'user',
        createdAt: session.user.created_at,
        lastLogin: new Date().toISOString()
      };

      setCurrentUser(userData);

      // Create profile if it doesn't exist
      if (!profile) {
        await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            email: session.user.email!,
            role: 'user',
            display_name: userData.name
          });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Set default user data if profile fetch fails
      setCurrentUser({
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'User',
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
        // Fetch user profile data using maybeSingle() to handle no profile case
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, display_name')
          .eq('id', data.user.id)
          .maybeSingle();

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

  const signUp = async (email: string, password: string, name: string, role: string = 'user') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create profile
        await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email,
            role: role,
            display_name: name
          });

        logActivity(
          'create',
          'user',
          data.user.id,
          email,
          `User registered: ${email}`
        );
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
    signUp,
    signOut
  };
}