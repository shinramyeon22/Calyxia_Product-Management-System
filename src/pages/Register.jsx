// src/pages/Register.jsx
import { useState } from 'react';
import { supabase } from '../supabaseClient'; // Path to your client initialization
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 1. EMAIL/PASSWORD SIGN UP PATH
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        // These extra fields will be stored in auth.users.raw_user_meta_data
        // and can be used by your trigger to fill the public.user table
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          username: formData.username,
        },
        emailRedirectTo: 'http://localhost:5173/login',
      },
    });

    if (error) {
      alert("Registration Error: " + error.message);
    } else {
      alert("Success! Check your email for verification. Note: Your account is INACTIVE until approved by an admin.");
      navigate('/login');
    }
    setLoading(false);
  };

  // 2. GOOGLE OAUTH PATH
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:5173/auth/callback', // Pointing to your callback route
      },
    });

    if (error) alert("Google Sign up error: " + error.message);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">C</div>
        
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join Calyxia and start managing products smarter</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="auth-input"
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="auth-input"
            />
          </div>

          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
            className="auth-input"
          />

          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            required
            className="auth-input"
          />

          <input
            type="password"
            name="password"
            placeholder="Create password"
            value={formData.password}
            onChange={handleChange}
            required
            className="auth-input"
          />

          <button type="submit" className="auth-button primary" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="divider">or continue with</div>

        <button
          type="button"
          onClick={handleGoogleLogin} // Triggering the Google OAuth
          className="google-btn"
        >
          <img
            src="https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png"
            alt="Google"
            className="google-logo"
          />
          Sign up with Google
        </button>

        <p className="text-center text-sm text-zinc-400 mt-8">
          Already have an account?{' '}
          <a href="/login" className="text-[#aa3bff] hover:underline font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}