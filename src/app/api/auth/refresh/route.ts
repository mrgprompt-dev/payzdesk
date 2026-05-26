import { NextRequest, NextResponse } from 'next/server'
import { verifyRefreshToken, signAccessToken, accessCookieOptions, ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth'
import { cookies } from 'next/headers'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'

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

    await connectDB()
    const user = await User.findById(payload.userId).select('isActive phone')

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: 'Account is suspended or deleted' },
        { status: 403 }
      )
    }

    const newAccessToken = signAccessToken({
      userId: user._id.toString(),
      phone: user.phone,
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