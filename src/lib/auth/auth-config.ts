import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import EmailProvider from 'next-auth/providers/email'
import { createTransport } from 'nodemailer'
import { randomInt } from 'crypto'
import bcrypt from 'bcryptjs'

const OTP_EXPIRY_MINUTES = 10
const MAX_OTP_ATTEMPTS = 3

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier: email, url, token }) {
        const otp = String(randomInt(100000, 999999))
        const hashedOtp = await bcrypt.hash(otp, 10)
        
        const expiresAt = new Date()
        expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES)
        
        await prisma.emailOTP.create({
          data: {
            email,
            codeHash: hashedOtp,
            expiresAt,
            attempts: 0,
          },
        })
        
        const transport = createTransport({
          host: process.env.EMAIL_SERVER_HOST,
          port: Number(process.env.EMAIL_SERVER_PORT),
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          },
        })
        
        await transport.sendMail({
          to: email,
          from: process.env.EMAIL_FROM!,
          subject: 'Your Public Comment Login Code',
          text: `Your verification code is: ${otp}\n\nThis code will expire in ${OTP_EXPIRY_MINUTES} minutes.`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Your Public Comment Login Code</h2>
              <p>Your verification code is:</p>
              <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                ${otp}
              </div>
              <p>This code will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                If you didn't request this code, please ignore this email.
              </p>
            </div>
          `,
        })
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
    verifyRequest: '/auth/verify',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        })
        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
          token.name = dbUser.name
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.name = token.name as string
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
}