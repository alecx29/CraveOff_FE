// app/_layout.tsx
import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { ActivityIndicator, StyleSheet, View, StatusBar, AppState, Image, Platform, Text } from 'react-native';
import { router, Stack, SplashScreen, usePathname } from 'expo-router';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import Constants from 'expo-constants';
import {
  DMSans_400Regular,
  DMSans_400Regular_Italic,
  DMSans_500Medium,
  DMSans_500Medium_Italic,
  DMSans_700Bold,
  DMSans_700Bold_Italic,
} from '@expo-google-fonts/dm-sans';

import { apiClient, isTokenExpired } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';
import { AuthContext, AuthProvider } from '@/src/context/AuthContext';
import { registerDeviceWithBackend } from '@/src/services/pushService';
import { NotificationsProvider } from '@/src/context/NotificationsContext';
import { ThemeProvider } from '@/src/context/ThemeProvider';
import { UserProvider } from '@/src/context/UserContext';
import { LogsProvider } from '@/src/context/LogsContext';
import { JournalProvider } from '@/src/context/JournalContext';
import { AchievementsProvider } from '@/src/context/AchievementsContext';
import { PledgeProvider } from '@/src/context/PledgeContext';
import { getTokens, clearTokens } from '@/src/Storage/tokenStorage';
import HomeOnlyCheckInController from '@/src/components/HomeOnlyCheckInController';
import UpdateGate from '@/src/components/UpdateGate';
import NotificationInitializer from '@/src/components/NotificationInitializer';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import { setCurrentPath } from '@/src/navigation/routeTracker';
import * as Updates from 'expo-updates';
import { applyGlobalDMSans } from '@/src/theme/applyGlobalFont';
import SuperwallRevenueCatBridge from '@/src/components/SuperwallRevenueCatBridge';
import SuperwallDebugLogger from '@/src/components/SuperwallDebugLogger';
import { saveAuthFlags } from '@/src/Storage/authFlagsStorage';

// Keep native splash visible for a controlled duration on app start
void SplashScreen.preventAutoHideAsync();

type SuperwallProviderComponent = React.ComponentType<{
  apiKeys: { ios?: string; android?: string };
  options?: any;
  children: React.ReactNode;
  onConfigurationError?: (error: Error) => void;
}>;

