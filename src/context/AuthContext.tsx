// src/context/AuthContext.tsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useState, ReactNode, useEffect } from 'react';

interface AuthContextProps {
  isAuthenticated: boolean;
  user: any;
  signIn: (userData: { accessToken: string; refreshToken: string }) => void;
  signUp: (userData: { accessToken: string; refreshToken: string }) => void;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextProps>({
  isAuthenticated: false,
  user: {},
  signIn: () => {},
  signUp: () => {},
  signOut: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

const AUTH_KEY = 'AUTH_TOKEN'; // Key for AsyncStorage

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem(AUTH_KEY);
        console.log('AuthContext::::: ' + 'token=' + token);
        setIsAuthenticated(!!token);
      } catch (error) {
        console.error('Error checking auth token:', error);
      }
    };
    checkAuth();
  }, []);

  const signIn = async (userData: { accessToken: string; refreshToken: string }) => {
    try {
      await AsyncStorage.setItem(AUTH_KEY, userData.accessToken);
      await AsyncStorage.setItem('refreshToken', userData.refreshToken);
      setIsAuthenticated(true);
      setUser(userData); // Store user details if required
    } catch (error) {
      console.error('Error storing auth token:', error);
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.clear(); // Clear all storage
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Error removing auth token:', error);
    }
  };

  const signUp = async (userData: { accessToken: string; refreshToken: string }) => {
    try {
      await AsyncStorage.setItem(AUTH_KEY, userData.accessToken);
      await AsyncStorage.setItem('refreshToken', userData.refreshToken);
      setIsAuthenticated(true);
      setUser(userData);
      console.log('Tokens stored successfully during signup');
    } catch (error) {
      console.error('Error storing auth token:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, signIn, signUp, signOut, user}}>
      {children}
    </AuthContext.Provider>
  );
};
