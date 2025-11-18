import { ImageSourcePropType } from 'react-native';

// Static mapping required by Metro bundler for asset inclusion
const achievementImageMap: Record<string, ImageSourcePropType> = {
  WELCOME: require('@/assets/images/output1.webp'),
  // Provided assets
  STREAK_1: require('@/assets/images/output1.webp'),
  STREAK_3: require('@/assets/images/output3.webp'),
  STREAK_7: require('@/assets/images/output7.webp'),
  STREAK_14: require('@/assets/images/output14.webp'),
  STREAK_60: require('@/assets/images/output60.webp'),
  STREAK_90: require('@/assets/images/output90.webp'),
  STREAK_365: require('@/assets/images/output365.webp'),
};

/**
 * Returns the image associated with a given achievement code.
 * If an exact image is not available, falls back to the nearest lower known STREAK_N.
 * Ultimately falls back to output1.webp until specific artwork is added.
 */
export function getAchievementImage(code: string): ImageSourcePropType {
  const exact = achievementImageMap[code];
  if (exact) return exact;

  const match = /^STREAK_(\d+)$/.exec(code || '');
  if (match) {
    const requestedDays = Number(match[1]);
    const availableDays = Object.keys(achievementImageMap)
      .map(k => {
        const m = /^STREAK_(\d+)$/.exec(k);
        return m ? Number(m[1]) : null;
      })
      .filter((n): n is number => typeof n === 'number')
      .sort((a, b) => a - b);

    for (let i = availableDays.length - 1; i >= 0; i--) {
      const day = availableDays[i];
      if (day <= requestedDays) {
        const fallbackCode = `STREAK_${day}`;
        const img = achievementImageMap[fallbackCode];
        if (img) return img;
      }
    }
  }

  return require('@/assets/images/output1.webp');
}

export const KNOWN_ACHIEVEMENT_IMAGE_CODES = Object.keys(achievementImageMap);


