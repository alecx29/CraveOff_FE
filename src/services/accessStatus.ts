import AsyncStorage from '@react-native-async-storage/async-storage';

import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';

export type AccessStatusResponse = {
  is_premium?: boolean;
  isPremium?: boolean;
  premium?: boolean;
  [k: string]: any;
};

export type AccessStatus = {
  isPremium: boolean;
  fetchedAtMs: number;
  raw?: AccessStatusResponse;
};

const ACCESS_CACHE_KEY = 'accessStatus.cache.v1';
const DEFAULT_MAX_AGE_MS = 30_000;

const normalizeIsPremium = (data: any): boolean => {
  const d = (data ?? {}) as AccessStatusResponse;
  if (typeof d.is_premium === 'boolean') return d.is_premium;
  if (typeof d.isPremium === 'boolean') return d.isPremium;
  if (typeof d.premium === 'boolean') return d.premium;
  return false;
};

export async function clearCachedAccessStatus() {
  try {
    await AsyncStorage.removeItem(ACCESS_CACHE_KEY);
  } catch {
    // non-blocking
  }
}

export async function getCachedAccessStatus(params?: { maxAgeMs?: number }): Promise<AccessStatus | null> {
  const maxAgeMs = params?.maxAgeMs ?? DEFAULT_MAX_AGE_MS;
  try {
    const raw = await AsyncStorage.getItem(ACCESS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AccessStatus;
    if (!parsed || typeof parsed.fetchedAtMs !== 'number' || typeof parsed.isPremium !== 'boolean') return null;
    if (Date.now() - parsed.fetchedAtMs > maxAgeMs) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function fetchAccessStatusFromBackend(): Promise<AccessStatus> {
  const res = await apiClient.get(BackendRoutes.ACCESS_STATUS);
  const data = (res?.data ?? {}) as AccessStatusResponse;
  const status: AccessStatus = {
    isPremium: normalizeIsPremium(data),
    fetchedAtMs: Date.now(),
    raw: data,
  };
  try {
    await AsyncStorage.setItem(ACCESS_CACHE_KEY, JSON.stringify(status));
  } catch {
    // non-blocking
  }
  return status;
}

export async function getAccessStatus(params?: { useCache?: boolean; maxAgeMs?: number }): Promise<AccessStatus> {
  const useCache = params?.useCache !== false;
  if (useCache) {
    const cached = await getCachedAccessStatus({ maxAgeMs: params?.maxAgeMs });
    if (cached) return cached;
  }
  return await fetchAccessStatusFromBackend();
}

export async function waitForPremiumAccess(params?: { delaysMs?: number[] }): Promise<AccessStatus> {
  const delaysMs = params?.delaysMs ?? [0, 1000, 2000, 4000];

  let last: AccessStatus | null = null;
  for (let i = 0; i < delaysMs.length; i += 1) {
    const delay = delaysMs[i] ?? 0;
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));
    last = await fetchAccessStatusFromBackend();
    if (last.isPremium) return last;
  }

  // If still not premium after retries, return the last known status (or a safe fallback).
  return (
    last ?? {
      isPremium: false,
      fetchedAtMs: Date.now(),
    }
  );
}

