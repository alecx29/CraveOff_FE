import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import { useTheme } from '@/src/context/ThemeProvider';
import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';
import { getAchievementImage, KNOWN_ACHIEVEMENT_IMAGE_CODES } from '@/src/utils/achievementImages';
import CommunityPostCard from '@/src/components/community/CommunityPostCard';

type BackendUser = {
  id: string;
  name?: string;
  gender?: string;
  member_since?: string; // ISO string from backend DTO
  created_at?: string;
  streak?: number;
  last_achievement_code?: string;
};

type PostResponse = {
  id: string | number;
  title?: string;
  content?: string;
  body?: string;
  upvotes?: number;
  user_name?: string;
  author?: { id?: string | number; username?: string; name?: string; avatar_url?: string } | string;
  created_at?: string;
  createdAt?: string;
  image_url?: string;
  comments_count?: number;
  likes_count?: number;
  user_last_achievement_code?: string;
};

type PostsPaginationMeta = {
  nextCursor: string | number | null;
  hasMore?: boolean;
  hasNextLink?: boolean;
};

type PostsFetchMode = 'replace' | 'append';

const POSTS_PAGE_SIZE = 20;

const firstNonEmptyValue = (...values: any[]): any => {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string') {
      if (value.trim().length === 0) continue;
      return value;
    }
    return value;
  }
  return undefined;
};

const toBoolean = (value: any): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return undefined;
};

const resolvePostsArray = (payload: any): PostResponse[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.posts)) return payload.posts;
  if (Array.isArray(payload?.posts?.data)) return payload.posts.data;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const normalizePostsPayload = (
  payload: any
): { list: PostResponse[]; meta: PostsPaginationMeta } => {
  const list = resolvePostsArray(payload);
  const meta: PostsPaginationMeta = {
    nextCursor:
      firstNonEmptyValue(
        payload?.nextCursor,
        payload?.next_cursor,
        payload?.cursor,
        payload?.next,
        payload?.pagination?.nextCursor,
        payload?.pagination?.next_cursor,
        payload?.meta?.nextCursor,
        payload?.meta?.next_cursor
      ) ?? null,
    hasMore: toBoolean(
      firstNonEmptyValue(
        payload?.hasMore,
        payload?.has_more,
        payload?.meta?.hasMore,
        payload?.meta?.has_more,
        payload?.pagination?.hasMore,
        payload?.pagination?.has_more
      )
    ),
    hasNextLink: Boolean(firstNonEmptyValue(payload?.links?.next, payload?.next_page_url, payload?.meta?.next)),
  };
  return { list, meta };
};

const computeHasMore = (meta: PostsPaginationMeta, receivedCount: number, pageSize: number): boolean => {
  if (typeof meta.hasMore === 'boolean') return meta.hasMore;
  if (meta.hasNextLink) return true;
  if (meta.nextCursor !== null && meta.nextCursor !== undefined) return true;
  return receivedCount >= pageSize;
};

const getPostIdentifier = (post: PostResponse): string => {
  const rawId =
    (post as any)?.id ??
    (post as any)?._id ??
    (post as any)?.post_id ??
    (post as any)?.uuid ??
    (post as any)?.slug;
  if (rawId !== undefined && rawId !== null) return String(rawId);
  const created = (post as any)?.created_at ?? (post as any)?.createdAt ?? '';
  const title = (post as any)?.title ?? (post as any)?.content ?? (post as any)?.body ?? '';
  const fallback = `${created}-${title}`.trim();
  return fallback.length > 0 ? fallback : JSON.stringify(post);
};

const mergePosts = (existing: PostResponse[], incoming: PostResponse[]): { list: PostResponse[]; added: number } => {
  if (!Array.isArray(incoming) || incoming.length === 0) return { list: existing, added: 0 };
  const keyToIndex = new Map<string, number>();
  existing.forEach((item, index) => keyToIndex.set(getPostIdentifier(item), index));
  const list = [...existing];
  let added = 0;
  incoming.forEach((item) => {
    const key = getPostIdentifier(item);
    const existingIndex = keyToIndex.get(key);
    if (existingIndex !== undefined) {
      list[existingIndex] = item;
    } else {
      keyToIndex.set(key, list.length);
      list.push(item);
      added += 1;
    }
  });
  return { list, added };
};

