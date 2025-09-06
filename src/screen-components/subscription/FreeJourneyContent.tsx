import React, { useContext, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

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

  // Features with icons
  const features: FeatureItem[] = [
    { text: 'Personalized recovery plan', icon: 'document-text' },
    { text: 'Daily motivational content', icon: 'flame' },
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
      // Retrieve the saved idTokens (Google or Apple) and validate them
      const [rawGoogleIdToken, rawAppleIdToken, lastAuthProvider, idTokenSavedAtStr] = await Promise.all([
        AsyncStorage.getItem('googleIdToken'),
        AsyncStorage.getItem('appleIdToken'),
        AsyncStorage.getItem('lastAuthProvider'),
        AsyncStorage.getItem('idTokenSavedAt')
      ]);

      const isValidToken = (token?: string | null) => {
        if (!token) return false;
        const trimmed = token.trim();
        if (!trimmed) return false;
        const lowered = trimmed.toLowerCase();
        if (lowered === 'null' || lowered === 'undefined') return false;
        return true;
      };

      const googleIdToken = isValidToken(rawGoogleIdToken) ? rawGoogleIdToken!.trim() : undefined;
      const appleIdToken = isValidToken(rawAppleIdToken) ? rawAppleIdToken!.trim() : undefined;

      // Determine age of idToken if metadata exists
      const idTokenSavedAt = idTokenSavedAtStr ? parseInt(idTokenSavedAtStr, 10) : undefined;
      const tokenAgeSec = idTokenSavedAt ? Math.floor((Date.now() - idTokenSavedAt) / 1000) : undefined;

      // Clean up invalid persisted tokens to avoid future confusion
      if (rawGoogleIdToken && !googleIdToken) {
        await AsyncStorage.removeItem('googleIdToken');
        console.warn('Removed invalid persisted Google idToken');
      }
      if (rawAppleIdToken && !appleIdToken) {
        await AsyncStorage.removeItem('appleIdToken');
        console.warn('Removed invalid persisted Apple idToken');
      }
      const idToken = googleIdToken || appleIdToken;
      
      // Determine the provider based on explicit lastAuthProvider fallback to presence
      let provider: string | undefined;
      if (lastAuthProvider === 'google' && googleIdToken) {
        provider = 'google';
      } else if (lastAuthProvider === 'apple' && appleIdToken) {
        provider = 'apple';
      } else if (googleIdToken) {
        provider = 'google';
      } else if (appleIdToken) {
        provider = 'apple';
      }
      
      console.log('Retrieved Google idToken for signup-complete:', googleIdToken ? 'Yes (valid)' : 'No (missing/invalid)');
      console.log('Retrieved Apple idToken for signup-complete:', appleIdToken ? 'Yes (valid)' : 'No (missing/invalid)');
      console.log('Using idToken for signup-complete:', idToken ? 'Yes (valid)' : 'No (not found)');
      console.log('Provider detected:', provider || 'none');
      if (tokenAgeSec !== undefined) {
        console.log('idToken age (seconds):', tokenAgeSec);
      }

      // If Google token older than ~50 minutes, try to refresh it
      try {
        if (provider === 'google' && tokenAgeSec !== undefined && tokenAgeSec > 50 * 60) {
          console.log('Google idToken appears old; attempting to refresh via GoogleSignin.getTokens');
          // Dynamic import to avoid web issues
          const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
          const tokens = await GoogleSignin.getTokens();
          if (tokens?.idToken) {
            console.log('Refreshed Google idToken');
            await AsyncStorage.setItem('googleIdToken', tokens.idToken);
            await AsyncStorage.setItem('idTokenSavedAt', Date.now().toString());
          } else {
            console.warn('GoogleSignin.getTokens did not return idToken');
          }
        }
      } catch (refreshErr) {
        console.warn('Failed to refresh Google idToken:', refreshErr);
      }

      // Re-read selected idToken after possible refresh
      const effectiveGoogleIdToken = provider === 'google' ? (await AsyncStorage.getItem('googleIdToken')) || googleIdToken : googleIdToken;
      const effectiveAppleIdToken = provider === 'apple' ? (await AsyncStorage.getItem('appleIdToken')) || appleIdToken : appleIdToken;
      const effectiveIdToken = provider === 'google' ? effectiveGoogleIdToken : provider === 'apple' ? effectiveAppleIdToken : undefined;
      
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
      const response = await apiClient.post(BackendRoutes.SIGNUP_COMPLETE || '/profile/signup-complete', requestBody);
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
        if (googleIdToken) {
          await AsyncStorage.removeItem('googleIdToken');
          console.log('Cleared stored Google idToken after use');
        }
        if (appleIdToken) {
          await AsyncStorage.removeItem('appleIdToken');
          console.log('Cleared stored Apple idToken after use');
        }
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
      // Continue with navigation even if API calls fail
      onContinue();
    } finally {
      // Reset loading state (though navigation will likely have occurred by now)
      setIsLoading(false);
    }
  };

  return (
    <>
      <Animated.View entering={FadeInDown.duration(600).delay(200)}>
        <Text style={styles.subtitle}>
          Get unlimited access to CraveOff including: Personalized and Science-Based Custom Plan, Content Blocker, Streak Track, Daily Pledges, Recovery Progress + much more!
        </Text>
      </Animated.View>
      
      <Animated.View 
        entering={FadeInDown.duration(500).delay(300)}
        style={styles.freeOfferContainer}
      >
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>EARLY ACCESS</Text>
        </View>
        
        <Text style={styles.offerTitle}>
          Start Your Journey For Free
        </Text>
        
        <Text style={styles.offerDescription}>
          As we are just launching, we are offering all premium features for free for a limited time. Be among the first to experience the full power of CraveOff.
        </Text>
        
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.iconContainer}>
                <Ionicons name={feature.icon as any} size={18} color="white" />
              </View>
              <Text style={styles.featureText}>{feature.text}</Text>
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

const createStyles = (theme: any) => StyleSheet.create({
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  freeOfferContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.3)',
    position: 'relative',
    paddingTop: 36,
    backdropFilter: 'blur(10px)',
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
    marginBottom: 24,
    lineHeight: 22,
  },
  featuresContainer: {
    marginBottom: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  featureText: {
    fontSize: 16,
    color: 'white',
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