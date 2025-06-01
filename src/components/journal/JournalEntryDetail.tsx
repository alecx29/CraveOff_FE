import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
  Modal as RNModal
} from 'react-native';
import Animated, { 
  FadeIn, 
  FadeOut 
} from 'react-native-reanimated';

import { useTheme } from '@/src/context/ThemeProvider';
import { JournalEntry } from '@/src/context/JournalContext';

interface JournalEntryDetailProps {
  entry: JournalEntry;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
}

const { width } = Dimensions.get('window');

const JournalEntryDetail: React.FC<JournalEntryDetailProps> = ({
  entry,
  onEdit,
  onDelete,
  onBack
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // Format the date
  const formattedDate = React.useMemo(() => {
    try {
      return format(new Date(entry.date), 'MMMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  }, [entry.date]);
  
  const formattedTime = React.useMemo(() => {
    try {
      return format(new Date(entry.createdAt), 'h:mm a');
    } catch (error) {
      return '';
    }
  }, [entry.createdAt]);

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
          borderColor: theme.colors.borderLight
        };
    }
  };

  const moodInfo = getMoodEmoji();

  // Open delete confirmation modal
  const handleDeletePress = () => {
    console.log('Delete button pressed, showing modal');
    setDeleteModalVisible(true);
  };

  // Handle confirmed delete
  const handleConfirmDelete = () => {
    setDeleteModalVisible(false);
    console.log('Delete confirmed, calling onDelete');
    onDelete();
  };

  // Handle cancel delete
  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    console.log('Delete cancelled');
  };

  // Delete confirmation modal
  const DeleteConfirmationModal = () => (
    <RNModal
      animationType="fade"
      transparent={true}
      visible={deleteModalVisible}
      onRequestClose={handleCancelDelete}
    >
      <Animated.View 
        style={styles.modalOverlay}
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Ionicons 
              name="warning-outline" 
              size={48} 
              color={theme.colors.emergency} 
              style={styles.modalIcon}
            />
            
            <Text style={styles.modalTitle}>Delete Entry</Text>
            
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this journal entry? This action cannot be undone.
            </Text>
            
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonCancel]} 
                onPress={handleCancelDelete}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonDelete]} 
                onPress={handleConfirmDelete}
              >
                <Text style={styles.modalButtonDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    </RNModal>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Journal Entry</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton} onPress={onEdit}>
              <Ionicons name="create-outline" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton} 
              onPress={handleDeletePress}
              activeOpacity={0.6}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={24} color={theme.colors.emergency} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.content}>
          {/* Date and Mood */}
          <View style={styles.metaContainer}>
            <View style={styles.dateContainer}>
              <Text style={styles.date}>{formattedDate}</Text>
              <Text style={styles.time}>{formattedTime}</Text>
            </View>
            <View style={[
              styles.moodContainer, 
              { 
                borderColor: moodInfo.borderColor,
                backgroundColor: moodInfo.backgroundColor
              }
            ]}>
              <Text style={styles.emoji}>{moodInfo.emoji}</Text>
              <Text style={[styles.moodLabel, { color: moodInfo.color }]}>
                {moodInfo.label}
              </Text>
            </View>
          </View>
          
          {/* Title */}
          <Text style={styles.title}>{entry.title}</Text>
          
          {/* Content */}
          <Text style={styles.contentText}>{entry.content}</Text>
          
          {/* Tags */}
          {entry.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              <Text style={styles.tagsTitle}>Tags</Text>
              <View style={styles.tagsList}>
                {entry.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Delete confirmation modal */}
      <DeleteConfirmationModal />
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    width: '100%',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  headerButton: {
    padding: 4,
    marginLeft: 12,
  },
  content: {
    padding: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: 'column',
  },
  date: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  time: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  moodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 24,
    borderWidth: 1,
    gap: 6,
  },
  emoji: {
    fontSize: 16,
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  contentText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    lineHeight: 24,
    marginBottom: 24,
  },
  tagsContainer: {
    marginTop: 8,
  },
  tagsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: theme.colors.cardInteractive,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    maxWidth: 340,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalContent: {
    padding: 24,
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: theme.colors.cardInteractive,
    marginRight: 8,
  },
  modalButtonDelete: {
    backgroundColor: theme.colors.emergency,
  },
  modalButtonCancelText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonDeleteText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default JournalEntryDetail; 