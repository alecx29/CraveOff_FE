import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import { useTheme } from '@/src/context/ThemeProvider';
import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';
import { getAchievementImage } from '@/src/utils/achievementImages';
import ChatComposer from '@/src/components/chat/ChatComposer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { LinearGradient } from 'expo-linear-gradient';

type AuthorLike =
  | string
  | {
      id?: string | number;
      username?: string;
      name?: string;
      avatar_url?: string;
      last_achievement_code?: string;
    };

type PostDetails = {
  id: string | number;
  title?: string;
  content?: string;
  body?: string;
  user_name?: string;
  author?: AuthorLike;
  created_at?: string;
  createdAt?: string;
  user_last_achievement_code?: string;
};

type CommentResponse = {
  id: string | number;
  post_id: string | number;
  user_id: string | number;
  content: string;
  parent_comment_id?: string | number | null;
  created_at: string;
  user_name?: string;
  user_last_achievement_code?: string;
};

type CommentNode = {
  comment: CommentResponse;
  replies: CommentNode[];
};

function formatTimeAgo(input?: string | number | Date): string {
  try {
    if (!input) return '';
    const date = new Date(input);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    let diff = Math.floor((now.getTime() - date.getTime()) / 1000); // seconds
    if (diff < 0) diff = 0;
    if (diff < 5) return 'now';
    if (diff < 60) return `${diff}s ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return mins === 1 ? '1 min ago' : `${mins} mins ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return months <= 1 ? '1 month ago' : `${months} months ago`;
    const years = Math.floor(days / 365);
    return years <= 1 ? '1 year ago' : `${years} years ago`;
  } catch {
    return '';
  }
}

