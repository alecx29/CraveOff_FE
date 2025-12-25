import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeProvider';
import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';

type Props = {
  postId: string | number;
  likesCount?: number;
  onChanged?: (newCount: number) => void;
  style?: ViewStyle;
};

export default function CommunityUpvote(props: Props) {
  const { postId, likesCount = 0, onChanged, style } = props;
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [pending, setPending] = useState<boolean>(false);
  const [count, setCount] = useState<number>(Number.isFinite(likesCount as any) ? Number(likesCount) : 0);

  useEffect(() => {
    const sanitized = Number.isFinite(likesCount as any) ? Number(likesCount) : 0;
    setCount(sanitized);
  }, [likesCount]);

  const handlePress = useCallback(async () => {
    if (pending) return;
    const next = count + 1;
    setPending(true);
    setCount(next);
    onChanged?.(next);
    try {
      await apiClient.post(BackendRoutes.COMMUNITY_POST_UPVOTE(postId));
    } catch {
      const revert = Math.max(0, next - 1);
      setCount(revert);
      onChanged?.(revert);
    } finally {
      setPending(false);
    }
  }, [pending, count, postId, onChanged]);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      disabled={pending}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[styles.upvoteButton, style]}
    >
      <View style={styles.upvoteCircle}>
        <Ionicons name="chevron-up" size={14} color="#111827" />
      </View>
      <Text style={styles.upvoteCount}>{String(count)}</Text>
    </TouchableOpacity>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  upvoteButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  upvoteCircle: {
    width: 22,
    height: 22,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows?.light,
  },
  upvoteCount: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
});


