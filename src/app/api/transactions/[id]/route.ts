import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getAuthUser } from '@/lib/getAuthUser'
import { Transaction } from '@/models/Transaction'

// ─── GET /api/transactions/[id] ───────────────────────────────────────────────
// Fetch a single transaction by ID.
// Ownership enforced: userId must match the authenticated user.

export async function GET(
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

    const txn = await Transaction.findOne({
      _id:    id,
      userId: auth.userId,
    })
      .populate('bankId', 'bankName accountNumber ifscCode branch')
      .lean()

    if (!txn) {
      return NextResponse.json(
        { success: false, message: 'Transaction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, message: 'OK', data: txn })
  } catch (err) {
    console.error('[GET /api/transactions/:id]', err)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch transaction' },
      { status: 500 }
    )
  }
}
