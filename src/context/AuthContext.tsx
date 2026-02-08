// src/context/AuthContext.tsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { Alert } from 'react-native';
import { saveTokens, clearTokens, getTokens } from '@/src/Storage/tokenStorage';
import { apiClient, apiClientImage, refreshTokenManually } from '@/src/axios/apiClient';
import { registerDeviceWithBackend } from '@/src/services/pushService';
import { initRevenueCat, logInRevenueCat, logOutRevenueCat } from '@/src/services/revenueCat';
import { getMonetizationUserId } from '@/src/services/monetizationUserId';
import { clearAuthFlags, extractAuthFlags, saveAuthFlags } from '@/src/Storage/authFlagsStorage';
import { clearCachedAccessStatus, getAccessStatus } from '@/src/services/accessStatus';

interface AuthContextProps {
  isAuthenticated: boolean;
  user: any;
  accessToken: string | null;
  isPremium: boolean | null;
  accessLoading: boolean;
  refreshAccessStatus: (params?: { useCache?: boolean }) => Promise<boolean | null>;
  signIn: (userData: { accessToken: string; refreshToken: string; user?: any; expiresAt?: number; refreshExpiresAt?: number }) => Promise<void>;
  signUp: (userData: { accessToken: string; refreshToken: string; user?: any; expiresAt?: number; refreshExpiresAt?: number }) => Promise<void>;
  signOut: () => void;
  refreshToken: () => Promise<boolean>;
  setAccessToken: (token: string | null) => void;
  setIsAuthenticated: (value: boolean) => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextProps>({
  isAuthenticated: false,
  user: {},
  accessToken: null,
  isPremium: null,
  accessLoading: false,
  refreshAccessStatus: () => Promise.resolve(null),
  signIn: () => Promise.resolve(),
  signUp: () => Promise.resolve(),
  signOut: () => {},
  refreshToken: () => Promise.resolve(false),
  setAccessToken: () => {},
  setIsAuthenticated: () => {},
  loading: true,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any>({});
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authErrorCount, setAuthErrorCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [accessLoading, setAccessLoading] = useState<boolean>(false);

  const PERSISTED_USER_KEY = 'authUser';

  const persistUser = async (userData: any) => {
    try {
      await AsyncStorage.setItem(PERSISTED_USER_KEY, JSON.stringify(userData));
    } catch (e) {
      console.warn('[AuthContext] Failed to persist user:', e);
    }
  };

  const loadPersistedUser = async () => {
    try {
      const raw = await AsyncStorage.getItem(PERSISTED_USER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed);
        try {
          const flags = extractAuthFlags(parsed);
          if (Object.keys(flags).length > 0) await saveAuthFlags(flags);
        } catch {}
        console.log('[AuthContext] Loaded user from storage');
        logInRevenueCat(getRevenueCatUserId(parsed));
      }
    } catch (e) {
      console.warn('[AuthContext] Failed to load user from storage:', e);
    }
  };

  const clearPersistedUser = async () => {
    try {
      await AsyncStorage.removeItem(PERSISTED_USER_KEY);
    } catch (e) {
      console.warn('[AuthContext] Failed to clear persisted user:', e);
    }
  };

  const getRevenueCatUserId = (userData?: any): string | undefined => getMonetizationUserId(userData);

  const refreshAccessStatus = async (params?: { useCache?: boolean }): Promise<boolean | null> => {
    try {
      const t = await getTokens();
      if (!t?.accessToken) {
        setIsPremium(null);
        return null;
      }

      setAccessLoading(true);
      const access = await getAccessStatus({ useCache: params?.useCache !== false });
      setIsPremium(access.isPremium);
      return access.isPremium;
    } catch (e: any) {
      console.warn('[Access] Failed to fetch /access/status:', e?.response?.data || e?.message || e);
      setIsPremium(null);
      return null;
    } finally {
      setAccessLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      // Fetch current user profile after token is set
      const response = await apiClient.get('/users/profile');
      if (response?.data) {
        const incoming = response.data;
        const incomingFlags = extractAuthFlags(incoming);
        const existingFlags = extractAuthFlags(user);
        const merged = {
          ...incoming,
          ...(incomingFlags.signup_complete === undefined && existingFlags.signup_complete !== undefined
            ? { signup_complete: existingFlags.signup_complete }
            : {}),
          ...(incomingFlags.reached_paywall === undefined && existingFlags.reached_paywall !== undefined
            ? { reached_paywall: existingFlags.reached_paywall }
            : {}),
        };
        setUser(merged);
        persistUser(merged);
        try {
          const flags = extractAuthFlags(merged);
          if (Object.keys(flags).length > 0) await saveAuthFlags(flags);
        } catch {}
        console.log('[AuthContext] User profile fetched from API');
        logInRevenueCat(getRevenueCatUserId(merged));
        // Non-blocking: keep backend as source of truth for access state
        refreshAccessStatus({ useCache: true }).catch(() => {});
      }
    } catch (e) {
      console.warn('[AuthContext] Failed to fetch user profile:', (e as any)?.message);
    }
  };

  // Check for existing token on mount
  useEffect(() => {
    initRevenueCat();

    const checkAuth = async () => {
      try {
        console.log('[AuthContext] Starting authentication check...');
        const { accessToken, refreshToken } = await getTokens();
        
        console.log('[AuthContext] Token check result:', { 
          accessTokenExists: !!accessToken, 
          refreshTokenExists: !!refreshToken 
        });
        
        if (accessToken) {
          setAccessToken(accessToken);
          setIsAuthenticated(true);
          console.log('[AuthContext] Existing token found, user is authenticated');
          
          // Set the token in the API client headers
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          apiClientImage.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

          // Load any persisted user immediately to avoid UI fallback
          await loadPersistedUser();

          // Then refresh user data from API in background
          fetchUserProfile();

          // Also refresh access state (backend source of truth)
          refreshAccessStatus({ useCache: true }).catch(() => {});
        } else {
          console.log('[AuthContext] No token found, user is not authenticated');
          setIsAuthenticated(false);
          setIsPremium(null);
        }
      } catch (error) {
        console.error('[AuthContext] Error checking authentication:', error);
        setIsAuthenticated(false);
        setIsPremium(null);
      } finally {
        console.log('[AuthContext] Authentication check complete, setting loading to false');
        setLoading(false);
      }
    };
    
    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resetăm contorul de erori când utilizatorul se autentifică cu succes
  useEffect(() => {
    if (isAuthenticated) {
      setAuthErrorCount(0);
    }
  }, [isAuthenticated]);

  const signIn = async (userData: { accessToken: string; refreshToken: string; user?: any; expiresAt?: number; refreshExpiresAt?: number }) => {
    try {
      console.log('[AuthContext] Signing in user');
      
      // Save tokens
      await saveTokens(
        userData.accessToken,
        userData.refreshToken,
        userData.expiresAt,
        userData.refreshExpiresAt
      );
      
      // Update state
      setAccessToken(userData.accessToken);
      setIsAuthenticated(true);
      
      if (userData.user) {
        setUser(userData.user);
        persistUser(userData.user);
        console.log('[AuthContext] User data set');
        logInRevenueCat(getRevenueCatUserId(userData.user));
        // Persist auth flags for routing (used by interceptors / boot flow)
        try {
          const flags = extractAuthFlags(userData.user);
          if (Object.keys(flags).length > 0) await saveAuthFlags(flags);
        } catch {}
      } else {
        // If user payload not provided, fetch it now
        await fetchUserProfile();
      }
      
      // Set the token in the API client headers
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${userData.accessToken}`;
      apiClientImage.defaults.headers.common['Authorization'] = `Bearer ${userData.accessToken}`;
      
      console.log('[AuthContext] Sign in complete');

      // Non-blocking: refresh backend access state after login
      refreshAccessStatus({ useCache: false }).catch(() => {});

      // Attempt to register device for push notifications (non-blocking)
      try {
        registerDeviceWithBackend({ silent: true });
      } catch {}
    } catch (error) {
      console.error('[AuthContext] Error during sign in:', error);
      // Incrementăm contorul de erori
      setAuthErrorCount(prev => prev + 1);
      
      // Dacă avem mai multe erori consecutive, notificăm utilizatorul
      if (authErrorCount > 2) {
        Alert.alert(
          'Authentication issues',
          'We ran into problems signing you in. Please sign in again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const signUp = async (userData: { accessToken: string; refreshToken: string; user?: any; expiresAt?: number; refreshExpiresAt?: number }) => {
    try {
      console.log('[AuthContext] Signing up user');
      
      // Use the same logic as signIn
      await signIn(userData);
      
      console.log('[AuthContext] Sign up complete');
    } catch (error) {
      console.error('[AuthContext] Error during sign up:', error);
    }
  };

  const signOut = async () => {
    try {
      console.log('[AuthContext] Signing out user');
      
      // Clear tokens
      await clearTokens();
      
      // Clear state
      setAccessToken(null);
      setIsAuthenticated(false);
      setUser({});
      clearPersistedUser();
      logOutRevenueCat();
      clearAuthFlags();
      setIsPremium(null);
      setAccessLoading(false);
      clearCachedAccessStatus().catch(() => {});
      
      // Remove the token from the API client headers
      delete apiClient.defaults.headers.common['Authorization'];
      delete apiClientImage.defaults.headers.common['Authorization'];
      
      console.log('[AuthContext] Sign out complete');
    } catch (error) {
      console.error('[AuthContext] Error during sign out:', error);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      console.log('[AuthContext] Refreshing token');
      
      const newToken = await refreshTokenManually();
      
      if (newToken) {
        setAccessToken(newToken);
        return true;
      } else {
        console.log('[AuthContext] Token refresh failed');
        // Incrementăm contorul de erori
        setAuthErrorCount(prev => prev + 1);
        
        // Dacă avem mai multe erori consecutive, notificăm utilizatorul
        if (authErrorCount > 2) {
          Alert.alert(
            'Session expired',
            'Your session has expired. Please sign in again.',
            [{ text: 'OK' }]
          );
          // Deconectăm utilizatorul după prea multe încercări eșuate
          await signOut();
        }
        return false;
      }
    } catch (error) {
      console.error('[AuthContext] Error refreshing token:', error);
      // Incrementăm contorul de erori
      setAuthErrorCount(prev => prev + 1);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        signIn,
        signUp,
        signOut,
        user,
        accessToken,
        isPremium,
        accessLoading,
        refreshAccessStatus,
        refreshToken,
        setAccessToken,
        setIsAuthenticated,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
