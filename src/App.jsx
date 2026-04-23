// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback'; // Keep this name consistent
import Products from './pages/Products';
import './App.css';

// Protect routes component
const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="bg-black min-h-screen text-white p-10 text-center">Loading Session...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* 1. Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* 2. OAuth Callback - Use only ONE and match the import name */}
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* 3. Protected Routes */}
      <Route 
        path="/products" 
        element={
          <ProtectedRoute>
            <Products />
          </ProtectedRoute>
        } 
      />

      {/* 4. Default Redirects - The "Catch-Alls" */}
      {/* If they hit the root URL, take them to products */}
      <Route path="/" element={<Navigate to="/products" replace />} />
      
      {/* If they type a URL that doesn't exist, send them to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;