import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';

export interface AchievementItem {
  code: string;
  threshold?: number;
  title: string;
  description?: string;
  unlocked: boolean;
  unlockedAt?: string;
  xp?: number;
}

export interface AchievementsSummary {
  total: number;
  unlocked: number;
  lastUpdatedAt?: string;
}

interface AchievementsContextType {
  achievements: AchievementItem[];
  summary: AchievementsSummary | null;
  loading: boolean;
  error: string | null;
  refreshFromApi: () => Promise<void>;
  setFromServer: (items: AchievementItem[]) => Promise<void>;
}

const AchievementsContext = createContext<AchievementsContextType>({
  achievements: [],
  summary: null,
  loading: false,
  error: null,
  refreshFromApi: async () => {},
  setFromServer: async () => {},
});

const STORAGE_KEY_LIST = 'achievements:list';
const STORAGE_KEY_SUMMARY = 'achievements:summary';

export const AchievementsProvider = ({ children }: { children: ReactNode }) => {
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [summary, setSummary] = useState<AchievementsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const computeSummary = (items: AchievementItem[]): AchievementsSummary => {
    const total = Array.isArray(items) ? items.length : 0;
    const unlocked = Array.isArray(items) ? items.filter(i => !!i.unlocked).length : 0;
    return { total, unlocked, lastUpdatedAt: new Date().toISOString() };
  };

  const persist = async (items: AchievementItem[]) => {
    try {
      const summ = computeSummary(items);
      await AsyncStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(items));
      await AsyncStorage.setItem(STORAGE_KEY_SUMMARY, JSON.stringify(summ));
      setAchievements(items);
      setSummary(summ);
    } catch (e) {
      console.warn('[Achievements] persist failed:', e);
      setAchievements(items);
      setSummary(computeSummary(items));
    }
  };

  const loadFromStorage = async (): Promise<boolean> => {
    try {
      const [rawList, rawSummary] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_LIST),
        AsyncStorage.getItem(STORAGE_KEY_SUMMARY),
      ]);
      if (rawList) {
        const list: AchievementItem[] = JSON.parse(rawList);
        setAchievements(list);
        if (rawSummary) {
          setSummary(JSON.parse(rawSummary));
        } else {
          setSummary(computeSummary(list));
        }
        return true;
      }
      return false;
    } catch (e) {
      console.warn('[Achievements] loadFromStorage failed:', e);
      return false;
    }
  };

  const setFromServer = async (items: AchievementItem[]) => {
    await persist(items);
  };

  const refreshFromApi = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(BackendRoutes.ACHIEVEMENTS);
      const list: AchievementItem[] = response?.data?.achievements || [];
      await persist(list);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch achievements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      const found = await loadFromStorage();
      if (!found) {
        await refreshFromApi();
      }
    };
    bootstrap();
  }, []);

  return (
    <AchievementsContext.Provider value={{ achievements, summary, loading, error, refreshFromApi, setFromServer }}>
      {children}
    </AchievementsContext.Provider>
  );
};

export const useAchievements = () => useContext(AchievementsContext);

