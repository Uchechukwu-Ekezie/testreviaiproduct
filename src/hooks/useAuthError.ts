"use client";

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

export function useAuthError() {
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const { logout } = useAuth();

  const handleAuthError = useCallback((error: any) => {
    // Check if it's an authentication error
    if (error?.response?.status === 401 || error?.message?.includes('401')) {
      console.log('Authentication error detected, showing login popup');
      setShowLoginPopup(true);
      return true; // Indicates that the error was handled
    }
    return false; // Error was not handled
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setShowLoginPopup(false);
  }, [logout]);

  const closeLoginPopup = useCallback(() => {
    setShowLoginPopup(false);
  }, []);

  return {
    showLoginPopup,
    handleAuthError,
    handleLogout,
    closeLoginPopup,
  };
}

