import { NextRequest, NextResponse } from 'next/server'
import { verifyRefreshToken, signAccessToken, accessCookieOptions, ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'No refresh token' },
        { status: 401 }
      )
    }

    const payload = verifyRefreshToken(refreshToken)

    const newAccessToken = signAccessToken({
      userId: payload.userId,
      phone: payload.phone,
    })

    cookieStore.set(ACCESS_COOKIE, newAccessToken, accessCookieOptions)

    return NextResponse.json({ success: true, message: 'Token refreshed' })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid or expired refresh token' },
      { status: 401 }
    )
  }
}