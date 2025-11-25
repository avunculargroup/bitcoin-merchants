// TypeScript types for opening hours data structures

export type DayOfWeek = 'Mo' | 'Tu' | 'We' | 'Th' | 'Fr' | 'Sa' | 'Su';

export interface TimeRange {
  open: string; // HH:MM format
  close: string; // HH:MM format
  open24?: boolean; // true if open 24 hours
}

export interface DaySchedule {
  enabled: boolean;
  closed: boolean;
  timeRanges: TimeRange[];
}

export interface WeekSchedule {
  Mo: DaySchedule;
  Tu: DaySchedule;
  We: DaySchedule;
  Th: DaySchedule;
  Fr: DaySchedule;
  Sa: DaySchedule;
  Su: DaySchedule;
}

export interface SpecialRule {
  type: 'holiday' | 'date' | 'dateRange' | 'week';
  modifier?: 'open' | 'closed' | 'unknown';
  date?: string; // YYYY-MM-DD or MM-DD
  dateFrom?: string;
  dateTo?: string;
  weekdays?: DayOfWeek[];
  timeRanges?: TimeRange[];
  comment?: string;
}

export interface OpeningHoursState {
  weekSchedule: WeekSchedule;
  specialRules: SpecialRule[];
  comment?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ParsedRule {
  weekdays?: DayOfWeek[];
  dateRange?: {
    from: string;
    to: string;
  };
  timeRanges: TimeRange[];
  modifier?: 'open' | 'closed' | 'unknown';
  comment?: string;
}

