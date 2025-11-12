import React, { useCallback, useEffect, useRef, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Image, TouchableOpacity, Keyboard } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
 

import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import { useTheme } from '@/src/context/ThemeProvider';
import { BackendRoutes } from '@/src/axios/backendRoutes';
import { apiClient } from '@/src/axios/apiClient';
import { AuthContext } from '@/src/context/AuthContext';
import ChatComposer from '@/src/components/chat/ChatComposer';
import { LinearGradient } from 'expo-linear-gradient';
import { getSupabase } from '@/src/services/supabaseClient';

type ChatMessage = {
  id: string;
  room_id: string;
  sender_user_id: string | number;
  sender_name?: string;
  content: string;
  content_type?: string;
  reply_to_message_id?: string | null;
  created_at: string; // ISO
  edited_at?: string | null;
  deleted_at?: string | null;
  metadata_json?: any;
};

export default function ChatRoomScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const { slug, title, imageUrl, isPublic: isPublicParam, genderPolicy, currentUserId: currentUserIdParam, roomId: roomIdParam } = useLocalSearchParams<{ slug: string; title?: string; imageUrl?: string; isPublic?: string; genderPolicy?: string; currentUserId?: string; roomId?: string }>();
  const isPublic = isPublicParam === 'true' || isPublicParam === '1';

  const [messages, setMessages] = useState<ChatMessage[]>([]); // kept in DESC order (newest first)
  const initialRoomIdFromParams = roomIdParam ? (isNaN(Number(roomIdParam)) ? roomIdParam : Number(roomIdParam)) : null;
  const [roomId, setRoomId] = useState<string | number | null>(initialRoomIdFromParams);
  const [sending, setSending] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const [composerH, setComposerH] = useState<number>(0);
  const [androidKb, setAndroidKb] = useState<number>(0);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const currentUserId = (user as any)?.id ?? (user as any)?._id ?? (user as any)?.user_id ?? currentUserIdParam ?? null;

  const fetchInitial = useCallback(async () => {
    try {
      const res = await apiClient.get(BackendRoutes.CHAT_ROOM_MESSAGES(slug), {
        params: { limit: 50, order: 'desc' },
      });
      const data = Array.isArray(res.data?.messages) ? res.data.messages : [];
      setMessages(data);
      // Derive room id from the first message (if available)
      if (Array.isArray(data) && data.length > 0) {
        const rid = (data[0] as any)?.room_id ?? null;
        if (rid != null) setRoomId(rid);
      }
    } catch {
      // noop for now
    } finally {
      // no-op
    }
  }, [slug]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  // Android: track keyboard height and push container paddingBottom accordingly
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

  const loadOlder = useCallback(async () => {
    if (messages.length === 0) return;
    const oldest = messages[messages.length - 1]?.created_at;
    if (!oldest) return;
    try {
      const res = await apiClient.get(BackendRoutes.CHAT_ROOM_MESSAGES(slug), {
        params: { limit: 50, order: 'desc', before: oldest },
      });
      const older = Array.isArray(res.data?.messages) ? res.data.messages : [];
      if (older.length > 0) {
        setMessages(prev => [...prev, ...older]);
        // Backfill room id if still unknown
        if (roomId == null) {
          const rid = (older[0] as any)?.room_id ?? null;
          if (rid != null) setRoomId(rid);
        }
      }
    } catch {}
  }, [messages, slug, roomId]);

  // Realtime: subscribe to new messages while in room
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    if (roomId == null) return;
    const channel = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload: any) => {
        const row = payload?.new;
        if (!row) return;
        // Normalize to ChatMessage shape and prepend (DESC list)
        const newMsg: ChatMessage = {
          id: String(row.id),
          room_id: row.room_id,
          sender_user_id: row.sender_user_id,
          sender_name: row.sender_name,
          content: row.content,
          content_type: row.content_type,
          reply_to_message_id: row.reply_to_message_id,
          created_at: String(row.created_at),
          deleted_at: row.deleted_at,
          metadata_json: row.metadata_json,
        };
        // Deduplicate if already present (e.g., after sending)
        setMessages(prev => {
          if (prev.length > 0 && prev[0]?.id === newMsg.id) return prev;
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [newMsg, ...prev];
        });
      })
      .subscribe();
    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [roomId]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    try {
      setSending(true);
      const res = await apiClient.post(BackendRoutes.CHAT_ROOM_MESSAGES(slug), { content: trimmed });
      const msg: ChatMessage | undefined = res.data?.message;
      if (msg) {
        setMessages(prev => [msg, ...prev]); // prepend because DESC order
        setInput('');
        // scroll to bottom (inverted list bottom is offset 0)
        requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }));
      }
    } catch (e: any) {
      // Handle permissions or validation errors
      const status = e?.response?.status;
      if (status === 403) {
        const userGender = String(user?.gender || '').toLowerCase();
        if (isPublic) {
          if ((genderPolicy === 'female_only') && userGender !== 'female') {
            alert('Only female users can post in this channel.');
          } else {
            alert('Posting is not allowed in this channel.');
          }
        } else {
          alert('This is a private channel. Please join with a code to post.');
        }
      } else if (status === 422) {
        alert('Message cannot be empty.');
      } else {
        alert('Failed to send message.');
      }
    } finally {
      setSending(false);
    }
  }, [input, slug, genderPolicy, isPublic, user?.gender]);

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isMine = currentUserId != null && String(item.sender_user_id) === String(currentUserId);
    const senderIdValue = (item.sender_user_id != null && String(item.sender_user_id).toLowerCase() !== 'null')
      ? String(item.sender_user_id)
      : null;
    const displayName = item.sender_name
      || (item as any)?.sender_display_name
      || (item?.metadata_json?.sender_display_name)
      || (item?.metadata_json?.sender_name)
      || (senderIdValue ? `User ${senderIdValue}` : 'User Unknown');

    if (isMine) {
      return (
        <View style={[styles.messageRow, styles.rowMine]}>
          <LinearGradient colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']} style={[styles.bubble, styles.bubbleGradient, styles.bubbleMineAlign]}>
            <Text style={[styles.messageText, styles.textGeneric]}>
              {item.content}
            </Text>
          </LinearGradient>
          <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/community/user/[userId]' as any, params: { userId: String(item.sender_user_id) } })}>
            {imageUrl ? (
              <Image source={{ uri: String(imageUrl) }} style={styles.avatarSmallRight} />
            ) : (
              <View style={styles.avatarSmallRightPlaceholder} />
            )}
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[styles.messageRow, styles.rowTheirs]}>
        <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/community/user/[userId]' as any, params: { userId: String(item.sender_user_id) } })}>
          {imageUrl ? (
            <Image source={{ uri: String(imageUrl) }} style={styles.avatarSmall} />
          ) : (
            <View style={styles.avatarSmallPlaceholder} />
          )}
        </TouchableOpacity>
        <View style={styles.theirsContent}>
          <View style={styles.nameRow}>
            <Text style={styles.nameText} numberOfLines={1}>{displayName}</Text>
          </View>
          <LinearGradient colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']} style={[styles.bubble, styles.bubbleGradient, styles.bubbleTheirsAlign]}>
            <Text style={[styles.messageText, styles.textGeneric]}>
              {item.content}
            </Text>
          </LinearGradient>
        </View>
      </View>
    );
  };

  return (
    <GradientBackground>
      <Stack.Screen
        options={{
          headerShown: true,
          title: (typeof title === 'string' && title.length > 0) ? String(title) : String(slug),
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.textPrimary,
          headerShadowVisible: true,
          // Back title options removed to satisfy type checks
          headerTitle: () => (
            <View style={styles.headerTitleContainer}>
              {imageUrl ? (
                <Image source={{ uri: String(imageUrl) }} style={styles.headerAvatar} />
              ) : (
                <View style={styles.headerAvatarPlaceholder} />
              )}
              <Text style={styles.headerTitle} numberOfLines={1}>{title || slug}</Text>
            </View>
          ),
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
        style={{ flex: 1 }}
      >
        <View style={[
          styles.container,
          Platform.OS === 'android' ? { paddingBottom: Math.max(androidKb - insets.bottom - 46, 0) } : null,
        ]}>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            inverted
            renderItem={renderItem}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: 8 + composerH + Math.max(insets.bottom - 6, 0) },
            ]}
            onEndReachedThreshold={0.2}
            onEndReached={loadOlder}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          />

          <View
            style={{ paddingBottom: Math.max(insets.bottom - 6, 0) }}
            onLayout={(e) => setComposerH(e.nativeEvent.layout.height)}
          >
            <ChatComposer
              value={input}
              onChangeText={setInput}
              onSend={sendMessage}
              disabled={sending}
              placeholder="Type a message..."
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 0,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  headerAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  listContent: {
    paddingVertical: 8,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 8,
    paddingHorizontal: 6,
    width: '100%',
  },
  rowMine: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
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
  bubble: {
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexShrink: 1,
    minWidth: 48,
  },
  bubbleGradient: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    maxWidth: '90%',
  },
  bubbleMineAlign: {
    alignSelf: 'flex-end',
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
  nameText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  nameRow: {
    height: 24,
    paddingTop:3,
    justifyContent: 'center',
  },
  avatarSmallRight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: 8,
    marginTop: 2,
  },
  avatarSmallRightPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: 8,
    marginTop: 2,
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
});


