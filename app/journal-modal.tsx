import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/src/context/ThemeProvider';
import { useJournal, JournalEntry } from '@/src/context/JournalContext';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import JournalList from '@/src/components/journal/JournalList';
import JournalEntryDetail from '@/src/components/journal/JournalEntryDetail';
import JournalEntryForm from '@/src/components/journal/JournalEntryForm';

type ScreenMode = 'list' | 'detail' | 'create' | 'edit';

export default function JournalModalScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets.top);

  const { entries, isLoading, fetchEntries, addEntry, updateEntry, deleteEntry, getEntryById } = useJournal();

  const [mode, setMode] = useState<ScreenMode>('list');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | undefined>(undefined);
  const [isEntryLoading, setIsEntryLoading] = useState<boolean>(false);

  // Fetch entries when the modal mounts
  useEffect(() => {
    fetchEntries();
  }, []);

  // Refresh data when the modal comes into focus
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

  const handleEntryPress = (id: string) => {
    setSelectedEntryId(id);
    setMode('detail');
  };

  const handleAddEntry = () => {
    setSelectedEntryId(null);
    setSelectedEntry(undefined);
    setMode('create');
  };

  const handleEditEntry = () => {
    if (selectedEntryId) setMode('edit');
  };

  const handleDeleteEntry = async () => {
    if (!selectedEntryId) return;
    try {
      await deleteEntry(selectedEntryId);
      setMode('list');
      setSelectedEntryId(null);
      setSelectedEntry(undefined);
    } catch (error) {
      console.error('Error deleting entry:', error);
      Alert.alert('Error', 'Failed to delete journal entry');
    }
  };

  const handleSaveNewEntry = async (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await addEntry(entry);
      setMode('list');
    } catch (error) {
      console.error('Error creating entry:', error);
      Alert.alert('Error', 'Failed to create journal entry');
    }
  };

  const handleUpdateEntry = async (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!selectedEntryId) return;
    try {
      await updateEntry(selectedEntryId, entry);
      const updatedEntry = await getEntryById(selectedEntryId);
      setSelectedEntry(updatedEntry);
      setMode('detail');
    } catch (error) {
      console.error('Error updating entry:', error);
      Alert.alert('Error', 'Failed to update journal entry');
    }
  };

  const handleCancelEntry = () => {
    if (mode === 'edit') {
      setMode('detail');
    } else {
      setMode('list');
      setSelectedEntryId(null);
      setSelectedEntry(undefined);
    }
  };

  const handleBackToList = () => {
    setMode('list');
    setSelectedEntryId(null);
    setSelectedEntry(undefined);
  };

  const renderContent = () => {
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
          <>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Journal</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Close journal"
              >
                <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <JournalList entries={entries} isLoading={isLoading} onEntryPress={handleEntryPress} onAddPress={handleAddEntry} />
          </>
        );
      case 'detail':
        return selectedEntry ? (
          <JournalEntryDetail entry={selectedEntry} onEdit={handleEditEntry} onDelete={handleDeleteEntry} onBack={handleBackToList} />
        ) : null;
      case 'create':
        return <JournalEntryForm onSave={handleSaveNewEntry} onCancel={handleCancelEntry} />;
      case 'edit':
        return selectedEntry ? <JournalEntryForm entry={selectedEntry} onSave={handleUpdateEntry} onCancel={handleCancelEntry} /> : null;
      default:
        return null;
    }
  };

  return (
    <GradientBackground>
      <View style={styles.container}>{renderContent()}</View>
    </GradientBackground>
  );
}

const createStyles = (theme: any, topInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: Math.max(topInset + 12, 20),
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalHeader: {
      paddingHorizontal: 16,
      paddingBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    closeButton: {
      position: 'absolute',
      right: 12,
      top: 0,
      padding: 8,
    },
  });


