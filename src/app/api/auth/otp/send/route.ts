import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { storeOTP, checkOTPRateLimit } from '@/lib/redis'
import { sendOTP } from '@/lib/otp'
import { User } from '@/models/User'
import { sanitizePhone } from '@/utils'
import { z } from 'zod'

const schema = z.object({
  phone: z.string().min(10).max(10).regex(/^[0-9]{10}$/),
  purpose: z.enum(['register', 'login', 'forgot-password', 'bank-verify']),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid phone number or purpose' },
        { status: 400 }
      )
    }

    const { phone: rawPhone, purpose } = parsed.data
    const phone = sanitizePhone(rawPhone)

    await connectDB()

    // For register: phone must NOT already exist
    if (purpose === 'register') {
      const existing = await User.findOne({ phone })
      if (existing) {
        return NextResponse.json(
          { success: false, message: 'Phone number already registered' },
          { status: 409 }
        )
      }
    }

    // For login / forgot-password: phone MUST exist for OTP to be useful,
    // but we return a generic success message to prevent enumeration.
    if (purpose === 'login' || purpose === 'forgot-password') {
      const existing = await User.findOne({ phone })
      if (!existing) {
        // Return a fake success response that mimics the real one
        return NextResponse.json({
          success: true,
          message: `If the number is registered, an OTP has been sent.`,
        })
      }
    }

    // Rate limit: 1 OTP per minute per phone+purpose
    const allowed = await checkOTPRateLimit(phone, purpose)
    if (!allowed) {
      return NextResponse.json(
        { success: false, message: 'Please wait 60 seconds before resending OTP' },
        { status: 429 }
      )
    }

    const otp = await sendOTP(phone)
    await storeOTP(phone, purpose, otp)

    return NextResponse.json({
      success: true,
      message: purpose === 'register' ? `OTP sent to +91 ${phone}` : `If the number is registered, an OTP has been sent.`,
    })
  } catch (err) {
    console.error('[OTP Send]', err)
    return NextResponse.json(
      { success: false, message: 'Failed to send OTP. Please try again.' },
      { status: 500 }
    )
  }
}