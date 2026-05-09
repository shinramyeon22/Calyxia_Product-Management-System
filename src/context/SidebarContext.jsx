/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';

/* 
  Disable React Fast Refresh rule for this context file 
  because it exports both Provider and custom hook
*/
const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // true = expanded

  return (
    <SidebarContext.Provider value={{ isSidebarOpen, setIsSidebarOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};