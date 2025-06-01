// src/context/AuthContext.tsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { saveTokens, clearTokens } from '@/src/Storage/tokenStorage';

interface AuthContextProps {
  isAuthenticated: boolean;
  user: any;
  accessToken: string | null;
  signIn: (userData: { accessToken: string; refreshToken: string }) => void;
  signUp: (userData: { accessToken: string; refreshToken: string }) => void;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextProps>({
  isAuthenticated: false,
  user: {},
  accessToken: null,
  signIn: () => {},
  signUp: () => {},
  signOut: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('[AuthContext] Checking authentication status on startup');
        const token = await AsyncStorage.getItem('accessToken');
        console.log('[AuthContext] Token found:', token ? 'Yes' : 'No');
        setAccessToken(token);
        setIsAuthenticated(!!token);
      } catch (error) {
        console.error('[AuthContext] Error checking auth token:', error);
      }
    };
    checkAuth();
  }, []);

  const signIn = async (userData: { accessToken: string; refreshToken: string }) => {
    try {
      console.log('[AuthContext] SignIn called with tokens:');
      console.log('[AuthContext] Access Token Length:', userData.accessToken?.length || 0);
      console.log('[AuthContext] Refresh Token Length:', userData.refreshToken?.length || 0);
      
      // Folosim funcția din tokenStorage pentru a salva tokenurile
      await saveTokens(userData.accessToken, userData.refreshToken);
      
      // Setăm starea în context
      setAccessToken(userData.accessToken);
      setIsAuthenticated(true);
      setUser({ ...userData }); // Store user details if required
      console.log('[AuthContext] Authentication state updated - isAuthenticated:', true);
    } catch (error) {
      console.error('[AuthContext] Error storing auth token:', error);
    }
  };

  const signOut = async () => {
    try {
      console.log('[AuthContext] Signing out...');
      // Ștergem tokenurile folosind funcția din tokenStorage
      await clearTokens();
      
      // Resetăm starea în context
      setAccessToken(null);
      setIsAuthenticated(false);
      setUser(null);
      console.log('[AuthContext] Authentication state reset');
    } catch (error) {
      console.error('[AuthContext] Error removing auth token:', error);
    }
  };

  const signUp = async (userData: { accessToken: string; refreshToken: string }) => {
    try {
      console.log('[AuthContext] SignUp called with tokens:');
      console.log('[AuthContext] Access Token Length:', userData.accessToken?.length || 0);
      console.log('[AuthContext] Refresh Token Length:', userData.refreshToken?.length || 0);
      
      // Folosim funcția din tokenStorage pentru a salva tokenurile
      await saveTokens(userData.accessToken, userData.refreshToken);
      
      // Setăm starea în context
      setAccessToken(userData.accessToken);
      setIsAuthenticated(true);
      setUser({ ...userData });
      console.log('[AuthContext] Authentication state updated for new user - isAuthenticated:', true);
    } catch (error) {
      console.error('[AuthContext] Error storing auth token:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, signIn, signUp, signOut, user, accessToken }}>
      {children}
    </AuthContext.Provider>
  );
};
