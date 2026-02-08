import React from 'react';
import { Alert, StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';

import { useTheme } from '@/src/context/ThemeProvider';
import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';

interface FreeJourneyContentProps {
  onContinue: () => void;
}

type SignupCompleteParams = {
  signIn: (payload: { accessToken: string; refreshToken: string; user?: any }) => Promise<void>;
  onSuccess: () => void;
  onRequireLogin: () => void;
};

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
    AsyncStorage.getItem('lastAuthProvider'),
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

  const exp = decodeJwtExp(idToken);
  const nowSec = Math.floor(Date.now() / 1000);
  const nearExpiry = exp !== undefined ? exp - nowSec <= 120 : false;

  if (!idToken || !provider || nearExpiry) {
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
      } catch { }
    }

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
      } catch { }
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
      } catch { }
    }
    return {};
  }

  return { idToken, provider };
};

export async function runSignupCompleteFlow({ signIn, onSuccess, onRequireLogin }: SignupCompleteParams) {
  try {
    const { idToken, provider } = await ensureFreshIdToken();

    console.log('Using idToken for signup-complete:', idToken ? 'Yes (valid)' : 'No (not found)');
    console.log('Provider detected:', provider || 'none');

    const effectiveIdToken = idToken;

    const resolvedTimeZone =
      (Intl as any)?.DateTimeFormat?.().resolvedOptions?.().timeZone ||
      (Intl as any)?.resolvedOptions?.().timeZone ||
      'UTC';
    const tzOffsetMinutes = new Date().getTimezoneOffset();
    console.log('[SignupComplete] Detected timezone:', resolvedTimeZone);
    console.log('[SignupComplete] Current GMT offset (minutes):', tzOffsetMinutes, '=> hours:', -(tzOffsetMinutes / 60));
    const requestBody: any = {
      signup_complete: true,
      timezone: resolvedTimeZone,
    };

    if (effectiveIdToken && provider) {
      requestBody.idToken = effectiveIdToken;
      requestBody.provider = provider;
    }

    console.log('Signup-complete request body:', JSON.stringify(requestBody, null, 2));

    if (!provider || !effectiveIdToken) {
      console.warn('Proceeding with signup-complete without idToken/provider. This may cause backend 500 if required.');
    }

    const doRequest = async () => apiClient.post(BackendRoutes.SIGNUP_COMPLETE_AUTH, requestBody);
    let response = await doRequest();
    console.log('Signup marked as complete');
    console.log('Response structure:', JSON.stringify(response.data, null, 2));

    if (response.data && response.data.session && response.data.user) {
      console.log('Authentication data received from signup-complete');
      console.log('Session data:', JSON.stringify(response.data.session, null, 2));

      const accessToken = response.data.session.access_token || response.data.session.accessToken;
      const refreshToken = response.data.session.refresh_token || response.data.session.refreshToken;

      console.log('Extracted tokens:');
      console.log('Access Token:', accessToken?.substring(0, 10) + '...');
      console.log('Refresh Token:', refreshToken?.substring(0, 10) + '...');

      if (!accessToken || !refreshToken) {
        console.error('ERROR: Missing tokens in response!');
        console.error('Full response:', JSON.stringify(response.data, null, 2));
        onSuccess();
        return;
      }

      await signIn({
        accessToken,
        refreshToken,
        user: response.data.user,
      });

      console.log('Authentication state updated successfully');

      const storedToken = await SecureStore.getItemAsync('accessToken');
      console.log('Stored access token after signIn:', storedToken ? 'Yes (found)' : 'No (not found)');

      await AsyncStorage.removeItem('googleIdToken');
      await AsyncStorage.removeItem('appleIdToken');
      console.log('Cleared stored provider idTokens after use');
      await AsyncStorage.removeItem('lastAuthProvider');
      await AsyncStorage.removeItem('idTokenSavedAt');

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const tokenAfterDelay = await SecureStore.getItemAsync('accessToken');
      console.log('Access token after delay:', tokenAfterDelay ? 'Yes (found)' : 'No (not found)');

      try {
        const currentDate = new Date().toISOString().split('T')[0];
        const logResponse = await apiClient.post(BackendRoutes.LOGS, {
          is_clean: true,
          date: currentDate,
        });
        console.log('Initial log created with is_clean: true and date:', currentDate);
        console.log('Log response:', logResponse.status);
      } catch (logError) {
        console.error('Error creating initial log:', logError);
      }

      try {
        const relapseResponse = await apiClient.patch(BackendRoutes.UPDATE_LAST_RELAPSE, {});
        console.log('Last relapse updated');
        console.log('Relapse response:', relapseResponse.status);
      } catch (relapseError) {
        console.error('Error updating last relapse:', relapseError);
      }

      onSuccess();
    } else {
      console.error('Invalid response format from signup-complete endpoint');
      console.error('Full response:', JSON.stringify(response.data, null, 2));
      onSuccess();
    }
  } catch (error: any) {
    console.error('Error during API calls:', error?.response?.data || error?.message || error);
    const status = error?.response?.status;
    const code = error?.response?.data?.code;
    const shouldReacquire =
      (status === 400 && (code === 'ID_TOKEN_MISSING' || code === 'UNSUPPORTED_PROVIDER')) ||
      (status === 401 && (code === 'ID_TOKEN_EXPIRED' || code === 'ID_TOKEN_INVALID'));

    if (shouldReacquire) {
      const { idToken: freshIdToken, provider: freshProvider } = await ensureFreshIdToken();
      if (isValidToken(freshIdToken) && (freshProvider === 'google' || freshProvider === 'apple')) {
        const resolvedTimeZone =
          (Intl as any)?.DateTimeFormat?.().resolvedOptions?.().timeZone ||
          (Intl as any)?.resolvedOptions?.().timeZone ||
          'UTC';
        const retryBody: any = {
          signup_complete: true,
          timezone: resolvedTimeZone,
          idToken: freshIdToken,
          provider: freshProvider,
        };
        try {
          const retryResponse = await apiClient.post(BackendRoutes.SIGNUP_COMPLETE_AUTH, retryBody);
          console.log('Signup marked as complete (after retry)');
          console.log('Response structure:', JSON.stringify(retryResponse.data, null, 2));
          if (retryResponse.data && retryResponse.data.session && retryResponse.data.user) {
            const accessToken = retryResponse.data.session.access_token || retryResponse.data.session.accessToken;
            const refreshToken = retryResponse.data.session.refresh_token || retryResponse.data.session.refreshToken;
            await signIn({ accessToken, refreshToken, user: retryResponse.data.user });
          }
          onSuccess();
          return;
        } catch (retryErr: any) {
          console.error('Retry after reacquire failed:', retryErr?.response?.data || retryErr?.message || retryErr);
          onRequireLogin();
          return;
        }
      } else {
        onRequireLogin();
        return;
      }
    }

    if (status === 400 || status === 401) {
      onRequireLogin();
      return;
    }
  }
}

