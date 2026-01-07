import type { AchievementItem } from '@/src/context/AchievementsContext';

export function getDaysFromAchievementCode(code?: string | null): number | null {
  if (!code) return null;
  const m = /^STREAK_(\d+)$/.exec(String(code));
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

export function getAchievementThresholdDays(a: Pick<AchievementItem, 'code' | 'threshold'>): number | null {
  if (typeof a.threshold === 'number' && Number.isFinite(a.threshold)) return a.threshold;
  return getDaysFromAchievementCode(a.code);
}

export function getCurrentAchievementCode(cleanDays: number, achievements: Pick<AchievementItem, 'code' | 'threshold'>[]): string {
  const safeDays = Number.isFinite(Number(cleanDays)) ? Math.max(0, Math.floor(Number(cleanDays))) : 0;
  const thresholds = (Array.isArray(achievements) ? achievements : [])
    .map((a) => {
      const t = getAchievementThresholdDays(a);
      return t === null ? null : { code: a.code, threshold: t };
    })
    .filter((x): x is { code: string; threshold: number } => !!x && typeof x.code === 'string')
    .sort((a, b) => a.threshold - b.threshold);

  // Fallback if list missing
  if (thresholds.length === 0) return 'STREAK_0';

  // Pick the highest threshold <= cleanDays
  let winner = thresholds[0].code;
  for (const t of thresholds) {
    if (t.threshold <= safeDays) winner = t.code;
    else break;
  }
  return winner || 'STREAK_0';
}

export function computeUnlockedFromStreak(a: Pick<AchievementItem, 'code' | 'threshold'>, cleanDays: number): boolean {
  const safeDays = Number.isFinite(Number(cleanDays)) ? Math.max(0, Math.floor(Number(cleanDays))) : 0;
  const threshold = getAchievementThresholdDays(a);
  if (threshold === null) return false;
  if (threshold <= 0) return true;
  return threshold <= safeDays;
}


