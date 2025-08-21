import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'fallback-secret'
)

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ session: null })
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    return NextResponse.json({
      session: {
        user: {
          id: payload.id as string,
          email: payload.email as string,
          role: payload.role as string,
          name: payload.name as string | null,
        }
      }
    })
  } catch (error) {
    return NextResponse.json({ session: null })
  }
}