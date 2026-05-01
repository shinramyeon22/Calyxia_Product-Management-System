import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import Products from './pages/Products';
import AdminDashboard from './pages/AdminDashboard';
import ProductManagement from './pages/ProductManagement';
import ProductDetails from './pages/ProductDetails';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { session, user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#d4af37] tracking-widest">VERIFYING ACCESS...</div>;
  }

  if (!session) return <Navigate to="/login" replace />;
  if (requireAdmin && user?.user_type !== 'ADMIN') return <Navigate to="/products" replace />;

  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
      <Route path="/product/:id" element={<ProtectedRoute><ProductDetails /></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/products" element={<ProtectedRoute requireAdmin={true}><ProductManagement /></ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/products" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;