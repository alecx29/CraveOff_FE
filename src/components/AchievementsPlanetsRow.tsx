import React, { memo } from 'react';
import { View, Text, ScrollView, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeProvider';
import { getAchievementImage } from '@/src/utils/achievementImages';

type MinimalAchievement = {
  code: string;
  unlocked: boolean;
};

type Summary = {
  unlocked: number;
  total: number;
} | null;

type Props = {
  achievements: MinimalAchievement[];
  summary?: Summary;
  onPress?: () => void;
  maxItems?: number;
  size?: number;     // circle diameter
  spacing?: number;  // horizontal spacing between circles
  showHeader?: boolean;
  bottomSpacing?: number;
};

const AchievementsPlanetsRow: React.FC<Props> = ({
  achievements,
  summary,
  onPress,
  maxItems = 9,
  size = 32,
  spacing = 4,
  showHeader = true,
  bottomSpacing = 12,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const Wrapper = onPress ? Pressable : View;

  const lockIconSize = Math.max(12, Math.round(size * 0.45));
  const radius = size / 2;

  return (
    <View style={[styles.container, { marginBottom: bottomSpacing }]}>
      <Wrapper onPress={onPress as any}>
        {showHeader && (
          <Text style={styles.headerText}>
            <Ionicons name="trophy-outline" size={16} color={theme.colors.primary} />  Achievements
            {summary ? `  (${summary.unlocked}/${summary.total})` : ''}
          </Text>
        )}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {achievements.slice(0, maxItems).map((a) => {
            return (
              <View
                key={a.code}
                style={{
                  width: size,
                  height: size,
                  borderRadius: radius,
                  marginRight: spacing,
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                }}
              >
                {a.unlocked ? (
                  <Image
                    source={getAchievementImage(a.code)}
                    resizeMode="cover"
                    style={{ width: '100%', height: '100%', borderRadius: radius }}
                  />
                ) : (
                  <Ionicons name="lock-closed" size={lockIconSize} color={theme.colors.textMuted} />
                )}
              </View>
            );
          })}
        </ScrollView>
      </Wrapper>
    </View>
  );
};

function createStyles(theme: any) {
  return StyleSheet.create({
    container: {
      backgroundColor: 'transparent',
      borderRadius: theme.borderRadius?.medium || 12,
      marginBottom: 12,
    },
    headerText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 6,
    },
    row: {
      alignItems: 'center',
      paddingRight: 2,
      paddingVertical: 6,
    },
  });
}

export default memo(AchievementsPlanetsRow);


