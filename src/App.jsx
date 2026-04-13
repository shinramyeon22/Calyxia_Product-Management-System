// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext'; // Import your AuthProvider
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';

// A simple component to protect routes (Redirects to login if not authenticated)
const ProtectedRoute = ({ children }) => {
  const { user, session } = useAuth();
  
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    /* 1. Wrap the entire Routes tree with AuthProvider */
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* 2. The Google OAuth Callback Route */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* 3. Protected Routes (Sprint 1 basic setup) */}
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

        {/* Default Redirect: Send users to login if they hit a random URL */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

<<<<<<< HEAD
export default App; 
=======
export default App;
>>>>>>> 8da57a230de1a9338742b92df2a1f0fa5d3e46de
