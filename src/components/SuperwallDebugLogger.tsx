import React from 'react';

/**
 * Dev-only logger for Superwall native events.
 *
 * Uses dynamic import so the app doesn't crash in environments where the native module
 * isn't compiled (Expo Go / stale dev-client).
 */
export default function SuperwallDebugLogger() {
  React.useEffect(() => {
    if (!__DEV__) return;

    let removeAll: (() => void)[] = [];
    let cancelled = false;

    (async () => {
      try {
        const { SuperwallExpoModule } = await import('expo-superwall');

        const sub = (event: string, handler: (payload: any) => void) => {
          const s = SuperwallExpoModule.addListener(event as any, handler);
          removeAll.push(() => s?.remove?.());
        };

        console.log('[Superwall][Debug] logger active');

        sub('onPaywallPresent', (p: any) => console.log('[Superwall][Event] onPaywallPresent', p));
        sub('onPaywallDismiss', (p: any) => console.log('[Superwall][Event] onPaywallDismiss', p));
        sub('onPaywallSkip', (p: any) => console.log('[Superwall][Event] onPaywallSkip', p));
        sub('onPaywallError', (p: any) => console.log('[Superwall][Event] onPaywallError', p));
        // Paywall lifecycle + outbound links (helps detect "Pay" being wired to URL/deeplink instead of purchase)
        sub('willPresentPaywall', (p: any) => console.log('[Superwall][Event] willPresentPaywall', p));
        sub('didPresentPaywall', (p: any) => console.log('[Superwall][Event] didPresentPaywall', p));
        sub('willDismissPaywall', (p: any) => console.log('[Superwall][Event] willDismissPaywall', p));
        sub('didDismissPaywall', (p: any) => console.log('[Superwall][Event] didDismissPaywall', p));
        sub('paywallWillOpenURL', (p: any) => console.log('[Superwall][Event] paywallWillOpenURL', p));
        sub('paywallWillOpenDeepLink', (p: any) => console.log('[Superwall][Event] paywallWillOpenDeepLink', p));
        // Purchase lifecycle (critical for diagnosing "loading forever" after tapping Pay)
        sub('onPurchase', (p: any) => console.log('[Superwall][Event] onPurchase', p));
        sub('onPurchaseRestore', (p: any) => console.log('[Superwall][Event] onPurchaseRestore', p));
        // Extra insight into paywall wiring / custom buttons / native SDK state
        sub('handleCustomPaywallAction', (p: any) => console.log('[Superwall][Event] handleCustomPaywallAction', p));
        sub('handleSuperwallEvent', (p: any) => console.log('[Superwall][Event] handleSuperwallEvent', p));
        sub('handleLog', (p: any) => console.log('[Superwall][SDK Log]', p));

        // Force verbose native logs in dev to surface why purchases don't start.
        try {
          SuperwallExpoModule.setLogLevel?.('debug');
        } catch {}

        const statusRaw = await SuperwallExpoModule.getConfigurationStatus().catch(() => '');
        const apiKeyRaw = await SuperwallExpoModule.getApiKey?.();
        const apiKeyPrefix =
          typeof apiKeyRaw === 'string' && apiKeyRaw.length > 0 ? `${apiKeyRaw.slice(0, 5)}***` : '(missing)';

        if (!cancelled) {
          console.log('[Superwall][Debug] initial configuration status:', statusRaw);
          console.log('[Superwall][Debug] native api key prefix:', apiKeyPrefix);
        }
      } catch (e: any) {
        if (!cancelled) console.log('[Superwall][Debug] logger not active:', e?.message || e);
      }
    })();

    return () => {
      cancelled = true;
      removeAll.forEach((fn) => fn());
      removeAll = [];
    };
  }, []);

  return null;
}


