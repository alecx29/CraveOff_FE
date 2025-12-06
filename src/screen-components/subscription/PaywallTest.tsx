import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Purchases, { CustomerInfo, PACKAGE_TYPE, PurchasesPackage } from 'react-native-purchases';

import { useTheme } from '@/src/context/ThemeProvider';
import {
  getRevenueCatCustomerInfo,
  getRevenueCatEntitlementId,
  getRevenueCatOfferings,
} from '@/src/services/revenueCat';

type PaywallTestProps = {
  onSubscribed?: () => void;
};

const PaywallTest: React.FC<PaywallTestProps> = ({ onSubscribed }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [isFetching, setIsFetching] = React.useState(true);
  const [isRequesting, setIsRequesting] = React.useState(false);
  const [errorText, setErrorText] = React.useState<string | null>(null);
  const [monthlyPackage, setMonthlyPackage] = React.useState<PurchasesPackage | null>(null);
  const [annualPackage, setAnnualPackage] = React.useState<PurchasesPackage | null>(null);
  const [requestingPlan, setRequestingPlan] = React.useState<'monthly' | 'annual' | null>(null);

  const entitlementId = React.useMemo(() => getRevenueCatEntitlementId(), []);

  const checkEntitlement = React.useCallback(
    (info?: CustomerInfo | null) => {
      if (!info || !entitlementId) return false;
      const active = !!info.entitlements?.active?.[entitlementId];
      if (active && onSubscribed) {
        onSubscribed();
      }
      return active;
    },
    [entitlementId, onSubscribed],
  );

  const selectPackages = React.useCallback((offering?: any | null) => {
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
  }, []);

  const pickOffering = (offerings?: any | null) => {
    if (!offerings) return null;
    if (offerings.current) return offerings.current;
    const allOfferings = offerings.all ? Object.values(offerings.all) : [];
    return allOfferings.length > 0 ? allOfferings[0] : null;
  };

  const refreshData = React.useCallback(async () => {
    setIsFetching(true);
    setErrorText(null);
    try {
      const [offerings, info] = await Promise.all([
        getRevenueCatOfferings(),
        getRevenueCatCustomerInfo(),
      ]);

      const offeringToUse = pickOffering(offerings);
      if (__DEV__) {
        console.log('[RevenueCat] Offerings fetched', {
          hasCurrent: !!offerings?.current,
          usingIdentifier: offeringToUse?.identifier,
          availablePackages: offeringToUse?.availablePackages?.map((pkg: PurchasesPackage) => ({
            id: pkg.identifier,
            type: pkg.packageType,
          })),
        });
      }

      selectPackages(offeringToUse);
      checkEntitlement(info);
    } catch (err: any) {
      setErrorText(err?.message || 'Failed to load subscription options.');
    } finally {
      setIsFetching(false);
    }
  }, [checkEntitlement, selectPackages]);

  React.useEffect(() => {
    refreshData();
  }, [refreshData]);

  const hasAnyPlan = !!monthlyPackage || !!annualPackage;

  const handleSubscribe = async (planType: 'monthly' | 'annual', pkg: PurchasesPackage | null) => {
    if (!pkg) {
      setErrorText('Subscription option not available yet. Please try again.');
      return;
    }

    setIsRequesting(true);
    setRequestingPlan(planType);
    setErrorText(null);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (!checkEntitlement(customerInfo)) {
        setErrorText('Purchase completed, awaiting activation. Please refresh shortly.');
      }
    } catch (err: any) {
      if (!err?.userCancelled) {
        setErrorText(err?.message || 'Purchase failed. Please try again.');
      }
    } finally {
      setIsRequesting(false);
      setRequestingPlan(null);
    }
  };

  const handleRestore = async () => {
    setIsRequesting(true);
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
    }
  };

  const formatMonthlyPrice = (pkg: PurchasesPackage | null) => {
    if (!pkg) return undefined;
    const base = pkg.product.pricePerMonthString ?? pkg.product.priceString;
    return base ? `${base} / mo` : undefined;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="star" size={18} color="#FBBF24" />
        <Text style={styles.title}>Premium Access</Text>
      </View>

      <Text style={styles.subtitle}>Choose the plan that fits you best.</Text>
      <View style={styles.planRow}>
        {monthlyPackage && (
          <PlanCard
            title="Monthly"
            subtitle="Billed monthly"
            price={formatMonthlyPrice(monthlyPackage)}
            onPress={() => handleSubscribe('monthly', monthlyPackage)}
            loading={isRequesting && requestingPlan === 'monthly'}
            disabled={isRequesting && requestingPlan !== 'monthly'}
          />
        )}
        {annualPackage && (
          <PlanCard
            title="Annual"
            subtitle="Best value"
            price={formatMonthlyPrice(annualPackage)}
            badge="BEST VALUE"
            onPress={() => handleSubscribe('annual', annualPackage)}
            loading={isRequesting && requestingPlan === 'annual'}
            disabled={isRequesting && requestingPlan !== 'annual'}
          />
        )}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={handleRestore} disabled={isRequesting}>
          <Text style={styles.restoreText}>Restore purchases</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={refreshData} disabled={isFetching}>
          <Text style={styles.restoreText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {isFetching && (
        <Text style={styles.infoText}>Loading subscription options…</Text>
      )}
      {!isFetching && !hasAnyPlan && (
        <Text style={styles.infoText}>Subscription not available yet. Ensure offerings are configured.</Text>
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
    planRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 12,
      marginBottom: 12,
    },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
    },
    restoreText: {
      color: '#C4B5FD',
      fontSize: 12,
      fontWeight: '600',
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

const planStyles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    position: 'relative',
    overflow: 'visible',
    paddingTop: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 8,
  },
  price: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 8,
  },
  badge: {
    backgroundColor: '#F59E0B',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeFloating: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
  },
  badgeText: {
    color: '#111827',
    fontSize: 10,
    fontWeight: '800',
  },
  buttonWrapper: {
    marginTop: 14,
    borderRadius: 999,
    overflow: 'hidden',
  },
  buttonInner: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});

type PlanCardProps = {
  title: string;
  subtitle: string;
  price?: string;
  badge?: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

const PlanCard = ({
  title,
  subtitle,
  price,
  badge,
  loading,
  disabled,
  onPress,
}: PlanCardProps) => {
  return (
    <View style={planStyles.container}>
      {!!badge && (
        <View style={[planStyles.badge, planStyles.badgeFloating]}>
          <Text style={planStyles.badgeText}>{badge}</Text>
        </View>
      )}
      <View style={planStyles.header}>
        <Text style={planStyles.title}>{title}</Text>
      </View>
      <Text style={planStyles.subtitle}>{subtitle}</Text>
      <Text style={planStyles.price}>{price ?? 'Not available'}</Text>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={planStyles.buttonWrapper}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#F59E0B', '#EF4444']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={planStyles.buttonInner}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={planStyles.buttonText}>Subscribe</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

