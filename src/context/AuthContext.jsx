/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (session) => {
    if (!session?.user?.id) return;

    try {
      const { data, error } = await supabase
        .from('app_user')
        .select('user_type, record_status')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.warn("No profile found, using default USER:", error.message);
        setUser({ 
          ...session.user, 
          user_type: 'USER',
          record_status: 'ACTIVE'
        });
      } else {
        setUser({ ...session.user, ...data });
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
      setUser({ ...session.user, user_type: 'USER' });
    }
  }, []);

  useEffect(() => {
  // 1. Instant check: Use cached session/type while waiting for Supabase
  const cachedType = localStorage.getItem('user_type');
  
  supabase.auth.getSession().then(({ data: { session: initSession } }) => {
    if (initSession) {
      setSession(initSession);
      // Optimistically set the user type from cache to bypass "Loading" screens
      setUser({ ...initSession.user, user_type: cachedType || 'USER' });
      fetchProfile(initSession);
    }
    setLoading(false);
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currSession) => {
    setSession(currSession);
    if (currSession) {
      await fetchProfile(currSession);
    } else {
      setUser(null);
      localStorage.removeItem('user_type'); // Clean up on logout
    }
    setLoading(false);
  });

  return () => subscription.unsubscribe();
}, [fetchProfile]);

  const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) console.error("Error signing out:", error.message);
  
  // Manually reset state so the UI reacts immediately
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
