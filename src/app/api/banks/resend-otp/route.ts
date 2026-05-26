import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { getAuthUser } from '@/lib/getAuthUser'
import { sendOTP } from '@/lib/otp'
import { storeOTP, checkOTPRateLimit } from '@/lib/redis'
import { BankAccount } from '@/models/BankAccount'
import { User } from '@/models/User'

// ─── POST /api/banks/resend-otp ───────────────────────────────────────────────
// Resends the bank-verify OTP to the user's registered phone.
// Rate-limited to one send per 60 seconds.

const schema = z.object({
  bankId: z.string().min(1, 'bankId is required'),
})

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUser(req)
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'bankId is required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Ensure the bank belongs to this user
    const bank = await BankAccount.findOne({
      _id:    parsed.data.bankId,
      userId: auth.userId,
    })
    if (!bank) {
      return NextResponse.json(
        { success: false, message: 'Bank account not found' },
        { status: 404 }
      )
    }

    // Get user's registered phone
    const user = await User.findById(auth.userId).select('phone').lean()
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const registeredPhone = (user as { phone: string }).phone

    // Enforce 60s rate limit
    const allowed = await checkOTPRateLimit(registeredPhone, 'bank-verify')
    if (!allowed) {
      return NextResponse.json(
        { success: false, message: 'Please wait 60 seconds before resending OTP' },
        { status: 429 }
      )
    }

    const otp = await sendOTP(registeredPhone)
    await storeOTP(registeredPhone, 'bank-verify', otp)

    const maskedPhone = `+91 XXXXXX${registeredPhone.slice(-4)}`

    return NextResponse.json({
      success: true,
      message: `OTP resent to ${maskedPhone}`,
    })
  } catch (err) {
    console.error('[POST /api/banks/resend-otp]', err)
    return NextResponse.json(
      { success: false, message: 'Failed to resend OTP. Please try again.' },
      { status: 500 }
    )
  }
}
