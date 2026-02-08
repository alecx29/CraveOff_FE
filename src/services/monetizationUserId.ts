export function getMonetizationUserId(userData?: any): string | undefined {
  if (!userData) return undefined;

  // IMPORTANT:
  // - This ID should match across RevenueCat + Superwall.
  // - Avoid PII (e.g. email) especially if passing identifiers to Google Play.
  const id =
    userData.supabase_user_id?.toString?.() ??
    userData.supabaseUserId?.toString?.() ??
    userData.auth_user_id?.toString?.() ??
    userData.id?.toString?.() ??
    userData.user_id?.toString?.() ??
    userData.uuid?.toString?.() ??
    undefined;

  return typeof id === 'string' && id.trim().length > 0 ? id.trim() : undefined;
}


