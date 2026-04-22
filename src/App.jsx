<<<<<<< HEAD
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import Products from "./pages/Products"; 
import "./App.css";

function App() {
  return (
    <Routes>
      {/* This sends users to Login by default */}
      <Route path="/" element={<Navigate to="/login" />} />
      
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/products" element={<Products />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
    </Routes>
  );
}

export default App;


=======
// src/App.jsx
import Register from './pages/Register.jsx';
import './App.css';

function App() {
  return (
    <div className="App">
      <Register />
    </div>
  );
}

export default App;
>>>>>>> a6691f171f9622c2ccf7159815cd846cbccd17b0
