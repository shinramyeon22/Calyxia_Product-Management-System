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
        // Profile row not readable (RLS not set up yet). Let the user through —
        // Login.jsx already gated on status. Do NOT force record_status here
        // because we can't know the real value without reading the DB.
        console.warn("Profile fetch failed — granting session-only access:", error.message);
        setUser({ ...authUser });
      } else {
        setUser({ ...authUser, ...data });
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
      setUser({ ...authUser });
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

  // Watch for real-time status changes to the logged-in user's row.
  // If a SuperAdmin suspends this account, force-sign-out immediately.
  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel(`user-status-${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_user',
          filter: `id=eq.${session.user.id}`
        },
        async (payload) => {
          const newStatus = String(payload.new?.record_status || '').toUpperCase();
          const newType = String(payload.new?.user_type || '').toUpperCase();
          if (newType !== 'SUPERADMIN' && newStatus !== 'A' && newStatus !== 'ACTIVE') {
            await supabase.auth.signOut();
          } else {
            setUser(prev => prev ? { ...prev, ...payload.new } : prev);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

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