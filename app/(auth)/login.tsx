// app/(auth)/login.tsx
import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import { Alert, StyleSheet, View, Image, TouchableOpacity, Text, Platform } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Constants from 'expo-constants';

import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';
import { AuthContext } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeProvider';
import GoogleSignInButton from '@/src/google-sign-in/GoogleSignInButton';
import { AppleSignInButton } from '@/src/apple-sign-in';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import { saveTokens } from '@/src/Storage/tokenStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';


const LoginScreen: React.FC = () => {
  const { theme } = useTheme();
  const { signIn } = useContext(AuthContext);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDevAppleLoading, setIsDevAppleLoading] = useState(false);
  const styles = createStyles(theme);
  
  // Check if we're in development mode - show dev button for apple-signin channel or development builds
  const isDevelopment = 
    Constants.expoConfig?.extra?.eas?.build?.channel === 'apple-signin' || 
    process.env.NODE_ENV === 'development' ||
    __DEV__;

  const googleLogin = async (idToken: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    console.log('[Login] Starting Google login process...');
    
    try {
      console.log('[Login] Sending authentication request to server...');
      const response = await apiClient.post(BackendRoutes.AUTHENTICATE, { 
        provider: 'google', 
        idToken: idToken 
      });
      
      console.log('[Login] Authentication successful, processing response');
      console.log('[Login] Full response structure:', JSON.stringify(response.data, null, 2));
      
      const { session, user } = response.data;
      console.log('[Login] Session object:', JSON.stringify(session, null, 2));
      
      // Verificăm exact ce cheie folosește serverul pentru tokens
      const accessToken = session.access_token || session.accessToken;
      const refreshToken = session.refresh_token || session.refreshToken;
      
      console.log('[Login] Extracted tokens:');
      console.log('[Login] Access Token:', accessToken?.substring(0, 10) + '...');
      console.log('[Login] Refresh Token:', refreshToken?.substring(0, 10) + '...');
      
      if (!accessToken || !refreshToken) {
        console.error('[Login] ERROR: Missing tokens in response!');
        Alert.alert('Authentication Error', 'Token information missing from response');
        setIsLoading(false);
        return;
      }
      
      console.log('[Login] Saving tokens using tokenStorage...');
      await saveTokens(accessToken, refreshToken);
      console.log('[Login] Tokens saved successfully');
      
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
        const isValidIdToken = (token?: string | null) => {
          if (!token) return false;
          const trimmed = token.trim();
          if (!trimmed) return false;
          const lowered = trimmed.toLowerCase();
          if (lowered === 'null' || lowered === 'undefined') return false;
          return true;
        };

        if (isValidIdToken(idToken)) {
          console.log('[Login] New user detected, saving idToken for signup-complete');
          await AsyncStorage.setItem('googleIdToken', idToken.trim());
        } else {
          console.warn('[Login] New user detected but idToken invalid. Skipping storage for signup-complete');
        }
        
        // Redirect to signup flow
        console.log('[Login] Redirecting to signup flow');
        router.push('/signup');
      } else if (user.signup_complete === false) {
        // For users who haven't completed signup, redirect to symptoms
        console.log('[Login] Incomplete signup detected, redirecting to symptoms screen');
        router.push('/(auth)/symptoms');
      } else {
        // For existing users with completed signup, redirect to home
        console.log('[Login] Existing user with completed signup, redirecting to home');
        router.push('/');
      }
    } catch (error: any) {
      console.error('[Login] Google login error:', error.response?.data || error.message);
      console.error('[Login] Full error:', error);
      Alert.alert(
        'Login Error', 
        error.response?.data?.message || 'Failed to login with Google. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Development-only Apple Sign In
  const handleDevAppleSignIn = async () => {
    if (isDevAppleLoading) return;
    
    setIsDevAppleLoading(true);
    console.log('[DevLogin] Starting dev Apple login process...');
    
    try {
      console.log('[DevLogin] Sending authentication request to server...');
      const response = await apiClient.post(BackendRoutes.DEV_LOGIN, { 
        provider: 'APPLE',
        signup_complete: true
      });
      
      console.log('[DevLogin] Authentication successful, processing response');
      console.log('[DevLogin] Full response structure:', JSON.stringify(response.data, null, 2));
      
      const { session, user } = response.data;
      console.log('[DevLogin] Session object:', JSON.stringify(session, null, 2));
      
      const accessToken = session.access_token || session.accessToken;
      const refreshToken = session.refresh_token || session.refreshToken;
      
      console.log('[DevLogin] Extracted tokens:');
      console.log('[DevLogin] Access Token:', accessToken?.substring(0, 10) + '...');
      console.log('[DevLogin] Refresh Token:', refreshToken?.substring(0, 10) + '...');
      
      if (!accessToken || !refreshToken) {
        console.error('[DevLogin] ERROR: Missing tokens in response!');
        Alert.alert('Authentication Error', 'Token information missing from response');
        setIsDevAppleLoading(false);
        return;
      }
      
      console.log('[DevLogin] Saving tokens using tokenStorage...');
      await saveTokens(accessToken, refreshToken);
      console.log('[DevLogin] Tokens saved successfully');
      
      // Save authentication state
      await signIn({
        accessToken, 
        refreshToken,
        user
      });
      
      // Add a small delay to ensure token is properly stored and available for subsequent requests
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // For dev login, always treat as completed signup
      console.log('[DevLogin] Dev login successful, redirecting to home');
      router.push('/');
    } catch (error: any) {
      console.error('[DevLogin] Dev Apple login error:', error.response?.data || error.message);
      console.error('[DevLogin] Full error:', error);
      Alert.alert(
        'Login Error', 
        error.response?.data?.message || 'Failed to login with Dev Apple. Please try again.'
      );
    } finally {
      setIsDevAppleLoading(false);
    }
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <Animated.View 
          style={styles.content}
          entering={FadeIn.duration(600)}
        >
          <Animated.View
            style={styles.logoContainer}
            entering={FadeInDown.duration(800).delay(200)}
          >
            <Image 
              source={require('@/assets/images/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
          
          <Animated.Text 
            style={styles.title}
            entering={FadeInDown.duration(800).delay(300)}
          >
            Welcome to the CraveOff community
          </Animated.Text>
          
          <Animated.Text 
            style={styles.subtitle}
            entering={FadeInDown.duration(800).delay(400)}
          >
            Join over our comunity of users. Become porn free and learn to be in control
          </Animated.Text>
           
          <Animated.View 
            style={styles.googleSignInContainer}
            entering={FadeInDown.duration(800).delay(500)}
          >
            <GoogleSignInButton signInCallback={googleLogin} />
            
            {Platform.OS === 'ios' && <View style={styles.buttonSpacer} />}
            
            <AppleSignInButton />

            {isDevelopment && Platform.OS === 'ios' && (
              <>
                <View style={styles.buttonSpacer} />
                
                <TouchableOpacity
                  style={[
                    styles.devButton,
                    isDevAppleLoading ? { opacity: 0.6 } : null
                  ]}
                  onPress={handleDevAppleSignIn}
                  disabled={isDevAppleLoading}
                >
                  <Text style={styles.devButtonText}>
                    DEV ONLY - Apple Sign In
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </Animated.View>
      </View>
    </GradientBackground>
  );
};

export default LoginScreen;

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    padding: 30,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 70,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 24,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.borderLight,
  },
  dividerText: {
    color: theme.colors.textMuted,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  googleSignInContainer: {
    width: '100%',
    marginTop: 20,
  },
  buttonSpacer: {
    height: 16,
  },
  devButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#FFFF00',
    borderStyle: 'dashed',
  },
  devButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
