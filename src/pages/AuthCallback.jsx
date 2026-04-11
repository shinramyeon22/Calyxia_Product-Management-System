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
        console.error("Auth error:", error);
        navigate('/login');
      }
    };
    handleAuth();
  }, [navigate]);

  return (
    <div style={{ padding: '20px' }}>
      Signing you in...
    </div>
  );
}
