import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Adjusted to common path

function AuthCallbackPage() {
  const navigate = useNavigate();
 
  useEffect(() => {
    // Listen for the SIGNED_IN event triggered by the OAuth redirect
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        
        // Run login guard: check record_status in the 'user' table
        const { data: userRow } = await supabase
          .from('user')
          .select('record_status')
          .eq('userId', session.user.id)
          .single();

        if (userRow?.record_status === 'ACTIVE') {
          // Success: User is active
          navigate('/products');
        } else {
          // Failure: User is INACTIVE or record not found
          await supabase.auth.signOut();
          navigate('/login?error=not_activated');
        }
      }
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-lg font-semibold">Signing you in...</p>
    </div>
  );
}

export default AuthCallbackPage;