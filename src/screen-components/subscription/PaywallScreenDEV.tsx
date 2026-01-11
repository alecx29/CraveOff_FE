/**
 * DEV-only legacy paywall screen (custom UI).
 *
 * This is the old "Start your 3-day FREE trial..." paywall screen.
 * We keep it around for reference / internal testing, but the main user flow
 * should present the RevenueCat dashboard paywall via `react-native-purchases-ui`.
 */

import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ImageBackground, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Purchases, { CustomerInfo, PACKAGE_TYPE, PurchasesPackage } from 'react-native-purchases';
import { useRouter } from 'expo-router';

import {
  getRevenueCatCustomerInfo,
  getRevenueCatEntitlementId,
  getRevenueCatOfferings,
} from '@/src/services/revenueCat';

type PlanKey = 'annual' | 'lunar';

type TimelineItem = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export default function PaywallScreenDEV() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('annual');
  const [isFetching, setIsFetching] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestingAction, setRequestingAction] = useState<'purchase' | 'restore' | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [annualPackage, setAnnualPackage] = useState<PurchasesPackage | null>(null);

  const entitlementId = useMemo(() => getRevenueCatEntitlementId(), []);

  const checkEntitlement = React.useCallback(
    (info?: CustomerInfo | null) => {
      if (!info || !entitlementId) return false;
      const active = !!info.entitlements?.active?.[entitlementId];
      if (active) {
        // After successful purchase/restore, proceed into the app.
        router.replace('/(tabs)');
      }
      return active;
    },
    [entitlementId, router]
  );

  // Match the padding structure used by the "We want you to try..." modal.
  // (Scrollable body + fixed bottom actions; padding only in those containers.)
  // On some Android devices with 3-button navigation, `insets.bottom` can be 0 even though the nav bar overlaps content.
  // We apply a small fallback ONLY in that case.
  const androidNavBarInsetFallback = 24;
  const effectiveBottomInset =
    Platform.OS === 'android' && insets.bottom === 0 ? androidNavBarInsetFallback : insets.bottom;
  // Keep the title closer to the top; only offset for the status bar/safe-area.
  const modalLikeTopPadding = insets.top + 52;
  const modalLikeBottomPadding = Math.max(effectiveBottomInset + 16, 32);

  const { styles, iconSizeSmall, iconSizeMed } = useMemo(() => {
    // Responsive scaling (keeps the UI close to your reference across devices).
    const rawScale = Math.min(width / 390, height / 844);
    const scale = Math.max(0.82, Math.min(rawScale, 1));

    const s = (n: number) => n * scale;
    return {
      styles: createStyles(scale),
      iconSizeSmall: Math.round(s(20)),
      iconSizeMed: Math.round(s(22)),
    };
  }, [height, width]);

  const pickOffering = (offerings?: any | null) => {
    if (!offerings) return null;
    if (offerings.current) return offerings.current;
    const allOfferings = offerings.all ? Object.values(offerings.all) : [];
    return allOfferings.length > 0 ? allOfferings[0] : null;
  };

  const selectPackages = (offering?: any | null) => {
    if (!offering) {
      setMonthlyPackage(null);
      setAnnualPackage(null);
      return;
    }

    const fallback = (pkgType: PACKAGE_TYPE) =>
      offering.availablePackages?.find((pkg: PurchasesPackage) => pkg.packageType === pkgType) ?? null;

    const nextMonthly = offering.monthly ?? fallback(PACKAGE_TYPE.MONTHLY);
    const nextAnnual = offering.annual ?? fallback(PACKAGE_TYPE.ANNUAL);

    setMonthlyPackage(nextMonthly ?? null);
    setAnnualPackage(nextAnnual ?? null);
  };

  const refreshData = React.useCallback(async () => {
    setIsFetching(true);
    setErrorText(null);
    try {
      const [offerings, info] = await Promise.all([getRevenueCatOfferings(), getRevenueCatCustomerInfo()]);
      const offeringToUse = pickOffering(offerings);
      selectPackages(offeringToUse);
      checkEntitlement(info);
    } catch (err: any) {
      setErrorText(err?.message || 'Failed to load subscription options.');
    } finally {
      setIsFetching(false);
    }
  }, [checkEntitlement]);

  React.useEffect(() => {
    refreshData();
  }, [refreshData]);

  const formatPrice = (pkg: PurchasesPackage | null, suffix: string) => {
    if (!pkg) return undefined;
    const base = pkg.product.priceString;
    return base ? `${base} ${suffix}` : undefined;
  };

  const annualPriceText = formatPrice(annualPackage, '/ year') ?? '299,99 RON / year';
  const monthlyPriceText = formatPrice(monthlyPackage, '/ mo') ?? '29,99 RON / mo';

  const handlePurchase = async () => {
    const pkg = selectedPlan === 'annual' ? annualPackage : monthlyPackage;
    if (!pkg) {
      setErrorText('Subscription option not available yet. Please try again.');
      return;
    }
    if (isRequesting) return;

    setIsRequesting(true);
    setRequestingAction('purchase');
    setErrorText(null);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (!checkEntitlement(customerInfo)) {
        Alert.alert('CraveOff', 'Purchase completed. If access is not active yet, please wait a moment and try Restore.');
      }
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
      const info = await Purchases.restorePurchases();
      if (!checkEntitlement(info)) {
        setErrorText('No previous subscription found to restore.');
      }
    } catch (err: any) {
      setErrorText(err?.message || 'Restore failed. Please try again.');
    } finally {
      setIsRequesting(false);
      setRequestingAction(null);
    }
  };

  const timeline: TimelineItem[] = useMemo(
    () => [
      {
        title: 'Today',
        subtitle: "Unlock access to all the app's features\nand qui porn",
        icon: 'lock-closed',
      },
      {
        title: 'In 2 Days - Reminder',
        subtitle: "We'll send you a reminder that your\ntrial is ending soon.",
        icon: 'notifications',
      },
      {
        title: 'In 3 Days - Billing Starts',
        subtitle: "You'll be charged on 10 ian. 2026\nunless you cancel anytime before.",
        icon: 'trophy',
      },
    ],
    []
  );

  return (
    <ImageBackground
      source={require('@/assets/images/PaymentScreen.png')}
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
          <PaywallText style={styles.title}>Start your 3-day FREE{'\n'}trial to continue</PaywallText>

          <View style={styles.timeline}>
            <LinearGradient
              colors={['#ff3aa6', '#6a5cff']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.timelineBar}
            />

            {timeline.map((item, idx) => {
              const dotBg = idx < 2 ? '#ff3aa6' : '#6a5cff';
              const iconSize = idx === 0 ? iconSizeSmall : iconSizeMed;
              return (
                <View key={item.title} style={styles.timelineEntry}>
                  <View style={styles.timelineIconCol}>
                    <View style={[styles.timelineDot, { backgroundColor: dotBg }]}>
                      <Ionicons name={item.icon} size={iconSize} color="#0B0F1F" />
                    </View>
                  </View>
                  <View style={styles.timelineTextCol}>
                    <View style={styles.timelineTitleRow}>
                      <PaywallText style={styles.timelineTitle}>{item.title}</PaywallText>
                    </View>
                    <PaywallText style={styles.timelineSubtitle}>{item.subtitle}</PaywallText>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View style={[styles.actions, { paddingBottom: modalLikeBottomPadding }]}>
          <View style={styles.plansRow}>
            <PlanCard
              styles={styles}
              selected={selectedPlan === 'annual'}
              topPill="3 Days Free"
              label="ANUAL"
              price={annualPriceText}
              onPress={() => setSelectedPlan('annual')}
            />
            <PlanCard
              styles={styles}
              selected={selectedPlan === 'lunar'}
              label="LUNAR"
              price={monthlyPriceText}
              onPress={() => setSelectedPlan('lunar')}
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
                <PaywallText style={styles.ctaText}>Start My 3-day Free Trial</PaywallText>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <PaywallText style={styles.finePrint}>3 days free, then 25,00 RON / month</PaywallText>

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
  price,
  onPress,
}: {
  styles: any;
  selected: boolean;
  topPill?: string;
  label: string;
  price: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.planCard, selected ? styles.planCardSelected : styles.planCardUnselected]}
    >
      {topPill ? (
        <View style={styles.planPillWrap}>
          <View style={styles.planPill}>
            <PaywallText style={styles.planPillText}>{topPill}</PaywallText>
          </View>
        </View>
      ) : null}

      <PaywallText style={[styles.planLabel, selected ? styles.planLabelSelected : styles.planLabelUnselected]}>{label}</PaywallText>
      <PaywallText style={[styles.planPrice, selected ? styles.planPriceSelected : styles.planPriceUnselected]}>{price}</PaywallText>
    </TouchableOpacity>
  );
}

const createStyles = (scale: number) => {
  const s = (n: number) => n * scale;
  const timelineDotSize = s(42);
  const timelineIconColWidth = s(58);
  const timelineBarWidth = s(10);
  return StyleSheet.create({
    background: {
      flex: 1,
    },
    dim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
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
    title: {
      color: '#ffffff',
      fontSize: s(32),
      fontWeight: '900',
      textAlign: 'center',
      lineHeight: s(36),
      letterSpacing: 0.2,
      marginBottom: s(14),
    },
    timeline: {
      width: '100%',
      marginTop: s(8),
      marginBottom: s(14),
      position: 'relative',
    },
    timelineBar: {
      position: 'absolute',
      left: (timelineIconColWidth / 2) - (timelineBarWidth / 2),
      top: timelineDotSize / 2,
      bottom: timelineDotSize / 2,
      width: timelineBarWidth,
      borderRadius: 999,
      opacity: 0.85,
    },
    timelineEntry: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: s(14),
    },
    timelineIconCol: {
      width: timelineIconColWidth,
      alignItems: 'center',
      justifyContent: 'center',
    },
    timelineDot: {
      width: timelineDotSize,
      height: timelineDotSize,
      borderRadius: timelineDotSize / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    timelineTextCol: {
      flex: 1,
      paddingTop: 0,
    },
    timelineTitleRow: {
      minHeight: timelineDotSize,
      justifyContent: 'center',
    },
    timelineTitle: {
      color: '#ffffff',
      fontSize: s(18),
      fontWeight: '800',
      marginBottom: s(2),
    },
    timelineSubtitle: {
      color: 'rgba(255, 255, 255, 0.45)',
      fontSize: s(14),
      lineHeight: s(18),
      fontWeight: '400',
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
      borderRadius: s(18),
      paddingVertical: s(16),
      paddingHorizontal: s(12),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    planCardSelected: {
      backgroundColor: '#ffffff',
      borderColor: 'rgba(255, 255, 255, 0.65)',
    },
    planCardUnselected: {
      backgroundColor: 'rgba(0, 0, 0, 0.38)',
      borderColor: 'rgba(255, 255, 255, 0.18)',
    },
    planPillWrap: {
      position: 'absolute',
      top: -s(14),
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    planPill: {
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.65)',
      paddingHorizontal: s(10),
      paddingVertical: s(6),
      borderRadius: 999,
    },
    planPillText: {
      color: '#ffffff',
      fontSize: s(13),
      fontWeight: '900',
    },
    planLabel: {
      fontSize: s(16),
      fontWeight: '900',
      letterSpacing: 1.0,
      marginBottom: s(8),
    },
    planLabelSelected: {
      color: 'rgba(15, 23, 42, 0.18)',
    },
    planLabelUnselected: {
      color: '#ffffff',
      opacity: 0.88,
    },
    planPrice: {
      fontSize: s(17),
      fontWeight: '900',
    },
    planPriceSelected: {
      color: '#0B0F1F',
    },
    planPriceUnselected: {
      color: '#ffffff',
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
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: s(12),
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

