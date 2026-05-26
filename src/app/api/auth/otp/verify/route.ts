import { NextRequest, NextResponse } from 'next/server'
import { peekOTP } from '@/lib/redis'
import { sanitizePhone } from '@/utils'
import { z } from 'zod'

const schema = z.object({
  phone: z.string().min(10).max(10).regex(/^[0-9]{10}$/),
  otp: z.string().length(6).regex(/^[0-9]{6}$/),
  purpose: z.enum(['register', 'login', 'forgot-password', 'bank-verify']),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid request data' },
        { status: 400 }
      )
    }

    const { phone: rawPhone, otp, purpose } = parsed.data
    const phone = sanitizePhone(rawPhone)

    const valid = await peekOTP(phone, purpose, otp)

    if (!valid) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired OTP' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
    })
  } catch (err) {
    console.error('[OTP Verify]', err)
    return NextResponse.json(
      { success: false, message: 'OTP verification failed' },
      { status: 500 }
    )
  }
}