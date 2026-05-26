'use client'

/**
 * /utr/create — Submit UTR form
 *
 * Layout from CONVERSION_SPEC.md §8:
 *
 *   SELECT BANK          ← ALL CAPS section label
 *   [ Choose bank ▾ ]    ← custom dropdown (only active banks)
 *
 *   ENTER UTR            ← ALL CAPS section label
 *   [ UTR Number    ID ] ← "ID" suffix on right
 *
 *   ENTER AMOUNT         ← ALL CAPS section label
 *   [ Amount       ₹ ]  ← rupee icon on right
 *
 *   [   SUBMIT UTR   ]   ← ghost dark button, disabled until all fields filled
 *   [    Cancel      ]   ← red pill button
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown, Hash, IndianRupee, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { IBankAccount } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  bankId:    string
  utrNumber: string
  amount:    string
}

// ─── Fetch active banks ───────────────────────────────────────────────────────

async function fetchActiveBanks(): Promise<IBankAccount[]> {
  const res = await fetch('/api/banks')
  if (!res.ok) throw new Error('Failed to fetch banks')
  const json = await res.json()
  const banks: IBankAccount[] = json.data ?? []
  // Only show active banks in the UTR dropdown
  return banks.filter((b) => b.status === 'active')
}

// ─── Ghost dark button style (spec: disabled by default) ─────────────────────

function ghostButtonStyle(enabled: boolean) {
  return {
    width:          '100%',
    background:     enabled ? 'var(--bg-input)' : 'var(--bg-input)',
    border:         `1px solid ${enabled ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
    borderRadius:   'var(--radius-full)' as const,
    padding:        '16px 20px',
    fontSize:       '16px',
    fontWeight:     700,
    color:          enabled ? 'var(--text-primary)' : 'var(--text-muted)',
    cursor:         enabled ? 'pointer' : 'not-allowed',
    display:        'flex' as const,
    alignItems:     'center' as const,
    justifyContent: 'center' as const,
    gap:            '8px',
    letterSpacing:  '0.05em',
    minHeight:      '54px',
    transition:     'border-color 150ms ease-out, color 150ms ease-out, transform 100ms',
    touchAction:    'manipulation' as const,
  } as const
}

// ─── Input with right-side icon/suffix ───────────────────────────────────────

function InputWithSuffix({
  id,
  placeholder,
  value,
  onChange,
  suffix,
  error,
  type = 'text',
}: {
  id: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  suffix: React.ReactNode
  error?: string
  type?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          id={id}
          type={type}
          inputMode={type === 'number' ? 'decimal' : undefined}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`form-input${error ? ' error' : ''}`}
          style={{ paddingRight: '52px' }}
        />
        <div
          style={{
            position:       'absolute',
            right:          '16px',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            color:          'var(--text-muted)',
            pointerEvents:  'none',
          }}
        >
          {suffix}
        </div>
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CreateUTRPage() {
  const router = useRouter()

  const [banks, setBanks]           = useState<IBankAccount[]>([])
  const [banksLoading, setBanksLoading] = useState(true)
  const [banksError, setBanksError] = useState(false)

  const [form, setForm]             = useState<FormState>({ bankId: '', utrNumber: '', amount: '' })
  const [errors, setErrors]         = useState<Partial<FormState & { general: string }>>({})
  const [loading, setLoading]       = useState(false)
  const [success, setSuccess]       = useState(false)

  // Load active banks on mount
  useEffect(() => {
    fetchActiveBanks()
      .then(setBanks)
      .catch(() => setBanksError(true))
      .finally(() => setBanksLoading(false))
  }, [])

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  // Submit is enabled only when all three fields are filled
  const canSubmit =
    form.bankId.trim() !== '' &&
    form.utrNumber.trim() !== '' &&
    form.amount.trim() !== '' &&
    !loading

  function validate(): boolean {
    const errs: Partial<FormState & { general: string }> = {}

    if (!form.bankId) errs.bankId = 'Please select a bank'
    if (!form.utrNumber.trim()) errs.utrNumber = 'UTR number is required'
    else if (!/^[A-Z0-9a-z]+$/.test(form.utrNumber.trim()))
      errs.utrNumber = 'UTR number must be alphanumeric'

    const amt = parseFloat(form.amount)
    if (!form.amount) errs.amount = 'Amount is required'
    else if (isNaN(amt) || amt <= 0) errs.amount = 'Enter a valid amount greater than 0'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    if (!validate()) return

    setLoading(true)
    setErrors({})

    try {
      const res = await fetch('/api/utr', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          bankId:    form.bankId,
          utrNumber: form.utrNumber.trim().toUpperCase(),
          amount:    parseFloat(form.amount),
        }),
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        setErrors({ general: json.message ?? 'Failed to submit UTR' })
        return
      }

      setSuccess(true)
      // Brief success flash, then navigate to UTR history
      setTimeout(() => router.replace('/utr'), 1800)
    } catch {
      setErrors({ general: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  // ── Success state ─────────────────────────────────────────────────────────

  if (success) {
    return (
      <div
        className="page-card"
        style={{
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           '16px',
          textAlign:     'center',
          padding:       '40px 20px',
          animation:     'fadeIn 200ms ease-out',
        }}
      >
        <CheckCircle2 size={52} style={{ color: 'var(--accent-green)' }} />
        <div>
          <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
            UTR Submitted!
          </p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Your UTR is pending verification.
          </p>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Redirecting to UTR History…
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 200ms ease-out' }}
    >
      {/* Page title */}
      <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
        Create UTR
      </h1>

      {/* ── SELECT BANK ──────────────────────────────────────────────────── */}
      <div className="page-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p className="section-label">SELECT BANK</p>

        {banksLoading ? (
          <div className="skeleton" style={{ height: '54px', borderRadius: 'var(--radius-md)' }} />
        ) : banksError ? (
          <div className="error-banner" style={{ fontSize: '13px' }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            Failed to load banks. Please refresh.
          </div>
        ) : banks.length === 0 ? (
          <div
            style={{
              padding:      '14px 16px',
              background:   'var(--accent-amber-dim)',
              border:       '1px solid rgba(245,158,11,0.2)',
              borderRadius: 'var(--radius-md)',
              fontSize:     '13px',
              color:        'var(--accent-amber)',
              fontWeight:   500,
            }}
          >
            No active bank accounts found.{' '}
            <Link href="/banks/add" style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>
              Add one first →
            </Link>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <select
              id="utr-bank"
              value={form.bankId}
              onChange={(e) => set('bankId', e.target.value)}
              className={`form-input${errors.bankId ? ' error' : ''}`}
              style={{
                appearance:       'none',
                WebkitAppearance: 'none',
                paddingRight:     '44px',
                cursor:           'pointer',
              }}
            >
              <option value="">Choose bank</option>
              {banks.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.bankName} — ••••{b.accountNumber.slice(-4)}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              style={{
                position:      'absolute',
                right:         '16px',
                top:           '50%',
                transform:     'translateY(-50%)',
                color:         'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
            {errors.bankId && <p className="field-error">{errors.bankId}</p>}
          </div>
        )}
      </div>

      {/* ── ENTER UTR ────────────────────────────────────────────────────── */}
      <div className="page-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p className="section-label">ENTER UTR</p>
        <InputWithSuffix
          id="utr-number"
          placeholder="UTR Number"
          value={form.utrNumber}
          onChange={(v) => set('utrNumber', v.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
          suffix={<Hash size={16} strokeWidth={2.5} />}
          error={errors.utrNumber}
        />
      </div>

      {/* ── ENTER AMOUNT ─────────────────────────────────────────────────── */}
      <div className="page-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p className="section-label">ENTER AMOUNT</p>
        <InputWithSuffix
          id="utr-amount"
          type="number"
          placeholder="Amount"
          value={form.amount}
          onChange={(v) => set('amount', v)}
          suffix={<IndianRupee size={16} strokeWidth={2.5} />}
          error={errors.amount}
        />
      </div>

      {/* Server / general error */}
      {errors.general && (
        <div className="error-banner">
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          {errors.general}
        </div>
      )}

      {/* ── SUBMIT UTR — ghost dark, disabled until all fields filled ─── */}
      <button
        type="submit"
        disabled={!canSubmit}
        style={ghostButtonStyle(canSubmit)}
        onMouseEnter={(e) => {
          if (canSubmit) e.currentTarget.style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = ''
        }}
        onMouseDown={(e) => {
          if (canSubmit) e.currentTarget.style.transform = 'scale(0.97)'
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = ''
        }}
      >
        {loading ? 'Submitting…' : 'SUBMIT UTR'}
      </button>

      {/* ── Cancel — red pill ─────────────────────────────────────────── */}
      <Link href="/utr" className="btn-danger" style={{ textAlign: 'center', textDecoration: 'none' }}>
        Cancel
      </Link>
    </form>
  )
}
