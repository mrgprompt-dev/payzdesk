import { Redis } from '@upstash/redis'

const REDIS_URL = process.env.UPSTASH_REDIS_URL as string
const REDIS_TOKEN = process.env.UPSTASH_REDIS_TOKEN as string

if (!REDIS_URL || !REDIS_TOKEN) {
  throw new Error('UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN must be set in env')
}

export const redis = new Redis({
  url: REDIS_URL,
  token: REDIS_TOKEN,
})

// ─── OTP helpers ──────────────────────────────────────────────────────────────

const OTP_TTL_SECONDS = 5 * 60 // 5 minutes
const OTP_RATE_TTL_SECONDS = 60 // 1 minute between resends

function otpKey(phone: string, purpose: string) {
  return `otp:${purpose}:${phone}`
}

function otpRateKey(phone: string, purpose: string) {
  return `otp_rate:${purpose}:${phone}`
}

export async function storeOTP(
  phone: string,
  purpose: string,
  otp: string
): Promise<void> {
  await redis.setex(otpKey(phone, purpose), OTP_TTL_SECONDS, otp)
}

export async function peekOTP(
  phone: string,
  purpose: string,
  otp: string
): Promise<boolean> {
  const stored = await redis.get(otpKey(phone, purpose))
  return stored ? String(stored) === String(otp) : false
}

export async function consumeOTP(
  phone: string,
  purpose: string,
  otp: string
): Promise<boolean> {
  const valid = await peekOTP(phone, purpose, otp)
  if (valid) {
    await redis.del(otpKey(phone, purpose))
  }
  return valid
}

export async function checkOTPRateLimit(
  phone: string,
  purpose: string
): Promise<boolean> {
  const key = otpRateKey(phone, purpose)
  const exists = await redis.exists(key)
  if (exists) return false // Still in cooldown
  await redis.setex(key, OTP_RATE_TTL_SECONDS, '1')
  return true
}