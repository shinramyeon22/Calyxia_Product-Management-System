import React from 'react';
import { useLocation } from 'react-router-dom';

export default function PageTransition({ children }) {
  const location = useLocation();

  return (
    <div
      key={location.pathname}
      className="animate-page-transition bg-inherit"
      style={{ minHeight: '100vh' }}
    >
      {children}
    </div>
  );
}
