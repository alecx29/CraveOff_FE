import Constants from "expo-constants";

function toBoolean(value: unknown): boolean {
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v === "1" || v === "true" || v === "yes" || v === "on";
  }
  return Boolean(value);
}

export function isTestPaymentsEnabled(): boolean {
  const fromEnv =
    (process as any)?.env?.EXPO_PUBLIC_TEST_PAYMENTS ??
    (process as any)?.env?.TEST_PAYMENTS;
  const fromExtra =
    (Constants as any)?.expoConfig?.extra?.test_payments ??
    (Constants as any)?.manifest?.extra?.test_payments;
  return toBoolean(fromEnv ?? fromExtra ?? false);
}

export const flags = {
  testPayments: isTestPaymentsEnabled(),
};
