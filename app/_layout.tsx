// app/_layout.tsx
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { apiClient } from '@/src/axios/apiClient';
import { AuthContext, AuthProvider } from '@/src/context/AuthContext';
import { NotificationsProvider } from '@/src/context/NotificationsContext';
import { ThemeProvider } from '@/src/context/ThemeProvider';
import { UserProvider } from '@/src/context/UserContext';
import { LogsProvider } from '@/src/context/LogsContext';
import { JournalProvider } from '@/src/context/JournalContext';
import { PledgeProvider } from '@/src/context/PledgeContext';
import { getTokens } from '@/src/Storage/tokenStorage';
import HomeOnlyCheckInController from '@/src/components/HomeOnlyCheckInController';
import NotificationInitializer from '@/src/components/NotificationInitializer';

export default function RootLayout() {
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
                  <PledgeProvider>
                  <NotificationInitializer />
                  <AuthNavigation />
                  </PledgeProvider>
                </JournalProvider>
              </LogsProvider>
            </UserProvider>
          </NotificationsProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const AuthNavigation: React.FC = () => {
  const { isAuthenticated, signIn, accessToken, setAccessToken, setIsAuthenticated } = useContext(AuthContext);
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    const bootstrap = async () => {
      // Get tokens and expiration time
      const { refreshToken, expiresAt } = await getTokens();
      console.log('refreshToken: ' + (refreshToken ? 'exists' : 'not found'));
      
      if (refreshToken) {
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
          } catch (error) {
            console.error('Error refreshing token on app launch:', error);
          }
        } else {
          console.log('Token still valid, skipping refresh');
          // We don't need to manually set authentication state here
          // The AuthContext already handles this in its useEffect
        }
      }
      setLoading(false);
      console.log('isAuthenticated: ' + isAuthenticated);
    };
    bootstrap();
  }, []);

  useEffect(() => {
    console.log(loading, isAuthenticated)
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated]);

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
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
});