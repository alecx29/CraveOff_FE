import React from 'react';
import { Platform, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useIAP } from 'react-native-iap';

import { SUBSCRIPTION_SKUS } from '@/src/config-files/constants/subscription';
import { useTheme } from '@/src/context/ThemeProvider';

type PaywallTestProps = {
  onSubscribed?: () => void;
};

const PaywallTest: React.FC<PaywallTestProps> = ({ onSubscribed }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [isFetching, setIsFetching] = React.useState(false);
  const [isRequesting, setIsRequesting] = React.useState(false);
  const [errorText, setErrorText] = React.useState<string | null>(null);
  const [productReady, setProductReady] = React.useState(false);

  const monthlySku = Platform.select({
    ios: SUBSCRIPTION_SKUS.ios.monthly,
    android: SUBSCRIPTION_SKUS.android.monthly,
    default: SUBSCRIPTION_SKUS.android.monthly,
  })!;

  const {
    connected,
    subscriptions,
    requestPurchase,
    fetchProducts,
    finishTransaction,
    getActiveSubscriptions,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      try {
        await finishTransaction({ purchase, isConsumable: false });
      } catch {}
      try {
        await getActiveSubscriptions();
      } catch {}
      setIsRequesting(false);
      if (onSubscribed) onSubscribed();
    },
    onPurchaseError: (err) => {
      setIsRequesting(false);
      setErrorText(err?.message || 'Purchase failed');
    },
  });

  // Track if the subscription SKU is available from the store
  React.useEffect(() => {
    const found = subscriptions?.some((s: any) => s?.id === monthlySku) ?? false;
    setProductReady(found);
  }, [subscriptions, monthlySku]);

  const ensureFetched = React.useCallback(async () => {
    if (!connected) return;
    setIsFetching(true);
    setErrorText(null);
    try {
      await fetchProducts({ skus: [monthlySku], type: 'subs' });
    } catch (e: any) {
      setErrorText(e?.message || 'Failed to fetch products');
    } finally {
      setIsFetching(false);
    }
  }, [connected, fetchProducts, monthlySku]);

  React.useEffect(() => {
    ensureFetched();
  }, [ensureFetched]);

  // Safety timeout for long-running requests
  React.useEffect(() => {
    if (!isRequesting) return;
    const t = setTimeout(() => {
      setIsRequesting(false);
      setErrorText('Purchase timed out. Please try again.');
    }, 30000);
    return () => clearTimeout(t);
  }, [isRequesting]);

  const handleSubscribe = async () => {
    if (!connected) {
      setErrorText('Store connection not ready yet.');
      return;
    }
    setIsRequesting(true);
    setErrorText(null);
    try {
      await requestPurchase({
        type: 'subs',
        request: {
          ios: { sku: monthlySku },
          android: { skus: [monthlySku] },
        },
      });
    } catch (e: any) {
      setErrorText(e?.message || 'Failed to start purchase');
      setIsRequesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="star" size={18} color="#FBBF24" />
        <Text style={styles.title}>Premium Monthly</Text>
      </View>
      <Text style={styles.subtitle}>Unlock everything. Cancel anytime.</Text>

      <TouchableOpacity
        onPress={handleSubscribe}
        activeOpacity={0.85}
        disabled={isRequesting || isFetching || !productReady}
        style={styles.buttonWrapper}
      >
        <LinearGradient
          colors={[ '#F59E0B', '#EF4444' ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.button}
        >
          {isRequesting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Subscribe Monthly (Test)</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {!connected && (
        <Text style={styles.infoText}>Connecting to store…</Text>
      )}
      {connected && !productReady && !isFetching && (
        <Text style={styles.infoText}>Subscription not available yet. Ensure SKU exists and is approved.</Text>
      )}
      {!!errorText && <Text style={styles.errorText}>{errorText}</Text>}
    </View>
  );
};

const createStyles = (_theme: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.18)',
      marginTop: 10,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6,
    },
    title: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '800',
    },
    subtitle: {
      color: 'rgba(255,255,255,0.85)',
      fontSize: 13,
      marginBottom: 12,
    },
    buttonWrapper: {
      borderRadius: 12,
      overflow: 'hidden',
    },
    button: {
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '700',
    },
    infoText: {
      color: 'rgba(255,255,255,0.85)',
      fontSize: 12,
      marginTop: 10,
    },
    errorText: {
      color: '#FCA5A5',
      fontSize: 12,
      marginTop: 8,
    },
  });

export default PaywallTest;


