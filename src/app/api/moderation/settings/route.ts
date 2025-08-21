import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { z } from 'zod'

const settingsSchema = z.object({
  autoModerate: z.boolean(),
  profanityFilter: z.boolean(),
  piiRedaction: z.boolean(),
  riskThreshold: z.number().min(0).max(1),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (![Role.MODERATOR, Role.ADMIN].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const settings = await prisma.systemConfig.findUnique({
      where: { key: 'moderation_settings' },
    })

    return NextResponse.json({
      settings: settings?.value || {
        autoModerate: true,
        profanityFilter: true,
        piiRedaction: true,
        riskThreshold: 0.7,
      },
    })
  } catch (error) {
    console.error('Error fetching moderation settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can change moderation settings
    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const body = await req.json()
    const validatedSettings = settingsSchema.parse(body)

    await prisma.systemConfig.upsert({
      where: { key: 'moderation_settings' },
      update: { value: validatedSettings },
      create: {
        key: 'moderation_settings',
        value: validatedSettings,
      },
    })

    return NextResponse.json({ 
      message: 'Settings saved successfully',
      settings: validatedSettings,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error saving moderation settings:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}