import OpenAI from 'openai'
import { CommentVisibility } from '@prisma/client'

// Initialize OpenAI client if API key is available
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

export interface ModerationResult {
  processed: boolean
  publicBody: string
  piiDetected: boolean
  profanityDetected: boolean
  riskFlags: {
    harassment: boolean
    threat: boolean
    hate: boolean
    selfHarm: boolean
    sexual: boolean
    violence: boolean
    score: number
  }
  suggestedVisibility: CommentVisibility
  moderationNotes: string[]
}

// PII patterns for detection
const PII_PATTERNS = {
  phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b|\b\d{9}\b/g,
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  address: /\d+\s+[A-Za-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir|Plaza|Pl)\b/gi,
  driversLicense: /\b[A-Z]\d{7,8}\b/g,
}

// Basic profanity list (expandable)
const PROFANITY_LIST = [
  // Add actual profanity terms here
  'profanity1', 'profanity2', // Placeholder - replace with actual list
]

export async function moderateComment(text: string): Promise<ModerationResult> {
  const result: ModerationResult = {
    processed: false,
    publicBody: text,
    piiDetected: false,
    profanityDetected: false,
    riskFlags: {
      harassment: false,
      threat: false,
      hate: false,
      selfHarm: false,
      sexual: false,
      violence: false,
      score: 0,
    },
    suggestedVisibility: CommentVisibility.VISIBLE,
    moderationNotes: [],
  }

  try {
    // Step 1: PII Detection and Redaction
    const piiResult = detectAndRedactPII(text)
    result.publicBody = piiResult.redactedText
    result.piiDetected = piiResult.detected
    if (piiResult.detected) {
      result.moderationNotes.push(`PII detected and redacted: ${piiResult.types.join(', ')}`)
    }

    // Step 2: Profanity Detection
    const profanityResult = detectProfanity(result.publicBody)
    result.profanityDetected = profanityResult.detected
    if (profanityResult.detected) {
      result.publicBody = profanityResult.cleanedText
      result.moderationNotes.push('Profanity detected and filtered')
    }

    // Step 3: AI-based content moderation (if OpenAI is configured)
    if (openai) {
      const aiModeration = await performAIModeration(result.publicBody)
      result.riskFlags = aiModeration.riskFlags
      
      if (aiModeration.flagged) {
        result.moderationNotes.push(`AI flagged content: ${aiModeration.categories.join(', ')}`)
        
        // Determine visibility based on risk score
        if (aiModeration.riskFlags.score > 0.7) {
          result.suggestedVisibility = CommentVisibility.HIDDEN
          result.moderationNotes.push('Auto-hidden due to high risk score')
        } else if (aiModeration.riskFlags.score > 0.4) {
          result.suggestedVisibility = CommentVisibility.PENDING_VISIBLE
          result.moderationNotes.push('Flagged for manual review')
        }
      }
    }

    result.processed = true
  } catch (error) {
    console.error('Error in comment moderation:', error)
    result.moderationNotes.push('Error during moderation processing')
  }

  return result
}

function detectAndRedactPII(text: string): { 
  redactedText: string
  detected: boolean
  types: string[]
} {
  let redactedText = text
  const detectedTypes: string[] = []
  let detected = false

  // Check and redact each PII type
  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    const matches = text.match(pattern)
    if (matches && matches.length > 0) {
      detected = true
      detectedTypes.push(type)
      redactedText = redactedText.replace(pattern, '[REDACTED]')
    }
  }

  return { redactedText, detected, types: detectedTypes }
}

function detectProfanity(text: string): {
  detected: boolean
  cleanedText: string
} {
  let cleanedText = text
  let detected = false

  // Basic profanity detection (can be enhanced with more sophisticated methods)
  const lowerText = text.toLowerCase()
  
  for (const word of PROFANITY_LIST) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    if (regex.test(lowerText)) {
      detected = true
      cleanedText = cleanedText.replace(regex, '[REMOVED]')
    }
  }

  return { detected, cleanedText }
}

async function performAIModeration(text: string): Promise<{
  flagged: boolean
  categories: string[]
  riskFlags: ModerationResult['riskFlags']
}> {
  if (!openai) {
    return {
      flagged: false,
      categories: [],
      riskFlags: {
        harassment: false,
        threat: false,
        hate: false,
        selfHarm: false,
        sexual: false,
        violence: false,
        score: 0,
      },
    }
  }

  try {
    // Use OpenAI's moderation API
    const moderation = await openai.moderations.create({
      input: text,
    })

    const result = moderation.results[0]
    const categories: string[] = []
    let maxScore = 0

    // Map OpenAI categories to our risk flags
    const riskFlags: ModerationResult['riskFlags'] = {
      harassment: result.categories['harassment'] || result.categories['harassment/threatening'] || false,
      threat: result.categories['harassment/threatening'] || result.categories['violence/graphic'] || false,
      hate: result.categories['hate'] || result.categories['hate/threatening'] || false,
      selfHarm: result.categories['self-harm'] || result.categories['self-harm/intent'] || result.categories['self-harm/instructions'] || false,
      sexual: result.categories['sexual'] || result.categories['sexual/minors'] || false,
      violence: result.categories['violence'] || result.categories['violence/graphic'] || false,
      score: 0,
    }

    // Collect flagged categories and calculate max score
    for (const [category, flagged] of Object.entries(result.categories)) {
      if (flagged) {
        categories.push(category)
      }
    }

    // Calculate overall risk score from category scores
    for (const [category, score] of Object.entries(result.category_scores)) {
      if (score > maxScore) {
        maxScore = score
      }
    }

    riskFlags.score = maxScore

    return {
      flagged: result.flagged,
      categories,
      riskFlags,
    }
  } catch (error) {
    console.error('OpenAI moderation error:', error)
    return {
      flagged: false,
      categories: [],
      riskFlags: {
        harassment: false,
        threat: false,
        hate: false,
        selfHarm: false,
        sexual: false,
        violence: false,
        score: 0,
      },
    }
  }
}

// Batch moderation for efficiency
export async function moderateCommentBatch(texts: string[]): Promise<ModerationResult[]> {
  return Promise.all(texts.map(text => moderateComment(text)))
}

// Check if a comment should be auto-hidden based on risk
export function shouldAutoHide(riskFlags: ModerationResult['riskFlags']): boolean {
  return riskFlags.score > 0.7 || 
         riskFlags.threat || 
         riskFlags.violence ||
         riskFlags.selfHarm
}

// Get moderation summary for display
export function getModerationSummary(result: ModerationResult): string {
  const issues: string[] = []
  
  if (result.piiDetected) issues.push('PII')
  if (result.profanityDetected) issues.push('Profanity')
  if (result.riskFlags.harassment) issues.push('Harassment')
  if (result.riskFlags.threat) issues.push('Threats')
  if (result.riskFlags.hate) issues.push('Hate speech')
  if (result.riskFlags.selfHarm) issues.push('Self-harm')
  if (result.riskFlags.sexual) issues.push('Sexual content')
  if (result.riskFlags.violence) issues.push('Violence')
  
  return issues.length > 0 ? `Issues detected: ${issues.join(', ')}` : 'No issues detected'
}