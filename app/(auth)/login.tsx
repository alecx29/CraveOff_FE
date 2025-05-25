// app/(auth)/login.tsx
import { Link, useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';
import { AuthContext } from '@/src/context/AuthContext';
import GoogleSignInButton from '@/src/google-sign-in/GoogleSignInButton';
import { saveTokens } from '@/src/Storage/tokenStorage';


const LoginScreen: React.FC = () => {
  const { signIn } = useContext(AuthContext);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const googleLogin = async (idToken: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const response = await apiClient.post(BackendRoutes.LOGIN, { 
        provider: 'GOOGLE', 
        idToken 
      });
      
      const { accessToken, refreshToken } = response.data;
      await saveTokens(accessToken, refreshToken);
      console.log('Google login successful:', response.data);
      signIn(response.data);
      router.push('/');
    } catch (error: any) {
      console.error('Google login error:', error.response?.data || error.message);
      Alert.alert(
        'Eroare de autentificare', 
        error.response?.data?.message || 'Autentificare eșuată cu Google. Încearcă din nou.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
         
      <View style={styles.googleSignInContainer}>
        <GoogleSignInButton signInCallback={googleLogin} />
      </View>
      
      <TouchableOpacity style={styles.signupLink}>
        <Text style={styles.signupText}>Don't have an account? </Text>
        <Link href="/signup" style={styles.signupLinkText}>
          Sign Up
        </Link>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    marginBottom: 24,
    textAlign: 'center',
  },
  signupLink: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'center',
  },
  signupText: {
    color: '#ccc',
    fontSize: 16,
  },
  signupLinkText: {
    color: '#ffd33d',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  googleSignInContainer: {
    marginBottom: 24,
  },
});
