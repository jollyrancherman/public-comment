/**
 * Datetime utilities with proper timezone handling
 */

/**
 * Get current datetime string formatted for HTML datetime-local input
 * Handles timezone conversion properly
 */
export function getCurrentDateTimeForInput(): string {
  const now = new Date()
  // Format for datetime-local input (YYYY-MM-DDTHH:mm)
  return formatDateForInput(now)
}

/**
 * Format a Date object for HTML datetime-local input
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Convert datetime-local input value to ISO string
 */
export function inputDateToISO(inputValue: string): string {
  if (!inputValue) return ''
  // datetime-local input gives us local time, convert to ISO
  const date = new Date(inputValue)
  return date.toISOString()
}

/**
 * Convert ISO string to datetime-local input value
 */
export function isoToInputDate(isoString: string): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  return formatDateForInput(date)
}

/**
 * Add hours to a datetime input value
 */
export function addHoursToInputDate(inputValue: string, hours: number): string {
  if (!inputValue) return ''
  
  const date = new Date(inputValue)
  date.setHours(date.getHours() + hours)
  return formatDateForInput(date)
}

/**
 * Validate that end time is after start time
 */
export function validateTimeRange(startTime: string, endTime: string): boolean {
  if (!startTime || !endTime) return false
  
  const start = new Date(startTime)
  const end = new Date(endTime)
  
  return end > start
}

/**
 * Format date for display with timezone awareness
 */
export function formatDateForDisplay(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }
  
  return dateObj.toLocaleDateString(undefined, { ...defaultOptions, ...options })
}

/**
 * Get timezone offset string for display
 */
export function getTimezoneOffset(): string {
  const offset = new Date().getTimezoneOffset()
  const hours = Math.floor(Math.abs(offset) / 60)
  const minutes = Math.abs(offset) % 60
  const sign = offset <= 0 ? '+' : '-'
  
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

/**
 * Check if a date/time is in the past
 */
export function isInPast(datetime: string | Date): boolean {
  const dateObj = typeof datetime === 'string' ? new Date(datetime) : datetime
  return dateObj < new Date()
}

/**
 * Check if a date/time is within the next N hours
 */
export function isWithinHours(datetime: string | Date, hours: number): boolean {
  const dateObj = typeof datetime === 'string' ? new Date(datetime) : datetime
  const cutoff = new Date(Date.now() + hours * 60 * 60 * 1000)
  return dateObj <= cutoff && dateObj >= new Date()
}