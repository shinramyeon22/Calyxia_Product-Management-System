import React, { useState } from 'react';
import { ToastContext } from './ToastContext';

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`px-8 py-4 rounded-none border text-sm tracking-widest shadow-2xl flex items-center gap-3 transition-all duration-300 pointer-events-auto
              ${toast.type === 'success' ? 'bg-emerald-950 border-emerald-500 text-emerald-400' : 
                toast.type === 'error' ? 'bg-red-950 border-red-500 text-red-400' : 
                'bg-[#d4af37] border-[#d4af37] text-black'}`}
          >
            <span className="text-xl">{toast.type === 'success' ? '✓' : toast.type === 'error' ? '⚠' : 'ℹ'}</span>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
