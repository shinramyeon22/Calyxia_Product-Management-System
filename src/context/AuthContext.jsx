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

  const fetchProfile = async (session) => {
  try {
    const { data, error } = await supabase
      .from('app_user')
      .select('user_type, record_status') // FETCH THE ROLE
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error.message);
      // If no profile found, we still set the basic user info
      setUser(session.user); 
    } else if (data) {
      // THE FIX: Merge the DB profile (role) into the user object
      setUser({ ...session.user, ...data });
      console.log("Profile Merged:", { ...session.user, ...data });
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    setUser(session.user);
  } finally {
    setLoading(false);
  }
};
  
   // src/context/AuthContext.jsx

const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error signing out:", error.message);
  } else {
    setUser(null); // Clear the local user state
    setSession(null); // Clear the session
  }
};

// ... make sure it's included in the value provider at the bottom:
return (
  <AuthContext.Provider value={{ session, user, loading, signOut }}>
    {children}
  </AuthContext.Provider>
);

  return (
    <AuthContext.Provider value={{ session, user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);