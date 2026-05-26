import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { getAuthUser } from '@/lib/getAuthUser'
import { User } from '@/models/User'

// ─── PATCH /api/settings/withdrawal ───────────────────────────────────────────
// Toggle the user's withdrawalEnabled setting.

const schema = z.object({
  enabled: z.boolean({ message: 'enabled must be a boolean' }),
})

export async function PATCH(req: NextRequest) {
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

    const { enabled } = parsed.data

    await connectDB()

    const user = await User.findByIdAndUpdate(
      auth.userId,
      { withdrawalEnabled: enabled },
      { new: true }
    )
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
      message: `Withdrawals ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: user,
    })
  } catch (err) {
    console.error('[PATCH /api/settings/withdrawal]', err)
    return NextResponse.json(
      { success: false, message: 'Failed to update withdrawal settings' },
      { status: 500 }
    )
  }
}
