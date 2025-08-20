import { NextResponse } from 'next/server'
import { verifyOTP } from '@/lib/auth/otp'
import { z } from 'zod'

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, code } = verifySchema.parse(body)
    
    const result = await verifyOTP(email, code)
    
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid input' },
        { status: 400 }
      )
    }
    
    console.error('OTP verification error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}