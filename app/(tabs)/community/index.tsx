import React, { useCallback, useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Linking, FlatList, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useTheme } from '@/src/context/ThemeProvider';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';
import { AuthContext } from '@/src/context/AuthContext';

type ChatRoom = {
  id: string | number;
  name?: string;
  title?: string;
  description?: string;
  membersCount?: number;
  image_url?: string;
  imageUrl?: string;
};

export default function CommunityInfoScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { user: authUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<'info' | 'clans'>('info');
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

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

  useEffect(() => {
    if (activeTab === 'clans' && rooms.length === 0 && !loading) {
      fetchRooms();
    }
  }, [activeTab, rooms.length, loading, fetchRooms]);

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
                  return (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.roomCard}
                      onPress={() =>
                        router.push({
                          pathname: '/(tabs)/community/room/[slug]' as any,
                          params: { slug, title, imageUrl, isPublic: String(!!isPublic), genderPolicy: genderPolicy || '', currentUserId: String(myId || '') },
                        })
                      }
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


