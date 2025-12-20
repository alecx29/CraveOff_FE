import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import { useTheme } from '@/src/context/ThemeProvider';
import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';

const PAGE_SIZE = 10;
const NOTIFICATION_CARD_GRADIENT = ['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)'] as const;

type CommunityNotification = {
  id: string;
  actorName: string;
  postTitle?: string;
  postId?: string;
  body?: string;
  timestamp?: string | number | Date;
  type?: string;
  isRead?: boolean;
};

type FetchMode = 'initial' | 'refresh' | 'loadMore';

const formatIdsForRequest = (ids: string[]): (string | number)[] =>
  ids
    .map((value) => `${value}`.trim())
    .filter((value) => value.length > 0)
    .map((value) => {
      const numeric = Number(value);
      return Number.isNaN(numeric) ? value : numeric;
    });

const parsePayload = (payload: unknown): Record<string, any> => {
  if (!payload) return {};

  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch (error) {
      console.warn('Failed to parse notification payload', error);
      return {};
    }
  }

  if (typeof payload === 'object' && payload !== null) {
    return payload as Record<string, any>;
  }

  return {};
};

const normalizeNotification = (item: any, index: number): CommunityNotification => {
  const fallbackId =
    item?.id ??
    item?.notification_id ??
    item?.uuid ??
    `${item?.type ?? 'notification'}-${item?.created_at ?? index}`;

  const payloadData = parsePayload(item?.payload);

  const actorNameRaw =
    item?.actor_user_name ??
    item?.actorUserName ??
    payloadData?.actor_user_name ??
    payloadData?.actorUserName ??
    item?.user_name ??
    item?.username ??
    item?.actor?.name;

  const title = item?.title ?? item?.heading ?? item?.subject ?? 'Notification';
  const bodySource = item?.body ?? item?.message ?? item?.content ?? item?.description ?? '';
  const timestamp = item?.created_at ?? item?.createdAt ?? item?.timestamp ?? item?.created_on ?? item?.createdOn;
  const type = item?.type ?? item?.category ?? item?.kind ?? item?.notification_type ?? undefined;
  const readFlag = item?.is_read ?? item?.read ?? Boolean(item?.read_at ?? item?.readAt);
  const postTitleRaw =
    payloadData?.post_title ??
    payloadData?.postTitle ??
    item?.post_title ??
    item?.postTitle ??
    payloadData?.title ??
    title;

  const postIdRaw =
    payloadData?.post_id ??
    payloadData?.postId ??
    item?.post_id ??
    item?.postId ??
    payloadData?.entity_id ??
    payloadData?.entityId ??
    item?.entity_id ??
    item?.entityId ??
    payloadData?.target_id ??
    payloadData?.targetId ??
    payloadData?.comment_post_id ??
    payloadData?.commentPostId ??
    (typeof payloadData?.post === 'object'
      ? payloadData.post?.id ?? payloadData.post?.uuid ?? payloadData.post?.slug
      : undefined) ??
    (typeof item?.post === 'object'
      ? item.post?.id ?? item.post?.uuid ?? item.post?.slug
      : undefined);

  const actorName =
    typeof actorNameRaw === 'string' && actorNameRaw.trim().length > 0
      ? actorNameRaw.trim()
      : 'Community member';

  const postTitle =
    typeof postTitleRaw === 'string' && postTitleRaw.trim().length > 0
      ? postTitleRaw.trim()
      : undefined;

  const postId =
    postIdRaw !== undefined && postIdRaw !== null && String(postIdRaw).trim().length > 0
      ? String(postIdRaw).trim()
      : undefined;

  const bodyText =
    typeof bodySource === 'string' && bodySource.trim().length > 0 ? bodySource.trim() : undefined;

  return {
    id: String(fallbackId ?? `${index}`),
    actorName,
    postTitle,
    postId,
    body: bodyText,
    timestamp,
    type: typeof type === 'string' ? type : undefined,
    isRead: Boolean(readFlag),
  };
};

