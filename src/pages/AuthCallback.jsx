import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        navigate('/login?error=auth_failed');
        return;
      }

      const { data: userRow, error: fetchError } = await supabase
        .from('app_user')
        .select('record_status, user_type')
        .eq('id', session.user.id)
        .single();

      // If new user, create record as INACTIVE — awaiting SUPERADMIN approval
      if (fetchError && fetchError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('app_user')
          .insert([{
            id: session.user.id,
            email: session.user.email,
            record_status: 'INACTIVE',
            user_type: 'USER'
          }]);

        if (insertError) {
          navigate('/login?error=database_error');
          return;
        }

        await supabase.auth.signOut();
        navigate('/login?status=pending_approval');
        return;
      }

      // SUPERADMIN always gets through regardless of record_status
      const userType = String(userRow?.user_type || '').toUpperCase();
      const status = String(userRow?.record_status || '').toUpperCase();
      if (userType === 'SUPERADMIN' || status === 'A' || status === 'ACTIVE') {
        navigate('/admin/products');
      } else {
        await supabase.auth.signOut();
        navigate('/login?error=not_activated');
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-[1px] bg-[#d4af37] mx-auto mb-6 animate-pulse"></div>
        <p className="text-[#d4af37] text-xs tracking-[0.5em]">FINALIZING SIGN IN...</p>
      </div>
    </div>
  );
}

export default AuthCallback;
