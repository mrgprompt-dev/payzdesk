import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { getAuthUser } from '@/lib/getAuthUser'
import { Transaction } from '@/models/Transaction'
import { BankAccount } from '@/models/BankAccount'
import { User } from '@/models/User'

// ─── POST /api/transactions/withdraw ─────────────────────────────────────────
// Initiate a withdrawal request.
//
// Business rules:
//   1. User must have withdrawalEnabled = true
//   2. Amount must not exceed user's maxWithdrawalPerTxn (default ₹40,000)
//   3. Amount must not exceed user's netBalance
//   4. Bank must belong to user and be active

const schema = z.object({
  bankId: z.string().min(1, 'Bank is required'),
  amount: z.number({ message: 'Amount must be a number' }).positive('Amount must be greater than 0'),
  notes:  z.string().optional(),
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

    const { bankId, amount, notes } = parsed.data

    await connectDB()

    // Fetch user to check permissions and balance
    const user = await User.findById(auth.userId)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Rule 1: withdrawal must be enabled
    if (!user.withdrawalEnabled) {
      return NextResponse.json(
        {
          success: false,
          message: 'Withdrawals are disabled. Enable them in Settings to proceed.',
        },
        { status: 403 }
      )
    }

    // Rule 2: per-transaction limit
    if (amount > user.maxWithdrawalPerTxn) {
      return NextResponse.json(
        {
          success: false,
          message: `Amount exceeds max withdrawal limit of ₹${user.maxWithdrawalPerTxn.toLocaleString('en-IN')} per transaction`,
        },
        { status: 400 }
      )
    }

    // Check bank first
    const bank = await BankAccount.findOne({ _id: bankId, userId: auth.userId, status: 'active' }).lean()
    if (!bank) {
      return NextResponse.json(
        { success: false, message: 'Bank account not found or not active' },
        { status: 400 }
      )
    }

    // Atomic deduction
    const updatedUser = await User.findOneAndUpdate(
      { 
        _id: auth.userId, 
        netBalance: { $gte: amount },
        withdrawalEnabled: true 
      },
      {
        $inc: {
          netBalance: -amount,
          withdrawalHoldAmount: amount,
        },
      },
      { new: true }
    )

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'Insufficient balance or withdrawals disabled concurrently' },
        { status: 400 }
      )
    }

    // Create withdrawal
    let txn
    try {
      txn = await Transaction.create({
        userId: auth.userId,
        type:   'withdrawal',
        amount,
        bankId,
        notes:  notes ?? null,
        status: 'pending',
      })
    } catch (createErr) {
      // Rollback
      await User.findByIdAndUpdate(auth.userId, {
        $inc: {
          netBalance: amount,
          withdrawalHoldAmount: -amount,
        },
      })
      throw createErr
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Withdrawal request submitted',
        data:    { transactionId: txn._id.toString() },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[POST /api/transactions/withdraw]', err)
    return NextResponse.json(
      { success: false, message: 'Failed to initiate withdrawal. Please try again.' },
      { status: 500 }
    )
  }
}
