import jwt from 'jsonwebtoken'
import { AuthTokenPayload } from '@/types'

const ACCESS_SECRET = process.env.JWT_SECRET as string
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('JWT secrets are not defined in environment variables')
}

// ─── Sign ─────────────────────────────────────────────────────────────────────

export function signAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' })
}

export function signRefreshToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '30d' })
}

// ─── Verify ───────────────────────────────────────────────────────────────────

export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as AuthTokenPayload
}

export function verifyRefreshToken(token: string): AuthTokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as AuthTokenPayload
}

// ─── Cookie config ────────────────────────────────────────────────────────────

export const ACCESS_COOKIE = 'accessToken'
export const REFRESH_COOKIE = 'refreshToken'

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

export const accessCookieOptions = {
  ...cookieOptions,
  maxAge: 15 * 60, // 15 minutes in seconds
}

export const refreshCookieOptions = {
  ...cookieOptions,
  maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
}