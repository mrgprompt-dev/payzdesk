import { NextResponse } from 'next/server'
import { ACCESS_COOKIE, REFRESH_COOKIE, cookieOptions } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()

  cookieStore.set(ACCESS_COOKIE, '', { ...cookieOptions, maxAge: 0 })
  cookieStore.set(REFRESH_COOKIE, '', { ...cookieOptions, maxAge: 0 })

  return NextResponse.json({ success: true, message: 'Logged out successfully' })
}