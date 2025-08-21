
export interface Dhikr {
  id: number;
  name: string;
  count: number; // Lifetime total
  dailyCount: number; // Resets every 24h
  target: number;
  color: string;
}

export enum BadgeTier {
  Beginner = 'المبتدئ',
  Consistent = 'المواظب',
  Master = 'سيد التسبيح',
  Enlightened = 'الذاكر المستنير',
}

export interface Badge {
  tier: BadgeTier;
  totalDhikrCount: number;
  unlocked: boolean;
  dateUnlocked?: string;
}

export interface HistoryLog {
    date: string;
    dhikrs: { name: string; count: number }[];
}
