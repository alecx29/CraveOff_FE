import { Platform } from "react-native";
import Constants from "expo-constants";
import Purchases, { CustomerInfo, LOG_LEVEL } from "react-native-purchases";

type RevenueCatConfig = {
  iosApiKey?: string;
  androidApiKey?: string;
  publicApiKey?: string;
  entitlementId?: string;
};

const getRevenueCatConfig = (): RevenueCatConfig => {
  const extra =
    (Constants.expoConfig as any)?.extra ??
    (Constants.manifest as any)?.extra ??
    {};
  return extra.revenueCat ?? {};
};

const FALLBACK_IOS_KEY = "appl_TvqcrNvOzhrgtyWVHedaKMZBcmH";
const FALLBACK_ANDROID_KEY = "goog_OtBqOAUdGCvwygWNWrprerAhHNw";
const FALLBACK_PUBLIC_KEY = "appl_TvqcrNvOzhrgtyWVHedaKMZBcmH";
const FALLBACK_ENTITLEMENT = "default";

// Prefer runtime env (EXPO_PUBLIC_*) first, then constants from app.config,
// and only then fall back to hardcoded values as an absolute last resort.
const config = getRevenueCatConfig();

const iosApiKey =
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ||
  config.iosApiKey ||
  FALLBACK_IOS_KEY;

const androidApiKey =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ||
  config.androidApiKey ||
  FALLBACK_ANDROID_KEY;

const publicApiKey =
  process.env.EXPO_PUBLIC_REVENUECAT_PUBLIC_KEY ||
  config.publicApiKey ||
  FALLBACK_PUBLIC_KEY;

const entitlementId =
  process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID ||
  config.entitlementId ||
  FALLBACK_ENTITLEMENT;

if (__DEV__) {
  console.log("[RevenueCat] Loaded config", {
    iosApiKey: iosApiKey ? `${iosApiKey.slice(0, 6)}***` : "(missing)",
    androidApiKey: androidApiKey
      ? `${androidApiKey.slice(0, 6)}***`
      : "(missing)",
    publicApiKey: publicApiKey ? `${publicApiKey.slice(0, 6)}***` : "(missing)",
    entitlementId,
  });
}

const getPlatformApiKey = () => {
  if (Platform.OS === "ios" && iosApiKey) return iosApiKey;
  if (Platform.OS === "android" && androidApiKey) return androidApiKey;
  return publicApiKey;
};

let initialized = false;
let missingKeyWarned = false;

const configure = async (appUserId?: string | null) => {
  const apiKey = getPlatformApiKey();
  if (!apiKey) {
    if (!missingKeyWarned) {
      console.warn(
        `[RevenueCat] Missing API key for platform ${
          Platform.OS
        }. Set EXPO_PUBLIC_REVENUECAT_${
          Platform.OS === "ios" ? "IOS" : "ANDROID"
        }_KEY or EXPO_PUBLIC_REVENUECAT_PUBLIC_KEY.`
      );
      missingKeyWarned = true;
    }
    return false;
  }

  if (!initialized) {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
  }

  await Purchases.configure({
    apiKey,
    appUserID: appUserId ?? undefined,
  });
  initialized = true;
  missingKeyWarned = false;
  return true;
};

export const initRevenueCat = async (appUserId?: string | null) => {
  try {
    await configure(appUserId);
  } catch (err) {
    console.warn("[RevenueCat] Failed to configure SDK:", err);
  }
};

export const logInRevenueCat = async (appUserId?: string | null) => {
  if (!appUserId) return;
  try {
    if (!initialized) {
      const ready = await configure(appUserId);
      if (!ready) return;
    }
    await Purchases.logIn(appUserId);
  } catch (err) {
    console.warn("[RevenueCat] Failed to log in user:", err);
  }
};

export const logOutRevenueCat = async () => {
  if (!initialized) return;
  try {
    await Purchases.logOut();
  } catch (err) {
    console.warn("[RevenueCat] Failed to log out user:", err);
  }
};

type OfferingsResult = Awaited<ReturnType<typeof Purchases.getOfferings>>;

export const getRevenueCatOfferings =
  async (): Promise<OfferingsResult | null> => {
    try {
      if (!initialized) {
        const ready = await configure();
        if (!ready) return null;
      }
      return await Purchases.getOfferings();
    } catch (err) {
      console.warn("[RevenueCat] Failed to fetch offerings:", err);
      return null;
    }
  };

export const getRevenueCatCustomerInfo =
  async (): Promise<CustomerInfo | null> => {
    try {
      if (!initialized) {
        const ready = await configure();
        if (!ready) return null;
      }
      return await Purchases.getCustomerInfo();
    } catch (err) {
      console.warn("[RevenueCat] Failed to fetch customer info:", err);
      return null;
    }
  };

export const getRevenueCatEntitlementId = () => entitlementId;
