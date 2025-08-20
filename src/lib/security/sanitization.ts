/**
 * Security utilities for input sanitization and XSS prevention
 */

/**
 * Sanitize HTML content by escaping dangerous characters
 * This prevents XSS attacks by converting HTML entities
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return ''
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Sanitize text input by removing potential script tags and dangerous content
 * More aggressive than HTML escaping - removes script content entirely
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') return ''
  
  return input
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove other potentially dangerous tags
    .replace(/<(iframe|object|embed|link|meta|style)[^>]*>/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove data: protocol for safety
    .replace(/data:/gi, '')
    // Remove on* event handlers
    .replace(/\s*on\w+\s*=\s*[^>]*/gi, '')
    .trim()
}

/**
 * Validate and sanitize numeric input with bounds
 */
export function sanitizeNumeric(
  input: string | number | null | undefined,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  defaultValue = 0
): number {
  if (input === null || input === undefined || input === '') {
    return defaultValue
  }
  
  const num = typeof input === 'string' ? parseInt(input, 10) : input
  
  if (isNaN(num)) {
    return defaultValue
  }
  
  return Math.max(min, Math.min(max, num))
}

/**
 * Rate limiting helper to prevent abuse
 * This is a simple in-memory solution - in production, use Redis or similar
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests = 10,
  windowMs = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)
  
  if (!record || now > record.resetTime) {
    const resetTime = now + windowMs
    rateLimitStore.set(identifier, { count: 1, resetTime })
    return { allowed: true, remaining: maxRequests - 1, resetTime }
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }
  
  record.count++
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime }
}