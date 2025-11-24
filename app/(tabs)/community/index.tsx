import React, { useCallback, useContext, useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Linking, FlatList, RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome, AntDesign } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useTheme } from '@/src/context/ThemeProvider';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';
import { AuthContext } from '@/src/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAchievementImage } from '@/src/utils/achievementImages';
import CommunityUpvote from '@/src/components/community/CommunityUpvote';

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

type ChatRoom = {
  id: string | number;
  name?: string;
  title?: string;
  description?: string;
  membersCount?: number;
  image_url?: string;
  imageUrl?: string;
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

export default function CommunityInfoScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();
  const { user: authUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<'info' | 'forum' | 'clans'>('info');
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [postsLoading, setPostsLoading] = useState<boolean>(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [postsRefreshing, setPostsRefreshing] = useState<boolean>(false);
  const [hasFetchedPosts, setHasFetchedPosts] = useState<boolean>(false);

  const [navLocked, setNavLocked] = useState<boolean>(false);
  const navLockRef = useRef<boolean>(false);

  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newPostTitle, setNewPostTitle] = useState<string>('');
  const [newPostContent, setNewPostContent] = useState<string>('');
  const [creatingPost, setCreatingPost] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

  const openReddit = () => {
    Linking.openURL('https://www.reddit.com/r/CraveOff/');
  };

  const openTelegram = () => {
    Linking.openURL('https://t.me/+csKNRFfBgRc1ZTFk');
  };

  const fetchRooms = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await apiClient.get(BackendRoutes.CHAT_ROOMS);
      const data = Array.isArray(response.data) ? response.data : (response.data?.rooms ?? []);
      setRooms(data);
    } catch {
      setError('Failed to load chat rooms');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      setPostsError(null);
      setPostsLoading(true);
      const response = await apiClient.get(BackendRoutes.COMMUNITY_POSTS);
      const data = Array.isArray(response.data) ? response.data : (response.data?.posts ?? []);
      setPosts(data);
    } catch {
      setPostsError('Failed to load forum posts');
    } finally {
      setPostsLoading(false);
      setPostsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'clans' && rooms.length === 0 && !loading) {
      fetchRooms();
    }
  }, [activeTab, rooms.length, loading, fetchRooms]);

  useEffect(() => {
    if (activeTab === 'forum' && !hasFetchedPosts) {
      setHasFetchedPosts(true);
      fetchPosts();
    }
  }, [activeTab, hasFetchedPosts, fetchPosts]);

  // Track keyboard height to float the Post button above it
  useEffect(() => {
    const onShow = (e: any) => {
      const height = e?.endCoordinates?.height ?? 0;
      setKeyboardHeight(height);
    };
    const onHide = () => setKeyboardHeight(0);
    const subShow = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', onShow);
    const subHide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', onHide);
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);
  const resetCreateForm = () => {
    setNewPostTitle('');
    setNewPostContent('');
    setCreateError(null);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    resetCreateForm();
  };

  const updatePostUpvotes = useCallback((postId: string | number, newCount: number) => {
    setPosts(prev =>
      prev.map(p => {
        if ((p as any)?.id === postId) {
          // Write to upvotes (primary) and likes_count (legacy) for compatibility
          return { ...(p as any), upvotes: newCount, likes_count: newCount };
        }
        return p;
      })
    );
  }, []);

  const handleCreatePost = useCallback(async () => {
    if (creatingPost) return;
    const title = (newPostTitle || '').trim();
    const content = (newPostContent || '').trim();
    if (!title || !content) {
      setCreateError('Add a title and content.');
      return;
    }
    try {
      setCreateError(null);
      setCreatingPost(true);
      await apiClient.post(BackendRoutes.COMMUNITY_POSTS, { title, content });
      setShowCreateModal(false);
      resetCreateForm();
      // Refresh posts after creating
      setPostsRefreshing(true);
      await fetchPosts();
    } catch {
      setCreateError('Nu am putut crea postarea. Încearcă din nou.');
    } finally {
      setCreatingPost(false);
    }
  }, [creatingPost, newPostTitle, newPostContent, fetchPosts]);

  return (
    <GradientBackground>
      <View style={styles.container}>
        <Text style={styles.title}>Community</Text>

        <View style={styles.tabsContainer}>
          {activeTab === 'info' ? (
            <TouchableOpacity activeOpacity={0.8} style={[styles.pillWrap, styles.pillActive]}>
              <View style={styles.pillContent}>
                <Ionicons name="trophy-outline" size={16} color="#111827" style={styles.pillIcon} />
                <Text style={styles.pillTextActive}>Info</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity activeOpacity={0.8} style={styles.pillWrap} onPress={() => setActiveTab('info')}>
              <LinearGradient
                colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
                style={styles.pillGradient}
              >
                <View style={styles.pillContent}>
                  <Ionicons name="trophy-outline" size={16} color={theme.colors.textPrimary} style={styles.pillIcon} />
                  <Text style={styles.pillTextInactive}>Info</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {activeTab === 'forum' ? (
            <TouchableOpacity activeOpacity={0.8} style={[styles.pillWrap, styles.pillActive]}>
              <View style={styles.pillContent}>
                <Ionicons name="chatbubbles-outline" size={16} color="#111827" style={styles.pillIcon} />
                <Text style={styles.pillTextActive}>Forum</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity activeOpacity={0.8} style={styles.pillWrap} onPress={() => setActiveTab('forum')}>
              <LinearGradient
                colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
                style={styles.pillGradient}
              >
                <View style={styles.pillContent}>
                  <Ionicons name="chatbubbles-outline" size={16} color={theme.colors.textPrimary} style={styles.pillIcon} />
                  <Text style={styles.pillTextInactive}>Forum</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {activeTab === 'clans' ? (
            <TouchableOpacity activeOpacity={0.8} style={[styles.pillWrap, styles.pillActive]}>
              <View style={styles.pillContent}>
                <Ionicons name="people-outline" size={16} color="#111827" style={styles.pillIcon} />
                <Text style={styles.pillTextActive}>Clans</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity activeOpacity={0.8} style={styles.pillWrap} onPress={() => setActiveTab('clans')}>
              <LinearGradient
                colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
                style={styles.pillGradient}
              >
                <View style={styles.pillContent}>
                  <Ionicons name="people-outline" size={16} color={theme.colors.textPrimary} style={styles.pillIcon} />
                  <Text style={styles.pillTextInactive}>Clans</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {activeTab === 'info' && (
          <ScrollView style={styles.infoScroll} contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false}>
            {/* Hero Section */}
            <View style={styles.heroCard}>
              <LinearGradient
                colors={['rgba(0, 0, 0, 0.35)', 'rgba(76, 62, 98, 0.28)']}
                style={styles.heroGradient}
              >
                <Image 
                  source={require('@/assets/images/logo.png')} 
                  style={styles.heroImage}
                  resizeMode="contain"
                />
                <Text style={styles.heroTitle}>You&apos;re Not Alone</Text>
                <Text style={styles.heroText}>
                  Thousands of people are on the same journey as you. Share experiences, find accountability partners, and get support from a community that understands.
                </Text>
              </LinearGradient>
            </View>

            {/* Reddit Community Card */}
            <View style={styles.redditCard}>
              <LinearGradient
                colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
                style={styles.redditGradient}
              >
                <View style={styles.redditHeader}>
                  <View style={styles.redditIconContainer}>
                    <FontAwesome name="reddit-alien" size={32} color="#FF4500" />
                  </View>
                  <View style={styles.redditTitleContainer}>
                    <Text style={styles.redditTitle}>r/CraveOff</Text>
                    <Text style={styles.redditMembers}>500+ members • Private community</Text>
                  </View>
                </View>
                
                <Text style={styles.redditDescription}>
                  Join our private Telegram and Reddit communities where you can share your journey, ask questions, and get support from people who understand what you&apos;re going through.
                </Text>
                
                <View style={styles.benefitsContainer}>
                  <View style={styles.benefitItem}>
                    <Ionicons name="shield-checkmark-outline" size={22} color="rgb(255, 69, 0)" />
                    <Text style={styles.benefitText}>Private & Anonymous</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Ionicons name="people-outline" size={22} color="rgb(255, 69, 0)" />
                    <Text style={styles.benefitText}>Supportive Members</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Ionicons name="trophy-outline" size={22} color="rgb(255, 69, 0)" />
                    <Text style={styles.benefitText}>Success Stories</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.telegramButton} 
                  onPress={openTelegram}
                  activeOpacity={0.8}
                >
                  <FontAwesome name="telegram" size={24} color="#FFFFFF" />
                  <Text style={styles.telegramButtonText}>Join our Telegram</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.redditButton} 
                  onPress={openReddit}
                  activeOpacity={0.8}
                >
                  <FontAwesome name="reddit" size={24} color="#FFFFFF" />
                  <Text style={styles.redditButtonText}>Join r/CraveOff</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
            
            {/* Community Tips */}
            <View style={styles.tipsCard}>
              <LinearGradient
                colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
                style={styles.tipsGradient}
              >
                <Text style={styles.tipsTitle}>Community Tips</Text>
                
                <View style={styles.tipItem}>
                  <View style={styles.tipNumber}>
                    <Text style={styles.tipNumberText}>1</Text>
                  </View>
                  <View style={styles.tipContent}>
                    <Text style={styles.tipContentTitle}>Introduce Yourself</Text>
                    <Text style={styles.tipContentText}>Start by sharing your story and goals with the community.</Text>
                  </View>
                </View>
                
                <View style={styles.tipItem}>
                  <View style={styles.tipNumber}>
                    <Text style={styles.tipNumberText}>2</Text>
                  </View>
                  <View style={styles.tipContent}>
                    <Text style={styles.tipContentTitle}>Be Respectful</Text>
                    <Text style={styles.tipContentText}>Everyone is at different stages in their journey. Be kind and supportive.</Text>
                  </View>
                </View>
                
                <View style={styles.tipItem}>
                  <View style={styles.tipNumber}>
                    <Text style={styles.tipNumberText}>3</Text>
                  </View>
                  <View style={styles.tipContent}>
                    <Text style={styles.tipContentTitle}>Share Your Progress</Text>
                    <Text style={styles.tipContentText}>Celebrate wins and be honest about setbacks. The community is here to support you.</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
            
            {/* Coming Soon Section */}
            <View style={styles.comingSoonCard}>
              <LinearGradient
                colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
                style={styles.comingSoonGradient}
              >
                <Text style={styles.comingSoonTitle}>Coming Soon</Text>
                <Text style={styles.comingSoonText}>
                  We&apos;re working on more community features, including direct messaging, accountability partners, and live support groups.
                </Text>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonBadgeText}>Stay Tuned</Text>
                </View>
              </LinearGradient>
            </View>
          </ScrollView>
        )}

        {activeTab === 'clans' && (
          <View style={{ flex: 1 }}>
            {error ? (
              <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchRooms}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={rooms}
                keyExtractor={(item, index) => String(item.id ?? index)}
                ListHeaderComponent={() => (
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionLine} />
                    <Text style={styles.sectionLabel}>Public</Text>
                    <View style={styles.sectionLine} />
                  </View>
                )}
                renderItem={({ item }) => {
                  const title = item.name || item.title || `Room #${item.id}`;
                  const imageUrl = item.image_url || item.imageUrl;
                  const slug = (item as any).slug || item.name || String(item.id);
                  const isPublic = (item as any).is_public;
                  const genderPolicy = (item as any).gender_policy;
                  const myId = (authUser as any)?.id ?? (authUser as any)?._id ?? (authUser as any)?.user_id ?? (authUser as any)?.uid ?? (authUser as any)?.uuid ?? '';
                  // Determine if this room should be disabled for the current user based on gender policy/title
                  const userGender = String((authUser as any)?.gender || '').toLowerCase();
                  const isFemaleOnlyPolicy = typeof genderPolicy === 'string' && genderPolicy.toLowerCase() === 'female_only';
                  const isGirliesOnlyTitle = !genderPolicy && String(title || '').trim().toLowerCase() === 'girlies only';
                  const isDisabledForUser = (isFemaleOnlyPolicy || isGirliesOnlyTitle) && userGender !== 'female';
                  return (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      disabled={isDisabledForUser}
                      style={[styles.roomCard, isDisabledForUser ? { opacity: 0.5 } : null]}
                      onPress={() => {
                        if (isDisabledForUser) return;
                        router.push({
                          pathname: '/(tabs)/community/room/[slug]' as any,
                          params: {
                            slug,
                            title,
                            imageUrl,
                            isPublic: String(!!isPublic),
                            genderPolicy: genderPolicy || '',
                            currentUserId: String(myId || ''),
                            roomId: String(item.id ?? slug),
                          },
                        });
                      }}
                    >
                      <LinearGradient
                        colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
                        style={styles.roomGradient}
                      >
                        <View style={styles.roomRow}>
                          {imageUrl ? (
                            <Image source={{ uri: imageUrl }} style={styles.roomImage} resizeMode="cover" />
                          ) : (
                            <View style={styles.roomImagePlaceholder} />
                          )}
                          <View style={styles.roomContent}>
                            <Text style={styles.roomTitle} numberOfLines={1}>
                              {title}
                            </Text>
                            {item.description ? (
                              <Text style={styles.roomDesc} numberOfLines={2}>
                                {item.description}
                              </Text>
                            ) : null}
                            {typeof item.membersCount === 'number' ? (
                              <Text style={styles.roomMeta}>{item.membersCount} members</Text>
                            ) : null}
                          </View>
                          <View style={styles.roomArrow}>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                          </View>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={loading || refreshing}
                    onRefresh={() => {
                      setRefreshing(true);
                      fetchRooms();
                    }}
                    tintColor={theme.colors.primary}
                  />
                }
              />
            )}
          </View>
        )}

        {activeTab === 'forum' && (
          <View style={{ flex: 1 }}>
            {postsError ? (
              <View style={styles.centered}>
                <Text style={styles.errorText}>{postsError}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchPosts}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={posts}
                keyExtractor={(item, index) => String((item as any)?.id ?? index)}
                ListEmptyComponent={() =>
                  !postsLoading && !postsRefreshing ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>Nu există postări în forum încă.</Text>
                    </View>
                  ) : null
                }
                renderItem={({ item }) => {
                  const title = (item as any).title as string | undefined;
                  const body = ((item as any).content as string | undefined) ?? ((item as any).body as string | undefined) ?? '';
                  const displayTitle = (title && title.trim().length > 0) ? title : (body ? body.slice(0, 60) : 'Post');
                  const author = (item as any).author;
                  const authorName =
                    typeof author === 'string'
                      ? author
                      : (author?.username || author?.name || 'Unknown');
                  const authorId = typeof author === 'object'
                    ? (author?.id ?? (author as any)?._id ?? (author as any)?.user_id ?? (author as any)?.uid ?? (author as any)?.uuid)
                    : undefined;
                  const authorAvatarUrl = typeof author === 'object' ? (author as any)?.avatar_url : undefined;
                  const achievementCode = (item as any)?.user_last_achievement_code as string | undefined;
                  const achievementAvatarSource = achievementCode ? getAchievementImage(String(achievementCode)) : null;
                  const createdRaw = (item as any).created_at ?? (item as any).createdAt;
                  const relativeCreatedLabel = formatTimeAgo(createdRaw);

                  return (
                    <View style={styles.postCard}>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        disabled={navLocked}
                        onPress={() => {
                          if (navLockRef.current) return;
                          navLockRef.current = true;
                          setNavLocked(true);
                          const postId = (item as any)?.id;
                              const userNameParam =
                                (item as any)?.user_name ||
                                (typeof author === 'object' ? (author?.username || author?.name) : authorName) ||
                                '';
                          router.push({
                            pathname: '/(tabs)/community/post/[postId]' as any,
                            params: {
                              postId: String(postId ?? ''),
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
                            }
                          });
                          setTimeout(() => {
                            navLockRef.current = false;
                            setNavLocked(false);
                          }, 800);
                        }}
                      >
                      <LinearGradient
                        colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
                        style={styles.postGradient}
                      >
                        {/* Top meta row: avatar + name/time + chevron */}
                        <View style={styles.postHeaderRow}>
                          <TouchableOpacity
                            activeOpacity={0.85}
                            disabled={!authorId}
                            onPress={() => {
                              if (!authorId) return;
                              router.push({
                                pathname: '/(tabs)/community/user/[userId]' as any,
                                params: { userId: String(authorId), achievementCode: achievementCode || '' }
                              });
                            }}
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
                          <View style={styles.postHeaderActions}>
                            <CommunityUpvote
                              postId={(item as any)?.id}
                              likesCount={Number((item as any)?.upvotes ?? (item as any)?.likes_count ?? 0)}
                              onChanged={(n) => updatePostUpvotes((item as any)?.id, n)}
                            />
                          </View>
                        </View>

                        {/* Body: title + excerpt under meta row */}
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
                }}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={postsLoading || postsRefreshing}
                    onRefresh={() => {
                      setPostsRefreshing(true);
                      fetchPosts();
                    }}
                    tintColor={theme.colors.primary}
                  />
                }
              />
            )}
          </View>
        )}

        {activeTab === 'forum' && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowCreateModal(true)}
            style={styles.fabButton}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        )}

        <Modal
          visible={showCreateModal}
          transparent
          animationType="none"
          statusBarTranslucent
          onRequestClose={closeCreateModal}
        >
          <View style={styles.fsOverlay}>
            <GradientBackground ignoreFocus>
              <View style={styles.fsContainer}>
                <View style={[styles.fsHeader, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
                  <TouchableOpacity
                    style={styles.fsCloseButton}
                    onPress={closeCreateModal}
                    activeOpacity={0.7}
                  >
                    <AntDesign name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                  style={[styles.fsContent, { paddingBottom: Platform.OS === 'ios' ? (insets.bottom + 8) : (Math.max(insets.bottom, 20) + 20) }]}
                >
                  <LinearGradient
                    colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
                    style={[styles.modalGradient, { flex: 1 }]}
                  >
                    <Text style={styles.modalHeading}>New Post</Text>
                    <TextInput
                      value={newPostTitle}
                      onChangeText={setNewPostTitle}
                      placeholder="title"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      style={styles.modalTitleInput}
                      maxLength={200}
                      returnKeyType="next"
                      autoFocus
                    />
                    <TextInput
                      value={newPostContent}
                      onChangeText={setNewPostContent}
                      placeholder="What's on your mind?"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      style={[styles.modalContentInput, { flex: 1 }]}
                      multiline
                      textAlignVertical="top"
                    />
                    {!!createError && <Text style={[styles.errorText, { marginTop: 8 }]}>{createError}</Text>}
                    <View style={[
                      styles.modalButtonsRow,
                      { marginBottom: Platform.OS === 'ios'
                        ? 8
                        : Math.max(24, (keyboardHeight - Math.max(insets.bottom, 20)) + 16)
                      }
                    ]}>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleCreatePost}
                        style={[
                          styles.modalButton,
                          styles.modalButtonPrimary,
                          styles.modalButtonWide,
                          (creatingPost || !newPostTitle.trim() || !newPostContent.trim()) ? { opacity: 0.5 } : null
                        ]}
                        disabled={creatingPost || !newPostTitle.trim() || !newPostContent.trim()}
                      >
                        <Text style={[styles.modalButtonText, { color: '#111827', fontWeight: '700', textAlign: 'center' }]}>
                          {creatingPost ? 'Posting...' : 'Post'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </KeyboardAvoidingView>
              </View>
            </GradientBackground>
          </View>
        </Modal>
      </View>
    </GradientBackground>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 44,
    paddingBottom: 40,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  pillWrap: {
    marginRight: 8,
    borderRadius: 9999,
  },
  pillGradient: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  pillActive: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 9999,
    ...theme.shadows.light,
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillIcon: {
    marginRight: 6,
  },
  infoScroll: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  retryText: {
    color: '#111827',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 40,
  },
  roomCard: {
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.medium,
    marginBottom: 12,
    overflow: 'hidden',
  },
  roomGradient: {
    padding: 8,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  roomImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
  roomContent: {
    flex: 1,
    paddingRight: 4,
  },
  roomTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  roomDesc: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 6,
  },
  roomMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  roomArrow: {
    marginLeft: 8,
    alignSelf: 'center',
  },
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
    borderColor: 'rgba(255, 255, 255, 0.06)'
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
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
  postContent: {
    flex: 1,
    paddingRight: 4,
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
  postMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  fabButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    ...theme.shadows.medium,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 16,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  modalHeading: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  modalTitleInput: {
    color: theme.colors.textPrimary,
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.small,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  modalContentInput: {
    color: theme.colors.textPrimary,
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.small,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 140,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'android' ? 14 : 10,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'transparent',
  },
  modalButtonWide: {
    width: '85%',
    alignSelf: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  modalButtonText: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  fsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  fsContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  fsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  fsCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  fsContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 8,
    marginTop: 4,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: (theme as any).colors.borderLight || 'rgba(255, 255, 255, 0.12)'
  },
  sectionLabel: {
    marginHorizontal: 8,
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillTextInactive: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  pillTextActive: {
    color: '#111827',
    fontWeight: '700',
    textAlign: 'center',
  },
  heroCard: {
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.large,
    padding: 0,
    marginBottom: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroGradient: {
    padding: 24,
    borderRadius: theme.borderRadius.large,
    alignItems: 'center',
  },
  heroImage: {
    width: 150,
    height: 100,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  heroText: {
    fontSize: 15,
    color: 'rgb(156, 163, 175)',
    textAlign: 'center',
    lineHeight: 22,
  },
  redditCard: {
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.medium,
    padding: 0,
    marginBottom: 20,
    overflow: 'hidden',
  },
  redditGradient: {
    padding: 20,
    borderRadius: theme.borderRadius.medium,
  },
  redditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  redditIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    ...theme.shadows.light,
  },
  redditTitleContainer: {
    flex: 1,
  },
  redditTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  redditMembers: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  redditDescription: {
    fontSize: 15,
    color: 'rgb(156, 163, 175)',
    lineHeight: 22,
    marginBottom: 18,
  },
  benefitsContainer: {
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  benefitText: {
    fontSize: 15,
    color: theme.colors.textPrimary,
    marginLeft: 10,
  },
  redditButton: {
    backgroundColor: '#FF4500',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 12,
    ...theme.shadows.light,
  },
  redditButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  telegramButton: {
    backgroundColor: '#229ED9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    paddingVertical: 14,
    paddingHorizontal: 24,
    ...theme.shadows.light,
  },
  telegramButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  tipsCard: {
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.medium,
    padding: 0,
    marginBottom: 20,
    overflow: 'hidden',
  },
  tipsGradient: {
    padding: 20,
    borderRadius: theme.borderRadius.medium,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  tipNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  tipNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tipContent: {
    flex: 1,
  },
  tipContentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  tipContentText: {
    fontSize: 14,
    color: 'rgb(156, 163, 175)',
    lineHeight: 20,
  },
  comingSoonCard: {
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.medium,
    padding: 0,
    marginBottom: 40,
    alignItems: 'center',
    overflow: 'hidden',
  },
  comingSoonGradient: {
    padding: 20,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  comingSoonText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  comingSoonBadge: {
    backgroundColor: theme.colors.cardInteractive,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.small,
  },
  comingSoonBadgeText: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
});


