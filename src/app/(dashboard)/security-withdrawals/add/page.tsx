'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ChevronDown,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import type { IBankAccount } from '@/types'
import { apiClient } from '@/lib/axios'

// ─── Fetch active banks ───────────────────────────────────────────────────────

async function fetchActiveBanks(): Promise<IBankAccount[]> {
  const res = await apiClient.get('/banks')
  return (res.data.data ?? []).filter((b: IBankAccount) => b.status === 'active')
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AddSecurityWithdrawalPage() {
  const router = useRouter()

  const { data: banks = [], isLoading: banksLoading, isError: banksError } = useQuery<IBankAccount[]>({
    queryKey: ['activeBanks'],
    queryFn: fetchActiveBanks,
  })

  const [bankId, setBankId]   = useState('')
  const [amount, setAmount]   = useState('')
  const [notes, setNotes]     = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors]   = useState<{ bankId?: string; amount?: string; general?: string }>({})



  const canSubmit = bankId !== '' && amount !== '' && !loading

  function validate(): boolean {
    const errs: typeof errors = {}
    if (!bankId) errs.bankId = 'Please select a bank'
    const amt = parseFloat(amount)
    if (!amount) errs.amount = 'Amount is required'
    else if (isNaN(amt) || amt <= 0) errs.amount = 'Enter a valid amount greater than 0'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || !validate()) return
    setLoading(true)
    setErrors({})

    try {
      const body: Record<string, unknown> = { bankId, amount: parseFloat(amount) }
      if (notes.trim()) body.notes = notes.trim()

      const res = await apiClient.post('/security-withdrawals', body)
      const json = res.data

      if (!json.success) {
        setErrors({ general: json.message ?? 'Failed to submit security withdrawal' })
        return
      }
      setSuccess(true)
      setTimeout(() => router.replace('/security-withdrawals'), 1800)
    } catch {
      setErrors({ general: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  // ── Success ───────────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="page-card flex flex-col items-center gap-4 text-center py-10 animate-[fadeIn_200ms_ease-out]">
        <CheckCircle2 className="w-14 h-14 text-amber" />
        <div>
          <p className="text-lg font-bold text-primary">Security Withdrawal Submitted!</p>
          <p className="text-sm text-secondary mt-2">Your request is pending processing.</p>
        </div>
        <p className="text-[13px] text-muted">Redirecting to Security Withdrawals…</p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4 animate-[fadeIn_200ms_ease-out]"
    >
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <Link
          href="/security-withdrawals"
          aria-label="Back to security withdrawals"
          className="flex items-center justify-center w-10 h-10 rounded-[10px] bg-[rgba(255,255,255,0.06)] border border-border-subtle shrink-0 touch-manipulation transition-opacity active:opacity-60"
        >
          <ArrowLeft className="w-4.5 h-4.5 text-secondary" />
        </Link>
        <h1 className="text-lg font-bold text-primary">Add Security Withdrawal</h1>
      </div>

      {/* ── SELECT BANK ─────────────────────────────────────────────────── */}
      <div className="page-card flex flex-col gap-2">
        <p className="section-label">SELECT BANK</p>

        {banksLoading && (
          <div className="skeleton h-[54px] rounded-[14px]" />
        )}

        {banksError && (
          <div className="error-banner text-[13px]">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            Failed to load banks. Please refresh.
          </div>
        )}

        {!banksLoading && !banksError && banks.length === 0 && (
          <div className="flex items-start gap-2 p-3.5 rounded-[14px] text-[13px] font-medium text-warning border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.08)]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
            <span>
              No active bank accounts.{' '}
              <Link href="/banks/add" className="font-bold text-gold">
                Add one first →
              </Link>
            </span>
          </div>
        )}

        {!banksLoading && !banksError && banks.length > 0 && (
          <div className="relative">
            <select
              id="withdrawal-bank"
              value={bankId}
              onChange={(e) => {
                setBankId(e.target.value)
                if (errors.bankId) setErrors((p) => ({ ...p, bankId: undefined }))
              }}
              className={`form-input pr-11 cursor-pointer appearance-none${errors.bankId ? ' error' : ''}`}
            >
              <option value="">Choose bank</option>
              {banks.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.bankName} — ••••{b.accountNumber.slice(-4)}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            {errors.bankId && <p className="field-error">{errors.bankId}</p>}
          </div>
        )}
      </div>

      {/* ── ENTER AMOUNT ────────────────────────────────────────────────── */}
      <div className="page-card flex flex-col gap-2">
        <p className="section-label">ENTER AMOUNT</p>
        <div className="relative">
          <input
            id="withdrawal-amount"
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              if (errors.amount) setErrors((p) => ({ ...p, amount: undefined }))
            }}
            className={`form-input pr-12${errors.amount ? ' error' : ''}`}
          />
          <IndianRupee className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        </div>
        {errors.amount && <p className="field-error">{errors.amount}</p>}
      </div>

      {/* ── NOTES (optional) ────────────────────────────────────────── */}
      <div className="page-card flex flex-col gap-2">
        <p className="section-label">NOTES <span className="text-muted normal-case font-normal">(optional)</span></p>
        <textarea
          id="withdrawal-notes"
          placeholder="Add any notes here…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="form-input"
          rows={3}
          style={{ resize: 'none' }}
        />
      </div>

      {/* General error */}
      {errors.general && (
        <div className="error-banner">
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
          {errors.general}
        </div>
      )}

      {/* ── Submit ──────────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="flex items-center justify-center gap-2.5 w-full py-4 rounded-full text-[15px] font-bold text-[#1a1000] transition-opacity active:opacity-80"
        style={{
          background: 'linear-gradient(145deg, var(--accent-amber-light), var(--accent-amber))',
          opacity: canSubmit ? 1 : 0.45, cursor: canSubmit ? 'pointer' : 'not-allowed',
        }}
      >
        {loading ? 'Submitting…' : 'Submit Withdrawal Request'}
      </button>

      {/* Cancel */}
      <Link href="/security-withdrawals" className="btn-danger text-center no-underline">
        Cancel
      </Link>
    </form>
  )
}
