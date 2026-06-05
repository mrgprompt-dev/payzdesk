'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/axios'
import { AxiosError } from 'axios'
import { formatINR } from '@/utils'
import {
  ArrowLeft,
  Clock,
  Zap,
  AlertCircle,
  CheckCircle2,
  Building2,
  Hash,
  Copy,
  RefreshCw,
  Send,
  User,
  CreditCard,
  Smartphone,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface IActiveJob {
  _id: string
  amount: number
  bankId?: {
    _id: string
    bankName?: string
    accountNumber?: string
    ifscCode?: string
    accountHolderName?: string
    upiId?: string
    branch?: string
  } | null
  transactionId?: {
    _id: string
    status?: string
  } | null
  expiresAt: string
  status: string
  utrNumber?: string
  completedAt?: string
}

interface ApiErrorResponse {
  message?: string
}

// ─── Countdown timer ──────────────────────────────────────────────────────────

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const calculateTime = () => {
      const diff = new Date(expiresAt).getTime() - new Date().getTime()
      if (diff <= 0) {
        setTimeLeft('Expired')
        setIsExpired(true)
        return
      }

      const hours = Math.floor(diff / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)

      if (hours > 0) {
        setTimeLeft(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
      } else {
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`)
      }

      setIsUrgent(diff < 300000) // Less than 5 minutes
    }

    calculateTime()
    const interval = setInterval(calculateTime, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  return (
    <div
      className={`flex items-center gap-1.5 text-[13px] font-mono font-bold ${
        isExpired ? 'text-danger' : isUrgent ? 'text-danger animate-pulse' : 'text-amber'
      }`}
    >
      <Clock className="w-3.5 h-3.5" />
      {timeLeft}
    </div>
  )
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* fallback: ignore */
    }
  }, [text])

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all active:scale-95 hover:bg-[rgba(255,255,255,0.06)]"
      style={{ color: copied ? 'var(--accent-green-light)' : 'var(--text-muted)' }}
    >
      {copied ? (
        <>
          <CheckCircle2 className="w-3 h-3" />
          Copied
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          {label ?? 'Copy'}
        </>
      )}
    </button>
  )
}

// ─── Bank detail row ──────────────────────────────────────────────────────────

function BankDetail({
  icon: Icon,
  label,
  value,
  copyable = false,
  mono = false,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  copyable?: boolean
  mono?: boolean
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border-subtle last:border-0">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'var(--bg-input)' }}
      >
        <Icon className="w-4 h-4 text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">{label}</p>
        <p className={`text-[14px] font-semibold text-primary mt-0.5 break-all ${mono ? 'font-mono' : ''}`}>
          {value}
        </p>
      </div>
      {copyable && <CopyButton text={value} />}
    </div>
  )
}

// ─── Single active job card ───────────────────────────────────────────────────

function ActiveJobCard({
  job,
  onSubmitSuccess,
}: {
  job: IActiveJob
  onSubmitSuccess: () => void
}) {
  const [utrInput, setUtrInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [completed, setCompleted] = useState(false)

  const bank = job.bankId

  const handleSubmit = async () => {
    const trimmed = utrInput.trim()
    if (!trimmed) {
      setErrorMsg('Please enter the UTR number')
      return
    }
    if (!/^[A-Za-z0-9]+$/.test(trimmed)) {
      setErrorMsg('UTR must be alphanumeric')
      return
    }

    setSubmitting(true)
    setErrorMsg('')

    try {
      const res = await apiClient.post('/live-pool/submit-utr', {
        jobId: job._id,
        utrNumber: trimmed,
      })
      if (res.data.success) {
        setCompleted(true)
        onSubmitSuccess()
      } else {
        setErrorMsg(res.data.message || 'Failed to submit UTR')
      }
    } catch (err: unknown) {
      const error = err as AxiosError<ApiErrorResponse>
      setErrorMsg(error.response?.data?.message || 'Error submitting UTR')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Completed state ──
  if (completed) {
    return (
      <div className="page-card flex flex-col items-center justify-center py-10 gap-4 border border-[rgba(16,185,129,0.3)] animate-[fadeIn_300ms_ease-out]">
        <div className="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.3)] flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green" />
        </div>
        <div className="text-center">
          <p className="text-[16px] font-bold text-primary">UTR Submitted!</p>
          <p className="text-[13px] text-secondary mt-1">
            {formatINR(job.amount)} — Processing
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-card relative overflow-hidden flex flex-col gap-0 border border-[rgba(245,166,35,0.2)] animate-[fadeIn_300ms_ease-out]">
      {/* Glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gold/5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />

      {/* ── Header: Amount + Timer ── */}
      <div className="flex justify-between items-start p-4 pb-3 z-10">
        <div>
          <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">
            Send This Amount
          </p>
          <p className="text-[28px] font-extrabold text-gold mt-1">{formatINR(job.amount)}</p>
        </div>
        <div className="bg-[rgba(0,0,0,0.25)] px-3 py-2 rounded-lg border border-[rgba(255,255,255,0.05)]">
          <CountdownTimer expiresAt={job.expiresAt} />
        </div>
      </div>

      {/* ── Bank Details Section ── */}
      <div className="z-10 mx-4 mb-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2 flex items-center gap-1.5">
          <Building2 className="w-3 h-3" />
          Transfer To
        </p>
        <div className="bg-[rgba(0,0,0,0.15)] rounded-xl border border-[rgba(255,255,255,0.04)] px-4">
          {bank?.accountHolderName && (
            <BankDetail icon={User} label="Account Holder" value={bank.accountHolderName} copyable />
          )}
          {bank?.bankName && (
            <BankDetail icon={Building2} label="Bank Name" value={bank.bankName} />
          )}
          {bank?.accountNumber && (
            <BankDetail icon={Hash} label="Account Number" value={bank.accountNumber} copyable mono />
          )}
          {bank?.ifscCode && (
            <BankDetail icon={CreditCard} label="IFSC Code" value={bank.ifscCode} copyable mono />
          )}
          {bank?.upiId && (
            <BankDetail icon={Smartphone} label="UPI ID" value={bank.upiId} copyable mono />
          )}
          {bank?.branch && (
            <BankDetail icon={Building2} label="Branch" value={bank.branch} />
          )}
        </div>
      </div>

      {/* ── UTR Submission ── */}
      <div className="z-10 mx-4 mb-4 mt-1">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2 flex items-center gap-1.5">
          <Hash className="w-3 h-3" />
          Submit UTR Proof
        </p>

        {errorMsg && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl text-[12px] font-medium text-danger border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] mb-2.5 animate-[fadeIn_200ms_ease-out]">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {errorMsg}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={utrInput}
            onChange={(e) => {
              setUtrInput(e.target.value.toUpperCase())
              setErrorMsg('')
            }}
            placeholder="Enter UTR / Reference Number"
            className="form-input flex-1 !py-3 !text-[14px] !rounded-xl"
            disabled={submitting}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !utrInput.trim()}
            className="px-5 py-3 rounded-xl text-[14px] font-bold text-white bg-[#10b981] hover:bg-[#059669] transition-all active:scale-[0.97] flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {submitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit
              </>
            )}
          </button>
        </div>
        <p className="text-[11px] text-muted mt-2">
          Complete the bank transfer, then paste the UTR/reference number above.
        </p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ActiveJobsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const {
    data: jobs = [],
    isLoading,
    isError,
  } = useQuery<IActiveJob[]>({
    queryKey: ['activeJobs'],
    queryFn: async () => {
      const res = await apiClient.get('/live-pool/active')
      return res.data.data ?? []
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const handleSubmitSuccess = () => {
    // Refetch active jobs after a short delay to let the DB update
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['activeJobs'] })
    }, 1000)
  }

  return (
    <div className="flex flex-col gap-5 animate-[fadeIn_200ms_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/live-pool')}
            className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.04)] border border-border-subtle flex items-center justify-center hover:bg-[rgba(255,255,255,0.08)] transition-colors active:scale-95"
          >
            <ArrowLeft className="w-4.5 h-4.5 text-secondary" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-primary flex items-center gap-2">
              Active Jobs
              {jobs.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-gold/20 text-gold text-[10px] font-bold uppercase tracking-wider">
                  {jobs.length}
                </span>
              )}
            </h1>
            <p className="text-[13px] text-secondary mt-0.5">Complete transfers & submit UTR</p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="page-card h-[320px] relative overflow-hidden">
              <div className="skeleton absolute inset-0" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="page-card flex flex-col items-center justify-center py-10 text-center gap-3">
          <AlertCircle className="w-10 h-10 text-danger opacity-80" />
          <p className="text-sm font-medium text-primary">Failed to load active jobs.</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="page-card flex flex-col items-center justify-center py-16 text-center gap-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,166,35,0.04)_0%,transparent_70%)] pointer-events-none" />
          <div className="w-16 h-16 rounded-full bg-[rgba(255,255,255,0.02)] border border-border-subtle flex items-center justify-center relative z-10">
            <CheckCircle2 className="w-7 h-7 text-muted" />
          </div>
          <div className="relative z-10">
            <p className="text-[16px] font-bold text-primary">No active jobs</p>
            <p className="text-[13px] text-secondary mt-1 max-w-[280px]">
              You don&apos;t have any grabbed jobs right now. Head to the Live Pool to grab new ones.
            </p>
          </div>
          <button
            onClick={() => router.push('/live-pool')}
            className="mt-2 px-6 py-2.5 rounded-full text-[13px] font-bold text-white bg-[#10b981] hover:bg-[#059669] transition-all active:scale-[0.97] flex items-center gap-2 shadow-[0_0_16px_rgba(16,185,129,0.3)] z-10"
          >
            <Zap className="w-4 h-4 fill-current" />
            Go to Live Pool
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {jobs.map((job) => (
            <ActiveJobCard
              key={job._id}
              job={job}
              onSubmitSuccess={handleSubmitSuccess}
            />
          ))}

          {/* Footer link */}
          <button
            onClick={() => router.push('/live-pool')}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[13px] font-semibold text-secondary hover:text-primary transition-colors active:opacity-75"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Zap className="w-3.5 h-3.5" />
            Grab more jobs from Live Pool
          </button>
        </div>
      )}
    </div>
  )
}
