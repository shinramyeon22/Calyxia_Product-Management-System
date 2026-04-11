// src/pages/AuthCallback.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (data?.session) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    };
    handleAuth();
  }, [navigate]);

  // FIX: Ensure there is NO slash in the FIRST <p>
  return <p>Signing you in...</p>; 
}
