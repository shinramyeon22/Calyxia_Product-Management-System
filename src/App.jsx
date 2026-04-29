import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import Products from './pages/Products';
import AdminDashboard from './pages/AdminDashboard';
import ProductManagement from './pages/ProductManagement';
import ProductDetails from './pages/ProductDetails';
import './App.css';

// ProtectedRoute with Admin "Bouncer" logic
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { session, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="bg-[#0a0a0c] min-h-screen flex items-center justify-center text-[#d4af37] font-sans tracking-widest">
        VERIFYING PERMISSIONS...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // The Bouncer: If page needs Admin but user is just a USER, send to Products
  if (requireAdmin && user?.user_type !== 'ADMIN') {
    return <Navigate to="/products" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected User Routes */}
      <Route 
        path="/products" 
        element={
          <ProtectedRoute>
            <Products />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/product/:id" 
        element={
          <ProtectedRoute>
            <ProductDetails />
          </ProtectedRoute>
        } 
      />

      {/* Protected Admin Routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/products" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <ProductManagement />
          </ProtectedRoute>
        } 
      />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/products" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;