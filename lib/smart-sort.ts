import { getDay } from 'date-fns';

export type SortOption = 'new' | 'top_rated' | 'most_tried' | 'saved' | 'smart';

export function isWeekend(date = new Date()): boolean {
  const day = getDay(date); // 0 = Sunday, 6 = Saturday
  return day === 0 || day === 6;
}

export function getSmartSortLabel(date = new Date()): string {
  const day = getDay(date);
  if (day === 0) return 'Sunday Dinner Ideas';
  if (day === 6) return 'Weekend Cooking';
  return 'For Tonight';
}

export interface SmartSortFilters {
  difficulty?: ('easy' | 'medium' | 'hard')[];
  maxTotalMinutes?: number;
  minRating?: number;
}

export function getSmartFilters(date = new Date()): SmartSortFilters {
  if (isWeekend(date)) {
    return {
      difficulty: ['medium', 'hard'],
      minRating: 7.0,
    };
  }
  return {
    difficulty: ['easy'],
    maxTotalMinutes: 45,
  };
}

export const CUISINES = [
  'All',
  'Italian',
  'Japanese',
  'Mexican',
  'Indian',
  'French',
  'American',
  'Chinese',
  'Thai',
  'Mediterranean',
  'Middle Eastern',
  'Korean',
  'Spanish',
  'Greek',
  'Vietnamese',
] as const;

export type Cuisine = (typeof CUISINES)[number];
