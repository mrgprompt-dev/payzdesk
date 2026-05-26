import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { getAuthUser } from '@/lib/getAuthUser'
import { UTR } from '@/models/UTR'
import { BankAccount } from '@/models/BankAccount'

// ─── POST /api/utr ────────────────────────────────────────────────────────────
// Submit a new UTR entry.
// Validates: bank belongs to user + is active, no duplicate UTR for this user.

const submitSchema = z.object({
  bankId:    z.string().min(1, 'Bank is required'),
  utrNumber: z
    .string()
    .min(1, 'UTR number is required')
    .max(50, 'UTR number too long')
    .regex(/^[A-Z0-9a-z]+$/, 'UTR number must be alphanumeric'),
  amount:    z.number({ message: 'Amount must be a number' }).positive('Amount must be greater than 0'),
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
    const parsed = submitSchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid input'
      return NextResponse.json({ success: false, message }, { status: 400 })
    }

    const { bankId, utrNumber, amount } = parsed.data

    await connectDB()

    // 1. Verify the bank belongs to this user and is active
    const bank = await BankAccount.findOne({
      _id:    bankId,
      userId: auth.userId,
    }).lean()

    if (!bank) {
      return NextResponse.json(
        { success: false, message: 'Bank account not found' },
        { status: 404 }
      )
    }

    if ((bank as { status: string }).status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Only active bank accounts can be used for UTR submissions' },
        { status: 400 }
      )
    }

    // 2. Check for duplicate UTR number for this user
    const duplicate = await UTR.findOne({
      userId: auth.userId,
      utrNumber,
    }).lean()

    if (duplicate) {
      return NextResponse.json(
        { success: false, message: 'This UTR number has already been submitted' },
        { status: 409 }
      )
    }

    // 3. Create the UTR record
    const utr = await UTR.create({
      userId:    auth.userId,
      bankId,
      utrNumber,
      amount,
      status:    'pending',
    })

    return NextResponse.json(
      {
        success: true,
        message: 'UTR submitted successfully',
        data: { utrId: utr._id.toString() },
      },
      { status: 201 }
    )
  } catch (err: unknown) {
    // Mongoose duplicate key error (compound index)
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: number }).code === 11000
    ) {
      return NextResponse.json(
        { success: false, message: 'This UTR number has already been submitted' },
        { status: 409 }
      )
    }
    console.error('[POST /api/utr]', err)
    return NextResponse.json(
      { success: false, message: 'Failed to submit UTR. Please try again.' },
      { status: 500 }
    )
  }
}

// ─── GET /api/utr ─────────────────────────────────────────────────────────────
// List the authenticated user's UTR history with optional filters.
//
// Query params:
//   status    – 'pending' | 'verified' | 'rejected'  (omit for all)
//   search    – partial match on utrNumber (case-insensitive)
//   dateFrom  – ISO date string  (inclusive)
//   dateTo    – ISO date string  (inclusive, end of day)

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
    const status   = searchParams.get('status')
    const search   = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo   = searchParams.get('dateTo')

    await connectDB()

    // Build filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { userId: auth.userId }

    if (status && ['pending', 'verified', 'rejected'].includes(status)) {
      filter.status = status
    }

    if (search) {
      filter.utrNumber = { $regex: search.trim(), $options: 'i' }
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {}
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom)
      if (dateTo) {
        const end = new Date(dateTo)
        end.setHours(23, 59, 59, 999) // include full end day
        filter.createdAt.$lte = end
      }
    }

    const utrs = await UTR.find(filter)
      .populate('bankId', 'bankName accountNumber ifscCode')
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({ success: true, message: 'OK', data: utrs })
  } catch (err) {
    console.error('[GET /api/utr]', err)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch UTR history' },
      { status: 500 }
    )
  }
}
