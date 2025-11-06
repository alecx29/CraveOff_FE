import React, { createContext, useState, useContext, ReactNode } from 'react';

import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';

// Define the log entry interface
export interface LogEntry {
  id: string;
  date: string;
  duration?: number; // Make duration optional - it's used for timer-based logs but not for daily check-ins
  is_clean: boolean; // whether the day was clean or not
  mood?: 'good' | 'meh' | 'bad';
  // Add other fields as needed based on your API response
}

// Define the last relapse data interface
export interface LastRelapseData {
  id: string;
  last_relapse_date: string | null; // ISO format datetime string (YYYY-MM-DDTHH:MM:SS.sssZ)
}

interface LogsContextType {
  logs: LogEntry[];
  lastRelapseData: LastRelapseData | null;
  currentStreak: number;
  isLoading: boolean;
  error: string | null;
  fetchLogs: () => Promise<void>;
  fetchLastRelapse: () => Promise<void>;
  addLog: (log: Omit<LogEntry, 'id'>) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
  updateLastRelapseDate: (date: string) => Promise<void>;
  clearError: () => void;
  resetLogs: () => void;
}

const LogsContext = createContext<LogsContextType>({
  logs: [],
  lastRelapseData: null,
  currentStreak: 0,
  isLoading: false,
  error: null,
  fetchLogs: async () => {},
  fetchLastRelapse: async () => {},
  addLog: async () => {},
  deleteLog: async () => {},
  updateLastRelapseDate: async () => {},
  clearError: () => {},
  resetLogs: () => {},
});

export const LogsProvider = ({ children }: { children: ReactNode }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [lastRelapseData, setLastRelapseData] = useState<LastRelapseData | null>(null);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(BackendRoutes.LOGS);
      console.log('Raw API response:', response.data);
      
      // Extract logs array from the response
      let logsData = [];
      if (response.data && response.data.logs && Array.isArray(response.data.logs)) {
        logsData = response.data.logs;
      } else if (Array.isArray(response.data)) {
        logsData = response.data;
      } else {
        console.error('Unexpected logs data format:', response.data);
      }
      
      console.log('Extracted logs data:', logsData);
      setLogs(logsData);
      
      // Also fetch the last relapse data whenever we fetch logs
      await fetchLastRelapse();
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setError('Failed to fetch logs. Please try again later.');
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLastRelapse = async () => {
    try {
      const response = await apiClient.get(BackendRoutes.LAST_RELAPSE);
      console.log('Last relapse API response:', JSON.stringify(response.data, null, 2));
      
      // Handle different possible response formats
      if (response.data && response.data.upsert_data) {
        // Format: { upsert_data: { id: "...", last_relapse_date: "..." } }
        console.log('Setting lastRelapseData from upsert_data:', JSON.stringify(response.data.upsert_data, null, 2));
        setLastRelapseData(response.data.upsert_data);
        updateCurrentStreakFromDate(response.data.upsert_data.last_relapse_date);
      } else if (response.data && response.data.last_relapse_date) {
        // Format: { id: "...", last_relapse_date: "..." }
        console.log('Setting lastRelapseData directly from response:', JSON.stringify(response.data, null, 2));
        setLastRelapseData(response.data);
        updateCurrentStreakFromDate(response.data.last_relapse_date);
      } else if (typeof response.data === 'object' && response.data !== null) {
        // Try to find last_relapse_date in any object
        for (const key in response.data) {
          if (response.data[key] && response.data[key].last_relapse_date) {
            console.log(`Found last_relapse_date in response.data.${key}:`, JSON.stringify(response.data[key], null, 2));
            setLastRelapseData(response.data[key]);
            updateCurrentStreakFromDate(response.data[key].last_relapse_date);
            return;
          }
        }
        console.error('Could not find last_relapse_date in response:', JSON.stringify(response.data, null, 2));
      } else {
        console.error('Unexpected last relapse data format:', JSON.stringify(response.data, null, 2));
      }
    } catch (error) {
      console.error('Failed to fetch last relapse:', error);
      // We don't set the global error here to avoid overriding logs errors
    }
  };

  // Update current streak whenever lastRelapseData changes
  React.useEffect(() => {
    updateCurrentStreakFromDate(lastRelapseData?.last_relapse_date ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastRelapseData?.last_relapse_date]);

  // Helper to compute current streak (days since last relapse)
  const updateCurrentStreakFromDate = (dateStr: string | null) => {
    try {
      if (!dateStr) {
        setCurrentStreak(0);
        return;
      }
      const relapseDateTime = new Date(dateStr);
      if (isNaN(relapseDateTime.getTime())) {
        setCurrentStreak(0);
        return;
      }
      const now = new Date();
      const diffTimeMs = now.getTime() - relapseDateTime.getTime();
      if (diffTimeMs > 0) {
        const diffDays = Math.floor(diffTimeMs / (24 * 3600 * 1000));
        setCurrentStreak(diffDays);
      } else {
        setCurrentStreak(0);
      }
    } catch (e) {
      console.error('Error computing current streak:', e);
      setCurrentStreak(0);
    }
  };

  const addLog = async (log: Omit<LogEntry, 'id'>) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Sending log data to API:', log);
      
      // Send log entry directly to the API as provided
      // This allows for both logs with and without duration
      const response = await apiClient.post(BackendRoutes.LOGS, log);
      console.log('Add log response:', response.data);
      
      let newLog = null;
      if (response.data && response.data.log) {
        newLog = response.data.log;
      } else if (response.data) {
        newLog = response.data;
      }
      
      if (newLog) {
        setLogs(prevLogs => 
          Array.isArray(prevLogs) ? [...prevLogs, newLog] : [newLog]
        );
      }
      
      // Also refresh the last relapse data after adding a log
      await fetchLastRelapse();
    } catch (error) {
      console.error('Failed to add log:', error);
      setError('Failed to add log. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLog = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.delete(`${BackendRoutes.LOGS}${id}`);
      setLogs(prevLogs => 
        Array.isArray(prevLogs) 
          ? prevLogs.filter(log => log.id !== id) 
          : []
      );
      
      // Also refresh the last relapse data after deleting a log
      await fetchLastRelapse();
    } catch (error) {
      console.error('Failed to delete log:', error);
      setError('Failed to delete log. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateLastRelapseDate = async (date: string) => {
    // Implementation of updateLastRelapseDate function
  };

  const clearError = () => {
    setError(null);
  };

  const resetLogs = () => {
    setLogs([]);
    setLastRelapseData(null);
  };

  return (
    <LogsContext.Provider 
      value={{ 
        logs, 
        lastRelapseData,
        currentStreak,
        isLoading, 
        error, 
        fetchLogs,
        fetchLastRelapse,
        addLog, 
        deleteLog,
        updateLastRelapseDate,
        clearError,
        resetLogs
      }}
    >
      {children}
    </LogsContext.Provider>
  );
};

export const useLogs = () => useContext(LogsContext); 