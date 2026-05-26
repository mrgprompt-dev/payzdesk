import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { verifyOTP } from '@/lib/redis'
import { signAccessToken, signRefreshToken, accessCookieOptions, refreshCookieOptions, ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth'
import { User } from '@/models/User'
import { sanitizePhone } from '@/utils'
import { z } from 'zod'
import { cookies } from 'next/headers'

const schema = z.object({
  phone: z.string().min(10).max(10).regex(/^[0-9]{10}$/, 'Enter a valid 10-digit phone number'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  otp: z.string().length(6).regex(/^[0-9]{6}$/),
  referralCode: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Invalid input'
      return NextResponse.json({ success: false, message }, { status: 400 })
    }

    const { phone: rawPhone, name, password, otp, referralCode } = parsed.data
    const phone = sanitizePhone(rawPhone)

    // Verify OTP before creating account
    const otpValid = await verifyOTP(phone, 'register', otp)
    if (!otpValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired OTP. Please request a new one.' },
        { status: 400 }
      )
    }

    await connectDB()

    // Double-check phone uniqueness
    const existing = await User.findOne({ phone })
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Phone number already registered' },
        { status: 409 }
      )
    }

    // Validate referral code if provided
    let referredBy: string | undefined
    if (referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() })
      if (referrer) {
        referredBy = referrer._id.toString()
      }
      // Silently ignore invalid referral codes — don't block registration
    }

    // Create user (passwordHash pre-save hook hashes it)
    const user = await User.create({
      phone,
      name,
      passwordHash: password,
      isVerified: true, // OTP already verified
      referredBy,
    })

    // Issue tokens
    const payload = { userId: user._id.toString(), phone }
    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)

    const cookieStore = await cookies()
    cookieStore.set(ACCESS_COOKIE, accessToken, accessCookieOptions)
    cookieStore.set(REFRESH_COOKIE, refreshToken, refreshCookieOptions)

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        data: { user },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[Register]', err)
    return NextResponse.json(
      { success: false, message: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}