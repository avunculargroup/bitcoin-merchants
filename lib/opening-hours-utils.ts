// Utility functions for parsing, generating, and validating OSM opening_hours strings

import {
  DayOfWeek,
  TimeRange,
  DaySchedule,
  WeekSchedule,
  OpeningHoursState,
  ValidationResult,
  SpecialRule,
  ParsedRule,
} from '@/types/opening-hours';
import opening_hours from 'opening_hours';

export const DAYS_OF_WEEK: DayOfWeek[] = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/**
 * Create a default empty week schedule
 */
export function createEmptyWeekSchedule(): WeekSchedule {
  return {
    Mo: { enabled: false, closed: false, timeRanges: [] },
    Tu: { enabled: false, closed: false, timeRanges: [] },
    We: { enabled: false, closed: false, timeRanges: [] },
    Th: { enabled: false, closed: false, timeRanges: [] },
    Fr: { enabled: false, closed: false, timeRanges: [] },
    Sa: { enabled: false, closed: false, timeRanges: [] },
    Su: { enabled: false, closed: false, timeRanges: [] },
  };
}

/**
 * Create a default opening hours state
 */
export function createDefaultOpeningHoursState(): OpeningHoursState {
  return {
    weekSchedule: createEmptyWeekSchedule(),
    specialRules: [],
  };
}

/**
 * Format time in HH:MM format
 */
export function formatTime(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Parse time string (HH:MM or HHMM) to hours and minutes
 */
export function parseTime(timeStr: string): { hours: number; minutes: number } | null {
  const cleaned = timeStr.replace(/[:\s]/g, '');
  if (cleaned.length === 3) {
    // HMM format
    const hours = parseInt(cleaned[0], 10);
    const minutes = parseInt(cleaned.slice(1), 10);
    if (hours >= 0 && hours <= 9 && minutes >= 0 && minutes < 60) {
      return { hours, minutes };
    }
  } else if (cleaned.length === 4) {
    // HHMM format
    const hours = parseInt(cleaned.slice(0, 2), 10);
    const minutes = parseInt(cleaned.slice(2), 10);
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return { hours, minutes };
    }
  }
  return null;
}

/**
 * Format time range for OSM opening_hours
 */
export function formatTimeRange(range: TimeRange): string {
  if (range.open24) {
    return '24/7';
  }
  return `${range.open}-${range.close}`;
}

/**
 * Parse time range from OSM format (e.g., "09:00-17:00" or "24/7")
 */
export function parseTimeRange(rangeStr: string): TimeRange | null {
  const trimmed = rangeStr.trim();
  
  if (trimmed === '24/7' || trimmed === '24:00') {
    return { open: '00:00', close: '24:00', open24: true };
  }
  
  const match = trimmed.match(/^(\d{1,2}):?(\d{2})\s*-\s*(\d{1,2}):?(\d{2})$/);
  if (match) {
    const openHours = parseInt(match[1], 10);
    const openMinutes = parseInt(match[2], 10);
    const closeHours = parseInt(match[3], 10);
    const closeMinutes = parseInt(match[4], 10);
    
    if (
      openHours >= 0 && openHours < 24 && openMinutes >= 0 && openMinutes < 60 &&
      closeHours >= 0 && closeHours <= 24 && closeMinutes >= 0 && closeMinutes < 60
    ) {
      return {
        open: formatTime(openHours, openMinutes),
        close: formatTime(closeHours, closeMinutes),
      };
    }
  }
  
  return null;
}

/**
 * Parse weekday selector (e.g., "Mo-Fr", "Mo,We,Fr", "Sa,Su")
 */
