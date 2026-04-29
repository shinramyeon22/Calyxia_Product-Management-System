import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Login = () => {

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
          },
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error("Auth Error:", error.message);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#050505] overflow-hidden selection:bg-amber-500/30">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,400..900;1,400..900&family=Montserrat:wght@100;200;300;400;500;600&display=swap');
        
        .serif-font { font-family: 'Bodoni Moda', serif; }
        .sans-font { font-family: 'Montserrat', sans-serif; }
        
        .login-input::placeholder {
          color: rgba(212, 175, 55, 0.3);
          letter-spacing: 0.3em;
        }

        .gold-glow:focus {
          box-shadow: 0 0 20px rgba(212, 175, 55, 0.1);
          border-color: #d4af37 !important;
        }
      `}</style>

      {/* LEFT SIDE: Extravagant Visual Pane */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0a0a0c] items-center justify-center overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 opacity-60">
          <img 
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop" 
            alt="Showroom" 
            className="w-full h-full object-cover grayscale-[40%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-[#0d1a15]"></div>
        </div>
        
        <div className="relative z-10 text-center px-20">
          <h2 className="serif-font text-8xl italic text-white/10 select-none">CX</h2>
          <div className="h-[1px] w-20 bg-amber-500/40 mx-auto my-8"></div>
          <p className="sans-font text-[10px] tracking-[1em] text-amber-500/60 uppercase font-light">The Private Collection</p>
        </div>
      </div>

      {/* RIGHT SIDE: Management Portal */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 bg-[#0d1a15]">
        <div className="w-full max-w-[460px] flex flex-col items-center">
          
          {/* Brand Identity */}
          <div className="text-center mb-16">
            <h1 className="serif-font text-7xl italic font-light text-white mb-2">Calyxia</h1>
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-[1px] w-8 bg-amber-500/30"></div>
              <span className="sans-font text-[9px] tracking-[0.5em] text-amber-500 uppercase font-medium">Management Enterprise</span>
              <div className="h-[1px] w-8 bg-amber-500/30"></div>
            </div>
          </div>

          {/* Form Portal */}
          <form className="w-full space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-4">
              <div className="relative group">
                <input 
                  type="email" 
                  placeholder="IDENTITY / EMAIL" 
                  className="login-input w-full bg-black/40 border border-white/5 py-5 px-8 rounded-sm text-white sans-font text-[10px] tracking-widest outline-none transition-all gold-glow"
                />
              </div>
              <div className="relative group">
                <input 
                  type="password" 
                  placeholder="ACCESS KEY / PASSWORD" 
                  className="login-input w-full bg-black/40 border border-white/5 py-5 px-8 rounded-sm text-white sans-font text-[10px] tracking-widest outline-none transition-all gold-glow"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-transparent text-amber-500 border border-amber-500/40 py-5 rounded-sm sans-font text-[10px] font-bold tracking-[0.4em] transition-all hover:bg-amber-500 hover:text-[#0d1a15] hover:shadow-[0_0_30px_rgba(212,175,55,0.2)] active:scale-[0.98]"
            >
              VALIDATE ACCESS
            </button>
          </form>

          <div className="flex items-center w-full my-12">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="mx-6 sans-font text-[8px] text-zinc-600 tracking-[0.4em] font-bold">OR</span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          {/* Social Access */}
          <button 
            onClick={handleGoogleSignIn} 
            type="button" 
            className="w-full bg-white text-black py-5 rounded-sm flex items-center justify-center gap-4 transition-all hover:bg-zinc-200 active:scale-[0.98] sans-font text-[10px] font-bold tracking-widest"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            GOOGLE AUTHENTICATION
          </button>

          <div className="mt-16 text-center">
            <p className="sans-font text-[9px] text-zinc-500 tracking-[0.2em] uppercase">
              Unregistered Identity? 
              <Link to="/register" className="text-amber-500 font-bold ml-2 hover:underline">
                Register Entry
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;