/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

// src/context/AuthContext.jsx

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session immediately
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      if (initSession) {
        setSession(initSession);
        setUser(initSession.user);
        // We stop loading here so the app can at least show the page
        setLoading(false); 
        
        // Background check for profile status (Admin approval/Bans)
        fetchProfile(initSession);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currSession) => {
      setSession(currSession);
      setUser(currSession?.user ?? null);
      setLoading(false);
      if (currSession) fetchProfile(currSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Separate function so it doesn't block the UI loading
  const fetchProfile = async (s) => {
    try {
      const { data } = await supabase
        .from('app_user')
        .select('record_status')
        .eq('id', s.user.id)
        .maybeSingle(); // maybeSingle() is safer than single()

      if (data?.record_status === 'INACTIVE') {
        await supabase.auth.signOut();
        window.location.href = '/login?error=not_activated';
      }
    } catch (e) {
      console.error("Profile check skipped:", e);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);