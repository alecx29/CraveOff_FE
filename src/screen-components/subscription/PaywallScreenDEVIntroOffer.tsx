/**
 * DEV-only custom paywall screen for the Claim Free Trial button.
 * Same UI as PaywallScreenDEV, but only shows the yearly plan and uses
 * the Android introductory offer (offer id: 80-off) when available.
 */

import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, ImageBackground, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Purchases, { PACKAGE_TYPE, PurchasesPackage } from 'react-native-purchases';
import { useRouter } from 'expo-router';

import {
  getRevenueCatOfferings,
} from '@/src/services/revenueCat';
import { getAccessStatus, waitForPremiumAccess } from '@/src/services/accessStatus';

const DISCOUNT_OFFERING_ID = 'discount';

export default function PaywallScreenDEVIntroOffer() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const [isFetching, setIsFetching] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestingAction, setRequestingAction] = useState<'purchase' | 'restore' | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [annualPackage, setAnnualPackage] = useState<PurchasesPackage | null>(null);
  const premiumNotifiedRef = React.useRef(false);

  // Match the padding structure used by the "We want you to try..." modal.
  // (Scrollable body + fixed bottom actions; padding only in those containers.)
  // On some Android devices with 3-button navigation, `insets.bottom` can be 0 even though the nav bar overlaps content.
  // We apply a small fallback ONLY in that case.
  const androidNavBarInsetFallback = 24;
  const effectiveBottomInset =
    Platform.OS === 'android' && insets.bottom === 0 ? androidNavBarInsetFallback : insets.bottom;
  // Keep the title closer to the top; only offset for the status bar/safe-area.
  const modalLikeTopPadding = insets.top + 18;
  const modalLikeBottomPadding = Math.max(effectiveBottomInset + 16, 32);

  const { styles } = useMemo(() => {
    // Responsive scaling (keeps the UI close to your reference across devices).
    const rawScale = Math.min(width / 390, height / 844);
    const scale = Math.max(0.82, Math.min(rawScale, 1));

    return {
      styles: createStyles(scale),
    };
  }, [height, width]);

  const pickOffering = (offerings?: any | null) => {
    if (!offerings) return null;
    const all = offerings.all ? (Object.values(offerings.all) as any[]) : [];
    const explicit = (offerings.all && offerings.all[DISCOUNT_OFFERING_ID]) || all.find((o) => o?.identifier === DISCOUNT_OFFERING_ID);
    return explicit ?? offerings.current ?? all[0] ?? null;
  };

  const selectPackage = (offering?: any | null) => {
    if (!offering) {
      setAnnualPackage(null);
      return;
    }

    const fallback = (pkgType: PACKAGE_TYPE) =>
      offering.availablePackages?.find((pkg: PurchasesPackage) => pkg.packageType === pkgType) ?? null;

    const nextAnnual = offering.annual ?? fallback(PACKAGE_TYPE.ANNUAL);
    setAnnualPackage(nextAnnual ?? null);
  };

  const refreshData = React.useCallback(async () => {
    setIsFetching(true);
    setErrorText(null);
    try {
      const [offerings, access] = await Promise.all([getRevenueCatOfferings(), getAccessStatus({ useCache: true })]);
      if (access?.isPremium) {
        if (!premiumNotifiedRef.current) {
          premiumNotifiedRef.current = true;
          Alert.alert('CraveOff', 'You already have an active subscription. Enjoy premium access!', [
            { text: 'OK', onPress: () => router.replace('/(auth)/premium-intro') },
          ]);
          return;
        }
        router.replace('/(auth)/premium-intro');
        return;
      }
      const offeringToUse = pickOffering(offerings);
      selectPackage(offeringToUse);
    } catch (err: any) {
      setErrorText(err?.message || 'Failed to load subscription options.');
    } finally {
      setIsFetching(false);
    }
  }, [router]);

  React.useEffect(() => {
    refreshData();
  }, [refreshData]);

  const annualSubtitleText = annualPackage?.product?.priceString
    ? `12mo • ${annualPackage.product.priceString}`
    : '12mo • 199,99 RON';
  const annualMonthlyText = annualPackage?.product?.pricePerMonthString
    ? `${annualPackage.product.pricePerMonthString}/mo`
    : '8,33 RON/mo';

  const purchaseAnnualPackage = async () => {
    if (!annualPackage) {
      setErrorText('Subscription option not available yet. Please try again.');
      return;
    }

    await Purchases.purchasePackage(annualPackage);
  };

  const handlePurchase = async () => {
    if (isRequesting) return;

    setIsRequesting(true);
    setRequestingAction('purchase');
    setErrorText(null);
    try {
      await purchaseAnnualPackage();
      const access = await waitForPremiumAccess();
      if (access?.isPremium) {
        router.replace('/(auth)/premium-intro');
        return;
      }
      Alert.alert(
        'CraveOff',
        'Purchase completed, but access is still activating. Please wait a moment and try again (or tap Restore).',
      );
    } catch (err: any) {
      if (!err?.userCancelled) {
        setErrorText(err?.message || 'Purchase failed. Please try again.');
      }
    } finally {
      setIsRequesting(false);
      setRequestingAction(null);
    }
  };

  const handleRestore = async () => {
    if (isRequesting) return;
    setIsRequesting(true);
    setRequestingAction('restore');
    setErrorText(null);
    try {
      await Purchases.restorePurchases();
      const access = await waitForPremiumAccess();
      if (access?.isPremium) {
        router.replace('/(auth)/premium-intro');
        return;
      }
      setErrorText('No active subscription found to restore (or access is still activating).');
    } catch (err: any) {
      setErrorText(err?.message || 'Restore failed. Please try again.');
    } finally {
      setIsRequesting(false);
      setRequestingAction(null);
    }
  };

  const [remainingSeconds, setRemainingSeconds] = useState(4 * 60 + 59);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const countdownText = useMemo(() => {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }, [remainingSeconds]);

  return (
    <ImageBackground
      source={require('@/assets/images/afterPay1.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar style="light" />
      <View style={styles.dim} />

      <View style={[styles.screen, { paddingTop: modalLikeTopPadding }]}>
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerSpacer} />
            <Image source={require('@/assets/images/logo.png')} style={styles.headerLogo} resizeMode="contain" />
            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()} activeOpacity={0.8}>
              <Ionicons name="close" size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <PaywallText style={styles.offerTitle}>ONE TIME OFFER</PaywallText>
          <PaywallText style={styles.offerSubtitle}>You will never see this again</PaywallText>

          <View style={styles.discountBlock}>
            <LinearGradient
              colors={['#F046C7', '#5CC8FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.discountGradient}
            >
              <View style={styles.discountInner}>
                <PaywallText style={styles.discountPercent}>80%</PaywallText>
                <PaywallText style={styles.discountLabel}>DISCOUNT</PaywallText>
              </View>
            </LinearGradient>
            <PaywallText style={styles.discountNote}>This offer will expire in</PaywallText>
            <PaywallText style={styles.discountTimer}>{countdownText}</PaywallText>
          </View>
        </ScrollView>

        <View style={[styles.actions, { paddingBottom: modalLikeBottomPadding }]}>
          <View style={styles.plansRow}>
            <PlanCard
              styles={styles}
              selected
              topPill="LOWEST PRICE EVER"
              label="Yearly"
              subtitle={annualSubtitleText}
              rightPrice={annualMonthlyText}
              onPress={() => { }}
            />
          </View>

          <View style={styles.noPaymentRow}>
            <Ionicons name="checkmark" size={18} color="#ffffff" />
            <PaywallText style={styles.noPaymentText}>No Payment Due Now</PaywallText>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.ctaOuter}
            onPress={handlePurchase}
            disabled={isFetching || isRequesting}
          >
            <LinearGradient
              colors={['#6a5cff', '#b54cff']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.cta}
            >
              {isRequesting && requestingAction === 'purchase' ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <PaywallText style={styles.ctaText}>CLAIM YOUR OFFER NOW</PaywallText>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <PaywallText style={styles.finePrint}>
            Cancel anytime <PaywallText style={styles.finePrintDot}>·</PaywallText> Finnaly quit porn
          </PaywallText>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleRestore}
            disabled={isFetching || isRequesting}
          >
            <PaywallText style={styles.restore}>
              {isRequesting && requestingAction === 'restore' ? 'Restoring…' : 'Restore Purchase'}
            </PaywallText>
          </TouchableOpacity>

          {isFetching ? <PaywallText style={styles.helperText}>Loading subscription options…</PaywallText> : null}
          {!!errorText ? <PaywallText style={styles.errorText}>{errorText}</PaywallText> : null}
        </View>
      </View>
    </ImageBackground>
  );
}

