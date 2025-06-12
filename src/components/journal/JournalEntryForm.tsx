import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';

import { useTheme } from '@/src/context/ThemeProvider';
import { JournalEntry } from '@/src/context/JournalContext';

// Helper function to safely access theme colors
const getColor = (theme: any, colorName: string, fallbackColor: string): string => {
  const colors = theme.colors as Record<string, string>;
  if (colorName in colors) return colors[colorName];
  return fallbackColor;
};

type MoodOption = 'great' | 'good' | 'okay' | 'difficult';

interface JournalEntryFormProps {
  entry?: Partial<JournalEntry>;
  onSave: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const JournalEntryForm: React.FC<JournalEntryFormProps> = ({ 
  entry, 
  onSave, 
  onCancel 
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const today = new Date().toISOString();
  
  // Form state
  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || '');
  const [mood, setMood] = useState<MoodOption>(entry?.mood as MoodOption || 'okay');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(entry?.tags || []);
  
  // Get mood emoji and label
  const getMoodDetails = (moodOption: MoodOption) => {
    switch (moodOption) {
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
          label: 'Select',
          backgroundColor: 'transparent',
          borderColor: getColor(theme, 'borderLight', '#e2e8f0')
        };
    }
  };
  
  // Add tag to the list
  const addTag = () => {
    if (tagInput.trim()) {
      const formattedTag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
      if (!tags.includes(formattedTag)) {
        setTags([...tags, formattedTag]);
      }
      setTagInput('');
    }
  };
  
  // Remove tag from the list
  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }
    
    if (!content.trim()) {
      Alert.alert('Error', 'Content is required');
      return;
    }
    
    onSave({
      title: title.trim(),
      content: content.trim(),
      mood: mood,
      tags,
      date: entry?.date || today
    });
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      {/* Header with navigation buttons */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onCancel}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {entry ? 'Edit' : 'New Entry'}
        </Text>
        
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSubmit}
          activeOpacity={0.7}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.mainContainer}>
        {/* Title Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter a title..."
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>
        
        {/* Mood Selector */}
        <View style={styles.moodContainer}>
          <Text style={styles.label}>How are you feeling?</Text>
          <View style={styles.moodButtonsContainer}>
            {(['difficult', 'okay', 'good', 'great'] as MoodOption[]).map((moodOption) => {
              const moodDetails = getMoodDetails(moodOption);
              return (
                <TouchableOpacity
                  key={moodOption}
                  style={[
                    styles.moodButton,
                    { 
                      borderColor: moodDetails.borderColor,
                      backgroundColor: moodDetails.backgroundColor
                    },
                    mood === moodOption && styles.selectedMoodButton
                  ]}
                  onPress={() => setMood(moodOption)}
                >
                  <Text style={styles.emoji}>{moodDetails.emoji}</Text>
                  <Text 
                    style={[
                      styles.moodLabel,
                      { color: moodDetails.color },
                      mood === moodOption && styles.selectedMoodLabel
                    ]}
                  >
                    {moodDetails.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        
        {/* Content Input - fills remaining space */}
        <View style={styles.journalEntryContainer}>
          <TextInput
            style={styles.textArea}
            value={content}
            onChangeText={setContent}
            placeholder="Write your thoughts..."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            textAlignVertical="top"
          />
        </View>
        
        {/* Tags Input - at the bottom */}
        <View style={styles.tagsContainer}>
          <Text style={styles.label}>Tags</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="Add a tag..."
              placeholderTextColor={theme.colors.textMuted}
              onSubmitEditing={addTag}
            />
            <TouchableOpacity 
              style={styles.addTagButton}
              onPress={addTag}
            >
              <Ionicons name="add" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          
          {/* Tags Display */}
          {tags.length > 0 && (
            <View style={styles.tagsListContainer}>
              {tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                  <TouchableOpacity
                    onPress={() => removeTag(index)}
                    style={styles.removeTagButton}
                  >
                    <Ionicons name="close-circle" size={16} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(200, 200, 200, 0.3)',
    backgroundColor: getColor(theme, 'backgroundDeep', '#1a1c20'),
  },
  mainContainer: {
    flex: 1,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
  },
  headerButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  saveButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  saveButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 10,
  },
  moodContainer: {
    marginBottom: 6,
  },
  moodButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  journalEntryContainer: {
    flex: 1,
    marginVertical: 10,
  },
  tagsContainer: {
    marginTop: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(31, 41, 55, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  textArea: {
    backgroundColor: 'rgba(31, 41, 55, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.colors.textPrimary,
    flex: 1,
    height: '100%',
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  moodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: 24,
    borderWidth: 1,
    gap: 4,
  },
  selectedMoodButton: {
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  emoji: {
    fontSize: 14,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  selectedMoodLabel: {
    fontWeight: 'bold',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    backgroundColor: 'rgba(31, 41, 55, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  addTagButton: {
    padding: 8,
    marginLeft: 8,
  },
  tagsListContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.3)',
  },
  tagText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  removeTagButton: {
    marginLeft: 4,
  },
});

export default JournalEntryForm; 