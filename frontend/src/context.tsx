import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Toast } from './types';

interface AppContextType {
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('ioptestes_sidebar_collapsed') === 'true';
  });

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleSetSidebarCollapsed = useCallback((v: boolean) => {
    setSidebarCollapsed(v);
    localStorage.setItem('ioptestes_sidebar_collapsed', String(v));
  }, []);

  return (
    <AppContext.Provider value={{ toasts, addToast, removeToast, sidebarCollapsed, setSidebarCollapsed: handleSetSidebarCollapsed }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
