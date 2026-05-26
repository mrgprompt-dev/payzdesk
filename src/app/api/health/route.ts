import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { redis } from '@/lib/redis'

export async function GET() {
  const status = {
    ok: false,
    mongodb: false,
    redis: false,
    timestamp: new Date().toISOString(),
  }

  try {
    await connectDB()
    status.mongodb = true
  } catch {
    status.mongodb = false
  }

  try {
    await redis.ping()
    status.redis = true
  } catch {
    status.redis = false
  }

  status.ok = status.mongodb && status.redis

  return NextResponse.json(status, {
    status: status.ok ? 200 : 503,
  })
}