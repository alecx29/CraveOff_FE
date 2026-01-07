import AsyncStorage from "@react-native-async-storage/async-storage";

export type AuthFlags = {
  signup_complete?: boolean;
  reached_paywall?: boolean;
  updatedAt?: number;
};

const AUTH_FLAGS_KEY = "authFlags";

const isBool = (v: unknown): v is boolean => typeof v === "boolean";

export function extractAuthFlags(payload: any): AuthFlags {
  const user = payload?.user ?? payload;

  const signup_complete =
    (isBool((user as any)?.signup_complete)
      ? (user as any).signup_complete
      : undefined) ??
    (isBool((user as any)?.signupComplete)
      ? (user as any).signupComplete
      : undefined) ??
    (isBool((payload as any)?.signup_complete)
      ? (payload as any).signup_complete
      : undefined) ??
    (isBool((payload as any)?.signupComplete)
      ? (payload as any).signupComplete
      : undefined);

  const reached_paywall =
    (isBool((user as any)?.reached_paywall)
      ? (user as any).reached_paywall
      : undefined) ??
    (isBool((user as any)?.reachedPaywall)
      ? (user as any).reachedPaywall
      : undefined) ??
    (isBool((payload as any)?.reached_paywall)
      ? (payload as any).reached_paywall
      : undefined) ??
    (isBool((payload as any)?.reachedPaywall)
      ? (payload as any).reachedPaywall
      : undefined);

  const out: AuthFlags = {};
  if (signup_complete !== undefined) out.signup_complete = signup_complete;
  if (reached_paywall !== undefined) out.reached_paywall = reached_paywall;
  return out;
}

export async function loadAuthFlags(): Promise<AuthFlags | null> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_FLAGS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const out: AuthFlags = extractAuthFlags(parsed);
    if (typeof (parsed as any).updatedAt === "number")
      out.updatedAt = (parsed as any).updatedAt;
    return Object.keys(out).length > 0 ? out : null;
  } catch {
    return null;
  }
}

export async function saveAuthFlags(next: AuthFlags): Promise<void> {
  try {
    const prev = (await loadAuthFlags()) ?? {};
    const merged: AuthFlags = {
      ...prev,
      ...next,
      updatedAt: Date.now(),
    };
    await AsyncStorage.setItem(AUTH_FLAGS_KEY, JSON.stringify(merged));
  } catch {
    // non-blocking
  }
}

export async function clearAuthFlags(): Promise<void> {
  try {
    await AsyncStorage.removeItem(AUTH_FLAGS_KEY);
  } catch {
    // non-blocking
  }
}