const FreeJourneyContent: React.FC<FreeJourneyContentProps> = ({ onContinue: _onContinue }) => {
  const { theme } = useTheme();
  const router = useRouter();
  const styles = createStyles(theme);

  // TEMP: Gate internal test controls from code.
  const showInternalPaywallTestControls = false;
  const testPlacement =
    (Constants.expoConfig?.extra as any)?.superwall?.testPlacement ||
    (Constants.manifest2 as any)?.extra?.superwall?.testPlacement ||
    'upgrade_pressed';

  const handleTestPaywall = async () => {
    console.log('[Superwall][Test] Pressed', { placement: String(testPlacement) });
    try {
      const extra =
        (Constants.expoConfig?.extra as any) ||
        (Constants.manifest2 as any)?.extra ||
        (Constants.manifest as any)?.extra ||
        undefined;
      const cfg = extra?.superwall as { iosApiKey?: string; androidApiKey?: string } | undefined;
      const env = (process as any)?.env as Record<string, string | undefined> | undefined;
      const envKey =
        Platform.OS === 'ios'
          ? (env?.EXPO_PUBLIC_SUPERWALL_IOS_KEY || env?.EXPO_SUPERWALL_PUBLIC_API_KEY)
          : (env?.EXPO_PUBLIC_SUPERWALL_ANDROID_KEY || env?.EXPO_SUPERWALL_PUBLIC_API_KEY);
      const apiKey = (Platform.OS === 'ios' ? cfg?.iosApiKey : cfg?.androidApiKey) || envKey;

      const { SuperwallExpoModule, DefaultSuperwallOptions } = await import('expo-superwall');

      const statusRaw = await SuperwallExpoModule.getConfigurationStatus().catch(() => '');
      const status = String(statusRaw || '').toLowerCase();
      const isConfigured = status.includes('configured');
      console.log('[Superwall][Test] Configuration status', { statusRaw, isConfigured });

      if (!isConfigured) {
        if (!apiKey) {
          Alert.alert(
            'Superwall',
            'Missing Superwall API key for this platform. Set EXPO_PUBLIC_SUPERWALL_IOS_KEY / EXPO_PUBLIC_SUPERWALL_ANDROID_KEY (or EXPO_SUPERWALL_PUBLIC_API_KEY) and restart Metro.',
          );
          return;
        }
        console.log('[Superwall][Test] Calling configure()', {
          platform: Platform.OS,
          apiKeyPrefix: typeof apiKey === 'string' ? `${apiKey.slice(0, 5)}***` : '(missing)',
        });
        // IMPORTANT: this app uses a CustomPurchaseControllerProvider (manual purchase management).
        // If we configure with `false` here, Superwall may not route paywall purchase actions through
        // our JS purchase controller, which can lead to confusing "loading forever" behavior.
        await SuperwallExpoModule.configure(String(apiKey), DefaultSuperwallOptions, true);
      }

      // Inspect what would happen before registering.
      try {
        // NOTE: Native expects 2 args at runtime (placement, params) even if params is optional in typings.
        const preview = await SuperwallExpoModule.getPresentationResult(String(testPlacement), {});
        console.log('[Superwall][Test] PresentationResult', preview);
      } catch (previewErr: any) {
        console.log('[Superwall][Test] getPresentationResult failed', previewErr?.message || previewErr);
      }

      console.log('[Superwall][Test] Calling registerPlacement()', { placement: String(testPlacement) });
      await SuperwallExpoModule.registerPlacement(String(testPlacement), undefined, 'dev-test');
      console.log('[Superwall][Test] registerPlacement() resolved');
    } catch (e: any) {
      const msg =
        e?.message && String(e.message).includes('Cannot find native module')
          ? 'Superwall native module is missing. You must rebuild your dev client (Expo Go will not work).'
          : e?.message
            ? String(e.message)
            : 'Failed to present paywall.';
      console.log('[Superwall][Test] FAILED', e?.message || e);
      Alert.alert('Superwall', msg);
    }
  };

  const handleClaimFreeTrial = () => {
    router.push('/(auth)/claim-free-trial-paywall');
  };

  const goToTryForFree = () => {
    router.push('/(auth)/try-for-free');
  };

  return (
    <View style={styles.actionContainer}>
      <Text style={styles.reframeText}>
        Willpower alone is not enough. You need to entirely reframe the way you view yourself, the purpose of sex, and your relationships.
      </Text>
      <View style={styles.discountCard}>
        <Text style={styles.discountTitle}>Special Discount!</Text>
        <Text style={styles.discountSubtitle}>Get 80% off on Craveoff Premium!</Text>
        <TouchableOpacity
          style={styles.discountButton}
          onPress={handleClaimFreeTrial}
          activeOpacity={0.85}
        >
          <Text style={styles.discountButtonText}>Claim Free Trial</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.continueButtonContainer, styles.primaryButtonInRow]}
          onPress={goToTryForFree}
          activeOpacity={0.8}
        >
          <View style={styles.continueButtonSolid}>
            <Text style={styles.continueButtonTextSolid}>Turn Crave OFF</Text>
          </View>
        </TouchableOpacity>

        {showInternalPaywallTestControls ? (
          <TouchableOpacity
            style={styles.testPaywallButton}
            onPress={handleTestPaywall}
            activeOpacity={0.85}
            accessibilityLabel="Test Superwall Paywall"
          >
            <Ionicons name="flask-outline" size={18} color="#111827" />
            <Text style={styles.testPaywallButtonText}>Test</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.limitedTimeText}>Purchase appears Discretely</Text>
      <Text style={styles.limitedTimeText2}>
        Cancel anytime ✅ Finnaly Quit Porn 🛡️
      </Text>
    </View>
  );
};

