/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'; 

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkUserStatus = async (currentSession) => {
    try {
      const { data: profile, error } = await supabase
        .from('user') 
        .select('record_status, user_type')
        .eq('userId', currentSession.user.id) // Ensure this matches your column name (userId or id)
        .single();

      // CASE 1: User exists but is INACTIVE
      if (profile?.record_status === 'INACTIVE') {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        // Better to redirect with a URL param than a blocking alert
        window.location.href = '/login?error=not_activated';
        return;
      }

      // CASE 2: User record doesn't exist yet (New Google Signup)
      if (error && error.code === 'PGRST116') { 
        // This is the "No rows found" error. 
        // We let them stay logged into Auth, but don't give them a 'user' profile yet.
        setSession(currentSession);
        setUser(currentSession.user); 
      } else {
        // CASE 3: Active user found
        setSession(currentSession);
        setUser({ ...currentSession.user, ...profile });
      }
    } catch (err) {
      console.error("Auth check failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await checkUserStatus(session);
      } else {
        setLoading(false);
      }
    };
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await checkUserStatus(session);
      } else {
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = { session, user, signOut: () => supabase.auth.signOut() };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);