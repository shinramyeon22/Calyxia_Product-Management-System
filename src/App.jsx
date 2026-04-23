// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import Products from './pages/Products';
import AdminDashboard from './pages/AdminDashboard'; // 1. Add this import
import './App.css';

// Updated ProtectedRoute with Admin "Bouncer" logic
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { session, user, loading } = useAuth();

  if (loading) {
    return <div className="bg-black min-h-screen text-white p-10 text-center">Verifying Permissions...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // 2. The Bouncer: If page needs Admin but user is just a USER, send to Products
  if (requireAdmin && user?.user_type !== 'ADMIN') {
    return <Navigate to="/products" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route 
        path="/products" 
        element={
          <ProtectedRoute>
            <Products />
          </ProtectedRoute>
        } 
      />

      {/* 3. The New Admin Route */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      <Route path="/" element={<Navigate to="/products" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;