export const FreeJourneyBody: React.FC<FreeJourneyContentProps> = ({ onContinue: _onContinue }) => {
  const { theme } = useTheme();
  const router = useRouter();
  const styles = createStyles(theme);

  const handleClaimFreeTrial = () => {
    router.push('/(auth)/claim-free-trial-paywall');
  };

  return (
    <View style={styles.actionContainer}>
      <Text style={styles.reframeText}>
        Willpower alone is not enough. You need to entirely reframe the way you view yourself, the purpose of sex, and your relationships.
      </Text>
      <View style={styles.discountCard}>
        <Text style={styles.discountTitle}>Special Discount!</Text>
        <Text style={styles.discountSubtitle}>Get 80% off on Craveoff Premium!</Text>
        <TouchableOpacity
          style={styles.discountButton}
          onPress={handleClaimFreeTrial}
          activeOpacity={0.85}
        >
          <Text style={styles.discountButtonText}>Claim Free Trial</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const FreeJourneyFooter: React.FC<FreeJourneyContentProps> = ({ onContinue: _onContinue }) => {
  const { theme } = useTheme();
  const router = useRouter();
  const styles = createStyles(theme);

  // TEMP: Gate internal test controls from code.
  const showInternalPaywallTestControls = false;
  const testPlacement =
    (Constants.expoConfig?.extra as any)?.superwall?.testPlacement ||
    (Constants.manifest2 as any)?.extra?.superwall?.testPlacement ||
    'upgrade_pressed';

  const handleTestPaywall = async () => {
    console.log('[Superwall][Test] Pressed', { placement: String(testPlacement) });
    try {
      const extra =
        (Constants.expoConfig?.extra as any) ||
        (Constants.manifest2 as any)?.extra ||
        (Constants.manifest as any)?.extra ||
        undefined;
      const cfg = extra?.superwall as { iosApiKey?: string; androidApiKey?: string } | undefined;
      const env = (process as any)?.env as Record<string, string | undefined> | undefined;
      const envKey =
        Platform.OS === 'ios'
          ? (env?.EXPO_PUBLIC_SUPERWALL_IOS_KEY || env?.EXPO_SUPERWALL_PUBLIC_API_KEY)
          : (env?.EXPO_PUBLIC_SUPERWALL_ANDROID_KEY || env?.EXPO_SUPERWALL_PUBLIC_API_KEY);
      const apiKey = (Platform.OS === 'ios' ? cfg?.iosApiKey : cfg?.androidApiKey) || envKey;

      const { SuperwallExpoModule, DefaultSuperwallOptions } = await import('expo-superwall');

      const statusRaw = await SuperwallExpoModule.getConfigurationStatus().catch(() => '');
      const status = String(statusRaw || '').toLowerCase();
      const isConfigured = status.includes('configured');
      console.log('[Superwall][Test] Configuration status', { statusRaw, isConfigured });

      if (!isConfigured) {
        if (!apiKey) {
          Alert.alert(
            'Superwall',
            'Missing Superwall API key for this platform. Set EXPO_PUBLIC_SUPERWALL_IOS_KEY / EXPO_PUBLIC_SUPERWALL_ANDROID_KEY (or EXPO_SUPERWALL_PUBLIC_API_KEY) and restart Metro.',
          );
          return;
        }
        console.log('[Superwall][Test] Calling configure()', {
          platform: Platform.OS,
          apiKeyPrefix: typeof apiKey === 'string' ? `${apiKey.slice(0, 5)}***` : '(missing)',
        });
        // IMPORTANT: this app uses a CustomPurchaseControllerProvider (manual purchase management).
        // If we configure with `false` here, Superwall may not route paywall purchase actions through
        // our JS purchase controller, which can lead to confusing "loading forever" behavior.
        await SuperwallExpoModule.configure(String(apiKey), DefaultSuperwallOptions, true);
      }

      // Inspect what would happen before registering.
      try {
        // NOTE: Native expects 2 args at runtime (placement, params) even if params is optional in typings.
        const preview = await SuperwallExpoModule.getPresentationResult(String(testPlacement), {});
        console.log('[Superwall][Test] PresentationResult', preview);
      } catch (previewErr: any) {
        console.log('[Superwall][Test] getPresentationResult failed', previewErr?.message || previewErr);
      }

      console.log('[Superwall][Test] Calling registerPlacement()', { placement: String(testPlacement) });
      await SuperwallExpoModule.registerPlacement(String(testPlacement), undefined, 'dev-test');
      console.log('[Superwall][Test] registerPlacement() resolved');
    } catch (e: any) {
      const msg =
        e?.message && String(e.message).includes('Cannot find native module')
          ? 'Superwall native module is missing. You must rebuild your dev client (Expo Go will not work).'
          : e?.message
            ? String(e.message)
            : 'Failed to present paywall.';
      console.log('[Superwall][Test] FAILED', e?.message || e);
      Alert.alert('Superwall', msg);
    }
  };

  const goToTryForFree = () => {
    router.push('/(auth)/try-for-free');
  };

  return (
    <View>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.continueButtonContainer, styles.primaryButtonInRow]}
          onPress={goToTryForFree}
          activeOpacity={0.8}
        >
          <View style={styles.continueButtonSolid}>
            <Text style={styles.continueButtonTextSolid}>Turn Crave OFF</Text>
          </View>
        </TouchableOpacity>

        {showInternalPaywallTestControls ? (
          <TouchableOpacity
            style={styles.testPaywallButton}
            onPress={handleTestPaywall}
            activeOpacity={0.85}
            accessibilityLabel="Test Superwall Paywall"
          >
            <Ionicons name="flask-outline" size={18} color="#111827" />
            <Text style={styles.testPaywallButtonText}>Test</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.limitedTimeText}>Purchase appears Discretely</Text>
      <Text style={styles.limitedTimeText}>
        Cancel anytime ✅ Finnaly Quit Porn 🛡️
      </Text>
    </View>
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
    backdropFilter: 'blur(10px)',
    marginTop: 50,
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
  discountCard: {
    borderRadius: 22,
    paddingVertical: 32,
    // paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 4
  },
  discountTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  discountSubtitle: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  discountButton: {
    marginTop: 14,
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.12)',
  },
  discountButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  reframeText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  continueButtonContainer: {
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 4,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    marginBottom: 16,
  },
  primaryButtonInRow: {
    flex: 1,
  },
  testPaywallButton: {
    height: 54,
    paddingHorizontal: 14,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.12)',
  },
  testPaywallButtonText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  continueButton: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonSolid: {
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 30,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  continueButtonTextSolid: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  limitedTimeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 4,
  },
  limitedTimeText2: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});

export default FreeJourneyContent;