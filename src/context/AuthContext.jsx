/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkUserStatus = async (currentSession) => {
    try {
      const { data: profile, error } = await supabase
        .from('user')
        .select('record_status, user_type')
        .eq('userId', currentSession.user.id)
        .single();

      if (profile?.record_status === 'INACTIVE') {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        return;
      }

      if (error && error.code === 'PGRST116') {
        setSession(currentSession);
        setUser(currentSession.user);
        return;
      }

      if (profile?.record_status === 'ACTIVE') {
        setSession(currentSession);
        setUser({ ...currentSession.user, ...profile });
        return;
      }

      await supabase.auth.signOut();
      setSession(null);
      setUser(null);

    } catch (err) {
      console.error('Auth check failed', err);
      setSession(null);
      setUser(null);
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        if (session) {
          await checkUserStatus(session);
        } else {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    session,
    user,
    loading,
    signOut: () => supabase.auth.signOut(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children} {/* ✅ DO NOT block render */}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);