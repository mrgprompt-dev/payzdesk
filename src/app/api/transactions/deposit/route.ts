import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { getAuthUser } from '@/lib/getAuthUser'
import { Transaction } from '@/models/Transaction'
import { BankAccount } from '@/models/BankAccount'
import { User } from '@/models/User'

// ─── POST /api/transactions/deposit ──────────────────────────────────────────
// Initiate a deposit request.
// Validates: bank belongs to user + is active.
// Creates a pending transaction and increments user's blockedDeposit.

const schema = z.object({
  bankId: z.string().min(1, 'Bank is required'),
  amount: z.number({ message: 'Amount must be a number' }).positive('Amount must be greater than 0'),
  utrNumber: z.string().optional(),
  notes:     z.string().optional(),
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

    const { bankId, amount, utrNumber, notes } = parsed.data

    await connectDB()

    // Verify bank ownership + active status
    const bank = await BankAccount.findOne({ _id: bankId, userId: auth.userId }).lean()
    if (!bank) {
      return NextResponse.json(
        { success: false, message: 'Bank account not found' },
        { status: 404 }
      )
    }
    if ((bank as { status: string }).status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Only active bank accounts can be used for deposits' },
        { status: 400 }
      )
    }

    // Create the deposit transaction
    const txn = await Transaction.create({
      userId:    auth.userId,
      type:      'deposit',
      amount,
      bankId,
      utrNumber: utrNumber ?? null,
      notes:     notes ?? null,
      status:    'pending',
    })

    try {
      // Block the deposit amount on the user's balance until it's processed
      const updatedUser = await User.findByIdAndUpdate(
        auth.userId,
        { $inc: { blockedDeposit: amount } },
        { new: true }
      )
      
      if (!updatedUser) {
        throw new Error('User not found during balance update')
      }
    } catch (err) {
      // Rollback transaction if we couldn't update the user
      await Transaction.findByIdAndDelete(txn._id)
      throw err
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Deposit request submitted',
        data:    { transactionId: txn._id.toString() },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[POST /api/transactions/deposit]', err)
    return NextResponse.json(
      { success: false, message: 'Failed to initiate deposit. Please try again.' },
      { status: 500 }
    )
  }
}
