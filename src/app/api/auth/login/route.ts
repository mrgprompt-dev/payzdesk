import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { signAccessToken, signRefreshToken, accessCookieOptions, refreshCookieOptions, ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth'
import { User } from '@/models/User'
import { sanitizePhone } from '@/utils'
import { z } from 'zod'
import { cookies } from 'next/headers'

const schema = z.object({
  phone: z.string().min(10).max(10).regex(/^[0-9]{10}$/),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid phone number or password' },
        { status: 400 }
      )
    }

    const { phone: rawPhone, password } = parsed.data
    const phone = sanitizePhone(rawPhone)

    await connectDB()

    const user = await User.findOne({ phone })

    // Use same generic message for both "not found" and "wrong password"
    // to avoid user enumeration
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid phone number or password' },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: 'Your account has been suspended. Please contact support.' },
        { status: 403 }
      )
    }

    const passwordValid = await user.comparePassword(password)
    if (!passwordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid phone number or password' },
        { status: 401 }
      )
    }

    const payload = { userId: user._id.toString(), phone }
    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)

    const cookieStore = await cookies()
    cookieStore.set(ACCESS_COOKIE, accessToken, accessCookieOptions)
    cookieStore.set(REFRESH_COOKIE, refreshToken, refreshCookieOptions)

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: { user },
    })
  } catch (err) {
    console.error('[Login]', err)
    return NextResponse.json(
      { success: false, message: 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}