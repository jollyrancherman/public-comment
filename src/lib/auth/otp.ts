import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function verifyOTP(email: string, code: string): Promise<{ success: boolean; message: string }> {
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
    return { success: false, message: 'No valid OTP found. Please request a new code.' }
  }

  const otp = otpRecords[0]

  if (otp.attempts >= 3) {
    return { success: false, message: 'Too many failed attempts. Please request a new code.' }
  }

  const isValid = await bcrypt.compare(code, otp.codeHash)

  if (!isValid) {
    await prisma.emailOTP.update({
      where: { id: otp.id },
      data: { attempts: otp.attempts + 1 },
    })
    return { success: false, message: 'Invalid code. Please try again.' }
  }

  // Delete all OTPs for this email after successful verification
  await prisma.emailOTP.deleteMany({
    where: { email },
  })

  return { success: true, message: 'Code verified successfully.' }
}

export async function cleanupExpiredOTPs() {
  await prisma.emailOTP.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  })
}