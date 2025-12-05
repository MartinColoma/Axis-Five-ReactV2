// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

interface UserData {
  id: number;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  role: 'admin' | 'customer';
}

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  userData: UserData | null;
  login: (token: string, user: UserData) => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Auth check - relies on HTTP-Only cookie (primary) + localStorage (backup)
  const checkAuth = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }

    try {
      console.log('🔍 Checking auth... (cookie-based)');
      
      // Make request - cookie is automatically sent by browser
      const response = await fetch(`${API_BASE}/api/auth/verify-token`, {
        credentials: 'include', // CRITICAL: includes cookies in request
      });

      const data = await response.json();
      
      console.log('📥 Auth check result:', {
        success: data.success,
        hasUser: !!data.user,
        code: data.code
      });

      if (data.success && data.user) {
        console.log('✅ Session valid:', data.user.username);
        setIsLoggedIn(true);
        setUserData(data.user);
        setIsInitialized(true);
        return true;
      } else {
        console.log('❌ No valid session');
        setIsLoggedIn(false);
        setUserData(null);
        localStorage.removeItem('auth_token'); // Clear backup
        setIsInitialized(true);
        return false;
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      setIsLoggedIn(false);
      setUserData(null);
      localStorage.removeItem('auth_token');
      setIsInitialized(true);
      return false;
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  // Initial auth check on mount
  useEffect(() => {
    console.log('🚀 App initialized - checking authentication...');
    checkAuth(true);
  }, [checkAuth]);

  // Periodic session verification (every 5 minutes)
  useEffect(() => {
    if (!isInitialized) return;

    const intervalId = setInterval(() => {
      console.log('🔄 Periodic session check...');
      checkAuth(false);
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [isInitialized, checkAuth]);

  // Check when tab becomes visible
  useEffect(() => {
    if (!isInitialized) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Tab visible - checking session...');
        checkAuth(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isInitialized, checkAuth]);

  // Login - cookie is set by server, localStorage is backup only
  const login = useCallback((token: string, user: UserData) => {
    console.log('✅ Login successful:', user.username);
    // Store in localStorage as backup (cookie is primary)
    localStorage.setItem('auth_token', token);
    setIsLoggedIn(true);
    setUserData(user);
    setIsInitialized(true);
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      console.log('🚪 Logging out...');
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Send cookie
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      setIsLoggedIn(false);
      setUserData(null);
      console.log('✅ Logged out');
    }
  }, []);

  // Manual refresh
  const refreshAuth = useCallback(async () => {
    await checkAuth(true);
  }, [checkAuth]);

  // Loading screen while checking initial auth
  if (!isInitialized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#1f1f1f'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #333',
            borderTop: '4px solid #00bcd4',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#fff', fontSize: '14px', margin: 0 }}>
            Loading...
          </p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <AuthContext.Provider 
      value={{ 
        isLoggedIn, 
        isLoading, 
        userData, 
        login, 
        logout, 
        refreshAuth 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};