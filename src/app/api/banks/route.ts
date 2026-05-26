import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { getAuthUser } from '@/lib/getAuthUser'
import { sendOTP } from '@/lib/otp'
import { storeOTP, checkOTPRateLimit } from '@/lib/redis'
import { BankAccount } from '@/models/BankAccount'
import { User } from '@/models/User'

// ─── GET /api/banks ─────────────────────────────────────────────────────────
// Returns the authenticated user's bank accounts, newest first.

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req)
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    await connectDB()

    const banks = await BankAccount.find({ userId: auth.userId })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({ success: true, message: 'OK', data: banks })
  } catch (err) {
    console.error('[GET /api/banks]', err)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch banks' },
      { status: 500 }
    )
  }
}

// ─── POST /api/banks ─────────────────────────────────────────────────────────
// Adds a new bank account (status: pending) and sends an OTP to the user's
// registered phone to trigger verification.

const addBankSchema = z.object({
  accountNumber:     z.string().min(1, 'Account number is required'),
  upiId:             z.string().default(''),
  accountHolderName: z.string().min(1, 'Account holder name is required'),
  ifscCode:          z
    .string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code (e.g. SBIN0001234)'),
  bankName:          z.string().min(1, 'Bank name is required'),
  branch:            z.string().default(''),
  address:           z.string().default(''),
  phone:             z
    .string()
    .regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
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
    const parsed = addBankSchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid input'
      return NextResponse.json({ success: false, message }, { status: 400 })
    }

    await connectDB()

    // Get user's registered phone to send OTP to
    const user = await User.findById(auth.userId).select('phone').lean()
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Rate-limit OTP sends (60s cooldown)
    const registeredPhone = (user as { phone: string }).phone
    const allowed = await checkOTPRateLimit(registeredPhone, 'bank-verify')
    if (!allowed) {
      return NextResponse.json(
        { success: false, message: 'Please wait 60 seconds before resending OTP' },
        { status: 429 }
      )
    }

    // Create the bank record in pending state
    const bank = await BankAccount.create({
      userId:            auth.userId,
      ...parsed.data,
      status:            'pending',
      verified:          false,
    })

    // Send OTP to the user's own registered phone
    const otp = await sendOTP(registeredPhone)
    await storeOTP(registeredPhone, 'bank-verify', otp)

    const maskedPhone = `+91 XXXXXX${registeredPhone.slice(-4)}`

    return NextResponse.json(
      {
        success: true,
        message: `OTP sent to ${maskedPhone}`,
        data: { bankId: bank._id.toString() },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[POST /api/banks]', err)
    return NextResponse.json(
      { success: false, message: 'Failed to add bank account' },
      { status: 500 }
    )
  }
}
