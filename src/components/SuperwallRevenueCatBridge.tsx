import React from 'react';
import { Platform } from 'react-native';

import { AuthContext } from '@/src/context/AuthContext';
import { getMonetizationUserId } from '@/src/services/monetizationUserId';

/**
 * Bridges your app's auth + RevenueCat subscription state into Superwall.
 *
 * Per Superwall Expo docs:
 * - Call `identify()` once you know the user's identity
 * - Keep Superwall subscription status in sync when using RevenueCat for purchasing
 *
 * This file intentionally avoids static imports from `expo-superwall` and `react-native-purchases`
 * to keep web / stale dev-client scenarios from crashing at module load time.
 */
export default function SuperwallRevenueCatBridge() {
  const { user, isAuthenticated } = React.useContext(AuthContext);
  const lastIdentifiedRef = React.useRef<string | null>(null);

  const waitForConfigured = React.useCallback(async () => {
    const { SuperwallExpoModule } = await import('expo-superwall');
    for (let i = 0; i < 15; i += 1) {
      const statusRaw = await SuperwallExpoModule.getConfigurationStatus().catch(() => '');
      const status = String(statusRaw || '').toLowerCase();
      if (status.includes('configured')) return true;
      // Small retry window while SuperwallProvider configures
      await new Promise((r) => setTimeout(r, 200));
    }
    return false;
  }, []);

  React.useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!isAuthenticated) return;

    const userId = getMonetizationUserId(user);
    if (!userId) return;
    if (lastIdentifiedRef.current === userId) return;

    let cancelled = false;
    (async () => {
      try {
        const configured = await waitForConfigured();
        if (!configured || cancelled) return;
        const { SuperwallExpoModule } = await import('expo-superwall');
        await SuperwallExpoModule.identify(userId, null);
        lastIdentifiedRef.current = userId;
        if (__DEV__) console.log('[Superwall][Bridge] identify OK', { userId });
      } catch (e) {
        console.warn('[Superwall] identify failed:', (e as any)?.message || e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user, waitForConfigured]);

  React.useEffect(() => {
    if (Platform.OS === 'web') return;

    let removeListener: undefined | (() => void);
    let cancelled = false;

    const syncFromCustomerInfo = async (customerInfo: any) => {
      try {
        const configured = await waitForConfigured();
        if (!configured || cancelled) return;

        const activeEntitlements = customerInfo?.entitlements?.active || {};
        const entitlementIds = Object.keys(activeEntitlements);
        const { SuperwallExpoModule } = await import('expo-superwall');

        if (__DEV__) {
          console.log('[Superwall][Bridge] syncing subscription status from RevenueCat', {
            activeEntitlements: entitlementIds,
          });
        }

        await SuperwallExpoModule.setSubscriptionStatus(
          entitlementIds.length === 0
            ? { status: 'INACTIVE' }
            : {
                status: 'ACTIVE',
                entitlements: entitlementIds.map((id) => ({ id, type: 'SERVICE_LEVEL' })),
              },
        );
      } catch (e) {
        console.warn('[Superwall] setSubscriptionStatus failed:', (e as any)?.message || e);
      }
    };

    (async () => {
      try {
        const PurchasesModule: any = await import('react-native-purchases');
        const Purchases = PurchasesModule.default ?? PurchasesModule;

        // Initial sync
        const initialInfo = await Purchases.getCustomerInfo();
        await syncFromCustomerInfo(initialInfo);

        // Subscribe to updates
        const sub = Purchases.addCustomerInfoUpdateListener((info: any) => {
          syncFromCustomerInfo(info).catch(() => {});
        });

        removeListener = () => sub?.remove?.();
      } catch (e) {
        console.warn('[Superwall] RevenueCat sync not active (Purchases not ready):', (e as any)?.message || e);
      }
    })();

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, [waitForConfigured]);

  return null;
}


