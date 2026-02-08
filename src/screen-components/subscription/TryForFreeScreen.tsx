import React from 'react';
import { ActivityIndicator, Alert, Image, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useTheme } from '@/src/context/ThemeProvider';
import { getAccessStatus } from '@/src/services/accessStatus';

export default function TryForFreeScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = createStyles(theme, insets);
  const [isLoading, setIsLoading] = React.useState(false);
  const premiumNotifiedRef = React.useRef(false);

  const goBack = () => router.back();

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const access = await getAccessStatus({ useCache: true });
        if (cancelled) return;
        if (access?.isPremium && !premiumNotifiedRef.current) {
          premiumNotifiedRef.current = true;
          Alert.alert('CraveOff', 'You already have an active subscription. Enjoy premium access!', [
            { text: 'OK', onPress: () => router.replace('/(tabs)') },
          ]);
        }
      } catch {
        // non-blocking
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const goToPaywall = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      // Avoid even entering the paywall route if backend says user is already premium.
      try {
        const access = await getAccessStatus({ useCache: false });
        if (access?.isPremium) {
          if (!premiumNotifiedRef.current) {
            premiumNotifiedRef.current = true;
            Alert.alert('CraveOff', 'You already have an active subscription. Enjoy premium access!', [
              { text: 'OK', onPress: () => router.replace('/(tabs)') },
            ]);
          } else {
            router.replace('/(tabs)');
          }
          return;
        }
      } catch (e: any) {
        // If we can't verify access (network/token issues), don't block the user from viewing the paywall.
        if (__DEV__) console.warn('[Access] /access/status check failed; continuing to paywall:', e?.message || e);
      }
      router.push('/(auth)/paywall');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require('@/assets/images/PaymentScreen.png')}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.bgDim} pointerEvents="none" />

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Image source={require('@/assets/images/logo.png')} style={styles.headerLogo} resizeMode="contain" />
            <TouchableOpacity style={styles.closeButton} onPress={goBack} activeOpacity={0.8}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>We want you to try CraveOff for free</Text>
            <View style={styles.phoneImageWrap}>
              <Image source={require('@/assets/images/phone-home-cut2.png')} style={styles.phoneImage} resizeMode="contain" />
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <View style={styles.noPaymentRow}>
              <Ionicons name="checkmark" size={18} color="#ffffff" />
              <Text style={styles.noPaymentText}>No Payment Due Now</Text>
            </View>
            <TouchableOpacity style={styles.primary} onPress={goToPaywall} activeOpacity={0.85} disabled={isLoading}>
              {isLoading ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.primaryText}>Try For FREE</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const createStyles = (_theme: any, insets: { top: number; bottom: number }) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: '#000',
    },
    bg: {
      flex: 1,
    },
    bgDim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
    },
    content: {
      flex: 1,
      paddingTop: Math.max(insets.top + 12, 40),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingBottom: 8,
    },
    headerSpacer: {
      width: 40,
      height: 40,
    },
    headerLogo: {
      width: 150,
      height: 38,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    bodyScroll: {
      flex: 1,
    },
    bodyContent: {
      paddingHorizontal: 24,
      alignItems: 'center',
      paddingBottom: 16,
      paddingTop: 28,
    },
    title: {
      color: '#fff',
      fontSize: 28,
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: 20,
    },
    phoneImage: {
      width: '100%',
      maxWidth: 320,
      height: 380,
    },
    phoneImageWrap: {
      width: '100%',
      alignItems: 'center',
      shadowColor: '#ffffff',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 6,
      elevation: 3,
    },
    actions: {
      paddingHorizontal: 24,
      paddingBottom: Math.max(insets.bottom + 16, 32),
    },
    noPaymentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 14,
    },
    noPaymentText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '700',
    },
    primary: {
      backgroundColor: '#7C3AED',
      borderRadius: 30,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '800',
    },
  });

