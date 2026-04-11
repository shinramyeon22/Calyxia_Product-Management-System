import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data: userRow } = await supabase
          .from('user')
          .select('record_status')
          .eq('userId', session.user.id)
          .single();
        if (userRow?.record_status === 'ACTIVE') {
          navigate('products');
          } else {
          await supabase.auth.signOut();
          navigate('/login?error=not_activated');
          }
        }
      });
    }, []);
  return </p>Signing you in...</p>;
  }
