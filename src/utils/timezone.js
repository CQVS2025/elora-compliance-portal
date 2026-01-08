import moment from 'moment-timezone';

/**
 * Timezone Utility Functions
 * Handles timezone conversions and display across the application
 */

// Get user's timezone from browser or use default
export function getUserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch (error) {
    console.error('Error detecting timezone:', error);
    return 'UTC';
  }
}

// Store user's timezone preference in localStorage
export function setUserTimezone(timezone) {
  try {
    localStorage.setItem('userTimezone', timezone);
  } catch (error) {
    console.error('Error saving timezone:', error);
  }
}

// Get stored timezone preference or detect automatically
export function getStoredTimezone() {
  try {
    const stored = localStorage.getItem('userTimezone');
    return stored || getUserTimezone();
  } catch (error) {
    return getUserTimezone();
  }
}

// Convert UTC date to user's timezone
export function toUserTimezone(utcDate, timezone = null) {
  if (!utcDate) return null;
  const tz = timezone || getStoredTimezone();
  return moment.utc(utcDate).tz(tz);
}

// Convert user timezone date to UTC
export function toUTC(localDate, timezone = null) {
  if (!localDate) return null;
  const tz = timezone || getStoredTimezone();
  return moment.tz(localDate, tz).utc();
}

// Format date in user's timezone
export function formatInUserTimezone(utcDate, format = 'MMM D, YYYY h:mm A', timezone = null) {
  const converted = toUserTimezone(utcDate, timezone);
  return converted ? converted.format(format) : '';
}

// Get relative time (e.g., "2 hours ago") in user's timezone
export function fromNow(utcDate, timezone = null) {
  const converted = toUserTimezone(utcDate, timezone);
  return converted ? converted.fromNow() : '';
}

// Get list of common timezones
export function getCommonTimezones() {
  return [
    { value: 'Pacific/Auckland', label: 'New Zealand (Auckland)' },
    { value: 'Australia/Sydney', label: 'Australia (Sydney)' },
    { value: 'Australia/Melbourne', label: 'Australia (Melbourne)' },
    { value: 'Australia/Brisbane', label: 'Australia (Brisbane)' },
    { value: 'Australia/Perth', label: 'Australia (Perth)' },
    { value: 'Asia/Tokyo', label: 'Japan (Tokyo)' },
    { value: 'Asia/Shanghai', label: 'China (Shanghai)' },
    { value: 'Asia/Singapore', label: 'Singapore' },
    { value: 'Asia/Dubai', label: 'UAE (Dubai)' },
    { value: 'Europe/London', label: 'UK (London)' },
    { value: 'Europe/Paris', label: 'France (Paris)' },
    { value: 'Europe/Berlin', label: 'Germany (Berlin)' },
    { value: 'America/New_York', label: 'US (Eastern)' },
    { value: 'America/Chicago', label: 'US (Central)' },
    { value: 'America/Denver', label: 'US (Mountain)' },
    { value: 'America/Los_Angeles', label: 'US (Pacific)' },
    { value: 'UTC', label: 'UTC (Universal Time)' },
  ];
}

// Get timezone abbreviation (e.g., "AEST", "PST")
export function getTimezoneAbbr(timezone = null) {
  const tz = timezone || getStoredTimezone();
  return moment.tz(tz).format('z');
}

// Get timezone offset (e.g., "+10:00", "-05:00")
export function getTimezoneOffset(timezone = null) {
  const tz = timezone || getStoredTimezone();
  return moment.tz(tz).format('Z');
}

// Check if date is today in user's timezone
export function isToday(utcDate, timezone = null) {
  const converted = toUserTimezone(utcDate, timezone);
  return converted ? converted.isSame(moment(), 'day') : false;
}

// Check if date is this week in user's timezone
export function isThisWeek(utcDate, timezone = null) {
  const converted = toUserTimezone(utcDate, timezone);
  return converted ? converted.isSame(moment(), 'week') : false;
}

// Get start of day in user's timezone, converted to UTC
export function getStartOfDayUTC(date = new Date(), timezone = null) {
  const tz = timezone || getStoredTimezone();
  return moment.tz(date, tz).startOf('day').utc().toISOString();
}

// Get end of day in user's timezone, converted to UTC
export function getEndOfDayUTC(date = new Date(), timezone = null) {
  const tz = timezone || getStoredTimezone();
  return moment.tz(date, tz).endOf('day').utc().toISOString();
}
