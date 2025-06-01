// app/(auth)/login.tsx
import { Link, useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';
import { AuthContext } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeProvider';
import GoogleSignInButton from '@/src/google-sign-in/GoogleSignInButton';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import { saveTokens } from '@/src/Storage/tokenStorage';


const LoginScreen: React.FC = () => {
  const { theme } = useTheme();
  const { signIn } = useContext(AuthContext);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const styles = createStyles(theme);

  const googleLogin = async (idToken: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    console.log('[Login] Starting Google login process...');
    
    try {
      console.log('[Login] Sending authentication request to server...');
      const response = await apiClient.post(BackendRoutes.AUTHENTICATE, { 
        provider: 'GOOGLE', 
        idToken 
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
      
      // Check if the user is new and redirect accordingly
      if (user.isNewUser) {
        // For new users, redirect to signup flow
        console.log('[Login] New user detected, redirecting to signup flow');
        console.log('[Login] Calling signIn with tokens...');
        signIn({accessToken, refreshToken});
        router.push('/signup');
      } else {
        // For existing users, redirect to home
        console.log('[Login] Existing user, redirecting to home');
        console.log('[Login] Calling signIn with tokens...');
        signIn({accessToken, refreshToken});
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
            Join over 10,000 users. Become porn free and learn to be in control
          </Animated.Text>
           
          <Animated.View 
            style={styles.googleSignInContainer}
            entering={FadeInDown.duration(800).delay(500)}
          >
            <GoogleSignInButton signInCallback={googleLogin} />
          </Animated.View>
          
          <Animated.View
            entering={FadeInDown.duration(800).delay(600)}
            style={styles.signupLinkContainer}
          >
            <TouchableOpacity style={styles.signupLink}>
              <Text style={styles.signupText}>Don&apos;t have an account? </Text>
              <Link href="/signup" style={styles.signupLinkText}>
                Sign Up
              </Link>
            </TouchableOpacity>
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
  signupLinkContainer: {
    marginTop: 30,
    padding: 10,
  },
  signupLink: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  signupLinkText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
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
});
