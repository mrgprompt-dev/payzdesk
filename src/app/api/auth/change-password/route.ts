import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { getAuthUser } from '@/lib/getAuthUser'
import { User } from '@/models/User'
import bcrypt from 'bcryptjs'

// ─── POST /api/auth/change-password ──────────────────────────────────────────
// Update the user's password.

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
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

    const { currentPassword, newPassword } = parsed.data

    await connectDB()

    const user = await User.findById(auth.userId)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Incorrect current password' },
        { status: 400 }
      )
    }

    // Hash new password and save
    // Note: The pre-save hook in User.ts will automatically hash it if it's not a bcrypt hash
    // We can just assign the raw password and save, or hash it here explicitly.
    // The pre-save hook:
    // if (!this.passwordHash.startsWith('$2')) {
    //   this.passwordHash = await bcrypt.hash(this.passwordHash, 12)
    // }
    
    user.passwordHash = newPassword
    await user.save()

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    })
  } catch (err) {
    console.error('[POST /api/auth/change-password]', err)
    return NextResponse.json(
      { success: false, message: 'Failed to change password. Please try again.' },
      { status: 500 }
    )
  }
}
