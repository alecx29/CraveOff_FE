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
  async function handleBackendAuthentication(identityToken: string, additionalData?: any) {
    try {
      console.log('[AppleSignIn] Sending authentication request to server...');
      
      // Backend expects camelCase idToken
      const requestBody = { 
        provider: 'apple', 
        idToken: identityToken
      };
      
      // Add additional data if available
      if (additionalData) {
        console.log('[AppleSignIn] Additional data available:', JSON.stringify(additionalData, null, 2));
        
        // Note: Not including additional data in request for now to simplify debugging
      }
      
      console.log('[AppleSignIn] Request body:', JSON.stringify(requestBody, null, 2));
      console.log('[AppleSignIn] ID Token length:', identityToken?.length);
      console.log('[AppleSignIn] ID Token preview:', identityToken?.substring(0, 50) + '...');
      
      const response = await apiClient.post(BackendRoutes.AUTHENTICATE, requestBody);
      
      console.log('[AppleSignIn] ========== APPLE SIGN-IN SUCCESS DEBUG ==========');
      console.log('[AppleSignIn] Response status:', response.status);
      console.log('[AppleSignIn] Response headers:', JSON.stringify(response.headers, null, 2));
      console.log('[AppleSignIn] Response data (full):', JSON.stringify(response.data, null, 2));
      console.log('[AppleSignIn] Response config URL:', response.config?.url);
      console.log('[AppleSignIn] Response config method:', response.config?.method);
      console.log('[AppleSignIn] ================================================');
      
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
        // Save metadata for provider and timestamp
        await AsyncStorage.setItem('lastAuthProvider', 'apple');
        await AsyncStorage.setItem('idTokenSavedAt', Date.now().toString());
        // Ensure opposite provider token is cleared to avoid ambiguity
        await AsyncStorage.removeItem('googleIdToken');
        
        // Redirect to signup flow
        console.log('[AppleSignIn] Redirecting to signup flow');
        router.push('/signup');
      } else if (user.signup_complete === false) {
        // For users who haven't completed signup, persist identityToken for signup-complete
        if (identityToken) {
          console.log('[AppleSignIn] Incomplete signup: saving Apple idToken for signup-complete');
          await AsyncStorage.setItem('appleIdToken', identityToken);
          await AsyncStorage.setItem('lastAuthProvider', 'apple');
          await AsyncStorage.setItem('idTokenSavedAt', Date.now().toString());
          await AsyncStorage.removeItem('googleIdToken');
        } else {
          console.warn('[AppleSignIn] Incomplete signup but identityToken missing. Skipping storage');
        }

        // Redirect to symptoms
        console.log('[AppleSignIn] Incomplete signup detected, redirecting to symptoms screen');
        router.push('/(auth)/symptoms');
      } else {
        // For existing users with completed signup, redirect to home
        console.log('[AppleSignIn] Existing user with completed signup, redirecting to home');
        router.push('/');
      }
    } catch (error: any) {
      console.error('[AppleSignIn] ========== APPLE SIGN-IN ERROR DEBUG ==========');
      console.error('[AppleSignIn] Error type:', typeof error);
      console.error('[AppleSignIn] Error message:', error.message);
      console.error('[AppleSignIn] Error code:', error.code);
      
      if (error.response) {
        console.error('[AppleSignIn] Response status:', error.response.status);
        console.error('[AppleSignIn] Response headers:', JSON.stringify(error.response.headers, null, 2));
        console.error('[AppleSignIn] Response data (full):', JSON.stringify(error.response.data, null, 2));
        console.error('[AppleSignIn] Response config URL:', error.response.config?.url);
        console.error('[AppleSignIn] Response config method:', error.response.config?.method);
        console.error('[AppleSignIn] Response config data:', error.response.config?.data);
      } else if (error.request) {
        console.error('[AppleSignIn] Request made but no response:', error.request);
      } else {
        console.error('[AppleSignIn] Error setting up request:', error.message);
      }
      
      console.error('[AppleSignIn] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      console.error('[AppleSignIn] ================================================');
      
      Alert.alert(
        'Login Error', 
        error.response?.data?.message || error.response?.data?.detail || 'Failed to login with Apple. Please try again.'
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

    // Check if Apple Authentication is available before proceeding
    if (isAppleAuthAvailable === false) {
      Alert.alert(
        "Not Available",
        "Apple Sign In is not available on this device. This feature requires a development build with native modules.",
        [{ text: "OK" }]
      );
      return;
    }

    // Wait for availability check to complete
    if (isAppleAuthAvailable === null) {
      Alert.alert(
        "Please Wait",
        "Checking Apple Sign In availability...",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      setIsLoading(true);
      console.log('[AppleSignIn] Starting Apple sign-in process...');
      
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      console.log('[AppleSignIn] Sign-in successful, credential received');
      console.log('[AppleSignIn] Full credential object:', JSON.stringify(credential, null, 2));
      
      // Get the identity token from the credential
      const { identityToken, authorizationCode, email, fullName } = credential;
      
      if (identityToken) {
        console.log('✅ Apple ID Token received');
        await handleBackendAuthentication(identityToken, { authorizationCode, email, fullName });
      } else {
        console.error('🚨 No identity token received from Apple');
        Alert.alert(
          "Authentication Error",
          "No identity token received from Apple. Please try again.",
          [{ text: "OK" }]
        );
        setIsLoading(false);
      }
    } catch (error: any) {
      setIsLoading(false);
      console.error('🚨 Apple Sign-In failed:', error);
      
      // Handle specific error codes
      if (error.code === 1000) { // User canceled
        console.log('User cancelled the login flow');
        return;
      }
      
      if (error.code === 'ERR_UNAVAILABLE') {
        Alert.alert(
          "Not Available",
          "Apple Sign In is not available. Please use a development build or try another sign-in method.",
          [{ text: "OK" }]
        );
        return;
      }
      
      console.log('Apple authentication error:', error.message);
      console.log('Error code:', error.code);
      Alert.alert(
        "Authentication Error",
        `Apple Sign In failed: ${error.message}`,
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

  // Don't render anything on Android - hide completely
  if (!isIOS) {
    return null;
  }

  // Always use a custom button to force English label across locales

  // Show loading or unavailable state only on iOS
  const isCheckingAvailability = isAppleAuthAvailable === null;
  const isUnavailable = isAppleAuthAvailable === false;
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { 
          backgroundColor: theme.colors.cardBackground,
          borderColor: '#E0E0E0',
          borderRadius: theme.borderRadius.medium,
        },
        (isLoading || isUnavailable) ? { opacity: 0.6 } : null
      ]}
      onPress={handleSignInWithApple}
      disabled={isLoading || isUnavailable || isCheckingAvailability}
      activeOpacity={0.8}
    >
      {isLoading || isCheckingAvailability ? (
        <ActivityIndicator size="small" color={theme.colors.primary} />
      ) : (
        <View style={styles.buttonContent}>
          <View style={styles.iconWrapper}>
            <AppleLogo />
          </View>
          <Text 
            style={[
              styles.buttonText,
              { 
                color: isUnavailable ? theme.colors.textSecondary : theme.colors.textPrimary 
              }
            ]}
          >
            {isUnavailable ? 'Apple Sign In (Unavailable)' : 'Sign in with Apple'}
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