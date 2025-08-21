
import { Dhikr, Badge, BadgeTier } from './types';

// The colors will be assigned dynamically on first load
export const INITIAL_DHIKRS: Omit<Dhikr, 'color' | 'id'>[] = [
  { name: 'سبحان الله', count: 0, dailyCount: 0, target: 100 },
  { name: 'الحمد لله', count: 0, dailyCount: 0, target: 100 },
  { name: 'الله أكبر', count: 0, dailyCount: 0, target: 100 },
  { name: 'لا إله إلا الله', count: 0, dailyCount: 0, target: 100 },
];

export const BADGE_DEFINITIONS: Badge[] = [
  { tier: BadgeTier.Beginner, totalDhikrCount: 100, unlocked: false },
  { tier: BadgeTier.Consistent, totalDhikrCount: 1000, unlocked: false },
  { tier: BadgeTier.Master, totalDhikrCount: 10000, unlocked: false },
  { tier: BadgeTier.Enlightened, totalDhikrCount: 100000, unlocked: false },
];
