import Constants from "expo-constants";
import { Platform } from "react-native";

import { getRevenueCatEntitlementId, getRevenueCatOfferings } from "@/src/services/revenueCat";

type RevenueCatExtraConfig = {
  paywallOfferingId?: string;
};

const getExtraRevenueCatConfig = (): RevenueCatExtraConfig => {
  const extra =
    (Constants.expoConfig as any)?.extra ??
    (Constants.manifest2 as any)?.extra ??
    (Constants.manifest as any)?.extra ??
    {};
  return (extra?.revenueCat as RevenueCatExtraConfig) ?? {};
};

const pickOffering = (offerings: any, offeringId?: string | null) => {
  if (!offerings) return null;
  const all = offerings.all ? (Object.values(offerings.all) as any[]) : [];

  if (offeringId) {
    const match =
      (offerings.all && offerings.all[offeringId]) ||
      all.find((o) => o?.identifier === offeringId);
    if (match) return match;
  }

  return offerings.current ?? all[0] ?? null;
};

const resolveRevenueCatUI = (mod: any) => {
  // Metro / CJS interop sometimes wraps default exports in multiple layers.
  // Try a few common shapes:
  // - mod.default (ESM default)
  // - mod (CJS module.exports)
  // - mod.default.default (double-wrapped default)
  // - mod.RevenueCatUI (named export, if any)
  const candidates = [
    mod?.default,
    mod,
    mod?.default?.default,
    mod?.RevenueCatUI,
    mod?.default?.RevenueCatUI,
  ].filter(Boolean);

  const match = candidates.find((c) => typeof c?.presentPaywall === "function");
  if (match) return match;

  // Some shapes may require one more unwrap
  const nested = candidates
    .map((c) => c?.default)
    .filter(Boolean)
    .find((c) => typeof c?.presentPaywall === "function");
  if (nested) return nested;

  return null;
};

export type PresentRevenueCatPaywallResult = {
  result: string;
  offeringIdentifier?: string;
};

/**
 * Presents the RevenueCat *dashboard-built* native paywall UI (Paywalls).
 * This is intentionally separate from the app's other paywall screens/flows.
 *
 * Selection order:
 * - `offeringId` param (if provided)
 * - `extra.revenueCat.paywallOfferingId` or `EXPO_PUBLIC_REVENUECAT_OFFERING_ID`
 * - RevenueCat "current" offering, else first available offering
 */
export async function presentRevenueCatDashboardPaywall(params?: {
  offeringId?: string;
  displayCloseButton?: boolean;
}): Promise<PresentRevenueCatPaywallResult> {
  if (Platform.OS === "web") {
    return { result: "NOT_AVAILABLE_ON_WEB" };
  }

  const cfg = getExtraRevenueCatConfig();
  const configuredOfferingId =
    params?.offeringId ||
    cfg.paywallOfferingId ||
    process.env.EXPO_PUBLIC_REVENUECAT_OFFERING_ID ||
    undefined;

  const offerings = await getRevenueCatOfferings();
  const offering = pickOffering(offerings, configuredOfferingId);
  if (!offering) {
    throw new Error(
      "No RevenueCat offering found. Configure an offering in RevenueCat (and optionally set EXPO_PUBLIC_REVENUECAT_OFFERING_ID)."
    );
  }

  const RevenueCatUIModule: any = await import("react-native-purchases-ui");
  const RevenueCatUI = resolveRevenueCatUI(RevenueCatUIModule);
  if (!RevenueCatUI) {
    const keys = RevenueCatUIModule ? Object.keys(RevenueCatUIModule) : [];
    const defaultKeys = RevenueCatUIModule?.default
      ? Object.keys(RevenueCatUIModule.default)
      : [];
    throw new Error(
      `RevenueCat UI module loaded but 'presentPaywall' is missing. module keys=${JSON.stringify(
        keys
      )} default keys=${JSON.stringify(defaultKeys)}`
    );
  }

  const result = await RevenueCatUI.presentPaywall({
    offering,
    displayCloseButton: params?.displayCloseButton ?? true,
  });

  return {
    result: String(result),
    offeringIdentifier: offering?.identifier,
  };
}

/**
 * Presents the dashboard paywall only if the user does NOT already own the entitlement.
 * Defaults to the configured entitlement id from `src/services/revenueCat.ts`.
 */
export async function presentRevenueCatDashboardPaywallIfNeeded(params?: {
  requiredEntitlementIdentifier?: string;
  offeringId?: string;
  displayCloseButton?: boolean;
}): Promise<PresentRevenueCatPaywallResult> {
  if (Platform.OS === "web") {
    return { result: "NOT_AVAILABLE_ON_WEB" };
  }

  const entitlement =
    params?.requiredEntitlementIdentifier || getRevenueCatEntitlementId();
  if (!entitlement) {
    throw new Error(
      "Missing RevenueCat entitlement id. Set EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID or app.config.js extra.revenueCat.entitlementId."
    );
  }

  const cfg = getExtraRevenueCatConfig();
  const configuredOfferingId =
    params?.offeringId ||
    cfg.paywallOfferingId ||
    process.env.EXPO_PUBLIC_REVENUECAT_OFFERING_ID ||
    undefined;

  const offerings = await getRevenueCatOfferings();
  const offering = pickOffering(offerings, configuredOfferingId);
  if (!offering) {
    throw new Error(
      "No RevenueCat offering found. Configure an offering in RevenueCat (and optionally set EXPO_PUBLIC_REVENUECAT_OFFERING_ID)."
    );
  }

  const RevenueCatUIModule: any = await import("react-native-purchases-ui");
  const RevenueCatUI = resolveRevenueCatUI(RevenueCatUIModule);
  if (!RevenueCatUI) {
    const keys = RevenueCatUIModule ? Object.keys(RevenueCatUIModule) : [];
    const defaultKeys = RevenueCatUIModule?.default
      ? Object.keys(RevenueCatUIModule.default)
      : [];
    throw new Error(
      `RevenueCat UI module loaded but 'presentPaywallIfNeeded' is missing. module keys=${JSON.stringify(
        keys
      )} default keys=${JSON.stringify(defaultKeys)}`
    );
  }

  const result = await RevenueCatUI.presentPaywallIfNeeded({
    requiredEntitlementIdentifier: entitlement,
    offering,
    displayCloseButton: params?.displayCloseButton ?? true,
  });

  return {
    result: String(result),
    offeringIdentifier: offering?.identifier,
  };
}

