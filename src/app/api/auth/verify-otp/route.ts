import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
})

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'fallback-secret'
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code } = verifyOtpSchema.parse(body)

    // Find valid OTP
    const otpRecords = await prisma.emailOTP.findMany({
      where: {
        email,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1,
    })

    if (otpRecords.length === 0) {
      return NextResponse.json(
        { error: 'No valid OTP found. Please request a new code.' },
        { status: 400 }
      )
    }

    const otp = otpRecords[0]

    if (otp.attempts >= 3) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please request a new code.' },
        { status: 400 }
      )
    }

    const isValid = await bcrypt.compare(code, otp.codeHash)

    if (!isValid) {
      await prisma.emailOTP.update({
        where: { id: otp.id },
        data: { attempts: otp.attempts + 1 },
      })
      return NextResponse.json(
        { error: 'Invalid code. Please try again.' },
        { status: 400 }
      )
    }

    // Delete all OTPs for this email after successful verification
    await prisma.emailOTP.deleteMany({
      where: { email },
    })

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          role: 'RESIDENT',
        },
      })
    }

    // Create JWT token
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET)

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    return response

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      )
    }

    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    )
  }
}