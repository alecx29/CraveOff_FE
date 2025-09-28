import { format } from 'date-fns';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/src/context/ThemeProvider';
import { JournalEntry } from '@/src/context/JournalContext';

// Helper function to safely access theme colors
const getColor = (theme: any, colorName: string, fallbackColor: string): string => {
  const colors = theme.colors as Record<string, string>;
  if (colorName in colors) return colors[colorName];
  return fallbackColor;
};

interface JournalEntryCardProps {
  entry: JournalEntry;
  onPress: (id: string) => void;
}

const JournalEntryCard: React.FC<JournalEntryCardProps> = ({ entry, onPress }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme, getColor);

  // Format the date
  const formattedDate = React.useMemo(() => {
    try {
      // Check if entry has entry_date field
      const dateToUse = entry.entry_date || entry.date;
      return format(new Date(dateToUse), 'MMMM d, yyyy');
    } catch (error) {
      console.error('Date parsing error:', error, 'Date value:', entry.entry_date || entry.date);
      return 'Invalid date';
    }
  }, [entry.date, entry.entry_date]);

  // Helper function for component-level color access
  const getComponentColor = (colorName: string, fallbackColor: string): string => {
    const colors = theme.colors as Record<string, string>;
    if (colorName in colors) return colors[colorName];
    return fallbackColor;
  };

  // Get mood emoji
  const getMoodEmoji = () => {
    switch (entry.mood) {
      case 'great':
        return { 
          emoji: '😄', 
          color: '#22c55e', // Green
          label: 'Great',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderColor: 'rgba(34, 197, 94, 0.3)'
        };
      case 'good':
        return { 
          emoji: '👍', 
          color: '#3b82f6', // Blue
          label: 'Good',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgba(59, 130, 246, 0.3)'
        };
      case 'okay':
        return { 
          emoji: '😐', 
          color: '#eab308', // Yellow
          label: 'Okay',
          backgroundColor: 'rgba(234, 179, 8, 0.1)',
          borderColor: 'rgba(234, 179, 8, 0.3)'
        };
      case 'difficult':
        return { 
          emoji: '😞', 
          color: '#f97316', // Orange
          label: 'Difficult',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          borderColor: 'rgba(249, 115, 22, 0.3)'
        };
      default:
        return { 
          emoji: '❓', 
          color: theme.colors.textMuted,
          label: 'Unknown',
          backgroundColor: 'transparent',
          borderColor: getComponentColor('borderLight', '#e2e8f0')
        };
    }
  };

  const moodInfo = getMoodEmoji();

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress(entry.id)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.dateContainer}>
            <Text style={styles.date}>{formattedDate}</Text>
          </View>
          <View style={[
            styles.moodContainer, 
            { 
              borderColor: moodInfo.borderColor,
              backgroundColor: moodInfo.backgroundColor
            }
          ]}>
            <Text style={styles.emoji}>{moodInfo.emoji}</Text>
            <Text style={[styles.moodLabel, { color: moodInfo.color }]}>{moodInfo.label}</Text>
          </View>
        </View>
        
        <Text style={styles.title}>{entry.title}</Text>
        
        <Text style={styles.content} numberOfLines={1}>
          {entry.content}
        </Text>
        
        {entry.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {entry.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
            {entry.tags.length > 3 && (
              <Text style={styles.tagText}>+{entry.tags.length - 3}</Text>
            )}
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const createStyles = (theme: any, getColor: (theme: any, colorName: string, fallbackColor: string) => string) => {
  return StyleSheet.create({
    card: {
      backgroundColor: 'transparent',
      borderRadius: 14,
      padding: 0,
      marginBottom: 12,
      overflow: 'hidden',
    },
    cardGradient: {
      padding: 16,
      borderRadius: 14,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    dateContainer: {
      borderWidth: 1,
      borderColor: getColor(theme, 'borderLight', '#e2e8f0'),
      borderRadius: 16,
      paddingHorizontal: 10,
      paddingVertical: 4,
      backgroundColor: getColor(theme, 'cardInteractive', '#F1F5F9'),
    },
    date: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    moodContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 2,
      paddingHorizontal: 10,
      borderRadius: 24,
      borderWidth: 1,
      gap: 4,
    },
    emoji: {
      fontSize: 14,
    },
    moodLabel: {
      fontSize: 12,
      fontWeight: '600',
      lineHeight: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginBottom: 6,
    },
    content: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 6,
      lineHeight: 20,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    tag: {
      backgroundColor: getColor(theme, 'cardInteractive', '#F1F5F9'),
      borderRadius: 14,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginRight: 6,
    },
    tagText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    }
  });
};

export default JournalEntryCard; 