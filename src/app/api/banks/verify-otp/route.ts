import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { getAuthUser } from '@/lib/getAuthUser'
import { consumeOTP } from '@/lib/redis'
import { BankAccount } from '@/models/BankAccount'
import { User } from '@/models/User'

// ─── POST /api/banks/verify-otp ──────────────────────────────────────────────
// Verifies the OTP sent to the user's registered phone during bank add flow.
// On success: marks the bank as active + verified, updates user counters.

const schema = z.object({
  bankId: z.string().min(1, 'bankId is required'),
  otp:    z.string().length(6, 'OTP must be 6 digits').regex(/^[0-9]{6}$/),
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
      const message = parsed.error.issues[0]?.message ?? 'Invalid input'
      return NextResponse.json({ success: false, message }, { status: 400 })
    }

    const { bankId, otp } = parsed.data

    await connectDB()

    // Find the bank — must belong to this user and be in pending state
    const bank = await BankAccount.findOne({
      _id: bankId,
      userId: auth.userId,
    })

    if (!bank) {
      return NextResponse.json(
        { success: false, message: 'Bank account not found' },
        { status: 404 }
      )
    }

    if (bank.status === 'active') {
      return NextResponse.json(
        { success: false, message: 'Bank account is already verified' },
        { status: 409 }
      )
    }

    // Verify and consume OTP against the user's registered phone
    const isValid = await consumeOTP(auth.phone, 'bank-verify', otp)
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired OTP. Please try again.' },
        { status: 400 }
      )
    }

    // Activate the bank
    bank.status = 'active'
    bank.verified = true
    await bank.save()

    // Recompute user bank counters
    const allBanks = await BankAccount.find({ userId: auth.userId })
    const activeBanks = allBanks.filter((b) => b.status === 'active').length
    await User.findByIdAndUpdate(auth.userId, {
      totalBanks: allBanks.length,
      activeBanks,
    })

    return NextResponse.json({
      success: true,
      message: 'Bank account verified successfully',
      data: { bankId: bank._id.toString() },
    })
  } catch (err) {
    console.error('[POST /api/banks/verify-otp]', err)
    return NextResponse.json(
      { success: false, message: 'Verification failed. Please try again.' },
      { status: 500 }
    )
  }
}
