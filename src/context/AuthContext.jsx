/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Consolidated fetch function
  const fetchUserProfile = useCallback(async (authUser) => {
    if (!authUser?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('app_user')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.warn("No profile found, using default USER:", error.message);
        // Fallback if the user exists in Auth but not in app_user table
        setUser({ 
          ...authUser, 
          user_type: 'USER',
          record_status: 'ACTIVE'
        });
      } else {
        setUser({ ...authUser, ...data });
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
      setUser({ ...authUser, user_type: 'USER' });
    } finally {
      setLoading(false); // CRITICAL: This stops the "Verifying Access" loop
    }
  }, []);

  useEffect(() => {
    // 1. Get initial session on mount
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession) {
        fetchUserProfile(initialSession.user);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (currentSession) {
        fetchUserProfile(currentSession.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error signing out:", error.message);
    
    setUser(null);
    setSession(null);
    localStorage.removeItem('user_type'); 
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);