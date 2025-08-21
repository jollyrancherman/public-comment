import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { randomInt } from 'crypto'

const sendOtpSchema = z.object({
  email: z.string().email(),
})

const OTP_EXPIRY_MINUTES = 10

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = sendOtpSchema.parse(body)

    // Generate 6-digit OTP
    const otp = String(randomInt(100000, 999999))
    const hashedOtp = await bcrypt.hash(otp, 10)
    
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES)
    
    // Delete any existing OTPs for this email
    await prisma.emailOTP.deleteMany({
      where: { email },
    })
    
    // Create new OTP
    await prisma.emailOTP.create({
      data: {
        email,
        codeHash: hashedOtp,
        expiresAt,
        attempts: 0,
      },
    })
    
    // In development, log OTP to console
    if (!process.env.EMAIL_SERVER_HOST || process.env.NODE_ENV === 'development') {
      console.log(`\n🔐 OTP CODE FOR ${email}: ${otp}`)
      console.log(`This code expires in ${OTP_EXPIRY_MINUTES} minutes.\n`)
    }
    
    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    )
  }
}