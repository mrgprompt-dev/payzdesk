'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Copy,
  Landmark,
} from 'lucide-react'
import type { IBankAccount } from '@/types'
import { formatINR } from '@/utils'
import { apiClient } from '@/lib/axios'

// ─── Fetch banks ─────────────────────────────────────────────────────────────

async function fetchBankDetails(bankId: string): Promise<IBankAccount | null> {
  const res = await apiClient.get('/banks')
  const banks = res.data.data ?? []
  return banks.find((b: IBankAccount) => b._id === bankId) || null
}

// ─── Component ────────────────────────────────────────────────────────────────

function PaymentConfirmationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const bankId = searchParams.get('bankId')
  const amountStr = searchParams.get('amount')
  const amount = amountStr ? parseFloat(amountStr) : 0

  const [bank, setBank] = useState<IBankAccount | null>(null)
  const [bankLoading, setBankLoading] = useState(true)
  const [bankError, setBankError] = useState(false)

  const [utrNum, setUtrNum] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    if (!bankId || isNaN(amount) || amount <= 0) {
      setBankError(true)
      setBankLoading(false)
      return
    }

    fetchBankDetails(bankId)
      .then((b) => {
        if (!b) setBankError(true)
        else setBank(b)
      })
      .catch(() => setBankError(true))
      .finally(() => setBankLoading(false))
  }, [bankId, amount])

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const canSubmit = utrNum.trim().length >= 8 && !loading

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError('')

    try {
      const res = await apiClient.post('/transactions/deposit', {
        bankId,
        amount,
        utrNumber: utrNum.trim().toUpperCase(),
      })

      if (!res.data.success) {
        setError(res.data.message ?? 'Failed to submit deposit')
        return
      }
      setSuccess(true)
      setTimeout(() => router.replace('/deposits'), 1800)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Success ───────────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="page-card flex flex-col items-center gap-4 text-center py-10 animate-[fadeIn_200ms_ease-out]">
        <CheckCircle2 className="w-14 h-14 text-green" />
        <div>
          <p className="text-lg font-bold text-primary">Deposit Submitted!</p>
          <p className="text-sm text-secondary mt-2">Your request is pending verification.</p>
        </div>
        <p className="text-[13px] text-muted">Redirecting to Deposit Requests…</p>
      </div>
    )
  }

  // ── Loading / Error ───────────────────────────────────────────────────────

  if (bankLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="skeleton h-10 w-32 rounded-[10px]" />
        <div className="skeleton h-[200px] rounded-[16px]" />
      </div>
    )
  }

  if (bankError || !bank) {
    return (
      <div className="flex flex-col gap-4 animate-[fadeIn_200ms_ease-out]">
        <div className="error-banner">
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
          Invalid deposit request or bank not found.
        </div>
        <Link href="/deposit" className="btn-primary text-center no-underline">
          Go Back
        </Link>
      </div>
    )
  }

  // ── Payment Instructions ──────────────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4 animate-[fadeIn_200ms_ease-out]"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back"
          className="flex items-center justify-center w-10 h-10 rounded-[10px] bg-[rgba(255,255,255,0.06)] border border-border-subtle shrink-0 touch-manipulation transition-opacity active:opacity-60"
        >
          <ArrowLeft className="w-4.5 h-4.5 text-secondary" />
        </button>
        <h1 className="text-lg font-bold text-primary">Make Payment</h1>
      </div>

      <div className="page-card flex gap-3 bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.2)]">
        <div className="w-8 h-8 rounded-full bg-green/20 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-green font-bold text-lg">!</span>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[14px] text-primary font-bold">Transfer exactly {formatINR(amount)}</p>
          <p className="text-[13px] text-secondary leading-relaxed">
            Please transfer the exact amount to the account below, then submit the 12-digit UTR/Reference number.
          </p>
        </div>
      </div>

      {/* Bank Details */}
      <div className="page-card p-0! overflow-hidden">
        <div className="px-4 py-3.5 border-b border-border-subtle flex items-center gap-2">
          <Landmark className="w-4.5 h-4.5 text-gold" />
          <p className="section-label mb-0">BANK DETAILS</p>
        </div>
        
        <div className="flex flex-col divide-y divide-border-subtle">
          {bank.upiId && (
            <div className="px-4 py-3 flex justify-between items-center">
              <div>
                <p className="text-[12px] font-medium text-muted uppercase tracking-wider mb-0.5">UPI ID</p>
                <p className="text-[14px] font-bold text-primary font-mono">{bank.upiId}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(bank.upiId!, 'upi')}
                className="p-2 rounded-md hover:bg-bg-primary transition-colors text-secondary hover:text-primary active:scale-95"
              >
                {copiedField === 'upi' ? <CheckCircle2 className="w-4 h-4 text-green" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          )}
          
          <div className="px-4 py-3 flex justify-between items-center">
            <div>
              <p className="text-[12px] font-medium text-muted uppercase tracking-wider mb-0.5">Bank Name</p>
              <p className="text-[14px] font-bold text-primary">{bank.bankName}</p>
            </div>
          </div>

          <div className="px-4 py-3 flex justify-between items-center">
            <div>
              <p className="text-[12px] font-medium text-muted uppercase tracking-wider mb-0.5">Account Holder</p>
              <p className="text-[14px] font-bold text-primary">{bank.accountHolderName}</p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(bank.accountHolderName, 'name')}
              className="p-2 rounded-md hover:bg-bg-primary transition-colors text-secondary hover:text-primary active:scale-95"
            >
              {copiedField === 'name' ? <CheckCircle2 className="w-4 h-4 text-green" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="px-4 py-3 flex justify-between items-center">
            <div>
              <p className="text-[12px] font-medium text-muted uppercase tracking-wider mb-0.5">Account Number</p>
              <p className="text-[14px] font-bold text-primary font-mono">{bank.accountNumber}</p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(bank.accountNumber, 'acc')}
              className="p-2 rounded-md hover:bg-bg-primary transition-colors text-secondary hover:text-primary active:scale-95"
            >
              {copiedField === 'acc' ? <CheckCircle2 className="w-4 h-4 text-green" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="px-4 py-3 flex justify-between items-center">
            <div>
              <p className="text-[12px] font-medium text-muted uppercase tracking-wider mb-0.5">IFSC Code</p>
              <p className="text-[14px] font-bold text-primary font-mono">{bank.ifscCode}</p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(bank.ifscCode, 'ifsc')}
              className="p-2 rounded-md hover:bg-bg-primary transition-colors text-secondary hover:text-primary active:scale-95"
            >
              {copiedField === 'ifsc' ? <CheckCircle2 className="w-4 h-4 text-green" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* UTR Input */}
      <div className="page-card flex flex-col gap-2">
        <p className="section-label">SUBMIT UTR NUMBER</p>
        <input
          id="deposit-utr"
          type="text"
          placeholder="Enter 12-digit UTR / Reference No."
          value={utrNum}
          onChange={(e) => setUtrNum(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
          className="form-input font-mono placeholder:font-sans"
          maxLength={22}
        />
        <p className="text-[12px] text-secondary">
          A UTR (Unique Transaction Reference) is a 12-digit number generated after a successful bank transfer.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="error-banner">
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="btn-primary mt-2"
        style={{ opacity: canSubmit ? 1 : 0.45, cursor: canSubmit ? 'pointer' : 'not-allowed' }}
      >
        {loading ? 'Submitting…' : 'I have transferred the funds'}
      </button>
    </form>
  )
}

export default function PaymentConfirmationPage() {
  return (
    <Suspense fallback={<div className="p-4"><div className="skeleton h-10 w-32 rounded-[10px]" /></div>}>
      <PaymentConfirmationContent />
    </Suspense>
  )
}
