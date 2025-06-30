import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';

// Define the journal entry interface
export interface JournalEntry {
  id: string;
  date: string;
  entry_date?: string;
  title: string;
  content: string;
  mood: 'great' | 'good' | 'okay' | 'difficult' | 'neutral';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface JournalContextType {
  entries: JournalEntry[];
  isLoading: boolean;
  error: string | null;
  fetchEntries: () => Promise<void>;
  addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<JournalEntry>;
  updateEntry: (id: string, entry: Partial<JournalEntry>) => Promise<JournalEntry>;
  deleteEntry: (id: string) => Promise<void>;
  getEntryById: (id: string) => Promise<JournalEntry | undefined>;
  clearError: () => void;
  resetJournal: () => void;
}

const JournalContext = createContext<JournalContextType>({
  entries: [],
  isLoading: false,
  error: null,
  fetchEntries: async () => {},
  addEntry: async () => ({} as JournalEntry),
  updateEntry: async () => ({} as JournalEntry),
  deleteEntry: async () => {},
  getEntryById: async () => undefined,
  clearError: () => {},
  resetJournal: () => {},
});

export const JournalProvider = ({ children }: { children: ReactNode }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch entries when the component mounts
  useEffect(() => {
    fetchEntries();
  }, []);

  // Fetch all journal entries from the API
  const fetchEntries = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Debug log to show we're attempting to fetch
      console.log('Fetching journal entries...');
      
      const response = await apiClient.get(BackendRoutes.JOURNAL);
      
      // Debug log to see what we got from the API
      console.log('API Response:', response.data);
      console.log('Response type:', typeof response.data);
      if (Array.isArray(response.data)) {
        console.log('Is array of length:', response.data.length);
      }
      
      // Ensure entries is always an array
      if (response.data) {
        // Check if the response data is in an expected format
        if (Array.isArray(response.data)) {
          setEntries(response.data);
        } else if (response.data.entries && Array.isArray(response.data.entries)) {
          // If the API returns { entries: [...] }
          setEntries(response.data.entries);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // If the API returns { data: [...] }
          setEntries(response.data.data);
        } else if (typeof response.data === 'object') {
          // If it's an object with values we can extract
          console.warn('Unexpected API response format, attempting to convert to array');
          const entriesArray = Object.values(response.data)
            .filter(item => item && typeof item === 'object')
            .filter(item => 
              typeof (item as any).id === 'string' && 
              (typeof (item as any).title === 'string' || typeof (item as any).content === 'string')
            ) as JournalEntry[];
          setEntries(entriesArray);
        } else {
          // If we can't handle the format, set empty array and log error
          console.error('API response format not recognized:', response.data);
          setEntries([]);
          setError('Received invalid data format from server');
        }
      } else {
        // Empty response
        console.warn('Empty response from API, using fallback data');
        // Provide fallback data if the API is not ready yet
        const fallbackEntries: JournalEntry[] = [
          {
            id: 'fallback-1',
            date: new Date().toISOString(),
            title: 'API Not Available',
            content: 'This is fallback data while the API is being set up. Your journal entries will be saved once the backend is ready.',
            mood: 'neutral',
            tags: ['fallback'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        setEntries(fallbackEntries);
      }
    } catch (error: any) {
      console.error('Failed to fetch journal entries:', error);
      
      // Provide some fallback data for testing if the API fails
      console.warn('API error, using fallback data');
      const fallbackEntries: JournalEntry[] = [
        {
          id: 'fallback-1',
          date: new Date().toISOString(),
          title: 'API Connection Error',
          content: 'There was an error connecting to the API. Your journal entries will be saved once the connection is restored.',
          mood: 'neutral',
          tags: ['fallback'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      setEntries(fallbackEntries);
      
      setError('Failed to fetch journal entries. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new journal entry via the API
  const addEntry = async (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post(BackendRoutes.JOURNAL, entry);
      
      // Handle various response formats
      let newEntry: JournalEntry;
      if (response.data) {
        if (response.data.id) {
          // Direct entry object response
          newEntry = response.data;
        } else if (response.data.entry && response.data.entry.id) {
          // { entry: {...} } format
          newEntry = response.data.entry;
        } else if (response.data.data && response.data.data.id) {
          // { data: {...} } format
          newEntry = response.data.data;
        } else {
          console.error('Unexpected API response format for new entry:', response.data);
          throw new Error('Invalid response format');
        }
        
        // Update state with the new entry
        setEntries(prevEntries => Array.isArray(prevEntries) ? [newEntry, ...prevEntries] : [newEntry]);
        return newEntry;
      } else {
        throw new Error('Empty response received');
      }
    } catch (error: any) {
      console.error('Failed to add journal entry:', error);
      setError('Failed to add journal entry. Please try again later.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing journal entry via the API
  const updateEntry = async (id: string, entryUpdates: Partial<JournalEntry>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.patch(`${BackendRoutes.JOURNAL}${id}`, entryUpdates);
      
      // Handle various response formats
      let updatedEntry: JournalEntry;
      if (response.data) {
        if (response.data.id) {
          // Direct entry object response
          updatedEntry = response.data;
        } else if (response.data.entry && response.data.entry.id) {
          // { entry: {...} } format
          updatedEntry = response.data.entry;
        } else if (response.data.data && response.data.data.id) {
          // { data: {...} } format
          updatedEntry = response.data.data;
        } else {
          console.error('Unexpected API response format for updated entry:', response.data);
          throw new Error('Invalid response format');
        }
        
        // Update state with the updated entry
        setEntries(prevEntries => 
          Array.isArray(prevEntries) 
            ? prevEntries.map(entry => entry.id === id ? updatedEntry : entry)
            : [updatedEntry]
        );
        return updatedEntry;
      } else {
        throw new Error('Empty response received');
      }
    } catch (error: any) {
      console.error('Failed to update journal entry:', error);
      setError('Failed to update journal entry. Please try again later.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a journal entry via the API
  const deleteEntry = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    console.log(`Attempting to delete journal entry with ID: ${id}`);
    console.log(`DELETE API call to: ${BackendRoutes.JOURNAL}${id}`);
    
    try {
      await apiClient.delete(`${BackendRoutes.JOURNAL}${id}`);
      console.log('API delete call successful');
      setEntries(prevEntries => prevEntries.filter(entry => entry.id !== id));
    } catch (error: any) {
      console.error('Failed to delete journal entry:', error);
      console.error('Error details:', error.response?.data || 'No response data');
      setError('Failed to delete journal entry. Please try again later.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Get a specific journal entry by ID from the API
  const getEntryById = async (id: string) => {
    try {
      const response = await apiClient.get(`${BackendRoutes.JOURNAL}${id}`);
      
      // Handle various response formats
      if (response.data) {
        if (response.data.id) {
          // Direct entry object response
          return response.data;
        } else if (response.data.entry && response.data.entry.id) {
          // { entry: {...} } format
          return response.data.entry;
        } else if (response.data.data && response.data.data.id) {
          // { data: {...} } format
          return response.data.data;
        } else {
          console.error('Unexpected API response format for entry detail:', response.data);
          setError('Received invalid data format from server');
          return undefined;
        }
      } else {
        console.error('Empty response for entry detail');
        setError('No data received from server');
        return undefined;
      }
    } catch (error: any) {
      console.error(`Failed to fetch journal entry with ID ${id}:`, error);
      setError(`Failed to fetch journal entry. Please try again later.`);
      return undefined;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const resetJournal = () => setEntries([]);

  return (
    <JournalContext.Provider 
      value={{ 
        entries, 
        isLoading, 
        error, 
        fetchEntries,
        addEntry, 
        updateEntry,
        deleteEntry,
        getEntryById,
        clearError,
        resetJournal
      }}
    >
      {children}
    </JournalContext.Provider>
  );
};

export const useJournal = () => useContext(JournalContext); 