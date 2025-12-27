import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';

type FetchUnreadOptions = {
  limit?: number;
};

const toNumberOrUndefined = (value: any): number | undefined => {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const extractNotificationsList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  const list = payload?.notifications ?? payload?.data ?? payload?.items ?? [];
  return Array.isArray(list) ? list : [];
};

const isReadFlag = (item: any): boolean => {
  // Match the same semantics as `notifications.tsx`:
  // readFlag = item?.is_read ?? item?.read ?? Boolean(item?.read_at ?? item?.readAt);
  const direct = item?.is_read ?? item?.read;
  if (direct !== undefined && direct !== null) return Boolean(direct);
  return Boolean(item?.read_at ?? item?.readAt);
};

export async function fetchCommunityNotificationsUnreadCount(
  options: FetchUnreadOptions = {}
): Promise<number> {
  const limit = Math.max(1, Math.min(50, options.limit ?? 20));

  const response = await apiClient.get(BackendRoutes.COMMUNITY_NOTIFICATIONS, {
    params: { limit },
  });

  const payload = response?.data;

  // Prefer backend-provided counts if available.
  const unreadCount =
    toNumberOrUndefined(payload?.unread_count) ??
    toNumberOrUndefined(payload?.unreadCount) ??
    toNumberOrUndefined(payload?.meta?.unread_count) ??
    toNumberOrUndefined(payload?.meta?.unreadCount);

  if (typeof unreadCount === 'number') return Math.max(0, unreadCount);

  const list = extractNotificationsList(payload);
  let unread = 0;
  for (const item of list) {
    if (!isReadFlag(item)) unread += 1;
  }
  return unread;
}


