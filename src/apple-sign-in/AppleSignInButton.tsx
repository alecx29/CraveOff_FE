import React, { useState, useContext } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '@/src/context/ThemeProvider';
import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';
import { AuthContext } from '@/src/context/AuthContext';
import { saveTokens } from '@/src/Storage/tokenStorage';

export default function AppleSignInButton() {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const isIOS = Platform.OS === 'ios';
  const [isAppleAuthAvailable, setIsAppleAuthAvailable] = useState<boolean | null>(null);
  const router = useRouter();
  const { signIn } = useContext(AuthContext);

  // Check if Apple Authentication is available
  React.useEffect(() => {
    async function checkAvailability() {
      if (isIOS) {
        console.log('[AppleSignIn] Checking Apple Authentication availability on component mount...');
        try {
          const available = await AppleAuthentication.isAvailableAsync();
          console.log('[AppleSignIn] Apple Authentication available:', available);
          setIsAppleAuthAvailable(available);
        } catch (error) {
          console.error('[AppleSignIn] Error checking availability:', error);
          setIsAppleAuthAvailable(false);
        }
      } else {
        setIsAppleAuthAvailable(false);
      }
    }
    
    checkAvailability();
  }, [isIOS]);

  // Handle the backend authentication with the ID token
  async function handleBackendAuthentication(identityToken: string) {
    try {
      console.log('[AppleSignIn] Sending authentication request to server...');
      const response = await apiClient.post(BackendRoutes.AUTHENTICATE, { 
        provider: 'APPLE', 
        idToken: identityToken 
      });
      
      console.log('[AppleSignIn] Authentication successful, processing response');
      console.log('[AppleSignIn] Full response structure:', JSON.stringify(response.data, null, 2));
      
      const { session, user } = response.data;
      console.log('[AppleSignIn] Session object:', JSON.stringify(session, null, 2));
      
      // Extract tokens
      const accessToken = session.access_token || session.accessToken;
      const refreshToken = session.refresh_token || session.refreshToken;
      
      console.log('[AppleSignIn] Extracted tokens:');
      console.log('[AppleSignIn] Access Token:', accessToken?.substring(0, 10) + '...');
      console.log('[AppleSignIn] Refresh Token:', refreshToken?.substring(0, 10) + '...');
      
      if (!accessToken || !refreshToken) {
        console.error('[AppleSignIn] ERROR: Missing tokens in response!');
        Alert.alert('Authentication Error', 'Token information missing from response');
        return;
      }
      
      console.log('[AppleSignIn] Saving tokens using tokenStorage...');
      await saveTokens(accessToken, refreshToken);
      console.log('[AppleSignIn] Tokens saved successfully');
      
      // Save authentication state
      await signIn({
        accessToken, 
        refreshToken,
        user
      });
      
      // Add a small delay to ensure token is properly stored and available for subsequent requests
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check user status and redirect accordingly
      if (user.isNewUser) {
        // For new users, save the idToken for later use in signup-complete
        console.log('[AppleSignIn] New user detected, saving idToken for signup-complete');
        await AsyncStorage.setItem('appleIdToken', identityToken);
        
        // Redirect to signup flow
        console.log('[AppleSignIn] Redirecting to signup flow');
        router.push('/signup');
      } else if (user.signup_complete === false) {
        // For users who haven't completed signup, redirect to symptoms
        console.log('[AppleSignIn] Incomplete signup detected, redirecting to symptoms screen');
        router.push('/(auth)/symptoms');
      } else {
        // For existing users with completed signup, redirect to home
        console.log('[AppleSignIn] Existing user with completed signup, redirecting to home');
        router.push('/');
      }
    } catch (error: any) {
      console.error('[AppleSignIn] Apple login error:', error.response?.data || error.message);
      console.error('[AppleSignIn] Full error:', error);
      Alert.alert(
        'Login Error', 
        error.response?.data?.message || 'Failed to login with Apple. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Handle sign-in
  async function handleSignInWithApple() {
    if (!isIOS) {
      Alert.alert(
        "Not Available",
        "Apple Sign In is currently only available on iOS devices.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      setIsLoading(true);
      console.log('[AppleSignIn] Starting Apple sign-in process...');
      
      // Sărim peste verificarea disponibilității în build-ul de dezvoltare
      console.log('[AppleSignIn] Încercăm autentificarea direct, fără verificare de disponibilitate');
      
      try {
        // Încercăm direct autentificarea
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });
        
        console.log('[AppleSignIn] Sign-in successful, credential received');
        
        // Get the identity token from the credential
        const { identityToken } = credential;
        
        if (identityToken) {
          console.log('✅ Apple ID Token received');
          await handleBackendAuthentication(identityToken);
        } else {
          console.error('🚨 No identity token received from Apple');
          Alert.alert(
            "Authentication Error",
            "No identity token received from Apple. Please try again.",
            [{ text: "OK" }]
          );
          setIsLoading(false);
        }
      } catch (signInError: any) {
        setIsLoading(false);
        console.error('🚨 Apple Sign-In failed:', signInError);
        
        // Handle user cancellation
        if (signInError.code === 1000) { // AppleAuthentication user canceled request
          console.log('User cancelled the login flow');
        } else {
          console.log('Apple authentication error:', signInError.message);
          console.log('Error code:', signInError.code);
          Alert.alert(
            "Authentication Error",
            `Apple Sign In failed: ${signInError.message} (Code: ${signInError.code})`,
            [{ text: "OK" }]
          );
        }
      }
    } catch (error: any) {
      setIsLoading(false);
      console.error('🚨 Unexpected error in handleSignInWithApple:', error);
      Alert.alert(
        "Error",
        `Unexpected error: ${error.message}`,
        [{ text: "OK" }]
      );
    }
  }

  // Apple logo SVG component
  const AppleLogo = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        fill={theme.colors.textPrimary}
        d="M17.05 20.28c-.98.95-2.05.86-3.08.38-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.38C2.79 15.15 3.51 7.2 9.05 6.97c1.65.08 2.78.94 3.75.94 1.06 0 2.03-.96 3.75-.92 1.36.03 2.6.56 3.47 1.53-3.13 1.83-2.62 5.67.22 7.08-.64 1.39-1.49 2.75-3.19 4.68z"
      />
      <Path
        fill={theme.colors.textPrimary}
        d="M12.77 4.05c.06-1.23.88-2.94 2.87-3.78.14 1.6-.37 3.12-1.27 4.06-.92.98-2.4 1.52-3.44 1.4-.15-1.53.77-2.97 1.84-3.68z"
      />
    </Svg>
  );

  // Use AppleAuthentication.AppleAuthenticationButton on iOS if available
  if (isIOS && isAppleAuthAvailable === true) {
    return (
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={theme.borderRadius.medium}
        style={styles.appleButton}
        onPress={handleSignInWithApple}
      />
    );
  }

  // Fallback button for non-iOS platforms or when Apple Authentication is not available
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { 
          backgroundColor: theme.colors.cardBackground,
          borderColor: '#E0E0E0',
          borderRadius: theme.borderRadius.medium,
        },
        isLoading ? { opacity: 0.6 } : null
      ]}
      onPress={handleSignInWithApple}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={theme.colors.primary} />
      ) : (
        <View style={styles.buttonContent}>
          <View style={styles.iconWrapper}>
            <AppleLogo />
          </View>
          <Text 
            style={[
              styles.buttonText,
              { color: theme.colors.textPrimary }
            ]}
          >
            Sign in with Apple
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    paddingHorizontal: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appleButton: {
    height: 52,
    width: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginRight: 12,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 