let SuperwallProvider: SuperwallProviderComponent | null = null;
let CustomPurchaseControllerProvider: React.ComponentType<{ children: React.ReactNode; controller: any }> | null = null;
try {
  // expo-superwall throws on import if the native module isn't compiled into the app binary yet.
  // We must guard it to support running in Expo Go or stale dev-clients.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sw = require('expo-superwall');
  SuperwallProvider = sw.SuperwallProvider as SuperwallProviderComponent;
  CustomPurchaseControllerProvider = sw.CustomPurchaseControllerProvider as React.ComponentType<{
    children: React.ReactNode;
    controller: any;
  }>;
} catch {
  SuperwallProvider = null;
  CustomPurchaseControllerProvider = null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'DMSans-Regular': DMSans_400Regular,
    'DMSans-RegularItalic': DMSans_400Regular_Italic,
    'DMSans-Medium': DMSans_500Medium,
    'DMSans-MediumItalic': DMSans_500Medium_Italic,
    'DMSans-Bold': DMSans_700Bold,
    'DMSans-BoldItalic': DMSans_700Bold_Italic,
  });
  const [splashTimerElapsed, setSplashTimerElapsed] = useState(false);
  const [updateGateBlocking, setUpdateGateBlocking] = useState(false);
  const [splashLine1, setSplashLine1] = useState('');
  const [splashLine2, setSplashLine2] = useState('');
  const fontsReady = fontsLoaded || !!fontError;
  const isInitialSplashVisible = !splashTimerElapsed || updateGateBlocking;

  // Smooth slide-up + fade for the logo + typing text on initial splash
  const splashEnterProgress = useSharedValue(0);
  const splashEnterStyle = useAnimatedStyle(() => {
    const p = splashEnterProgress.value;
    return {
      opacity: p,
      transform: [
        {
          // Start a bit below, end a bit ABOVE the current "center" position.
          translateY: interpolate(p, [0, 1], [44, -20], Extrapolation.CLAMP),
        },
      ],
    };
  }, []);

  useEffect(() => {
    if (!fontsReady) return;
    if (!isInitialSplashVisible) return;
    splashEnterProgress.value = 0;
    splashEnterProgress.value = withTiming(1, {
      duration: 3800,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  }, [fontsReady, isInitialSplashVisible, splashEnterProgress]);

  useEffect(() => {
    if (!fontsReady) return;
    const line1 = 'This urge is temporary.';
    const line2 = 'Your progress is not.';
    const startDelayMs = 500;
    // These control "typing speed". Increase durations to type slower.
    const typingSpeedFactor = 0.90;
    const line1DurationMs = 2200 * typingSpeedFactor;
    const pauseBetweenMs = 500;
    const line2DurationMs = 2200 * typingSpeedFactor;
    const totalDurationMs = line1DurationMs + pauseBetweenMs + line2DurationMs;
    // Precompute "when each character should appear" (ms) with a curve that ONLY slows down.
    // (Character intervals strictly increase, so the typing never speeds up mid-sentence.)
    const buildCharTimes = (text: string, durationMs: number) => {
      const n = text.length;
      if (n <= 0) return [];
      if (n === 1) return [durationMs];

      // Shape knobs:
      // - slowdownStrength: how much slower the last characters get vs the first
      // - slowdownPower: how quickly it slows down toward the end
      const slowdownStrength = 2.0; // last interval ~= (1 + strength) * first interval
      const slowdownPower = 2.4;

      const weights: number[] = [];
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1); // 0..1
        weights.push(1 + slowdownStrength * Math.pow(t, slowdownPower));
      }

      const sum = weights.reduce((acc, w) => acc + w, 0);
      const scale = durationMs / sum;

      const times: number[] = [];
      let cumulative = 0;
      for (let i = 0; i < n; i++) {
        cumulative += weights[i] * scale;
        times.push(cumulative);
      }
      return times;
    };

    const line1Times = buildCharTimes(line1, line1DurationMs);
    const line2Times = buildCharTimes(line2, line2DurationMs);

    let rafId = 0;
    let start: number | null = null;
    let lastLine1Count = -1;
    let lastLine2Count = -1;
    setSplashLine1('');
    setSplashLine2('');

    const tick = (timestamp: number) => {
      if (start === null) start = timestamp;
      const elapsed = timestamp - start - startDelayMs;
      if (elapsed < 0) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      // Line 1
      let nextLine1Count = 0;
      for (let i = 0; i < line1Times.length; i++) {
        if (elapsed >= line1Times[i]) nextLine1Count = i + 1;
        else break;
      }
      if (nextLine1Count !== lastLine1Count) {
        lastLine1Count = nextLine1Count;
        setSplashLine1(line1.slice(0, nextLine1Count));
      }

      // Line 2 (after pause)
      const line2Elapsed = elapsed - line1DurationMs - pauseBetweenMs;
      if (line2Elapsed >= 0) {
        let nextLine2Count = 0;
        for (let i = 0; i < line2Times.length; i++) {
          if (line2Elapsed >= line2Times[i]) nextLine2Count = i + 1;
          else break;
        }
        if (nextLine2Count !== lastLine2Count) {
          lastLine2Count = nextLine2Count;
          setSplashLine2(line2.slice(0, nextLine2Count));
        }
      }

      if (elapsed < totalDurationMs) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [fontsReady]);

  useEffect(() => {
    if (!fontsReady) return;
    SplashScreen.hideAsync().catch(() => { });
    const timer = setTimeout(() => {
      setSplashTimerElapsed(true);
    }, 5400);
    return () => clearTimeout(timer);
  }, [fontsReady]);

  useEffect(() => {
    if (!fontsLoaded) return;
    applyGlobalDMSans();
  }, [fontsLoaded]);

  useEffect(() => {
    if (fontError) {
      console.warn('[Fonts] Failed to load DM Sans', fontError);
    }
  }, [fontError]);

  // Auto-apply OTA updates (EAS Update) silently on app start
  useEffect(() => {
    (async () => {
      try {
        if (__DEV__) return; // skip in dev
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          // Do NOT reload now; the update will apply on next app launch
        }
      } catch (e) {
        console.log('[Updates] No OTA applied:', (e as any)?.message || e);
      }
    })();
  }, []);

  if (!fontsReady) {
    return null;
  }

  const extra =
    (Constants.expoConfig?.extra as any) ||
    (Constants.manifest2 as any)?.extra ||
    (Constants.manifest as any)?.extra ||
    undefined;
  const superwallConfig = (extra?.superwall as { iosApiKey?: string; androidApiKey?: string } | undefined) ?? undefined;

  // Expo injects EXPO_PUBLIC_* at runtime too; use as fallback in case `extra` isn't populated
  // (e.g. stale manifest/dev-client, or metro not restarted after env changes).
  const FALLBACK_SUPERWALL_IOS_KEY = 'pk_1tKyBjngSPyyRhHcAtRYz';
  const FALLBACK_SUPERWALL_ANDROID_KEY = 'pk_K0Y9JPpF1f7wWrKTqDKBv';
  const env = (process as any)?.env as Record<string, string | undefined> | undefined;
  const envIosKey = env?.EXPO_PUBLIC_SUPERWALL_IOS_KEY || env?.EXPO_SUPERWALL_PUBLIC_API_KEY || FALLBACK_SUPERWALL_IOS_KEY;
  const envAndroidKey = env?.EXPO_PUBLIC_SUPERWALL_ANDROID_KEY || env?.EXPO_SUPERWALL_PUBLIC_API_KEY || FALLBACK_SUPERWALL_ANDROID_KEY;
  const superwallApiKeys = {
    // IMPORTANT: use `||` so empty-string config doesn't block fallbacks.
    ios: superwallConfig?.iosApiKey || envIosKey || FALLBACK_SUPERWALL_IOS_KEY,
    android: superwallConfig?.androidApiKey || envAndroidKey || FALLBACK_SUPERWALL_ANDROID_KEY,
  };

  const shouldEnableSuperwall =
    Platform.OS !== 'web' &&
    !!SuperwallProvider &&
    !!CustomPurchaseControllerProvider &&
    (superwallApiKeys.ios.length > 0 || superwallApiKeys.android.length > 0);

  const superwallOptions = Platform.OS === 'android' ? { passIdentifiersToPlayStore: true } : undefined;

  const AppTree = (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <AuthProvider>
        {shouldEnableSuperwall ? <SuperwallRevenueCatBridge /> : null}
        {shouldEnableSuperwall && __DEV__ ? <SuperwallDebugLogger /> : null}
        <ThemeProvider>
          <NotificationsProvider>
            <UserProvider>
              <LogsProvider>
                <JournalProvider>
                  <AchievementsProvider>
                    <PledgeProvider>
                      <NotificationInitializer />
                      <AuthNavigation />
                    </PledgeProvider>
                  </AchievementsProvider>
                </JournalProvider>
              </LogsProvider>
            </UserProvider>
          </NotificationsProvider>
        </ThemeProvider>
      </AuthProvider>

      <UpdateGate
        isSplashVisible={!splashTimerElapsed || updateGateBlocking}
        onPromptShown={() => setUpdateGateBlocking(true)}
        onDecision={() => setUpdateGateBlocking(false)}
      />
      {!splashTimerElapsed || updateGateBlocking ? (
        <View style={styles.initialSplash}>
          <GradientBackground ignoreFocus>
            <View style={styles.initialSplashBgWrap}>
              <Image
                source={require('@/assets/images/afterPay1.png')}
                resizeMode="cover"
                blurRadius={Platform.OS === 'ios' ? 14 : 8}
                style={styles.initialSplashAbstractBg}
              />
              <Animated.View style={[styles.initialSplashInner, splashEnterStyle]}>
                <Image
                  source={require('@/assets/images/logo.png')}
                  resizeMode="contain"
                  style={styles.initialLogo}
                />
                <View style={styles.initialSplashTextBlock}>
                  <Text style={styles.initialSplashLine}>{splashLine1}</Text>
                  <Text style={styles.initialSplashLineSecondary}>{splashLine2}</Text>
                </View>
              </Animated.View>
            </View>
          </GradientBackground>
        </View>
      ) : null}
    </SafeAreaProvider>
  );

  const superwallPurchaseController = {
    // Called by Superwall when the user taps purchase inside a Superwall paywall.
    onPurchase: async (params: { productId: string; platform?: 'ios' | 'android'; basePlanId?: string; offerId?: string }) => {
      const PurchasesModule: any = await import('react-native-purchases');
      const Purchases = PurchasesModule.default ?? PurchasesModule;
      const { PURCHASES_ERROR_CODE } = PurchasesModule;

      try {
        if (__DEV__) console.log('[Superwall][RC] onPurchase', params);

        // iOS-specific: Superwall paywalls can be presented outside React's main VC/window.
        // RevenueCat presents the Apple purchase sheet from the currently presented VC; when the paywall
        // is in a separate overlay/window, the purchase sheet may fail to present and the promise can hang.
        // Dismissing the paywall first makes the purchase sheet presentation reliable.
        if (Platform.OS === 'ios') {
          try {
            const { SuperwallExpoModule } = await import('expo-superwall');
            await SuperwallExpoModule.dismiss?.().catch(() => { });
            // Let UIKit settle the dismissal before presenting StoreKit UI.
            await new Promise((r) => setTimeout(r, 250));
          } catch (e) {
            if (__DEV__) console.log('[Superwall][RC] iOS pre-dismiss failed (non-blocking)', (e as any)?.message || e);
          }
        }

        // Basic capability check (helps catch iOS restrictions / parental controls quickly).
        try {
          const canPay = await Purchases.canMakePayments();
          if (__DEV__) console.log('[Superwall][RC] canMakePayments', { canPay });
          if (canPay === false) return { type: 'failed', error: 'In-app purchases are not allowed on this device.' };
        } catch {
          // non-blocking
        }

        const products = await Purchases.getProducts([params.productId]);
        const product = products?.[0];
        if (!product) {
          if (__DEV__) console.log('[Superwall][RC] Product not found for id', params.productId);
          return { type: 'failed', error: 'Product not found' };
        }

        // Android base plans / offers:
        // Superwall provides `basePlanId` and optional `offerId`. RevenueCat requires purchasing
        // the matching SubscriptionOption when you need a specific base plan or offer.
        if (Platform.OS === 'android' && params.basePlanId) {
          const optionId = params.offerId ? `${params.basePlanId}:${params.offerId}` : params.basePlanId;
          const options: any[] | null | undefined = product.subscriptionOptions;
          const defaultOption: any | null | undefined = product.defaultOption;
          const chosenOption =
            (Array.isArray(options) ? options.find((o) => o?.id === optionId) : null) ||
            defaultOption ||
            (Array.isArray(options) ? options[0] : null);

          if (!chosenOption) {
            if (__DEV__) console.log('[Superwall][RC] No subscription option found; falling back to purchaseStoreProduct', { optionId });
            await Purchases.purchaseStoreProduct(product);
          } else {
            if (__DEV__) console.log('[Superwall][RC] Purchasing subscription option', { optionId: chosenOption?.id, productId: chosenOption?.productId });
            await Purchases.purchaseSubscriptionOption(chosenOption);
          }
        } else if (Platform.OS === 'ios') {
          // Prefer purchasing via Offerings/Packages on iOS (matches your existing paywall flow
          // and preserves presentedOfferingContext when available).
          try {
            const offerings = await Purchases.getOfferings();
            const offering = offerings?.current ?? (offerings?.all ? Object.values(offerings.all)[0] : null);
            const pkgs = offering?.availablePackages ?? [];
            const matchedPkg =
              Array.isArray(pkgs) ? pkgs.find((p: any) => p?.product?.identifier === params.productId) : null;
            if (matchedPkg) {
              if (__DEV__) console.log('[Superwall][RC] iOS purchasing via package', { pkgId: matchedPkg?.identifier });
              await Purchases.purchasePackage(matchedPkg);
            } else {
              if (__DEV__) console.log('[Superwall][RC] iOS purchasing via store product', { productId: product?.identifier });
              await Purchases.purchaseStoreProduct(product);
            }
          } catch (e) {
            // Fall back to direct store product purchase if offerings lookup fails.
            if (__DEV__) console.log('[Superwall][RC] iOS offerings lookup failed; falling back', (e as any)?.message || e);
            await Purchases.purchaseStoreProduct(product);
          }
        } else {
          // Android without basePlanId
          await Purchases.purchaseStoreProduct(product);
        }

        // Success: returning void is enough; CustomPurchaseControllerProvider treats it as purchased.
        return;
      } catch (error: any) {
        const code = error?.code;
        if (code === PURCHASES_ERROR_CODE?.PURCHASE_CANCELLED_ERROR || error?.userCancelled) {
          return { type: 'cancelled' };
        }
        if (code === PURCHASES_ERROR_CODE?.PAYMENT_PENDING_ERROR) {
          return { type: 'pending' };
        }
        if (__DEV__) console.log('[Superwall][RC] Purchase failed', { code, message: error?.message, raw: error });
        return { type: 'failed', error: error?.message || 'Unknown purchase error' };
      }
    },

    // Called by Superwall when the user taps restore inside a Superwall paywall.
    onPurchaseRestore: async () => {
      const PurchasesModule: any = await import('react-native-purchases');
      const Purchases = PurchasesModule.default ?? PurchasesModule;
      try {
        await Purchases.restorePurchases();
        return { type: 'restored' };
      } catch (error: any) {
        return { type: 'failed', error: error?.message || 'Unknown restore error' };
      }
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {!shouldEnableSuperwall || !SuperwallProvider || !CustomPurchaseControllerProvider
        ? AppTree
        : (() => {
          const SWP = SuperwallProvider as React.ComponentType<any>;
          const CPC = CustomPurchaseControllerProvider as React.ComponentType<any>;
          return (
            <CPC controller={superwallPurchaseController}>
              <SWP apiKeys={superwallApiKeys} options={superwallOptions}>
                {AppTree}
              </SWP>
            </CPC>
          );
        })()}
    </GestureHandlerRootView>
  );
}

const AuthNavigation: React.FC = () => {
  const { isAuthenticated, signIn, setAccessToken, setIsAuthenticated, loading, user, isPremium, accessLoading, refreshAccessStatus } =
    useContext(AuthContext);
  const pathname = usePathname();
  const paywallCheckedRef = useRef(false);
  const bootstrapRanRef = useRef(false);
  const deviceRegisterAttemptedRef = useRef(false);
  const checkPaywallOnce = useCallback(async () => {
    if (paywallCheckedRef.current) return;
    if (!isAuthenticated) return;
    if (loading) return;
    if (user && user.signup_complete === true) return;
    const sc = (user as any)?.signup_complete;
    if (typeof sc !== 'boolean') return;
    // Fast path: if backend already provided reached_paywall in the user payload, respect it immediately.
    const cachedReached = (user as any)?.reached_paywall === true || (user as any)?.reachedPaywall === true;
    if (sc === false && cachedReached) {
      paywallCheckedRef.current = true;
      try {
        await saveAuthFlags({ signup_complete: false, reached_paywall: true });
      } catch { }
      if (pathname !== '/(auth)/subscription') router.replace('/(auth)/subscription');
      return;
    }
    const expired = await isTokenExpired();
    if (expired) return;
    try {
      const res = await apiClient.get(BackendRoutes.PAYWALL_STATUS);
      const reached = !!(res?.data && (res.data.reached_paywall === true || res.data?.status === 'reached' || res.data?.reached === true));
      if (reached) {
        paywallCheckedRef.current = true;
        try {
          await saveAuthFlags({ signup_complete: false, reached_paywall: true });
        } catch { }
        if (pathname !== '/(auth)/subscription') router.replace('/(auth)/subscription');
      }
    } catch { }
  }, [isAuthenticated, pathname, user, loading]);

  // Function to check and refresh tokens
  const checkAndRefreshTokens = async () => {
    try {
      // Get tokens and expiration time
      const { refreshToken, expiresAt, accessToken: storedAccessToken } = await getTokens();
      console.log('refreshToken: ' + (refreshToken ? 'exists' : 'not found'));
      console.log('accessToken: ' + (storedAccessToken ? 'exists' : 'not found'));

      if (refreshToken && storedAccessToken) {
        // Check if token is expired or about to expire (within 5 minutes)
        const now = Math.floor(Date.now() / 1000);
        const shouldRefresh = !expiresAt || expiresAt - now < 300;

        if (shouldRefresh) {
          console.log('Token expired or about to expire, refreshing...');
          try {
            const response = await apiClient.post('/auth/refresh', { refresh_token: refreshToken });
            const userData = response.data;
            const rawUser = userData?.user ?? {};
            const normalizedUser = {
              ...rawUser,
              signup_complete:
                typeof rawUser?.signup_complete === 'boolean'
                  ? rawUser.signup_complete
                  : typeof rawUser?.signupComplete === 'boolean'
                    ? rawUser.signupComplete
                    : typeof userData?.signup_complete === 'boolean'
                      ? userData.signup_complete
                      : typeof userData?.signupComplete === 'boolean'
                        ? userData.signupComplete
                        : rawUser?.signup_complete,
              reached_paywall:
                typeof rawUser?.reached_paywall === 'boolean'
                  ? rawUser.reached_paywall
                  : typeof rawUser?.reachedPaywall === 'boolean'
                    ? rawUser.reachedPaywall
                    : typeof userData?.reached_paywall === 'boolean'
                      ? userData.reached_paywall
                      : typeof userData?.reachedPaywall === 'boolean'
                        ? userData.reachedPaywall
                        : rawUser?.reached_paywall,
            };

            // Use signIn to properly update the auth context and token storage
            await signIn({
              accessToken: userData.access_token,
              refreshToken: userData.refresh_token || refreshToken,
              expiresAt: userData.expires_at,
              refreshExpiresAt: userData.refresh_expires_at,
              user: normalizedUser
            });

            console.log('Token refreshed and auth context updated');
            return true;
          } catch (error) {
            console.error('Error refreshing token:', error);
            // Clear expired tokens and set unauthenticated state
            await clearTokens();
            setIsAuthenticated(false);
            return false;
          }
        } else {
          console.log('Token still valid, skipping refresh');
          // Ensure state is correctly set even if token is valid
          setAccessToken(storedAccessToken);
          setIsAuthenticated(true);
          // Set headers for API client
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedAccessToken}`;
          return true;
        }
      } else {
        console.log('No valid tokens found');
        setIsAuthenticated(false);
        return false;
      }
    } catch (error) {
      console.error('Error checking tokens:', error);
      setIsAuthenticated(false);
      return false;
    }
  };

  // Initial check on app launch
  useEffect(() => {
    if (bootstrapRanRef.current) return;
    bootstrapRanRef.current = true;
    const bootstrap = async () => {
      const authResult = await checkAndRefreshTokens();
      console.log('Bootstrap complete, authentication result:', authResult);
      console.log('isAuthenticated after bootstrap:', isAuthenticated);
      if (authResult) {
        try {
          if (!deviceRegisterAttemptedRef.current) {
            deviceRegisterAttemptedRef.current = true;
            registerDeviceWithBackend({ silent: true });
          }
        } catch { }
        // Check paywall status once at startup for users not fully signed up
        await checkPaywallOnce();
      }
    };
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check when app returns to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active' && isAuthenticated) {
        console.log('App has come to the foreground, checking tokens...');
        checkAndRefreshTokens();
        // Also refresh premium access state on resume (backend is source of truth)
        refreshAccessStatus({ useCache: false }).catch(() => { });
        // Also check paywall status once per session
        checkPaywallOnce();
      }
    });

    return () => {
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    // Track current route for interceptors to make smarter redirects
    if (pathname) setCurrentPath(pathname);
  }, [pathname]);

  useEffect(() => {
    if (loading) return;
    const isOnAuthOrOnboarding = pathname === '/login' || pathname.startsWith('/onboarding') || pathname.startsWith('/(auth)');
    const isSignupComplete = !!(user && user.signup_complete === true);

    if (!isAuthenticated) {
      if (pathname !== '/login') router.replace('/login');
      return;
    }

    // If we know the user is NOT premium, keep them out of the main app.
    // (Paywall should be shown only when backend says !is_premium.)
    if (isSignupComplete && isPremium === false && pathname.startsWith('/(tabs)')) {
      router.replace('/(auth)/subscription');
      return;
    }

    // Authenticated users: only redirect to tabs if signup is complete and they are still on auth/onboarding screens
    if (isSignupComplete && isOnAuthOrOnboarding) {
      // Allow premium intro to be shown even for premium users (don't auto-bounce to tabs).
      if (pathname === '/(auth)/premium-intro') return;
      // If access is known and inactive, keep them on the paywall flow.
      if (isPremium === false) {
        if (pathname !== '/(auth)/subscription') router.replace('/(auth)/subscription');
        return;
      }
      router.replace('/(tabs)');
    }
    // Otherwise, allow the signup/onboarding flow to proceed without forced redirects
  }, [loading, isAuthenticated, pathname, user, isPremium, accessLoading]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/signup" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/analysis-complete" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/goals" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/symptoms" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/subscription" options={{ headerShown: false }} />
        <Stack.Screen
          name="(auth)/try-for-free"
          options={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: '#000' } }}
        />
        <Stack.Screen
          name="(auth)/premium-intro"
          options={{ headerShown: false, animation: 'fade', gestureEnabled: false, contentStyle: { backgroundColor: '#000' } }}
        />
        <Stack.Screen
          name="(auth)/paywall"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
            contentStyle: { backgroundColor: '#000' },
          }}
        />
        <Stack.Screen
          name="(auth)/revenuecat-paywall"
          options={{ headerShown: false, animation: 'slide_from_right', gestureEnabled: false }}
        />
        <Stack.Screen
          name="(auth)/claim-free-trial-paywall"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
            contentStyle: { backgroundColor: '#000' },
          }}
        />
      </Stack>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="(auth)/paywall"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
            contentStyle: { backgroundColor: '#000' },
          }}
        />
        <Stack.Screen
          name="(auth)/try-for-free"
          options={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: '#000' } }}
        />
        <Stack.Screen
          name="(auth)/premium-intro"
          options={{ headerShown: false, animation: 'fade', gestureEnabled: false, contentStyle: { backgroundColor: '#000' } }}
        />
        <Stack.Screen
          name="(auth)/revenuecat-paywall"
          options={{ headerShown: false, animation: 'slide_from_right', gestureEnabled: false, contentStyle: { backgroundColor: '#000' } }}
        />
        <Stack.Screen
          name="(auth)/claim-free-trial-paywall"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
            contentStyle: { backgroundColor: '#000' },
          }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen
          name="deep-breathing/index"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="deep-breathing/session"
          options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'fade' }}
        />
        <Stack.Screen
          name="journal-modal"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
      </Stack>

      {/* Show daily check-in popup only for authenticated users on the home page */}
      {!loading ? <HomeOnlyCheckInController /> : null}
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
  initialSplash: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  initialSplashBgWrap: {
    flex: 1,
  },
  initialSplashAbstractBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.28,
    transform: [{ scale: 1.06 }],
  },
  initialSplashInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialLogo: {
    width: 160,
    height: 160,
  },
  initialSplashTextBlock: {
    marginTop: -34,
    alignItems: 'center',
    minHeight: 52,
  },
  initialSplashLine: {
    color: '#f2f2f2',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  initialSplashLineSecondary: {
    marginTop: 8,
    color: '#dcdcdc',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});