export function parseWeekdays(weekdayStr: string): DayOfWeek[] {
  const days: DayOfWeek[] = [];
  const parts = weekdayStr.split(',').map(s => s.trim());
  
  for (const part of parts) {
    if (part.includes('-')) {
      // Range like "Mo-Fr"
      const [start, end] = part.split('-').map(s => s.trim());
      const startIdx = DAYS_OF_WEEK.indexOf(start as DayOfWeek);
      const endIdx = DAYS_OF_WEEK.indexOf(end as DayOfWeek);
      
      if (startIdx !== -1 && endIdx !== -1) {
        for (let i = startIdx; i <= endIdx; i++) {
          days.push(DAYS_OF_WEEK[i]);
        }
      }
    } else {
      // Single day
      if (DAYS_OF_WEEK.includes(part as DayOfWeek)) {
        days.push(part as DayOfWeek);
      }
    }
  }
  
  return [...new Set(days)]; // Remove duplicates
}

/**
 * Format weekdays for OSM (e.g., "Mo-Fr" or "Mo,We,Fr")
 */
export function formatWeekdays(days: DayOfWeek[]): string {
  if (days.length === 0) return '';
  if (days.length === 1) return days[0];
  
  // Try to create ranges
  const sorted = [...days].sort((a, b) => 
    DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b)
  );
  
  const ranges: string[] = [];
  let rangeStart = sorted[0];
  let rangeEnd = sorted[0];
  
  for (let i = 1; i < sorted.length; i++) {
    const currentIdx = DAYS_OF_WEEK.indexOf(sorted[i]);
    const prevIdx = DAYS_OF_WEEK.indexOf(sorted[i - 1]);
    
    if (currentIdx === prevIdx + 1) {
      // Continue range
      rangeEnd = sorted[i];
    } else {
      // End current range, start new one
      if (rangeStart === rangeEnd) {
        ranges.push(rangeStart);
      } else {
        ranges.push(`${rangeStart}-${rangeEnd}`);
      }
      rangeStart = sorted[i];
      rangeEnd = sorted[i];
    }
  }
  
  // Add final range
  if (rangeStart === rangeEnd) {
    ranges.push(rangeStart);
  } else {
    ranges.push(`${rangeStart}-${rangeEnd}`);
  }
  
  return ranges.join(',');
}

/**
 * Parse OSM opening_hours string into OpeningHoursState
 * This is a simplified parser that handles common cases
 */
export function parseOpeningHours(osmString: string): OpeningHoursState {
  if (!osmString || osmString.trim() === '') {
    return createDefaultOpeningHoursState();
  }
  
  const state = createDefaultOpeningHoursState();
  const rules = osmString.split(/[;]/).map(r => r.trim()).filter(r => r);
  
  for (const rule of rules) {
    // Handle comments
    const commentMatch = rule.match(/"([^"]+)"/);
    if (commentMatch) {
      state.comment = commentMatch[1];
    }
    
    // Handle modifiers (open, closed, unknown)
    let modifier: 'open' | 'closed' | 'unknown' | undefined;
    let ruleWithoutModifier = rule;
    if (rule.includes(' open ')) {
      modifier = 'open';
      ruleWithoutModifier = rule.replace(/\s+open\s+/, ' ');
    } else if (rule.includes(' closed ')) {
      modifier = 'closed';
      ruleWithoutModifier = rule.replace(/\s+closed\s+/, ' ');
    } else if (rule.includes(' unknown ')) {
      modifier = 'unknown';
      ruleWithoutModifier = rule.replace(/\s+unknown\s+/, ' ');
    }
    
    // Remove comments from rule
    ruleWithoutModifier = ruleWithoutModifier.replace(/"([^"]+)"/, '').trim();
    
    // Handle "PH" (public holidays)
    if (ruleWithoutModifier.includes('PH')) {
      const specialRule: SpecialRule = {
        type: 'holiday',
        modifier: modifier || 'closed',
      };
      state.specialRules.push(specialRule);
      continue;
    }
    
    // Parse weekday and time parts
    const parts = ruleWithoutModifier.split(/\s+/);
    let weekdayPart = '';
    let timePart = '';
    
    for (const part of parts) {
      if (part.match(/^(Mo|Tu|We|Th|Fr|Sa|Su)/)) {
        weekdayPart = part;
      } else if (part.match(/\d{1,2}:?\d{2}/) || part === '24/7' || part.includes('-')) {
        timePart = part;
      }
    }
    
    if (weekdayPart) {
      const days = parseWeekdays(weekdayPart);
      const timeRanges: TimeRange[] = [];
      
      if (timePart) {
        if (timePart === '24/7') {
          timeRanges.push({ open: '00:00', close: '24:00', open24: true });
        } else {
          // Handle multiple time ranges (e.g., "09:00-12:00,13:00-17:00")
          const ranges = timePart.split(',').map(r => r.trim());
          for (const range of ranges) {
            const parsed = parseTimeRange(range);
            if (parsed) {
              timeRanges.push(parsed);
            }
          }
        }
      }
      
      // Apply to week schedule
      for (const day of days) {
        if (modifier === 'closed') {
          state.weekSchedule[day] = { enabled: true, closed: true, timeRanges: [] };
        } else if (timeRanges.length > 0) {
          state.weekSchedule[day] = { enabled: true, closed: false, timeRanges };
        } else {
          state.weekSchedule[day] = { enabled: true, closed: false, timeRanges: [] };
        }
      }
    }
  }
  
  return state;
}

