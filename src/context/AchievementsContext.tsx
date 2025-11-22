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

  // Central milestone definitions used to normalize server data
  const milestoneDefs: {
    code: string;
    title: string;
    description: string;
    threshold: number;
    xp: number;
  }[] = [
    // { code: 'WELCOME', title: 'Welcome to CraveOff', description: 'You took the first step towards a healthier life', threshold: 1000, xp: 100 },
    { code: 'STREAK_0', title: '0 Days Clean', description: 'First day of control — your journey has begun.', threshold: 0, xp: 80 },
    { code: 'STREAK_3', title: '3 Days Clean', description: 'You’re breaking the cycle. Keep your focus strong.', threshold: 3, xp: 120 },
    { code: 'STREAK_7', title: '7 Days Clean', description: 'A full week clean. You’re proving you can take charge.', threshold: 7, xp: 150 },
    { 
      code: 'STREAK_14', 
      title: '14 Days Clean', 
      description: 'Two weeks clean. Your discipline is growing — the new you is taking shape.', 
      threshold: 14, 
      xp: 200 
    },
    { code: 'STREAK_30', title: '30 Days Clean', description: 'One month free. Your mind is getting sharper and stronger.', threshold: 30, xp: 300 },
    { code: 'STREAK_60', title: '60 Days Clean', description: 'Sixty days of discipline. You’re building real power.', threshold: 60, xp: 600 },
    { code: 'STREAK_90', title: '90 Days Clean', description: 'Three months clean. This is where transformation begins.', threshold: 90, xp: 1000 },
    { code: 'STREAK_365', title: '365 Days Clean', description: 'One full year clean. Few end up here but its a sign of self-mastery.', threshold: 365, xp: 5000 },
  ];

  // Normalize and merge server payload with our known definitions
  const mergeWithDefinitions = (serverList: any[]): AchievementItem[] => {
    try {
      const byCode = new Map<string, any>();
      (Array.isArray(serverList) ? serverList : []).forEach((item: any) => {
        const code = item?.code || item?.id;
        if (code) byCode.set(code, item);
      });

      const merged = milestoneDefs.map(def => {
        const serverItem = byCode.get(def.code);
        const unlocked: boolean = typeof serverItem?.unlocked === 'boolean'
          ? !!serverItem.unlocked
          : def.threshold === 0; // default unlock for welcome

        const unlockedAt: string | undefined = serverItem?.unlockedAt || serverItem?.unlocked_at || undefined;

        return {
          code: def.code,
          threshold: def.threshold,
          title: serverItem?.title || def.title,
          description: serverItem?.description || def.description,
          unlocked,
          unlockedAt,
          xp: typeof serverItem?.xp === 'number' ? serverItem.xp : def.xp,
        } as AchievementItem;
      });

      console.log('[Achievements] mergeWithDefinitions input:', serverList);
      console.log('[Achievements] mergeWithDefinitions output:', merged);
      return merged;
    } catch (e) {
      console.warn('[Achievements] mergeWithDefinitions failed:', e);
      // Fallback to defs with only welcome unlocked
      return milestoneDefs.map(def => ({
        code: def.code,
        threshold: def.threshold,
        title: def.title,
        description: def.description,
        unlocked: def.threshold === 0,
        unlockedAt: undefined,
        xp: def.xp,
      }));
    }
  };

  const computeSummary = (items: AchievementItem[]): AchievementsSummary => {
    const total = Array.isArray(items) ? items.length : 0;
    const unlocked = Array.isArray(items) ? items.filter(i => !!i.unlocked).length : 0;
    return { total, unlocked, lastUpdatedAt: new Date().toISOString() };
  };

  const persist = async (items: AchievementItem[]) => {
    try {
      const summ = computeSummary(items);
      console.log('[Achievements] persist list:', items);
      console.log('[Achievements] persist summary:', summ);
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
      const [rawList] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_LIST),
        AsyncStorage.getItem(STORAGE_KEY_SUMMARY),
      ]);
      if (rawList) {
        const list: AchievementItem[] = JSON.parse(rawList);
        // Always normalize stored list to keep in sync with definitions
        const normalized = mergeWithDefinitions(list);
        console.log('[Achievements] loadFromStorage raw list:', list);
        console.log('[Achievements] loadFromStorage normalized:', normalized);
        setAchievements(normalized);
        const recomputed = computeSummary(normalized);
        console.log('[Achievements] loadFromStorage summary:', recomputed);
        setSummary(recomputed);
        return true;
      }
      return false;
    } catch (e) {
      console.warn('[Achievements] loadFromStorage failed:', e);
      return false;
    }
  };

  const setFromServer = async (items: AchievementItem[]) => {
    const normalized = mergeWithDefinitions(items as any);
    console.log('[Achievements] setFromServer normalized:', normalized);
    await persist(normalized);
  };

  const refreshFromApi = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(BackendRoutes.ACHIEVEMENTS);
      const list: any[] = response?.data?.achievements || [];
      console.log('[Achievements] refreshFromApi server list:', list);
      const normalized = mergeWithDefinitions(list);
      console.log('[Achievements] refreshFromApi normalized:', normalized);
      await persist(normalized);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch achievements');
      // Persist fallback from local definitions so UI has data even without network
      try {
        const fallback = mergeWithDefinitions([]);
        console.log('[Achievements] using fallback definitions due to API error');
        await persist(fallback);
      } catch {}
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

