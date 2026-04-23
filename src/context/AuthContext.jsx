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
        .from('app_user')  // ← changed
        .select('*')
        .eq('id', currentSession.user.id)
        .single();

      // Table is empty or user not in table yet — allow access anyway
      if (error && error.code === 'PGRST116') {
        setUser(currentSession.user);
        setSession(currentSession);
        return;
      }

      if (error) {
        // Any other DB error — still let them in using auth session
        console.error("DB error:", error.message);
        setUser(currentSession.user);
        setSession(currentSession);
        return;
      }

      // User found — check if INACTIVE
      if (profile?.record_status === 'INACTIVE') {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        window.location.href = '/login?error=not_activated';
        return;
      }

      // Success
      setUser({ ...currentSession.user, ...profile });
      setSession(currentSession);

    } catch (err) {
      console.error("Auth check failed:", err);
      // Fallback — don't lock user out on unexpected errors
      setUser(currentSession.user);
      setSession(currentSession);
    } finally {
      setLoading(false); // ← Always runs, no matter what
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      if (initialSession) {
        await checkUserStatus(initialSession);
      } else {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (currentSession) {
          await checkUserStatus(currentSession);
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
    signOut: () => supabase.auth.signOut()
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);