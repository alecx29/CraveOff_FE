import {} from "react-native";
import Constants from "expo-constants";
import DeviceInfo from "react-native-device-info";
import devUpdateConfig from "@/src/config-files/update-config-dev";
import * as Updates from "expo-updates";

type PlatformKey = "ios" | "android";

export type PlatformUpdateRules = {
  minBuild?: string | number;
  latest?: string | number;
};

export type RemoteUpdateConfig = {
  ios?: PlatformUpdateRules;
  android?: PlatformUpdateRules;
  messageMandatory?: string;
  messageOptional?: string;
};

export type UpdateStatus = {
  requiresForce: boolean;
  updateAvailable: boolean;
  latestBuild?: number;
  minBuild?: number;
  currentBuild: number;
  messageMandatory?: string;
  messageOptional?: string;
};

function toInt(value: unknown | undefined): number | undefined {
  if (value === undefined || value === null) return undefined;
  const n = parseInt(String(value), 10);
  return Number.isFinite(n) ? n : undefined;
}

export async function getCurrentBuildNumber(): Promise<number> {
  const bn = DeviceInfo.getBuildNumber(); // string like "40"
  const n = parseInt(bn, 10);
  return Number.isFinite(n) ? n : 0;
}

export function getStoreLinks(): { ios?: string; android?: string } {
  const extra =
    ((Constants as any)?.expoConfig?.extra as any) ||
    ((Updates as any)?.manifest?.extra as any) ||
    {};
  const iosId: string | undefined = extra?.iosAppStoreId;
  const androidPkg: string | undefined =
    extra?.androidPackage || (Constants?.expoConfig as any)?.android?.package;

  return {
    ios: iosId ? `itms-apps://itunes.apple.com/app/id${iosId}` : undefined,
    android: androidPkg ? `market://details?id=${androidPkg}` : undefined,
  };
}

export async function fetchRemoteUpdateConfig(): Promise<RemoteUpdateConfig | null> {
  const extra =
    ((Constants as any)?.expoConfig?.extra as any) ||
    ((Updates as any)?.manifest?.extra as any) ||
    {};
  const url: string | undefined = extra?.updateConfigUrl;

  // Allow dev testing via local file when enabled
  const enableInDev = extra?.enableUpdateGateInDev === true;
  if (__DEV__ && enableInDev) {
    return devUpdateConfig as RemoteUpdateConfig;
  }

  if (!url) return null;
  try {
    const res = await fetch(url, {
      headers: {
        "cache-control": "no-cache",
        pragma: "no-cache",
      },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as RemoteUpdateConfig;
    return json || null;
  } catch {
    return null;
  }
}

export function evaluateUpdateStatus(
  platform: PlatformKey,
  currentBuild: number,
  config: RemoteUpdateConfig | null
): UpdateStatus {
  const rules = config?.[platform];
  const minBuild = toInt(rules?.minBuild);
  const latestBuild = toInt(rules?.latest);

  const requiresForce = !!(minBuild && currentBuild < minBuild);
  const updateAvailable = !!(
    latestBuild &&
    currentBuild < latestBuild &&
    !requiresForce
  );

  return {
    requiresForce,
    updateAvailable,
    latestBuild: latestBuild ?? undefined,
    minBuild: minBuild ?? undefined,
    currentBuild,
    messageMandatory: config?.messageMandatory,
    messageOptional: config?.messageOptional,
  };
}
