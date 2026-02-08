import React from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  InteractionManager,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import {
  getRevenueCatOfferings,
} from '@/src/services/revenueCat';
import { presentRevenueCatDashboardPaywall } from '@/src/services/revenueCatPaywallUi';
import { waitForPremiumAccess } from '@/src/services/accessStatus';

const pickOffering = (offerings: any, offeringId?: string | null) => {
  if (!offerings) return null;
  const all = offerings.all ? (Object.values(offerings.all) as any[]) : [];

  if (offeringId) {
    const match =
      (offerings.all && offerings.all[offeringId]) ||
      all.find((o) => o?.identifier === offeringId);
    if (match) return match;
  }

  return offerings.current ?? all[0] ?? null;
};

const resolveRevenueCatUI = (mod: any) => {
  const candidates = [
    mod?.default,
    mod,
    mod?.default?.default,
    mod?.RevenueCatUI,
    mod?.default?.RevenueCatUI,
  ].filter(Boolean);

  const match = candidates.find((c) => typeof c?.Paywall === 'function');
  if (match) return match;

  const nested = candidates
    .map((c) => c?.default)
    .filter(Boolean)
    .find((c) => typeof c?.Paywall === 'function');
  if (nested) return nested;

  return null;
};

export default function RevenueCatPaywallScreen() {
  const router = useRouter();
  const [RevenueCatUI, setRevenueCatUI] = React.useState<any>(null);
  const [offering, setOffering] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [showPaywall, setShowPaywall] = React.useState(false);

  // Prevent Android hardware back from closing the screen; allow controlled back via router/back.
  React.useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  // Delay mounting the paywall until after nav/interaction work finishes (avoids RN 0.79 crash)
  React.useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setShowPaywall(true));
    return () => task.cancel();
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (Platform.OS === 'web') {
          throw new Error('RevenueCat paywalls are not available on web.');
        }

        const offerings = await getRevenueCatOfferings();
        const offeringId = process.env.EXPO_PUBLIC_REVENUECAT_OFFERING_ID || undefined;
        const selected = pickOffering(offerings, offeringId);
        if (!selected) {
          throw new Error(
            'No RevenueCat offering found. Configure a Current Offering in RevenueCat (or set EXPO_PUBLIC_REVENUECAT_OFFERING_ID).',
          );
        }

        const mod: any = await import('react-native-purchases-ui');
        const resolved = resolveRevenueCatUI(mod);
        if (!resolved) {
          throw new Error('RevenueCat UI Paywall component not found (native module missing or bad export).');
        }

        if (!cancelled) {
          setOffering(selected);
          setRevenueCatUI(resolved);
        }
      } catch (e: any) {
        // Fallback: if embedding fails, try the native-presenting helper so the user isn’t blocked.
        const raw = e?.message ? String(e.message) : '';
        console.log('[RevenueCat][UI] embed failed, falling back to presentPaywall', raw || e);
        try {
          await presentRevenueCatDashboardPaywall({ displayCloseButton: false });
          if (cancelled) return;
          const access = await waitForPremiumAccess();
          if (access?.isPremium) {
            router.replace('/(auth)/premium-intro');
          } else {
            router.back();
          }
          return;
        } catch (fallbackErr: any) {
          const rawFallback = fallbackErr?.message ? String(fallbackErr.message) : '';
          const msg =
            rawFallback.includes("doesn't seem to be linked") || rawFallback.includes('Cannot find native module')
              ? 'RevenueCat Paywalls UI is not linked in this build. Rebuild your dev client (sau EAS dev build) și reinstalează aplicația. Expo Go nu va funcționa pentru paywall-uri native.'
              : rawFallback
                ? rawFallback
                : 'Failed to open RevenueCat paywall.';
          if (!cancelled) {
            Alert.alert('RevenueCat', msg, [{ text: 'OK', onPress: () => router.back() }]);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleMaybeContinue = React.useCallback(async () => {
    try {
      const access = await waitForPremiumAccess();
      if (access?.isPremium) {
        router.replace('/(auth)/premium-intro');
      } else {
        router.back();
      }
    } catch {
      router.back();
    }
  }, [router]);

  if (loading || !RevenueCatUI || !offering) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  // Full-screen embedded paywall. Close button hidden; back swipe disabled in navigator.
  return (
    <View style={styles.container}>
      {showPaywall ? (
        <RevenueCatUI.Paywall
          key={offering?.identifier || 'rc-paywall'}
          style={styles.paywall}
          options={{
            offering,
            displayCloseButton: false,
          }}
          onPurchaseCompleted={handleMaybeContinue}
          onRestoreCompleted={handleMaybeContinue}
          onDismiss={handleMaybeContinue}
          onPurchaseError={({ error }: any) => {
            if (error?.userCancelled) return;
            Alert.alert('RevenueCat', error?.message || 'Purchase failed.');
          }}
          onRestoreError={({ error }: any) => {
            Alert.alert('RevenueCat', error?.message || 'Restore failed.');
          }}
        />
      ) : (
        <View style={styles.loading}>
          <ActivityIndicator />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  paywall: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
});