const formatRelativeTime = (value?: string | number | Date) => {
  if (!value) return '';
  let date: Date;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'number') {
    date = new Date(value > 1e12 ? value : value * 1000);
  } else {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime()) && !Number.isNaN(Number(value))) {
      date = new Date(Number(value));
    } else {
      date = parsed;
    }
  }

  if (Number.isNaN(date.getTime())) return '';
  return formatDistanceToNow(date, { addSuffix: true });
};

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets.top), [theme, insets.top]);

  const [notifications, setNotifications] = useState<CommunityNotification[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const loadNotifications = useCallback(async (mode: FetchMode = 'initial', offset = 0) => {
    const limit = PAGE_SIZE;
    const normalizedOffset = Math.max(offset ?? 0, 0);

    if (mode === 'refresh') {
      setIsRefreshing(true);
    } else if (mode === 'loadMore') {
      setIsLoadingMore(true);
    } else {
      setIsInitialLoading(true);
    }

    setError(null);

    try {
      const response = await apiClient.get(BackendRoutes.COMMUNITY_NOTIFICATIONS, {
        params: {
          limit,
          offset: normalizedOffset > 0 ? normalizedOffset : undefined,
        },
      });

      const payload = response.data;
      const rawList = Array.isArray(payload)
        ? payload
        : payload?.notifications ?? payload?.data ?? payload?.items ?? [];

      const normalized = Array.isArray(rawList)
        ? rawList.map((item, index) => normalizeNotification(item, index))
        : [];

      let effectiveChunkLength = normalized.length;

      if (mode === 'loadMore') {
        setNotifications((prev) => {
          if (!normalized.length) {
            effectiveChunkLength = 0;
            return prev;
          }

          const existingIds = new Set(prev.map((item) => item.id));
          const additions = normalized.filter((item) => !existingIds.has(item.id));
          effectiveChunkLength = additions.length;

          if (!additions.length) {
            return prev;
          }

          return [...prev, ...additions];
        });
      } else {
        setNotifications(normalized);
      }

      const responseHasMore =
        payload?.has_more ??
        payload?.hasMore ??
        payload?.meta?.has_more ??
        payload?.meta?.hasMore;

      if (typeof responseHasMore === 'boolean') {
        setHasMore(responseHasMore);
      } else {
        const chunkLength = mode === 'loadMore' ? effectiveChunkLength : normalized.length;
        setHasMore(chunkLength === limit);
      }
    } catch (err: any) {
      console.error('Failed to load community notifications', err);
      const message =
        err?.response?.data?.message ?? err?.message ?? 'Unable to load notifications right now.';
      setError(message);
    } finally {
      if (mode === 'refresh') {
        setIsRefreshing(false);
      } else if (mode === 'loadMore') {
        setIsLoadingMore(false);
      } else {
        setIsInitialLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadNotifications('initial', 0);
  }, [loadNotifications]);

  const handleRefresh = useCallback(() => {
    loadNotifications('refresh', 0);
  }, [loadNotifications]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || isInitialLoading || isLoadingMore || isRefreshing) return;
    loadNotifications('loadMore', notifications.length);
  }, [hasMore, isInitialLoading, isLoadingMore, isRefreshing, notifications.length, loadNotifications]);

  const handleRetry = useCallback(() => {
    loadNotifications('initial', 0);
  }, [loadNotifications]);

  const markNotificationsRead = useCallback(
    async (ids: string[]) => {
      const filteredIds = ids.filter(Boolean);
      if (!filteredIds.length) return;

      const idsSet = new Set(filteredIds);
      setNotifications((prev) =>
        prev.map((notification) =>
          idsSet.has(notification.id) ? { ...notification, isRead: true } : notification
        )
      );

      try {
        await apiClient.post(BackendRoutes.COMMUNITY_NOTIFICATIONS_READ, {
          ids: formatIdsForRequest(filteredIds),
        });
      } catch (err) {
        console.error('Failed to mark notifications as read', err);
        loadNotifications('initial', 0);
      }
    },
    [loadNotifications]
  );

  const handleNotificationPress = useCallback(
    (id: string) => {
      if (!id) return;
      const target = notifications.find((notification) => notification.id === id);
      if (!target) return;

      if (!target.isRead) {
        markNotificationsRead([id]);
      }

      if (target.postId) {
        router.push({
          pathname: '/(tabs)/community/post/[postId]',
          params: {
            postId: target.postId,
            title: target.postTitle ?? '',
            userName: target.actorName,
            created_at: typeof target.timestamp === 'string' ? target.timestamp : undefined,
          },
        });
      }
    },
    [notifications, markNotificationsRead]
  );

  const hasUnread = useMemo(() => notifications.some((notification) => !notification.isRead), [notifications]);

  const handleMarkAllRead = useCallback(async () => {
    if (isMarkingAll || !hasUnread) return;
    setIsMarkingAll(true);
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));

    try {
      await apiClient.post(BackendRoutes.COMMUNITY_NOTIFICATIONS_READ_ALL);
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
      loadNotifications('initial', 0);
    } finally {
      setIsMarkingAll(false);
    }
  }, [hasUnread, isMarkingAll, loadNotifications]);

  const renderNotification = useCallback(
    ({ item }: { item: CommunityNotification }) => {
      const detailText = item.postTitle
        ? `Commented on "${item.postTitle}"`
        : item.body ?? 'Commented on your post';

      return (
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
          onPress={() => handleNotificationPress(item.id)}
        >
          <LinearGradient
            colors={NOTIFICATION_CARD_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.notificationCardInner}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.actorName}
                </Text>
                {!item.isRead && <View style={styles.unreadDot} />}
              </View>
              {item.timestamp && (
                <Text style={styles.cardTimestamp}>{formatRelativeTime(item.timestamp)}</Text>
              )}
            </View>
            {!!detailText && (
              <Text style={styles.cardBody} numberOfLines={2}>
                {detailText}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      );
    },
    [styles, handleNotificationPress]
  );

  const listHeader = error ? (
    <View style={styles.listHeader}>
      <TouchableOpacity activeOpacity={0.85} onPress={handleRetry} style={styles.errorBanner}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorAction}>Tap to retry</Text>
      </TouchableOpacity>
    </View>
  ) : null;

  const shouldShowFooter = notifications.length > 0 && (isLoadingMore || !hasMore);
  const listFooter = shouldShowFooter ? (
    <View style={styles.footer}>
      {isLoadingMore && <ActivityIndicator color={theme.colors.primary} />}
      {!isLoadingMore && !hasMore && (
        <Text style={styles.footerHint}>You&apos;re all caught up.</Text>
      )}
    </View>
  ) : null;

  const emptyComponent = !isInitialLoading ? (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off-outline" size={48} color={theme.colors.textMuted} />
      <Text style={styles.emptyTitle}>No notifications yet</Text>
      <Text style={styles.emptyText}>
        Interactions from the community will show up here. Keep sharing and engaging.
      </Text>
      {!!error && (
        <TouchableOpacity style={styles.retryButton} activeOpacity={0.85} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  ) : null;

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.back()}
            style={styles.iconButton}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.title}>Notifications</Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/community/notifications-settings')}
            style={styles.iconButton}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name="settings-outline" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {hasUnread && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.actionButton, isMarkingAll && styles.actionButtonDisabled]}
              onPress={handleMarkAllRead}
              disabled={isMarkingAll}
            >
              <Ionicons name="checkmark-done-outline" size={16} color="#ffffff" />
              <Text style={styles.actionText}>
                {isMarkingAll ? 'Marking...' : 'Mark all as read'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {isInitialLoading && notifications.length === 0 ? (
          <View style={styles.loader}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderNotification}
            contentContainerStyle={[
              styles.listContent,
              notifications.length === 0 && styles.emptyContentPadding,
            ]}
            ListHeaderComponent={listHeader}
            ListFooterComponent={listFooter}
            ListEmptyComponent={emptyComponent}
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </GradientBackground>
  );
}

