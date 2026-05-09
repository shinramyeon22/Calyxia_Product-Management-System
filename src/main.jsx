import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from "./context/AuthContext.jsx";
import { UserRightsProvider } from "./context/UserRightsContext.jsx";
import { SidebarProvider } from "./context/SidebarContext.jsx";   // ← Add this
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UserRightsProvider>
          <SidebarProvider>           {/* ← Add this */}
            <App />
          </SidebarProvider>
        </UserRightsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);