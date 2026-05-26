import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { verifyOTP } from '@/lib/redis'
import { User } from '@/models/User'
import { sanitizePhone } from '@/utils'
import { z } from 'zod'

const schema = z.object({
  phone: z.string().min(10).max(10).regex(/^[0-9]{10}$/, 'Enter a valid 10-digit phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  otp: z.string().length(6).regex(/^[0-9]{6}$/),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Invalid input'
      return NextResponse.json({ success: false, message }, { status: 400 })
    }

    const { phone: rawPhone, password, otp } = parsed.data
    const phone = sanitizePhone(rawPhone)

    // Verify OTP
    const otpValid = await verifyOTP(phone, 'forgot-password', otp)
    if (!otpValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired OTP. Please try again.' },
        { status: 400 }
      )
    }

    await connectDB()

    const user = await User.findOne({ phone })
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Account not found' },
        { status: 404 }
      )
    }

    // Update password (pre-save hook hashes it automatically)
    user.passwordHash = password
    await user.save()

    return NextResponse.json(
      {
        success: true,
        message: 'Password reset successfully',
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('[Forgot Password]', err)
    return NextResponse.json(
      { success: false, message: 'Password reset failed. Please try again.' },
      { status: 500 }
    )
  }
}
