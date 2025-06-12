import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '@/src/context/ThemeProvider';
import { useJournal, JournalEntry } from '@/src/context/JournalContext';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import JournalList from '@/src/components/journal/JournalList';
import JournalEntryDetail from '@/src/components/journal/JournalEntryDetail';
import JournalEntryForm from '@/src/components/journal/JournalEntryForm';

type ScreenMode = 'list' | 'detail' | 'create' | 'edit';

export default function JournalScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { 
    entries, 
    isLoading, 
    fetchEntries, 
    addEntry, 
    updateEntry, 
    deleteEntry, 
    getEntryById 
  } = useJournal();

  const [mode, setMode] = useState<ScreenMode>('list');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | undefined>(undefined);
  const [isEntryLoading, setIsEntryLoading] = useState<boolean>(false);

  // Fetch entries when the screen mounts
  useEffect(() => {
    fetchEntries();
  }, []);

  // Refresh data when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchEntries();
      return () => {};
    }, [])
  );

  // Load the selected entry when needed
  useEffect(() => {
    const loadSelectedEntry = async () => {
      if (selectedEntryId && (mode === 'detail' || mode === 'edit')) {
        setIsEntryLoading(true);
        try {
          const entry = await getEntryById(selectedEntryId);
          setSelectedEntry(entry);
        } catch (error) {
          console.error('Error loading entry:', error);
          Alert.alert('Error', 'Failed to load journal entry');
          setMode('list');
        } finally {
          setIsEntryLoading(false);
        }
      } else if (!selectedEntryId) {
        setSelectedEntry(undefined);
      }
    };
    
    loadSelectedEntry();
  }, [selectedEntryId, mode]);

  // Handle entry selection
  const handleEntryPress = (id: string) => {
    setSelectedEntryId(id);
    setMode('detail');
  };

  // Handle creating a new entry
  const handleAddEntry = () => {
    setSelectedEntryId(null);
    setSelectedEntry(undefined);
    setMode('create');
  };

  // Handle editing an entry
  const handleEditEntry = () => {
    if (selectedEntryId) {
      setMode('edit');
    }
  };

  // Handle deleting an entry
  const handleDeleteEntry = async () => {
    console.log('handleDeleteEntry called, selectedEntryId:', selectedEntryId);
    if (selectedEntryId) {
      console.log('Attempting to delete entry ID:', selectedEntryId);
      try {
        await deleteEntry(selectedEntryId);
        console.log('Entry deleted successfully');
        setMode('list');
        setSelectedEntryId(null);
        setSelectedEntry(undefined);
      } catch (error) {
        console.error('Error deleting entry:', error);
        Alert.alert('Error', 'Failed to delete journal entry');
      }
    } else {
      console.error('Cannot delete entry: selectedEntryId is null or undefined');
    }
  };

  // Handle saving a new entry
  const handleSaveNewEntry = async (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await addEntry(entry);
      setMode('list');
    } catch (error) {
      console.error('Error creating entry:', error);
      Alert.alert('Error', 'Failed to create journal entry');
    }
  };

  // Handle updating an existing entry
  const handleUpdateEntry = async (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedEntryId) {
      try {
        await updateEntry(selectedEntryId, entry);
        // Refresh the entry data
        const updatedEntry = await getEntryById(selectedEntryId);
        setSelectedEntry(updatedEntry);
        setMode('detail');
      } catch (error) {
        console.error('Error updating entry:', error);
        Alert.alert('Error', 'Failed to update journal entry');
      }
    }
  };

  // Handle canceling entry creation/editing
  const handleCancelEntry = () => {
    if (mode === 'edit') {
      setMode('detail');
    } else {
      setMode('list');
      setSelectedEntryId(null);
      setSelectedEntry(undefined);
    }
  };

  // Handle going back to the list from detail view
  const handleBackToList = () => {
    setMode('list');
    setSelectedEntryId(null);
    setSelectedEntry(undefined);
  };

  // Render the appropriate screen based on the current mode
  const renderContent = () => {
    // Show loading indicator while fetching the entry data
    if (isEntryLoading && (mode === 'detail' || mode === 'edit')) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    switch (mode) {
      case 'list':
        return (
          <JournalList
            entries={entries}
            isLoading={isLoading}
            onEntryPress={handleEntryPress}
            onAddPress={handleAddEntry}
          />
        );
      case 'detail':
        if (selectedEntry) {
          return (
            <JournalEntryDetail
              entry={selectedEntry}
              onEdit={handleEditEntry}
              onDelete={handleDeleteEntry}
              onBack={handleBackToList}
            />
          );
        }
        return null;
      case 'create':
        return (
          <JournalEntryForm
            onSave={handleSaveNewEntry}
            onCancel={handleCancelEntry}
          />
        );
      case 'edit':
        if (selectedEntry) {
          return (
            <JournalEntryForm
              entry={selectedEntry}
              onSave={handleUpdateEntry}
              onCancel={handleCancelEntry}
            />
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        {renderContent()}
      </View>
    </GradientBackground>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
}); 