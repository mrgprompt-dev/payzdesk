import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getAuthUser } from '@/lib/getAuthUser'
import { BankAccount } from '@/models/BankAccount'
import { User } from '@/models/User'

// ─── DELETE /api/banks/[id] ──────────────────────────────────────────────────
// Removes a bank account that belongs to the authenticated user.
// Only allows deletion of the user's own bank (userId match enforced in query).

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthUser(req)
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { id } = await params

    await connectDB()

    const bank = await BankAccount.findOneAndDelete({
      _id: id,
      userId: auth.userId,
    })

    if (!bank) {
      return NextResponse.json(
        { success: false, message: 'Bank account not found' },
        { status: 404 }
      )
    }

    // Update user bank counters
    const allBanks = await BankAccount.find({ userId: auth.userId })
    const activeBanks = allBanks.filter((b) => b.status === 'active').length
    await User.findByIdAndUpdate(auth.userId, {
      totalBanks: allBanks.length,
      activeBanks,
    })

    return NextResponse.json({
      success: true,
      message: 'Bank account removed successfully',
    })
  } catch (err) {
    console.error('[DELETE /api/banks/:id]', err)
    return NextResponse.json(
      { success: false, message: 'Failed to remove bank account' },
      { status: 500 }
    )
  }
}

// ─── PATCH /api/banks/[id] ───────────────────────────────────────────────────
// Reserved for admin/future use — not exposed in Phase 1 UI.

export async function PATCH() {
  return NextResponse.json(
    { success: false, message: 'Not implemented' },
    { status: 501 }
  )
}