export default function CommunityPostDetailsScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const {
    postId,
    title: paramTitle,
    content: paramContent,
    authorName: paramAuthorName,
    userName: paramUserName,
    user_name: paramUser_name,
    authorId: paramAuthorId,
    authorAvatarUrl: paramAuthorAvatarUrl,
    achievementCode: paramAchievementCode,
    created_at: paramCreatedAt,
    createdAt: paramCreatedAtCamel,
  } = useLocalSearchParams<{
    postId: string;
    title?: string;
    content?: string;
    authorName?: string;
    userName?: string;
    user_name?: string;
    authorId?: string;
    authorAvatarUrl?: string;
    achievementCode?: string;
    created_at?: string;
    createdAt?: string;
  }>();

  const [post, setPost] = useState<PostDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [comments, setComments] = useState<CommentNode[] | null>(null);
  const [commentsLoading, setCommentsLoading] = useState<boolean>(true);
  const [commentsError, setCommentsError] = useState<boolean>(false);
  const [composerValue, setComposerValue] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [composerH, setComposerH] = useState<number>(0);
  const [androidKb, setAndroidKb] = useState<number>(0);

  const fetchPost = useCallback(async () => {
    if (!postId) {
      setLoading(false);
      return;
    }
    try {
      setError(false);
      setLoading(true);
      const detailUrl =
        BackendRoutes.COMMUNITY_POSTS.replace(/\/$/, '') + '/' + String(postId);
      const res = await apiClient.get(detailUrl);
      const data = res?.data;
      const obj: PostDetails =
        (data && (data.post || data)) || ({} as PostDetails);
      setPost(obj);
    } catch {
      // If backend doesn't support details endpoint yet, we gracefully fallback to params
      setError(true);
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const fetchComments = useCallback(async () => {
    if (!postId) {
      setCommentsLoading(false);
      return;
    }
    try {
      setCommentsError(false);
      setCommentsLoading(true);
      const res = await apiClient.get(BackendRoutes.COMMUNITY_POST_COMMENTS(String(postId)));
      const data = res?.data;
      const nodes: CommentNode[] = Array.isArray(data)
        ? (data as any)
        : (Array.isArray(data?.comments) ? data.comments : []);
      setComments(nodes);
    } catch {
      setCommentsError(true);
      setComments(null);
    } finally {
      setCommentsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Android keyboard handling to push content up similar to chat
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setAndroidKb(e.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setAndroidKb(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const effectiveTitle =
    (post?.title || post?.content || post?.body) ? (post?.title || '') : (paramTitle as string) || '';
  const effectiveBody =
    (post?.content || post?.body || '') || (paramContent as string) || '';

  const authorObj = (post?.author ?? null) as AuthorLike | null;
  const authorName = useMemo(() => {
    // Priority: post.user_name -> params (userName/user_name) -> author object/legacy param -> 'User'
    if ((post?.user_name || '').trim().length > 0) return String(post?.user_name);
    if ((paramUserName || '').trim().length > 0) return String(paramUserName);
    if ((paramUser_name || '').trim().length > 0) return String(paramUser_name);
    if (typeof authorObj === 'string' && (authorObj || '').trim().length > 0) return authorObj;
    const fromAuthorObj =
      (authorObj as any)?.username ||
      (authorObj as any)?.name ||
      '';
    if ((fromAuthorObj || '').trim().length > 0) return String(fromAuthorObj);
    if ((paramAuthorName || '').trim().length > 0) return String(paramAuthorName);
    return 'User';
  }, [post?.user_name, paramUserName, paramUser_name, authorObj, paramAuthorName]);

  const authorAvatarUrl = useMemo(() => {
    if (typeof authorObj === 'object') {
      return (authorObj?.avatar_url as string) || (paramAuthorAvatarUrl as string) || '';
    }
    return (paramAuthorAvatarUrl as string) || '';
  }, [authorObj, paramAuthorAvatarUrl]);

  const achievementCode =
    (typeof authorObj === 'object' && (authorObj?.last_achievement_code as string)) ||
    (post?.user_last_achievement_code as string) ||
    (paramAchievementCode as string) ||
    '';
  const achievementAvatarSource = achievementCode
    ? getAchievementImage(String(achievementCode))
    : null;

  const createdRaw = (post?.created_at ?? post?.createdAt ?? paramCreatedAt ?? paramCreatedAtCamel) as string | undefined;
  const createdDate = createdRaw ? new Date(createdRaw) : null;
  const createdLabel =
    createdDate && !isNaN(createdDate.getTime())
      ? createdDate.toLocaleDateString()
      : '';

  const handleSendComment = useCallback(async () => {
    const trimmed = (composerValue || '').trim();
    if (!trimmed || !postId || submitting) return;
    try {
      setSubmitting(true);
      await apiClient.post(BackendRoutes.COMMUNITY_POST_COMMENTS(String(postId)), {
        content: trimmed,
      });
      setComposerValue('');
      // refresh comments
      await fetchComments();
    } catch {
      // We can surface a basic alert or silent fail for now
    } finally {
      setSubmitting(false);
    }
  }, [composerValue, postId, submitting, fetchComments]);

  const renderCommentNode = (node: CommentNode, depth: number): React.ReactNode => {
    const displayName = (node.comment?.user_name && String(node.comment.user_name).trim().length > 0)
      ? String(node.comment.user_name)
      : (node.comment?.user_id ? `User ${String(node.comment.user_id)}` : 'User');
    const achievementCode = node.comment?.user_last_achievement_code as string | undefined;
    const achievementAvatarSource = achievementCode ? getAchievementImage(String(achievementCode)) : null;
    return (
      <View key={String(node.comment.id)} style={[depth > 0 ? { marginLeft: Math.min(depth * 12, 48) } : null]}>
        <View style={[styles.messageRow, styles.rowTheirs]}>
          {achievementAvatarSource ? (
            <Image source={achievementAvatarSource} style={styles.avatarSmall} />
          ) : (
            <View style={styles.avatarSmallPlaceholder} />
          )}
          <View style={styles.theirsContent}>
            <View style={styles.nameRow}>
              <Text style={styles.nameText} numberOfLines={1}>{displayName}</Text>
            </View>
            <LinearGradient colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']} style={[styles.bubble, styles.bubbleGradient, styles.bubbleTheirsAlign]}>
              <Text style={[styles.messageText, styles.textGeneric]}>
                {node.comment.content}
              </Text>
            </LinearGradient>
            <Text style={styles.commentMeta}>{formatTimeAgo(node.comment.created_at)}</Text>
          </View>
        </View>
        {Array.isArray(node.replies) && node.replies.length > 0
          ? node.replies.map(child => renderCommentNode(child, depth + 1))
          : null}
      </View>
    );
  };

  return (
    <GradientBackground>
      <Stack.Screen
        options={{
          title: 'Post',
          headerShown: true,
          headerBackTitle: 'Back',
        }}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}>
        <View style={[styles.flexFill, Platform.OS === 'android' ? { paddingBottom: Math.max(androidKb - insets.bottom - 46, 0) } : null]}>
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 8 + composerH + Math.max(insets.bottom - 6, 0) }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header: Avatar + Name */}
            <View style={styles.header}>
              {achievementAvatarSource ? (
                <Image source={achievementAvatarSource} style={styles.avatar} />
              ) : authorAvatarUrl ? (
                <Image source={{ uri: authorAvatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder} />
              )}
              <View style={styles.headerText}>
                <Text style={styles.authorName} numberOfLines={1}>
                  {authorName}
                </Text>
                {!!createdLabel && (
                  <Text style={styles.metaText} numberOfLines={1}>
                    {createdLabel}
                  </Text>
                )}
              </View>
            </View>

            {/* Title */}
            {!!effectiveTitle && (
              <Text style={styles.titleText}>{effectiveTitle}</Text>
            )}

            {/* Body */}
            {!!effectiveBody && (
              <Text style={styles.bodyText}>{effectiveBody}</Text>
            )}

            {/* Comments */}
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments</Text>
            </View>
            {commentsLoading ? (
              <Text style={styles.loadingText}>Loading comments...</Text>
            ) : commentsError ? (
              <Text style={styles.loadingText}>Could not load comments.</Text>
            ) : Array.isArray(comments) && comments.length > 0 ? (
              <View style={styles.commentsList}>
                {comments.map(node => renderCommentNode(node, 0))}
              </View>
            ) : (
              <Text style={styles.loadingText}>No comments yet.</Text>
            )}

            {/* Only show loading state for comments, not for post */}
          </ScrollView>

          <View style={{ paddingBottom: Math.max(insets.bottom - 6, 0) }} onLayout={(e) => setComposerH(e.nativeEvent.layout.height)}>
            <ChatComposer
              value={composerValue}
              onChangeText={setComposerValue}
              onSend={handleSendComment}
              disabled={submitting}
              placeholder="Say something"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    flexFill: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 44,
      paddingBottom: 40,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      marginRight: 12,
    },
    avatarPlaceholder: {
      width: 56,
      height: 56,
      borderRadius: 28,
      marginRight: 12,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    headerText: {
      flex: 1,
    },
    authorName: {
      color: theme.colors.textPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
    metaText: {
      marginTop: 4,
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    titleText: {
      color: theme.colors.textPrimary,
      fontSize: 20,
      fontWeight: '800',
      marginBottom: 10,
    },
    bodyText: {
      color: theme.colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 24,
    },
    commentsHeader: {
      marginTop: 8,
      marginBottom: 8,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.08)',
      paddingTop: 12,
    },
    commentsTitle: {
      color: theme.colors.textPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
    commentsList: {
      paddingTop: 4,
    },
    // Chat-like message styles (left-aligned for all comments)
    messageRow: {
      flexDirection: 'row',
      marginVertical: 8,
      paddingHorizontal: 6,
      width: '100%',
    },
    rowTheirs: {
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
    },
    avatarSmall: {
      width: 24,
      height: 24,
      borderRadius: 12,
      marginRight: 8,
      marginTop: 0,
    },
    avatarSmallPlaceholder: {
      width: 24,
      height: 24,
      borderRadius: 12,
      marginRight: 8,
      marginTop: 0,
      backgroundColor: 'rgba(255,255,255,0.08)'
    },
    theirsContent: {
      flex: 1,
      minWidth: 0,
    },
    nameRow: {
      height: 24,
      paddingTop:3,
      justifyContent: 'center',
    },
    nameText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    bubble: {
      borderRadius: 14,
      paddingVertical: 8,
      paddingHorizontal: 12,
      flexShrink: 1,
      minWidth: 48,
      maxWidth: '90%',
    },
    bubbleGradient: {
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    bubbleTheirsAlign: {
      alignSelf: 'flex-start',
    },
    messageText: {
      fontSize: 15,
    },
    textGeneric: {
      color: theme.colors.textPrimary,
    },
    commentMeta: {
      marginTop: 4,
      color: theme.colors.textMuted,
      fontSize: 12,
    },
    loadingText: {
      marginTop: 8,
      color: theme.colors.textSecondary,
    },
  });


