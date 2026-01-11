import React from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { presentRevenueCatDashboardPaywall } from '@/src/services/revenueCatPaywallUi';
import { getRevenueCatCustomerInfo, getRevenueCatEntitlementId } from '@/src/services/revenueCat';

export default function RevenueCatPaywallScreen() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (Platform.OS === 'web') {
          throw new Error('RevenueCat paywalls are not available on web.');
        }

        await presentRevenueCatDashboardPaywall();

        if (cancelled) return;

        const entitlementId = getRevenueCatEntitlementId();
        const info = await getRevenueCatCustomerInfo();
        const active = !!(entitlementId && info?.entitlements?.active?.[entitlementId]);
        if (active) {
          router.replace('/(tabs)');
        } else {
          router.back();
        }
      } catch (e: any) {
        const raw = e?.message ? String(e.message) : '';
        const msg =
          raw.includes("doesn't seem to be linked") || raw.includes('Cannot find native module')
            ? 'RevenueCat Paywalls UI is not linked in this build. Rebuild your dev client (or EAS development build) and reinstall the app. Expo Go will not work for native paywalls.'
            : raw
              ? raw
              : 'Failed to open RevenueCat paywall.';
        if (!cancelled) {
          Alert.alert('RevenueCat', msg, [{ text: 'OK', onPress: () => router.back() }]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <View style={styles.loading}>
      <ActivityIndicator />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
});