/**
 * Generate OSM opening_hours string from OpeningHoursState
 */
export function generateOpeningHours(state: OpeningHoursState): string {
  const rules: string[] = [];
  
  // Group days with same schedule
  const scheduleGroups: Map<string, { days: DayOfWeek[]; schedule: DaySchedule }> = new Map();
  
  for (const day of DAYS_OF_WEEK) {
    const schedule = state.weekSchedule[day];
    if (!schedule.enabled) continue;
    
    const key = schedule.closed 
      ? 'closed' 
      : schedule.timeRanges.map(r => formatTimeRange(r)).join(',');
    
    if (!scheduleGroups.has(key)) {
      scheduleGroups.set(key, { days: [], schedule });
    }
    scheduleGroups.get(key)!.days.push(day);
  }
  
  // Generate rules for each group
  for (const [key, group] of scheduleGroups.entries()) {
    const weekdays = formatWeekdays(group.days);
    if (!weekdays) continue;
    
    let rule = weekdays;
    
    if (group.schedule.closed) {
      rule += ' closed';
    } else if (group.schedule.timeRanges.length > 0) {
      const timeStr = group.schedule.timeRanges.map(r => formatTimeRange(r)).join(',');
      rule += ` ${timeStr}`;
    }
    
    rules.push(rule);
  }
  
  // Add special rules
  for (const specialRule of state.specialRules) {
    let rule = '';
    
    if (specialRule.type === 'holiday') {
      rule = 'PH';
    } else if (specialRule.type === 'date' && specialRule.date) {
      rule = specialRule.date;
    } else if (specialRule.type === 'dateRange' && specialRule.dateFrom && specialRule.dateTo) {
      rule = `${specialRule.dateFrom}-${specialRule.dateTo}`;
    }
    
    if (specialRule.weekdays && specialRule.weekdays.length > 0) {
      rule = `${formatWeekdays(specialRule.weekdays)} ${rule}`;
    }
    
    if (specialRule.modifier) {
      rule += ` ${specialRule.modifier}`;
    } else if (specialRule.timeRanges && specialRule.timeRanges.length > 0) {
      rule += ` ${specialRule.timeRanges.map(r => formatTimeRange(r)).join(',')}`;
    }
    
    if (specialRule.comment) {
      rule += ` "${specialRule.comment}"`;
    }
    
    if (rule) {
      rules.push(rule);
    }
  }
  
  // Add global comment if present
  if (state.comment && rules.length > 0) {
    rules[0] += ` "${state.comment}"`;
  }
  
  return rules.join('; ');
}

/**
 * Validate OSM opening_hours string using opening_hours.js library
 * This provides comprehensive validation according to the OSM specification
 */
