/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

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
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      if (initSession) {
        setSession(initSession);
        setUser(initSession.user);
        fetchProfile(initSession);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currSession) => {
      setSession(currSession);
      setUser(currSession?.user ?? null);
      if (currSession) fetchProfile(currSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);