import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'fallback-secret'
)

export interface User {
  id: string
  email: string
  role: string
  name: string | null
}

export async function getServerSession(): Promise<{ user: User } | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return null
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    return {
      user: {
        id: payload.id as string,
        email: payload.email as string,
        role: payload.role as string,
        name: payload.name as string | null,
      }
    }
  } catch (error) {
    return null
  }
}

export async function requireAuth(): Promise<User> {
  const session = await getServerSession()
  if (!session) {
    throw new Error('Authentication required')
  }
  return session.user
}