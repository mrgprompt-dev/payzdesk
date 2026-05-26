import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ─── Classnames ───────────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Currency ─────────────────────────────────────────────────────────────────

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// ─── Date ─────────────────────────────────────────────────────────────────────

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

// ─── Phone ────────────────────────────────────────────────────────────────────

export function formatPhone(phone: string): string {
  // Ensure +91 prefix for display
  if (phone.startsWith('+91')) return phone
  if (phone.startsWith('91') && phone.length === 12) return `+${phone}`
  return `+91 ${phone}`
}

export function sanitizePhone(phone: string): string {
  // Remove all non-digit characters first
  let digits = phone.replace(/\D/g, '')
  // Only strip country code prefix when the total length proves it's there
  // e.g. "919123456789" (12 digits) → strip leading 91 → "9123456789"
  // e.g. "9123456789" (10 digits) → keep as is
  if (digits.length > 10 && digits.startsWith('91')) {
    digits = digits.slice(2)
  }
  return digits.slice(0, 10)
}

// ─── Referral code ────────────────────────────────────────────────────────────

export function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'PD' // PayzDesk prefix
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// ─── API response helper (server-side) ───────────────────────────────────────

export function apiSuccess<T>(data: T, message = 'Success') {
  return { success: true, message, data }
}

export function apiError(message: string, status = 400) {
  return { success: false, message, error: message, status }
}