const createStyles = (theme: any, insetTop: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: Math.max(insetTop, 16) + 8,
      backgroundColor: 'transparent',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    iconButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      flex: 1,
      textAlign: 'center',
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    loader: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listContent: {
      paddingBottom: 32,
    },
    emptyContentPadding: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    listHeader: {
      marginBottom: 12,
      gap: 8,
    },
    errorBanner: {
      padding: 12,
      borderRadius: 14,
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      borderWidth: 1,
      borderColor: theme.colors.emergencyLight,
    },
    errorText: {
      color: theme.colors.textPrimary,
      fontSize: 14,
      marginBottom: 4,
    },
    errorAction: {
      color: theme.colors.textSecondary,
      fontSize: 12,
    },
    notificationCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.04)',
      marginBottom: 12,
      overflow: 'hidden',
    },
    notificationCardInner: {
      padding: 16,
    },
    unreadCard: {
      // Unread items should have no border
      borderWidth: 0,
      borderColor: 'transparent',
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
      gap: 6,
    },
    cardHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexShrink: 1,
    },
    cardTitle: {
      flex: 1,
      color: theme.colors.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    cardTimestamp: {
      color: theme.colors.textMuted,
      fontSize: 12,
    },
    cardBody: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#ffffff',
    },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginBottom: 12,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 999,
      borderWidth: 0,
      backgroundColor: 'transparent',
    },
    actionButtonDisabled: {
      opacity: 0.6,
    },
    actionText: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '600',
    },
    footer: {
      marginTop: 8,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 24,
      gap: 12,
    },
    footerHint: {
      color: theme.colors.textSecondary,
      fontSize: 13,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      gap: 12,
    },
    emptyTitle: {
      color: theme.colors.textPrimary,
      fontSize: 18,
      fontWeight: '600',
    },
    emptyText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
    retryButton: {
      marginTop: 8,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: theme.colors.primary,
    },
    retryButtonText: {
      color: '#0b0a10',
      fontWeight: '600',
    },
  });