export default function CommunityUserProfile() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { userId, achievementCode: achievementCodeParam } = useLocalSearchParams<{ userId: string; achievementCode?: string }>();

  const [user, setUser] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [postsLoading, setPostsLoading] = useState<boolean>(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [postsRefreshing, setPostsRefreshing] = useState<boolean>(false);
  const [postsHasMore, setPostsHasMore] = useState<boolean>(true);
  const [postsLoadingMore, setPostsLoadingMore] = useState<boolean>(false);
  const [postsLoadMoreError, setPostsLoadMoreError] = useState<string | null>(null);
  const postsCursorRef = useRef<string | number | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setError(false);
      setLoading(true);
      const res = await apiClient.get(BackendRoutes.USER_BY_ID(String(userId)));
      setUser(res.data || null);
    } catch {
      setError(true);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchPosts = useCallback(
    async (mode: PostsFetchMode = 'replace') => {
      const isAppend = mode === 'append';
      if (!userId) return;

      if (isAppend) {
        if (!postsHasMore || postsLoadingMore || postsLoading || postsRefreshing) return;
        setPostsLoadMoreError(null);
        setPostsLoadingMore(true);
      } else {
        setPostsError(null);
        setPostsLoadMoreError(null);
        setPostsLoading(true);
        postsCursorRef.current = null;
        setPostsHasMore(true);
      }

      const params: Record<string, any> = {
        user_id: String(userId),
        limit: POSTS_PAGE_SIZE,
      };
      if (isAppend && postsCursorRef.current !== null && postsCursorRef.current !== undefined) {
        params.cursor = postsCursorRef.current;
        params.after = postsCursorRef.current; // extra compatibility with alternate backends
      }

      try {
        const response = await apiClient.get(BackendRoutes.COMMUNITY_POSTS, { params });
        const { list, meta } = normalizePostsPayload(response?.data);
        postsCursorRef.current = meta.nextCursor ?? postsCursorRef.current ?? null;
        const derivedHasMore = computeHasMore(meta, list.length, POSTS_PAGE_SIZE);

        if (isAppend) {
          let addedCount = 0;
          setPosts((prev) => {
            const { list: merged, added } = mergePosts(prev, list);
            addedCount = added;
            return merged;
          });
          const duplicatesOnly =
            list.length > 0 && addedCount === 0 && !meta.nextCursor && !meta.hasNextLink && meta.hasMore !== true;
          const shouldContinue = derivedHasMore && !duplicatesOnly;
          setPostsHasMore(shouldContinue);
          if (!shouldContinue) postsCursorRef.current = null;
        } else {
          const { list: merged } = mergePosts([], list);
          setPosts(merged);
          setPostsHasMore(derivedHasMore);
        }
      } catch {
        if (isAppend) {
          setPostsLoadMoreError("Couldn't load more posts.");
        } else {
          setPostsError("Couldn't load posts.");
          setPosts([]);
        }
      } finally {
        if (isAppend) {
          setPostsLoadingMore(false);
        } else {
          setPostsLoading(false);
          setPostsRefreshing(false);
        }
      }
    },
    [userId, postsHasMore, postsLoadingMore, postsLoading, postsRefreshing]
  );

  useEffect(() => {
    // If backend not ready yet, it's okay; we still render a mock
    fetchUser();
    fetchPosts('replace');
  }, [fetchUser]);

  const gender = (user?.gender || '').toLowerCase();
  // Prefer latest achievement avatar (same logic as chat). Fallback to gender placeholder.
  const lastAchievementCode =
    (achievementCodeParam as string) ||
    (user as any)?.last_achievement_code ||
    (user as any)?.sender_last_achievement_code ||
    (user as any)?.achievement_code ||
    (user as any)?.lastAchievementCode ||
    '';
  const achievementAvatarSource = lastAchievementCode ? getAchievementImage(String(lastAchievementCode)) : null;
  const avatar = achievementAvatarSource
    ? achievementAvatarSource
    : (gender === 'female'
    ? require('@/assets/images/girl2.png')
        : require('@/assets/images/boy2.png'));

  // Streak and "Til sober" (to 90 days)
  const rawStreak = Number((user as any)?.streak);
  const streakDays = Number.isFinite(rawStreak) && rawStreak >= 0 ? rawStreak : 0;
  const tillSober = Math.max(0, 90 - streakDays);

  // Build achievements list: unlocked if user's streak reached the threshold; others show a lock
  const achCodes = KNOWN_ACHIEVEMENT_IMAGE_CODES.filter(code => code !== 'WELCOME');
  const getDaysFromCode = (code: string): number => {
    const m = /^STREAK_(\d+)/.exec(code || '');
    return m ? Number(m[1]) : Number.POSITIVE_INFINITY;
  };
  const achForRender = achCodes
    .slice()
    .sort((a, b) => getDaysFromCode(a) - getDaysFromCode(b))
    .map(code => ({
      code,
      unlocked: getDaysFromCode(code) <= streakDays,
    }));
  const memberSince = user?.member_since || user?.created_at;

  const authorNameForPosts = useMemo(() => {
    return (user?.name || '').trim() || 'User';
  }, [user?.name]);

  const updatePostUpvotes = useCallback((postIdValue: string | number, likesCount: number) => {
    setPosts((prev) =>
      prev.map((p) => {
        const pid = (p as any)?.id ?? (p as any)?._id ?? (p as any)?.post_id ?? (p as any)?.uuid;
        if (String(pid) !== String(postIdValue)) return p;
        return { ...(p as any), upvotes: likesCount, likes_count: likesCount };
      })
    );
  }, []);

  const header = useMemo(() => {
    return (
      <View>
        <View style={styles.header}>
          <Image source={avatar} style={styles.avatar} />
          <View style={styles.headerText}>
            <Text style={styles.nameText}>{user?.name || 'User'}</Text>
            {!!memberSince && (
              <Text style={styles.metaText}>Member since {formatDate(memberSince)}</Text>
            )}
            {!!user?.gender && (
              <View style={styles.pillRow}>
                <View style={styles.pill}><Text style={styles.pillText}>{user.gender}</Text></View>
              </View>
            )}
          </View>
        </View>

        {/* Stats Widget */}
        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Streak (d)</Text>
            <Text style={styles.statValue}>{streakDays}</Text>
          </View>

          <View style={styles.statColCenter}>
            <Text style={styles.statLabel}>Achievements</Text>
            <View style={styles.achScrollWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.achScrollContent}
              >
                {achForRender.map(({ code, unlocked }) => (
                  <View key={code} style={[styles.achItem, !unlocked && styles.achItemLock]}>
                    {unlocked ? (
                      <Image source={getAchievementImage(code)} style={styles.achImageFill} resizeMode="cover" />
                    ) : (
                      <Ionicons name="lock-closed" size={12} color={theme.colors.textMuted} />
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Til sober (d)</Text>
            <Text style={styles.statValue}>{tillSober}</Text>
          </View>
        </View>

        {/* User's posts section */}
        <View style={styles.postsSection}>
          <Text style={styles.postsSectionTitle}>User&apos;s posts</Text>
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Loading profile...</Text>
        ) : error ? (
          <Text style={styles.loadingText}>Could not load profile.</Text>
        ) : null}
      </View>
    );
  }, [styles, avatar, user, memberSince, loading, error, achForRender, streakDays, tillSober, theme.colors.textMuted]);

  return (
    <GradientBackground>
      <Stack.Screen options={{ title: 'Profile', headerBackTitle: 'Back' }} />
      <FlatList
        data={posts}
        keyExtractor={(item) => getPostIdentifier(item)}
        renderItem={({ item }) => (
          <CommunityPostCard
            post={item as any}
            authorNameOverride={authorNameForPosts}
            authorIdOverride={String(userId)}
            achievementCodeOverride={String(lastAchievementCode || '')}
            disableAuthorNavigation
            onUpvoteChanged={(postId, n) => updatePostUpvotes(postId, n)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={header}
        onEndReachedThreshold={0.4}
        onEndReached={() => fetchPosts('append')}
        refreshing={postsRefreshing}
        onRefresh={() => {
          setPostsRefreshing(true);
          fetchPosts('replace');
        }}
        ListEmptyComponent={
          postsLoading ? (
            <Text style={styles.loadingText}>Loading posts...</Text>
          ) : postsError ? (
            <Text style={styles.loadingText}>{postsError}</Text>
          ) : (
            <Text style={styles.loadingText}>No posts yet.</Text>
          )
        }
        ListFooterComponent={
          postsLoadingMore ? (
            <Text style={styles.loadingText}>Loading more...</Text>
          ) : postsLoadMoreError ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => fetchPosts('append')}
              style={styles.loadMoreRetry}
            >
              <Text style={styles.loadMoreRetryText}>{postsLoadMoreError} Tap to retry.</Text>
            </TouchableOpacity>
          ) : !postsHasMore && posts.length > 0 ? (
            <Text style={styles.loadingText}>End of posts.</Text>
          ) : null
        }
      />
    </GradientBackground>
  );
}

function formatDate(iso?: string): string {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString();
  } catch {
    return '-';
  }
}

const createStyles = (theme: any) => StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 12,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  statCol: {
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statColCenter: {
    width: '40%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  achRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  achDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  achImage: {
    width: '100%',
    height: '100%',
  },
  achScrollWrap: {
    width: '100%',
  },
  achScrollContent: {
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  achItem: {
    width: 26,
    height: 26,
    borderRadius: 16,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  achItemLock: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  achImageFill: {
    width: '100%',
    height: '100%',
  },
  headerText: {
    flex: 1,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  metaText: {
    marginTop: 4,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  pillRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)'
  },
  pillText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  loadingText: {
    color: theme.colors.textSecondary,
  },
  postsSection: {
    marginBottom: 16,
  },
  postsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  // Post styles moved to `src/components/community/CommunityPostCard.tsx` for reuse.
  // Post styles moved to `src/components/community/CommunityPostCard.tsx` for reuse.
  loadMoreRetry: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreRetryText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  // removed card/table styles
});


