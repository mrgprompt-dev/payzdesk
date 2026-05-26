import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getAuthUser } from '@/lib/getAuthUser'
import { User } from '@/models/User'

// ─── GET /api/settings ────────────────────────────────────────────────────────
// Return the user's settings (withdrawalEnabled, maxWithdrawalPerTxn, appLockEnabled)

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

    const user = await User.findById(auth.userId)
      .select('withdrawalEnabled maxWithdrawalPerTxn appLockEnabled')
      .lean()

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'OK',
      data: user,
    })
  } catch (err) {
    console.error('[GET /api/settings]', err)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}
