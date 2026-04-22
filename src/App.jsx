// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';

// Protect routes
const ProtectedRoute = ({ children }) => {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* OAuth Callback */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected Route */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <div className="p-10">
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p>If you see this, you are logged in and ACTIVE.</p>
              </div>
            </ProtectedRoute>
          } 
        />

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;