function PaywallText({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <Text allowFontScaling={false} maxFontSizeMultiplier={1} style={style}>
      {children}
    </Text>
  );
}

function PlanCard({
  styles,
  selected,
  topPill,
  label,
  subtitle,
  rightPrice,
  onPress,
}: {
  styles: any;
  selected: boolean;
  topPill?: string;
  label: string;
  subtitle: string;
  rightPrice: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.planCard}
    >
      {topPill ? (
        <View style={styles.planTopPill}>
          <PaywallText style={styles.planTopPillText}>{topPill}</PaywallText>
        </View>
      ) : null}
      <LinearGradient
        colors={selected ? ['#8B5CF6', '#5B5BFF'] : ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.08)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.planCardBorder}
      >
        <View style={[styles.planCardInner, selected ? styles.planCardInnerSelected : styles.planCardInnerUnselected]}>
          <View style={styles.planContentRow}>
            <View style={styles.planTextCol}>
              <PaywallText style={styles.planLabelNew}>{label}</PaywallText>
              <PaywallText style={styles.planSubtitle}>{subtitle}</PaywallText>
            </View>
            <PaywallText style={styles.planRightPrice}>{rightPrice}</PaywallText>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const createStyles = (scale: number) => {
  const s = (n: number) => n * scale;
  return StyleSheet.create({
    background: {
      flex: 1,
      // Prevent a light/grey flash while the ImageBackground mounts during navigation transitions.
      backgroundColor: '#000',
    },
    dim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.10)',
    },
    screen: {
      flex: 1,
    },
    body: {
      flex: 1,
    },
    bodyContent: {
      paddingHorizontal: s(18),
      alignItems: 'center',
      paddingBottom: s(6),
    },
    actions: {
      paddingHorizontal: s(18),
      alignItems: 'center',
    },
    headerRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: s(18),
    },
    headerSpacer: {
      width: s(36),
      height: s(36),
    },
    headerLogo: {
      width: s(132),
      height: s(34),
    },
    closeButton: {
      padding: s(8),
    },
    offerTitle: {
      color: '#ffffff',
      fontSize: s(30),
      fontWeight: '900',
      textAlign: 'center',
      lineHeight: s(34),
      letterSpacing: 0.2,
      marginBottom: s(6),
    },
    offerSubtitle: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: s(15),
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: s(22),
    },
    discountBlock: {
      width: '100%',
      alignItems: 'center',
      marginTop: s(6),
      marginBottom: s(12),
    },
    discountGradient: {
      width: '82%',
      borderRadius: s(18),
      padding: s(3),
      shadowColor: '#A855F7',
      shadowOffset: { width: 0, height: s(10) },
      shadowOpacity: 0.6,
      shadowRadius: s(18),
      elevation: 14,
    },
    discountInner: {
      borderRadius: s(16),
      paddingVertical: s(20),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.18)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.65)',
    },
    discountPercent: {
      color: '#ffffff',
      fontSize: s(56),
      fontWeight: '900',
      lineHeight: s(60),
    },
    discountLabel: {
      color: '#ffffff',
      fontSize: s(18),
      fontWeight: '800',
      letterSpacing: 2,
      marginTop: s(6),
    },
    discountNote: {
      color: 'rgba(255, 255, 255, 0.85)',
      fontSize: s(15),
      fontWeight: '600',
      marginTop: s(16),
    },
    discountTimer: {
      color: '#ffffff',
      fontSize: s(36),
      fontWeight: '900',
      marginTop: s(8),
      letterSpacing: 1,
    },
    plansRow: {
      width: '100%',
      flexDirection: 'row',
      gap: s(12),
      marginTop: s(10),
      marginBottom: s(14),
    },
    planCard: {
      flex: 1,
      alignItems: 'center',
    },
    planTopPill: {
      paddingHorizontal: s(12),
      paddingVertical: s(6),
      borderRadius: 999,
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.35)',
      marginBottom: s(8),
    },
    planTopPillText: {
      color: '#ffffff',
      fontSize: s(12),
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    planCardBorder: {
      width: '100%',
      borderRadius: s(18),
      padding: s(2),
    },
    planCardInner: {
      borderRadius: s(16),
      paddingVertical: s(16),
      paddingHorizontal: s(16),
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    planCardInnerSelected: {
      backgroundColor: 'rgba(20, 20, 32, 0.9)',
    },
    planCardInnerUnselected: {
      backgroundColor: 'rgba(20, 20, 32, 0.7)',
    },
    planContentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: s(12),
    },
    planTextCol: {
      flex: 1,
    },
    planLabelNew: {
      color: '#ffffff',
      fontSize: s(18),
      fontWeight: '800',
    },
    planSubtitle: {
      color: 'rgba(255, 255, 255, 0.75)',
      fontSize: s(14),
      marginTop: s(4),
    },
    planRightPrice: {
      color: '#ffffff',
      fontSize: s(18),
      fontWeight: '800',
    },
    noPaymentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(8),
      marginBottom: s(16),
    },
    noPaymentText: {
      color: '#ffffff',
      fontSize: s(17),
      fontWeight: '800',
    },
    ctaOuter: {
      width: '100%',
      borderRadius: s(34),
      overflow: 'hidden',
      marginTop: s(4),
      marginBottom: s(12),
    },
    cta: {
      paddingVertical: s(16),
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaText: {
      color: '#ffffff',
      fontSize: s(17),
      fontWeight: '900',
    },
    finePrint: {
      color: 'rgba(255, 255, 255, 0.85)',
      fontSize: s(15),
      fontWeight: '500',
      textAlign: 'center',
      marginBottom: s(12),
    },
    finePrintDot: {
      color: 'rgba(255, 255, 255, 0.85)',
      fontSize: s(16),
      fontWeight: '500',
    },
    restore: {
      color: 'rgba(255, 255, 255, 0.75)',
      fontSize: s(15),
      fontWeight: '700',
      textAlign: 'center',
    },
    helperText: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: s(12),
      marginTop: s(10),
      textAlign: 'center',
    },
    errorText: {
      color: '#FCA5A5',
      fontSize: s(12),
      marginTop: s(8),
      textAlign: 'center',
    },
  });
};
