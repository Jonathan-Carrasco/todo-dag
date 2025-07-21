/**
 * Data formatting utilities for date and time manipulation
 * Provides consistent date parsing, formatting, and validation functions
 */

/**
 * Removes time component from a date string, keeping only the date portion
 * @param dateString - Full date string with time component
 * @param isIsoString - Whether the input is in ISO format (default: true)
 * @returns Date string in YYYY-MM-DD format
 */
export function removeTime(dateString: string, isIsoString: boolean = true) {
  return dateString.split(isIsoString ? 'T' : ' ')[0];
}

/**
 * Checks if a given date is in the past (overdue)
 * @param date - Date string in YYYY-MM-DD format
 * @returns True if the date is before today, false otherwise
 */
export function isOverdue(date: string): boolean {
  return removeTime(date) < removeTime(new Date().toISOString());
}

/**
 * Parses a string to an integer with validation
 * Only allows positive integers (no decimals, no negative numbers)
 * @param value - String value to parse
 * @returns Parsed integer or NaN if invalid
 */
export function parseToInt(value: string) : number {
  // Only allow integers (no decimals)
  if (!/^\d+$/.test(value)) {
    return NaN;
  }

  return parseInt(value, 10);;
}

/**
 * Internal helper function to format a date for display
 * @param date - Date object to format
 * @returns Formatted string in "Start: YYYY-MM-DD HH" format
 */
export function formatTime(date: Date) : string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1);
  const day = String(date.getDate());
  let hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12; // Apply modulo 12
  hours = hours ? hours : 12; // Handle 0 (midnight) as 12
  return `${year}-${month}-${day} ${hours} ${ampm}`; 
}

/**
 * Adds a specified number of hours to the current time and formats it
 * Used for displaying earliest start times for todos based on dependencies
 * @param hoursToAdd - Number of hours to add to current time
 * @returns Formatted string in "Start: YYYY-MM-DD HH:hh" format
 */
export function getEarliestStart(hoursToAdd: number): string {
  // Add specified hours to current time, or use current time if hoursToAdd is 0
  const today = new Date();
  const dateTime = hoursToAdd ? 
    formatTime(new Date(today.getTime() + hoursToAdd * 3600000)) :
    formatTime(today);

  return `Earliest: ${dateTime}`;
}