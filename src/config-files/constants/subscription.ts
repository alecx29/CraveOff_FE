export const SUBSCRIPTION_SKUS = {
  // Replace with real product IDs when available in App Store Connect / Google Play Console
  ios: {
    monthly: "craveoff_monthly_sub",
    annual: "craveoff_annual_sub",
  },
  android: {
    // For Android subscriptions created in Play Console you typically have a productId and base plan ID.
    // react-native-iap expects the productId for request; offer tokens are resolved from fetchProducts when needed.
    monthly: "craveoff_monthly_sub",
    // annual: 'craveoff_annual_sub', // TODO: set real Android annual productId when created
  },
} as const;

export type PlatformSku = (typeof SUBSCRIPTION_SKUS)["ios" | "android"];
