import React, { useCallback, useEffect, useMemo, useState, useContext } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, KeyboardAvoidingView, Platform, Keyboard, TouchableOpacity, Modal } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import { useTheme } from '@/src/context/ThemeProvider';
import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';
import { getAchievementImage } from '@/src/utils/achievementImages';
import ChatComposer from '@/src/components/chat/ChatComposer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import CommunityUpvote from '@/src/components/community/CommunityUpvote';
import LottieUniversal from '@/src/components/LottieUniversal';
import { AuthContext } from '@/src/context/AuthContext';

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
  upvotes?: number;
  user_name?: string;
  author?: AuthorLike;
  created_at?: string;
  createdAt?: string;
  user_last_achievement_code?: string;
  user_current_streak?: number | string;
  likes_count?: number;
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

// Sort comments newest-first (top-level and replies)
function sortCommentsNewestFirst(nodes: CommentNode[] | null | undefined): CommentNode[] {
  if (!Array.isArray(nodes)) return [];
  const parsed = nodes.map((n) => ({
    comment: n.comment,
    replies: sortCommentsNewestFirst(n.replies),
  }));
  parsed.sort((a, b) => {
    const aTime = new Date(a.comment?.created_at as any).getTime() || 0;
    const bTime = new Date(b.comment?.created_at as any).getTime() || 0;
    return bTime - aTime; // newest first
  });
  return parsed;
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
  const [showReportMenu, setShowReportMenu] = useState<boolean>(false);
  const [reportBannerVisible, setReportBannerVisible] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { user: authUser } = useContext(AuthContext);

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
      setComments(sortCommentsNewestFirst(nodes));
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

  const authorId = useMemo(() => {
    // 1) From author object if present
    if (typeof authorObj === 'object') {
      const idFromObj =
        (authorObj as any)?.id ??
        (authorObj as any)?._id ??
        (authorObj as any)?.user_id ??
        (authorObj as any)?.uid ??
        (authorObj as any)?.uuid;
      if (idFromObj !== undefined && idFromObj !== null) return String(idFromObj);
    }
    // 2) From top-level post fields if backend uses different shape
    const idFromPost =
      (post as any)?.user_id ??
      (post as any)?.userId ??
      (post as any)?.author_id ??
      (post as any)?.authorId ??
      (post as any)?.owner_id ??
      (post as any)?.ownerId;
    if (idFromPost !== undefined && idFromPost !== null) return String(idFromPost);
    // 3) From route params as fallback
    if ((paramAuthorId || '').trim().length > 0) return String(paramAuthorId);
    return '';
  }, [authorObj, post, paramAuthorId]);

  const myId = useMemo(() => {
    return String(
      (authUser as any)?.id ??
      (authUser as any)?._id ??
      (authUser as any)?.user_id ??
      (authUser as any)?.uid ??
      (authUser as any)?.uuid ??
      ''
    );
  }, [authUser]);

  const isOwnPost = useMemo(() => {
    if (!authorId || !myId) return false;
    return String(authorId) === String(myId);
  }, [authorId, myId]);

  const achievementCode =
    (typeof authorObj === 'object' && (authorObj?.last_achievement_code as string)) ||
    (post?.user_last_achievement_code as string) ||
    (paramAchievementCode as string) ||
    '';
  const achievementAvatarSource = achievementCode
    ? getAchievementImage(String(achievementCode))
    : null;

  const canNavigateProfile = useMemo(() => !!authorId && String(authorId).trim().length > 0, [authorId]);

  const handleOpenProfile = useCallback(() => {
    if (!canNavigateProfile) return;
    router.push({
      pathname: '/(tabs)/community/user/[userId]' as any,
      params: { userId: String(authorId), achievementCode: achievementCode || '' }
    });
  }, [canNavigateProfile, authorId, achievementCode]);

  // Build user streak label (from DTO field user_current_streak)
  const userStreakLabel = useMemo(() => {
    const val = (post as any)?.user_current_streak;
    if (val === null || val === undefined) return '';
    const num = typeof val === 'string' ? parseInt(val, 10) : Number(val);
    if (!isFinite(num) || isNaN(num)) {
      // If backend returns a formatted string, show as-is
      return String(val);
    }
    const unit = num === 1 ? 'day' : 'days';
    return `${num} ${unit} streak`;
  }, [post]);

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
          title: 'Post Details',
          headerShown: true,
          headerBackTitle: 'Back',
        }}
      />
      {reportBannerVisible ? (
        <View style={styles.reportBanner}>
          <View style={styles.reportBannerRow}>
            <Ionicons name="checkmark" size={16} color="#111827" />
            <Text style={styles.reportBannerText}>Post has been reported</Text>
          </View>
        </View>
      ) : null}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Delete post?</Text>
            <Text style={styles.confirmText}>Are you sure you want to delete this post?</Text>
            {!!deleteError && <Text style={styles.confirmError}>{deleteError}</Text>}
            <View style={styles.confirmButtonsRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setShowDeleteConfirm(false)}
                style={[styles.confirmButton, styles.confirmButtonSecondary]}
                disabled={deleting}
              >
                <Text style={[styles.confirmButtonText, styles.confirmButtonSecondaryText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={async () => {
                  if (!postId) return;
                  try {
                    console.log('[PostDetails] Deleting post', postId);
                    setDeleteError(null);
                    setDeleting(true);
                    await apiClient.delete(BackendRoutes.COMMUNITY_POST(String(postId)));
                    setShowDeleteConfirm(false);
                    // Navigate back after successful deletion
                    router.back();
                  } catch {
                    console.warn('[PostDetails] Delete failed for post', postId);
                    setDeleteError('Could not delete. Please try again.');
                  } finally {
                    setDeleting(false);
                  }
                }}
                style={[styles.confirmButton, styles.confirmButtonPrimary, deleting ? { opacity: 0.7 } : null]}
                disabled={deleting}
              >
                <Text style={[styles.confirmButtonText, styles.confirmButtonPrimaryText]}>
                  {deleting ? 'Deleting...' : 'Delete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}>
        <View style={[styles.flexFill, Platform.OS === 'android' ? { paddingBottom: Math.max(androidKb - insets.bottom - 46, 0) } : null]}>
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 8 + composerH + Math.max(insets.bottom - 6, 0) }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header: Avatar + Name (pressable) + Upvote */}
            <View style={styles.header}>
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={!canNavigateProfile}
                onPress={handleOpenProfile}
                style={styles.headerPressArea}
              >
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
                {!!userStreakLabel && (
                  <Text style={styles.metaText} numberOfLines={1}>
                    {userStreakLabel}
                  </Text>
                )}
              </View>
              </TouchableOpacity>
              <View style={styles.postHeaderActions}>
                <CommunityUpvote
                  postId={String(postId)}
                  likesCount={Number((post as any)?.upvotes ?? (post as any)?.likes_count ?? 0)}
                  onChanged={(n) => setPost(prev => prev ? ({ ...(prev as any), upvotes: n, likes_count: n }) : prev)}
                />
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
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setShowReportMenu(true)}
                style={styles.moreButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="ellipsis-horizontal" size={18} color={theme.colors.textPrimary} />
              </TouchableOpacity>
              {showReportMenu ? (
                <View style={styles.reportMenu}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      setReportBannerVisible(true);
                      setShowReportMenu(false);
                      setTimeout(() => setReportBannerVisible(false), 1800);
                    }}
                    style={styles.reportMenuItem}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={styles.reportMenuItemText}>Report</Text>
                  </TouchableOpacity>
                  {isOwnPost ? (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => {
                        setDeleteError(null);
                        setShowDeleteConfirm(true);
                        setShowReportMenu(false);
                      }}
                      style={styles.reportMenuItem}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Text style={styles.reportMenuItemDestructive}>Delete</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}
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
              <View style={styles.emptyComments}>
                <LottieUniversal
                  source={require('@/assets/images/space boy developer.json')}
                  autoPlay
                  loop
                  style={styles.emptyLottie}
                />
                <Text style={styles.loadingText}>No comments yet. Be the first to engage.</Text>
              </View>
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
    headerPressArea: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      minWidth: 0,
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
    postHeaderActions: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 6,
      marginTop: 2,
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative',
      zIndex: 10,
    },
    commentsTitle: {
      color: theme.colors.textPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
    moreButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    reportMenu: {
      position: 'absolute',
      right: 0,
      top: 32,
      backgroundColor: '#FFFFFF',
      borderRadius: 10,
      paddingVertical: 6,
      minWidth: 120,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.06)',
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      zIndex: 20,
      elevation: 12,
    },
    reportMenuItem: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    reportMenuItemText: {
      color: '#111827',
      fontSize: 14,
      fontWeight: '600',
    },
    reportMenuItemDestructive: {
      color: '#DC2626',
      fontSize: 14,
      fontWeight: '700',
    },
    reportBanner: {
      position: 'absolute',
      top: 12,
      alignSelf: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 9999,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.06)',
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      zIndex: 50,
    },
    reportBannerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    reportBannerText: {
      color: '#111827',
      fontSize: 14,
      fontWeight: '700',
      marginLeft: 8,
    },
    commentsList: {
      paddingTop: 4,
    },
    emptyComments: {
      alignItems: 'center',
      paddingTop: 8,
      paddingBottom: 16,
    },
    emptyLottie: {
      width: 180,
      height: 180,
    },
    confirmOverlay: {
      ...StyleSheet.absoluteFillObject as any,
      backgroundColor: 'rgba(0,0,0,0.35)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    confirmCard: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.06)',
      shadowColor: '#000',
      shadowOpacity: 0.14,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
    },
    confirmTitle: {
      color: '#111827',
      fontSize: 16,
      fontWeight: '800',
      marginBottom: 8,
      textAlign: 'center',
    },
    confirmText: {
      color: '#374151',
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 8,
    },
    confirmError: {
      color: '#DC2626',
      fontSize: 12,
      textAlign: 'center',
      marginBottom: 8,
    },
    confirmButtonsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    confirmButton: {
      flex: 1,
      paddingVertical: Platform.OS === 'android' ? 12 : 10,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      marginHorizontal: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmButtonText: {
      fontWeight: '700',
    },
    confirmButtonSecondary: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E5E7EB',
    },
    confirmButtonSecondaryText: {
      color: '#111827',
    },
    confirmButtonPrimary: {
      backgroundColor: '#DC2626',
      borderColor: '#DC2626',
    },
    confirmButtonPrimaryText: {
      color: '#FFFFFF',
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


