import React, { useContext, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

import { useTheme } from '@/src/context/ThemeProvider';
import { apiClient } from '@/src/axios/apiClient';
import { AuthContext } from '@/src/context/AuthContext';
import { BackendRoutes } from '@/src/axios/backendRoutes';

interface FreeJourneyContentProps {
  onContinue: () => void;
}

interface FeatureItem {
  text: string;
  icon: string;
}

const FreeJourneyContent: React.FC<FreeJourneyContentProps> = ({ onContinue }) => {
  const { theme } = useTheme();
  const { signIn } = useContext(AuthContext);
  const styles = createStyles(theme);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Helpers
  const isValidToken = (token?: string | null) => {
    if (!token) return false;
    const trimmed = token.trim();
    if (!trimmed) return false;
    const lowered = trimmed.toLowerCase();
    if (lowered === 'null' || lowered === 'undefined') return false;
    return true;
  };

  const decodeJwtExp = (token?: string | null): number | undefined => {
    try {
      if (!isValidToken(token)) return undefined;
      const parts = token!.split('.');
      if (parts.length < 2) return undefined;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload?.exp === 'number' ? payload.exp : undefined;
    } catch {
      return undefined;
    }
  };

  const ensureFreshIdToken = async (): Promise<{ idToken?: string; provider?: 'google' | 'apple' }> => {
    const [rawGoogleIdToken, rawAppleIdToken, lastAuthProvider] = await Promise.all([
      AsyncStorage.getItem('googleIdToken'),
      AsyncStorage.getItem('appleIdToken'),
      AsyncStorage.getItem('lastAuthProvider')
    ]);

    let provider: 'google' | 'apple' | undefined;
    let idToken = isValidToken(rawGoogleIdToken) ? rawGoogleIdToken!.trim() : undefined;
    if (isValidToken(rawAppleIdToken)) {
      provider = 'apple';
      idToken = rawAppleIdToken!.trim();
    } else if (isValidToken(rawGoogleIdToken)) {
      provider = 'google';
      idToken = rawGoogleIdToken!.trim();
    }
    if (lastAuthProvider === 'google' && isValidToken(rawGoogleIdToken)) provider = 'google';
    if (lastAuthProvider === 'apple' && isValidToken(rawAppleIdToken)) provider = 'apple';

    // Determine near-expiry window (<= 120s)
    const exp = decodeJwtExp(idToken);
    const nowSec = Math.floor(Date.now() / 1000);
    const nearExpiry = exp !== undefined ? exp - nowSec <= 120 : false;

    // Try refresh if missing or near expiry
    if (!idToken || !provider || nearExpiry) {
      // Google silent first
      if (provider === 'google' || (!provider && isValidToken(rawGoogleIdToken))) {
        try {
          const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
          const tokens = await GoogleSignin.getTokens();
          if (tokens?.idToken) {
            await AsyncStorage.setItem('googleIdToken', tokens.idToken);
            await AsyncStorage.setItem('lastAuthProvider', 'google');
            await AsyncStorage.setItem('idTokenSavedAt', Date.now().toString());
            return { idToken: tokens.idToken, provider: 'google' };
          }
        } catch {}
      }

      // Interactive path
      if (provider === 'google' || (!provider && !isValidToken(rawAppleIdToken))) {
        try {
          const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
          await GoogleSignin.hasPlayServices();
          const userInfo = await GoogleSignin.signIn();
          // @ts-ignore
          const freshRaw = userInfo?.idToken || userInfo?.data?.idToken;
          const freshIdToken: string | undefined = typeof freshRaw === 'string' ? freshRaw : undefined;
          if (isValidToken(freshIdToken)) {
            await AsyncStorage.setItem('googleIdToken', freshIdToken!.trim());
            await AsyncStorage.setItem('lastAuthProvider', 'google');
            await AsyncStorage.setItem('idTokenSavedAt', Date.now().toString());
            return { idToken: freshIdToken!.trim(), provider: 'google' };
          }
        } catch {}
      }

      if (provider === 'apple' || (!provider && !isValidToken(rawGoogleIdToken))) {
        try {
          const AppleAuth = await import('expo-apple-authentication');
          // @ts-ignore
          if (await AppleAuth.isAvailableAsync?.()) {
            // @ts-ignore
            const credential = await AppleAuth.signInAsync?.({
              requestedScopes: [
                // @ts-ignore
                AppleAuth.AppleAuthenticationScope.FULL_NAME,
                // @ts-ignore
                AppleAuth.AppleAuthenticationScope.EMAIL,
              ],
            });
            const freshRaw = credential?.identityToken;
            const freshIdToken: string | undefined = typeof freshRaw === 'string' ? freshRaw : undefined;
            if (isValidToken(freshIdToken)) {
              await AsyncStorage.setItem('appleIdToken', freshIdToken!.trim());
              await AsyncStorage.setItem('lastAuthProvider', 'apple');
              await AsyncStorage.setItem('idTokenSavedAt', Date.now().toString());
              return { idToken: freshIdToken!.trim(), provider: 'apple' };
            }
          }
        } catch {}
      }
      return {};
    }

    return { idToken, provider };
  };

  // Features with icons
  const features: FeatureItem[] = [
    { text: 'Personalized recovery plan', icon: 'document-text' },
    { text: 'Progress tracking', icon: 'trending-up' },
    { text: 'Community support', icon: 'people' },
    { text: 'Advanced analytics', icon: 'analytics' },
    { text: 'Exclusive premium content', icon: 'star' },
  ];
  
  // Handler for continue button with API calls
  const handleContinue = async () => {
    // Set loading state to true when starting API calls
    setIsLoading(true);
    
    try {
      // Ensure we have a fresh idToken just-in-time
      const { idToken, provider } = await ensureFreshIdToken();
      
      console.log('Using idToken for signup-complete:', idToken ? 'Yes (valid)' : 'No (not found)');
      console.log('Provider detected:', provider || 'none');

      const effectiveIdToken = idToken;
      
      // Prepare request body
      const resolvedTimeZone = (Intl as any)?.DateTimeFormat?.().resolvedOptions?.().timeZone || (Intl as any)?.resolvedOptions?.().timeZone || 'UTC';
      const tzOffsetMinutes = new Date().getTimezoneOffset();
      console.log('[SignupComplete] Detected timezone:', resolvedTimeZone);
      console.log('[SignupComplete] Current GMT offset (minutes):', tzOffsetMinutes, '=> hours:', -(tzOffsetMinutes / 60));
      const requestBody: any = { 
        signup_complete: true,
        timezone: resolvedTimeZone
      };
      
      // Add idToken and provider only if we have a valid token and matching provider
      if (effectiveIdToken && provider) {
        requestBody.idToken = effectiveIdToken;
        requestBody.provider = provider;
      }
      
      console.log('Signup-complete request body:', JSON.stringify(requestBody, null, 2));
      
      // If provider is missing or idToken is missing, log and proceed with minimal body
      if (!provider || !effectiveIdToken) {
        console.warn('Proceeding with signup-complete without idToken/provider. This may cause backend 500 if required.');
      }

      // First API call: Mark signup as complete, including the idToken and provider if available
      const doRequest = async () => apiClient.post(BackendRoutes.SIGNUP_COMPLETE_AUTH, requestBody);
      let response = await doRequest();
      console.log('Signup marked as complete');
      console.log('Response structure:', JSON.stringify(response.data, null, 2));
      
      // Handle authentication response like authenticate action
      if (response.data && response.data.session && response.data.user) {
        console.log('Authentication data received from signup-complete');
        console.log('Session data:', JSON.stringify(response.data.session, null, 2));
        
        // Verificăm exact ce cheie folosește serverul pentru tokens
        const accessToken = response.data.session.access_token || response.data.session.accessToken;
        const refreshToken = response.data.session.refresh_token || response.data.session.refreshToken;
        
        console.log('Extracted tokens:');
        console.log('Access Token:', accessToken?.substring(0, 10) + '...');
        console.log('Refresh Token:', refreshToken?.substring(0, 10) + '...');
        
        if (!accessToken || !refreshToken) {
          console.error('ERROR: Missing tokens in response!');
          console.error('Full response:', JSON.stringify(response.data, null, 2));
          onContinue();
          return;
        }
        
        // Use signIn from AuthContext to handle the session data
        await signIn({
          accessToken,
          refreshToken,
          user: response.data.user
        });
        
        console.log('Authentication state updated successfully');
        
        // Verificăm dacă tokenul a fost salvat corect
        const storedToken = await SecureStore.getItemAsync('accessToken');
        console.log('Stored access token after signIn:', storedToken ? 'Yes (found)' : 'No (not found)');
        
        // Clear the stored idTokens and metadata as they're no longer needed
        await AsyncStorage.removeItem('googleIdToken');
        await AsyncStorage.removeItem('appleIdToken');
        console.log('Cleared stored provider idTokens after use');
        await AsyncStorage.removeItem('lastAuthProvider');
        await AsyncStorage.removeItem('idTokenSavedAt');
        
        // Add a small delay to ensure token is properly stored and available for subsequent requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verificăm din nou dacă tokenul este disponibil
        const tokenAfterDelay = await SecureStore.getItemAsync('accessToken');
        console.log('Access token after delay:', tokenAfterDelay ? 'Yes (found)' : 'No (not found)');
        
        // Second API call: Log first entry with is_clean: true
        try {
          // Adăugăm data curentă în formatul ISO
          const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
          const logResponse = await apiClient.post(BackendRoutes.LOGS, { 
            is_clean: true,
            date: currentDate
          });
          console.log('Initial log created with is_clean: true and date:', currentDate);
          console.log('Log response:', logResponse.status);
        } catch (logError) {
          console.error('Error creating initial log:', logError);
        }
        
        // Third API call: Update last relapse
        try {
          const relapseResponse = await apiClient.patch(BackendRoutes.UPDATE_LAST_RELAPSE, {});
          console.log('Last relapse updated');
          console.log('Relapse response:', relapseResponse.status);
        } catch (relapseError) {
          console.error('Error updating last relapse:', relapseError);
        }
        
        // Only continue with navigation after all API calls are complete
        onContinue();
      } else {
        console.error('Invalid response format from signup-complete endpoint');
        console.error('Full response:', JSON.stringify(response.data, null, 2));
        // Continue with navigation even if authentication failed
        onContinue();
      }
    } catch (error: any) {
      console.error('Error during API calls:', error?.response?.data || error?.message || error);
      const status = error?.response?.status;
      const code = error?.response?.data?.code;
      const shouldReacquire =
        (status === 400 && (code === 'ID_TOKEN_MISSING' || code === 'UNSUPPORTED_PROVIDER')) ||
        (status === 401 && (code === 'ID_TOKEN_EXPIRED' || code === 'ID_TOKEN_INVALID'));

      if (shouldReacquire) {
        // Reacquire idToken and retry once
        const { idToken: freshIdToken, provider: freshProvider } = await ensureFreshIdToken();
        if (isValidToken(freshIdToken) && (freshProvider === 'google' || freshProvider === 'apple')) {
          const resolvedTimeZone = (Intl as any)?.DateTimeFormat?.().resolvedOptions?.().timeZone || (Intl as any)?.resolvedOptions?.().timeZone || 'UTC';
          const retryBody: any = { signup_complete: true, timezone: resolvedTimeZone, idToken: freshIdToken, provider: freshProvider };
          try {
            const retryResponse = await apiClient.post(BackendRoutes.SIGNUP_COMPLETE_AUTH, retryBody);
            // mimic success path
            console.log('Signup marked as complete (after retry)');
            console.log('Response structure:', JSON.stringify(retryResponse.data, null, 2));
            if (retryResponse.data && retryResponse.data.session && retryResponse.data.user) {
              const accessToken = retryResponse.data.session.access_token || retryResponse.data.session.accessToken;
              const refreshToken = retryResponse.data.session.refresh_token || retryResponse.data.session.refreshToken;
              await signIn({ accessToken, refreshToken, user: retryResponse.data.user });
            }
            onContinue();
            setIsLoading(false);
            return;
          } catch (retryErr: any) {
            console.error('Retry after reacquire failed:', retryErr?.response?.data || retryErr?.message || retryErr);
            router.replace('/login');
            return;
          }
        } else {
          router.replace('/login');
          return;
        }
      }

      // Fallback behavior
      if (status === 400 || status === 401) {
        router.replace('/login');
        return;
      }
      onContinue();
    } finally {
      // Reset loading state (though navigation will likely have occurred by now)
      setIsLoading(false);
    }
  };

  return (
    <>
      <Animated.View entering={FadeInDown.duration(600).delay(200)}>
        <View style={{ height: 8 }} />
      </Animated.View>
      
      <Animated.View 
        entering={FadeInDown.duration(500).delay(300)}
        style={styles.freeOfferContainer}
      >
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>EARLY ACCESS</Text>
        </View>
        <Text style={styles.offerTitle}>Start Your Journey For Free</Text>
        <Text style={styles.offerDescription}>
          As we are just launching, we are offering all premium features for free for a limited time. Be among the first to experience the full power of CraveOff.
        </Text>
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureChip}>
              <Ionicons name={feature.icon as any} size={14} color="#fff" />
              <Text style={styles.featureChipText}>{feature.text}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
      
      <Animated.View entering={FadeInDown.duration(500).delay(500)} style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.continueButtonContainer}
          onPress={handleContinue}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#8B5CF6', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButton}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.continueButtonText}>START MY FREE JOURNEY</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
        
        <Text style={styles.limitedTimeText}>
          Limited time offer • No credit card required
        </Text>
      </Animated.View>
    </>
  );
};

const createStyles = (_theme: any) => StyleSheet.create({
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  freeOfferContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.28)',
    position: 'relative',
    paddingTop: 38,
    backdropFilter: 'blur(10px)',
    marginTop: 50,
  },
  badgeContainer: {
    position: 'absolute',
    top: -15,
    alignSelf: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  offerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(99, 102, 241, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  offerDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 22,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.35)'
  },
  featureChipText: {
    color: '#fff',
    fontSize: 13,
    marginLeft: 6,
  },
  actionContainer: {
    marginTop: 16,
  },
  continueButtonContainer: {
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButton: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  limitedTimeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 16,
  },
});

export default FreeJourneyContent;