import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'; // Ensure your supabase client is initialized here

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check for an existing session on app load
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await checkUserStatus(session);
      } else {
        setLoading(false);
      }
    };

    initializeAuth();

    // 2. Listen for Auth Changes (Login, Logout, Google OAuth Redirects)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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

  // 3. The "Inactive Gate" (Critical Sprint 1 Requirement)
  const checkUserStatus = async (currentSession) => {
    const { data: profile, error } = await supabase
      .from('user') // This is your public user table
      .select('record_status, user_type')
      .eq('id', currentSession.user.id)
      .single();

    if (profile?.record_status === 'INACTIVE') {
      alert("Your account is pending admin approval.");
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
    } else {
      setSession(currentSession);
      setUser({ ...currentSession.user, ...profile });
    }
    setLoading(false);
  };

  const value = {
    session,
    user,
    signOut: () => supabase.auth.signOut(),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access
export const useAuth = () => useContext(AuthContext);
