// app/_layout.tsx
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, StatusBar, AppState, Image } from 'react-native';
import { router, Stack, SplashScreen, usePathname } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { apiClient } from '@/src/axios/apiClient';
import { AuthContext, AuthProvider } from '@/src/context/AuthContext';
import { registerDeviceWithBackend } from '@/src/services/pushService';
import { NotificationsProvider } from '@/src/context/NotificationsContext';
import { ThemeProvider } from '@/src/context/ThemeProvider';
import { UserProvider } from '@/src/context/UserContext';
import { LogsProvider } from '@/src/context/LogsContext';
import { JournalProvider } from '@/src/context/JournalContext';
import { AchievementsProvider } from '@/src/context/AchievementsContext';
import { PledgeProvider } from '@/src/context/PledgeContext';
import { getTokens, clearTokens } from '@/src/Storage/tokenStorage';
import HomeOnlyCheckInController from '@/src/components/HomeOnlyCheckInController';
import NotificationInitializer from '@/src/components/NotificationInitializer';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';

// Keep native splash visible for a controlled duration on app start
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [showInitialSplash, setShowInitialSplash] = useState(true);

  // Hide native splash immediately, then show custom SkyStar overlay for 3 seconds
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    const timer = setTimeout(() => {
      setShowInitialSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <AuthProvider>
        <ThemeProvider>
          <NotificationsProvider>
            <UserProvider>
              <LogsProvider>
                <JournalProvider>
                  <AchievementsProvider>
                  <PledgeProvider>
                  <NotificationInitializer />
                  <AuthNavigation />
                  </PledgeProvider>
                  </AchievementsProvider>
                </JournalProvider>
              </LogsProvider>
            </UserProvider>
          </NotificationsProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
    {showInitialSplash && (
      <View style={styles.initialSplash}>
        <GradientBackground ignoreFocus>
          <View style={styles.initialSplashInner}>
            <Image
              source={require('@/assets/images/logo.png')}
              resizeMode="contain"
              style={styles.initialLogo}
            />
          </View>
        </GradientBackground>
      </View>
    )}
    </GestureHandlerRootView>
  );
}

const AuthNavigation: React.FC = () => {
  const { isAuthenticated, signIn, accessToken, setAccessToken, setIsAuthenticated, loading } = useContext(AuthContext);
  const pathname = usePathname();

  // Funcție pentru verificarea și reînnoirea token-urilor
  const checkAndRefreshTokens = async () => {
    try {
      // Get tokens and expiration time
      const { refreshToken, expiresAt, accessToken: storedAccessToken } = await getTokens();
      console.log('refreshToken: ' + (refreshToken ? 'exists' : 'not found'));
      console.log('accessToken: ' + (storedAccessToken ? 'exists' : 'not found'));
      
      if (refreshToken && storedAccessToken) {
        // Check if token is expired or about to expire (within 5 minutes)
        const now = Math.floor(Date.now() / 1000);
        const shouldRefresh = !expiresAt || expiresAt - now < 300;
        
        if (shouldRefresh) {
          console.log('Token expired or about to expire, refreshing...');
          try {
            const response = await apiClient.post('/auth/refresh', { refresh_token: refreshToken });
            const userData = response.data;

            // Use signIn to properly update the auth context and token storage
            await signIn({
              accessToken: userData.access_token,
              refreshToken: userData.refresh_token || refreshToken,
              expiresAt: userData.expires_at,
              refreshExpiresAt: userData.refresh_expires_at,
              user: userData.user
            });
            
            console.log('Token refreshed and auth context updated');
            return true;
          } catch (error) {
            console.error('Error refreshing token:', error);
            // Curățăm token-urile expirate și setăm starea ca neautentificat
            await clearTokens();
            setIsAuthenticated(false);
            return false;
          }
        } else {
          console.log('Token still valid, skipping refresh');
          // Asigurăm-ne că starea este setată corect chiar dacă token-ul este valid
          setAccessToken(storedAccessToken);
          setIsAuthenticated(true);
          // Setăm headerele pentru API client
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedAccessToken}`;
          return true;
        }
      } else {
        console.log('No valid tokens found');
        setIsAuthenticated(false);
        return false;
      }
    } catch (error) {
      console.error('Error checking tokens:', error);
      setIsAuthenticated(false);
      return false;
    }
  };

  // Verificare inițială la pornirea aplicației
  useEffect(() => {
    const bootstrap = async () => {
      const authResult = await checkAndRefreshTokens();
      console.log('Bootstrap complete, authentication result:', authResult);
      console.log('isAuthenticated after bootstrap:', isAuthenticated);
      if (authResult) {
        try {
          registerDeviceWithBackend({ silent: true });
        } catch {}
      }
    };
    bootstrap();
  }, []);

  // Verificare la revenirea aplicației în prim-plan
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active' && isAuthenticated) {
        console.log('App has come to the foreground, checking tokens...');
        checkAndRefreshTokens();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      // Always keep unauthenticated users on login
      if (pathname !== '/login') router.replace('/login');
    } else {
      // When authenticated, redirect only if still on auth/onboarding routes
      if (
        pathname === '/login' ||
        pathname.startsWith('/onboarding') ||
        pathname.startsWith('/(auth)')
      ) {
        router.replace('/(tabs)');
      }
      // Do not force replace when already inside any tab route so tab switching works
    }
  }, [loading, isAuthenticated, pathname]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <>
    <Stack screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/signup" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/analysis-complete" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/goals" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/symptoms" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/subscription" options={{ headerShown: false }} />
        </>
      ) : (
        <>
          <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />

          <Stack.Screen
            name="form-modal"
            options={{
              headerShown: false,
              presentation: 'fullScreenModal',
              animation: 'slide_from_bottom',
            }}
          />
        </>
      )}
    </Stack>
      
      {/* Show daily check-in popup only for authenticated users on the home page */}
      {isAuthenticated && !loading && <HomeOnlyCheckInController />}
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  initialSplash: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  initialSplashInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialLogo: {
    width: 160,
    height: 160,
  },
});