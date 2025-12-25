import React, { useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { useTheme } from '@/src/context/ThemeProvider';
import { getAchievementImage } from '@/src/utils/achievementImages';
import { formatTimeAgo } from '@/src/utils/formatTimeAgo';
import CommunityUpvote from '@/src/components/community/CommunityUpvote';

type PostLike = Record<string, any>;

type Props = {
  post: PostLike;
  /** When provided, used instead of post-derived author name (useful on profile pages). */
  authorNameOverride?: string;
  /** When provided, used instead of post-derived author id (useful on profile pages). */
  authorIdOverride?: string | number;
  /** When provided, used instead of post-derived achievement code (useful on profile pages). */
  achievementCodeOverride?: string;
  /** Disable navigating to author's profile when tapping avatar. */
  disableAuthorNavigation?: boolean;
  /** Disable navigating to post details when tapping the card. */
  disablePostNavigation?: boolean;
  /** Called when upvote count changes (so parent can update list state). */
  onUpvoteChanged?: (postId: string | number, newCount: number) => void;
};

export default function CommunityPostCard({
  post,
  authorNameOverride,
  authorIdOverride,
  achievementCodeOverride,
  disableAuthorNavigation,
  disablePostNavigation,
  onUpvoteChanged,
}: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Matches the behavior that previously lived in `app/(tabs)/community/index.tsx`
  const title = (post as any)?.title as string | undefined;
  const body =
    ((post as any)?.content as string | undefined) ??
    ((post as any)?.body as string | undefined) ??
    '';
  const displayTitle =
    title && title.trim().length > 0 ? title : body ? body.slice(0, 60) : 'Post';

  const author = (post as any)?.author;
  const senderNameRaw = String(((post as any)?.sender_name ?? '') || '').trim();
  const computedAuthorName =
    senderNameRaw ||
    (typeof author === 'string'
      ? author
      : author?.username || author?.name || (post as any)?.user_name || 'Unknown');
  const authorName = (authorNameOverride || '').trim() || computedAuthorName;

  const computedAuthorId =
    typeof author === 'object'
      ? author?.id ??
        (author as any)?._id ??
        (author as any)?.user_id ??
        (author as any)?.uid ??
        (author as any)?.uuid
      : undefined;
  const authorId = authorIdOverride ?? computedAuthorId;
  const canNavigateAuthor = !disableAuthorNavigation && authorId !== undefined && authorId !== null && String(authorId).trim().length > 0;

  const authorAvatarUrl =
    typeof author === 'object' ? (author as any)?.avatar_url : undefined;

  const achievementCode =
    (achievementCodeOverride || '').trim() ||
    ((post as any)?.user_last_achievement_code as string | undefined) ||
    '';
  const achievementAvatarSource = achievementCode
    ? getAchievementImage(String(achievementCode))
    : null;

  const createdRaw = (post as any)?.created_at ?? (post as any)?.createdAt;
  const relativeCreatedLabel = formatTimeAgo(createdRaw);

  const postIdValue: string | number | undefined =
    (post as any)?.id ?? (post as any)?._id ?? (post as any)?.post_id ?? (post as any)?.uuid;

  // Global-ish tap lock (prevents double-tap navigation), similar to the previous implementation.
  const navLockRef = useRef<boolean>(false);

  const handleOpenPost = () => {
    if (disablePostNavigation) return;
    if (navLockRef.current) return;
    navLockRef.current = true;

    const userNameParam =
      senderNameRaw ||
      (post as any)?.user_name ||
      (typeof author === 'object' ? author?.username || author?.name : authorName) ||
      '';

    router.push({
      pathname: '/(tabs)/community/post/[postId]' as any,
      params: {
        postId: String(postIdValue ?? ''),
        title: title || '',
        content: body || '',
        // Provide both legacy authorName and new userName for robust fallback
        authorName: String(authorName || ''),
        userName: String(userNameParam || ''),
        user_name: String(userNameParam || ''),
        authorId: authorId ? String(authorId) : '',
        authorAvatarUrl: String(authorAvatarUrl || ''),
        achievementCode: String(achievementCode || ''),
        created_at: String(createdRaw || ''),
      },
    });

    setTimeout(() => {
      navLockRef.current = false;
    }, 800);
  };

  const handleOpenAuthor = () => {
    if (!canNavigateAuthor) return;
    router.push({
      pathname: '/(tabs)/community/user/[userId]' as any,
      params: { userId: String(authorId), achievementCode: achievementCode || '' },
    });
  };

  return (
    <View style={styles.postCard}>
      <TouchableOpacity activeOpacity={0.85} onPress={handleOpenPost} disabled={!!disablePostNavigation}>
        <LinearGradient
          colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
          style={styles.postGradient}
        >
          <View style={styles.postHeaderRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={!canNavigateAuthor}
              onPress={handleOpenAuthor}
            >
              {achievementAvatarSource ? (
                <Image source={achievementAvatarSource} style={styles.postAvatar} resizeMode="cover" />
              ) : authorAvatarUrl ? (
                <Image source={{ uri: authorAvatarUrl }} style={styles.postAvatar} resizeMode="cover" />
              ) : (
                <View style={styles.postAvatarPlaceholder} />
              )}
            </TouchableOpacity>

            <View style={styles.postHeaderText}>
              <Text style={styles.postAuthorName} numberOfLines={1}>
                {authorName}
              </Text>
              {!!relativeCreatedLabel && (
                <Text style={styles.postTime} numberOfLines={1}>
                  {relativeCreatedLabel}
                </Text>
              )}
            </View>

            {postIdValue !== undefined && postIdValue !== null ? (
              <View style={styles.postHeaderActions}>
                <CommunityUpvote
                  postId={postIdValue}
                  likesCount={Number((post as any)?.upvotes ?? (post as any)?.likes_count ?? 0)}
                  onChanged={(n) => onUpvoteChanged?.(postIdValue, n)}
                />
              </View>
            ) : null}
          </View>

          <View style={styles.postBody}>
            <Text style={styles.postTitle} numberOfLines={1}>
              {displayTitle}
            </Text>
            {body ? (
              <Text style={styles.postExcerpt} numberOfLines={2}>
                {body}
              </Text>
            ) : null}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    postCard: {
      backgroundColor: 'transparent',
      borderRadius: theme.borderRadius.medium,
      marginBottom: 12,
      overflow: 'hidden',
    },
    postGradient: {
      padding: 12,
      borderRadius: theme.borderRadius.medium,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    postHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    postHeaderText: {
      flex: 1,
      paddingRight: 8,
    },
    postHeaderActions: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 6,
      marginTop: 2,
    },
    postAuthorName: {
      color: theme.colors.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
    postTime: {
      marginTop: 2,
      color: theme.colors.textMuted,
      fontSize: 12,
    },
    postBody: {
      marginTop: 8,
    },
    postAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      marginRight: 12,
    },
    postAvatarPlaceholder: {
      width: 44,
      height: 44,
      borderRadius: 22,
      marginRight: 12,
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
    postTitle: {
      color: theme.colors.textPrimary,
      fontSize: 16,
      fontWeight: '700',
      marginRight: 8,
    },
    postExcerpt: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      marginTop: 4,
      marginBottom: 6,
    },
  });


