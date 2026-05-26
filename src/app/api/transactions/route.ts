import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getAuthUser } from '@/lib/getAuthUser'
import { Transaction } from '@/models/Transaction'

// ─── GET /api/transactions ────────────────────────────────────────────────────
// List the authenticated user's transactions with optional filters.
//
// Query params:
//   type      – 'deposit' | 'withdrawal'
//   status    – 'pending' | 'completed' | 'failed' | 'disputed'
//   search    – partial match on utrNumber or referenceId
//   dateFrom  – ISO date string (inclusive)
//   dateTo    – ISO date string (inclusive, end of day)

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req)
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const type     = searchParams.get('type')
    const status   = searchParams.get('status')
    const search   = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo   = searchParams.get('dateTo')

    await connectDB()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { userId: auth.userId }

    if (type && ['deposit', 'withdrawal'].includes(type)) {
      filter.type = type
    }

    if (status && ['pending', 'processing', 'completed', 'failed', 'disputed', 'cancelled'].includes(status)) {
      filter.status = status
    }

    if (search) {
      filter.$or = [
        { utrNumber:   { $regex: search.trim(), $options: 'i' } },
        { referenceId: { $regex: search.trim(), $options: 'i' } },
      ]
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {}
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom)
      if (dateTo) {
        const end = new Date(dateTo)
        end.setHours(23, 59, 59, 999)
        filter.createdAt.$lte = end
      }
    }

    const transactions = await Transaction.find(filter)
      .populate('bankId', 'bankName accountNumber ifscCode')
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({ success: true, message: 'OK', data: transactions })
  } catch (err) {
    console.error('[GET /api/transactions]', err)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
