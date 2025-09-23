import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/src/context/ThemeProvider';

type HomeTopBarProps = {
  cleanDays: number;
  isConnected: boolean;
  onChatPress: () => void;
  onPetPress: () => void;
  petAnimatedStyle?: any;
};

const HomeTopBar: React.FC<HomeTopBarProps> = ({
  cleanDays,
  isConnected,
  onChatPress,
  onPetPress,
  petAnimatedStyle,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const getFlameColor = (): string => {
    const colors = theme.colors as Record<string, string>;
    if ('flame' in colors) return colors.flame as string;
    if ('accentOrange' in colors) return colors.accentOrange as string;
    return colors.accent as string || '#f97316';
  };

  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('@/assets/images/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        {!isConnected && (
          <Text style={styles.offlineMessage}>{"You're currently offline"}</Text>
        )}
      </View>

      <View style={styles.headerButtons}>
        <View style={[styles.streakBadge, { marginRight: 10 }]}>
          <Ionicons name="flame" size={18} color={getFlameColor()} />
          <Text style={styles.streakBadgeText}>{cleanDays}</Text>
        </View>
        <TouchableOpacity
          style={[styles.petButton, { marginRight: 10 }]}
          activeOpacity={0.8}
          onPress={onChatPress}
        >
          <Ionicons name="chatbubble-outline" size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.petButton}
          onPress={onPetPress}
          activeOpacity={0.8}
        >
          <Animated.View style={petAnimatedStyle}>
            <Text style={styles.petEmoji}>🐶</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  logo: {
    width: 150,
    height: 50,
    marginBottom: 6,
  },
  offlineMessage: {
    fontSize: 12,
    color: theme.colors.emergency || '#dc2626',
    marginTop: 2,
    fontStyle: 'italic',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 16,
    paddingHorizontal: 10,
    height: 32,
    ...theme.shadows.light,
  },
  streakBadgeText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  petButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.light,
  },
  petEmoji: {
    fontSize: 22,
  },
});

export default HomeTopBar;


