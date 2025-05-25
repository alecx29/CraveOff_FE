// app/_layout.tsx
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack } from 'expo-router';

import { apiClient } from '@/src/axios/apiClient';
import { AuthContext, AuthProvider } from '@/src/context/AuthContext';
import { NotificationsProvider } from '@/src/context/NotificationsContext';
import { ThemeProvider } from '@/src/context/ThemeProvider';
import { UserProvider } from '@/src/context/UserContext';
import { getTokens } from '@/src/Storage/tokenStorage';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationsProvider>
            <UserProvider>
              <AuthNavigation />
            </UserProvider>
        </NotificationsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

const AuthNavigation: React.FC = () => {
  const { isAuthenticated, signIn } = useContext(AuthContext);
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    const bootstrap = async () => {
      const { refreshToken } = await getTokens();
      console.log('refreshToken: ' + refreshToken)
      if (refreshToken) {
        try {
          console.log('post refresh call')
          const response = await apiClient.post('/auth/refresh', { refreshToken });
          const userData = response.data;

          // Save the new access token and update the context
          await AsyncStorage.setItem('accessToken', userData.accessToken);
          signIn(userData); // Set user as authenticated
        } catch (error) {
          console.error('Error refreshing token on app launch:', error);
        }
      }
      setLoading(false);
      console.log('isAuthenticated: ' + isAuthenticated)
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
    <Stack>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)signup" options={{ headerShown: false }} />
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