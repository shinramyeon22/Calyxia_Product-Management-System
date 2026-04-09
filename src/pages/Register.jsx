// src/pages/Register.jsx
import { useState } from 'react';

export default function Register() {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Design Preview Mode\n\nAccount would be created here.");
    console.log("Registration data:", formData);
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

          <button type="submit" className="auth-button primary">
            Create Account
          </button>
        </form>

        <div className="divider">or continue with</div>

        {/* NEW GOOGLE BUTTON - Matching your reference image */}
        <button
          type="button"
          onClick={() => alert("Google Sign up clicked (design preview)")}
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
          <a href="#" className="text-[#aa3bff] hover:underline font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}