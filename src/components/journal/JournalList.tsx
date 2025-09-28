import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/src/context/ThemeProvider';
import { JournalEntry } from '@/src/context/JournalContext';
import JournalEntryCard from './JournalEntryCard';

interface JournalListProps {
  entries: JournalEntry[];
  isLoading: boolean;
  onEntryPress: (id: string) => void;
  onAddPress: () => void;
}

const JournalList: React.FC<JournalListProps> = ({
  entries,
  isLoading,
  onEntryPress,
  onAddPress
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Group entries by month
  const groupedEntries = React.useMemo(() => {
    const groups: Record<string, JournalEntry[]> = {};
    
    // Add additional safety check for entries
    if (!entries || !Array.isArray(entries)) {
      console.error('Entries is not an array:', entries);
      return [];
    }
    
    try {
      entries.forEach(entry => {
        try {
          const date = new Date(entry.entry_date || entry.date);
          const monthYear = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
          
          if (!groups[monthYear]) {
            groups[monthYear] = [];
          }
          
          groups[monthYear].push(entry);
        } catch (error) {
          // Handle invalid dates or entries
          console.warn('Error processing entry:', entry, error);
          const fallback = 'Other';
          if (!groups[fallback]) {
            groups[fallback] = [];
          }
          groups[fallback].push(entry);
        }
      });
    } catch (error) {
      console.error('Error grouping entries:', error);
      return [];
    }
    
    return Object.entries(groups).map(([title, data]) => ({
      title,
      data
    }));
  }, [entries]);

  // Add debug log to see what entries we're working with
  React.useEffect(() => {
    console.log('JournalList received entries:', Array.isArray(entries) ? `Array of ${entries.length} items` : typeof entries);
    if (entries && entries.length > 0) {
      console.log('First entry sample:', entries[0]);
    }
  }, [entries]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="book-outline" size={64} color={theme.colors.textMuted} />
        <Text style={styles.emptyText}>No journal entries yet</Text>
        <Text style={styles.emptySubtext}>
          Start writing about your journey and track your progress
        </Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>New Entry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={groupedEntries}
        keyExtractor={(item) => item.title}
        renderItem={({ item }) => (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{item.title}</Text>
            {item.data.map((entry) => (
              <JournalEntryCard
                key={entry.id}
                entry={entry}
                onPress={onEntryPress}
              />
            ))}
          </View>
        )}
      />
      
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={onAddPress}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 9999,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  section: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 12,
    marginTop: 8,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.medium,
  }
});

export default JournalList; 