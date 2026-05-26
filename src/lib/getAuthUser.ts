import { NextRequest } from 'next/server'
import { verifyAccessToken, ACCESS_COOKIE } from '@/lib/auth'
import type { AuthTokenPayload } from '@/types'

/**
 * Extract the authenticated user payload from an API request.
 * Returns null if the token is missing, invalid, or expired.
 * Use this in every protected API route handler.
 */
export function getAuthUser(req: NextRequest): AuthTokenPayload | null {
  try {
    const token = req.cookies.get(ACCESS_COOKIE)?.value
    if (!token) return null
    return verifyAccessToken(token)
  } catch {
    return null
  }
}