export function validateOpeningHours(osmString: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };
  
  if (!osmString || osmString.trim() === '') {
    return result; // Empty is valid (optional field)
  }
  
  try {
    // opening_hours.js constructor validates the string
    // If it throws an error, the string is invalid
    const oh = new opening_hours(osmString);
    
    // Get warnings from the parser (if any)
    const warnings = oh.getWarnings();
    if (warnings && warnings.length > 0) {
      result.warnings = warnings;
    }
    
    result.valid = true;
  } catch (error: any) {
    // opening_hours.js throws an error if the string is invalid
    result.valid = false;
    const errorMessage = error?.message || 'Invalid opening hours format';
    
    // Try to extract meaningful error messages
    if (errorMessage.includes('syntax') || errorMessage.includes('Syntax')) {
      result.errors.push('Syntax error in opening hours format');
    } else if (errorMessage.includes('time') || errorMessage.includes('Time')) {
      result.errors.push('Invalid time format');
    } else if (errorMessage.includes('day') || errorMessage.includes('Day')) {
      result.errors.push('Invalid day specification');
    } else {
      // Use the error message directly, but clean it up if it's too technical
      const cleanedMessage = errorMessage.replace(/^Error:?\s*/i, '');
      result.errors.push(cleanedMessage || 'Invalid opening hours format');
    }
  }
  
  return result;
}

/**
 * Get day name from DayOfWeek
 */
export function getDayName(day: DayOfWeek): string {
  const idx = DAYS_OF_WEEK.indexOf(day);
  return DAY_NAMES[idx] || day;
}

/**
 * Apply preset to week schedule
 */
export function applyPreset(
  preset: 'mon-fri-9-5' | 'mon-sat-9-5' | '24-7' | 'closed' | 'weekends-only',
  schedule: WeekSchedule
): WeekSchedule {
  const newSchedule = { ...schedule };
  
  switch (preset) {
    case 'mon-fri-9-5':
      for (const day of ['Mo', 'Tu', 'We', 'Th', 'Fr'] as DayOfWeek[]) {
        newSchedule[day] = {
          enabled: true,
          closed: false,
          timeRanges: [{ open: '09:00', close: '17:00' }],
        };
      }
      newSchedule.Sa = { enabled: false, closed: false, timeRanges: [] };
      newSchedule.Su = { enabled: false, closed: false, timeRanges: [] };
      break;
      
    case 'mon-sat-9-5':
      for (const day of ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as DayOfWeek[]) {
        newSchedule[day] = {
          enabled: true,
          closed: false,
          timeRanges: [{ open: '09:00', close: '17:00' }],
        };
      }
      newSchedule.Su = { enabled: false, closed: false, timeRanges: [] };
      break;
      
    case '24-7':
      for (const day of DAYS_OF_WEEK) {
        newSchedule[day] = {
          enabled: true,
          closed: false,
          timeRanges: [{ open: '00:00', close: '24:00', open24: true }],
        };
      }
      break;
      
    case 'closed':
      for (const day of DAYS_OF_WEEK) {
        newSchedule[day] = { enabled: true, closed: true, timeRanges: [] };
      }
      break;
      
    case 'weekends-only':
      newSchedule.Mo = { enabled: false, closed: false, timeRanges: [] };
      newSchedule.Tu = { enabled: false, closed: false, timeRanges: [] };
      newSchedule.We = { enabled: false, closed: false, timeRanges: [] };
      newSchedule.Th = { enabled: false, closed: false, timeRanges: [] };
      newSchedule.Fr = { enabled: false, closed: false, timeRanges: [] };
      newSchedule.Sa = {
        enabled: true,
        closed: false,
        timeRanges: [{ open: '09:00', close: '17:00' }],
      };
      newSchedule.Su = {
        enabled: true,
        closed: false,
        timeRanges: [{ open: '09:00', close: '17:00' }],
      };
      break;
  }
  
  return newSchedule;
}

