'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  accountNumber:     string
  upiId:             string
  accountHolderName: string
  ifscCode:          string
  bankName:          string
  branch:            string
  address:           string
  phone:             string
}

interface FormErrors {
  accountNumber?:     string
  upiId?:             string
  accountHolderName?: string
  ifscCode?:          string
  bankName?:          string
  branch?:            string
  address?:           string
  phone?:             string
  general?:           string
}

type Step = 'form' | 'otp' | 'success'

// ─── Validation ───────────────────────────────────────────────────────────────

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {}

  if (!form.accountNumber.trim())
    errors.accountNumber = 'Account number is required'

  if (!form.accountHolderName.trim())
    errors.accountHolderName = 'Account holder name is required'

  if (!form.ifscCode.trim()) {
    errors.ifscCode = 'IFSC code is required'
  } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifscCode.toUpperCase())) {
    errors.ifscCode = 'Invalid IFSC format (e.g. SBIN0001234)'
  }

  if (!form.bankName.trim())
    errors.bankName = 'Bank name is required'

  if (!form.phone.trim()) {
    errors.phone = 'Phone number is required'
  } else if (!/^[0-9]{10}$/.test(form.phone)) {
    errors.phone = 'Enter a valid 10-digit phone number'
  }

  return errors
}

// ─── OTP Countdown hook ───────────────────────────────────────────────────────

function useOTPCountdown(initial: number) {
  const [seconds, setSeconds] = useState(initial)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function start() {
    setSeconds(initial)
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!)
          return 0
        }
        return s - 1
      })
    }, 1000)
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  return { seconds, start, canResend: seconds === 0 }
}

// ─── Step 1: Add Bank Form ────────────────────────────────────────────────────

interface AddBankFormProps {
  onSuccess: (bankId: string) => void
}

// Input field renderer
function Field({
  id, label, placeholder, value, onChange, type = 'text', error, prefix,
}: {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  type?: string
  error?: string
  prefix?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <p className="section-label">{label}</p>
      <div style={{ display: 'flex', gap: '8px' }}>
        {prefix && (
          <div
            style={{
              padding:         '16px 12px',
              background:      'var(--bg-input)',
              border:          '1px solid var(--border-subtle)',
              borderRadius:    'var(--radius-md)',
              fontSize:        '16px',
              fontWeight:      600,
              color:           'var(--text-secondary)',
              whiteSpace:      'nowrap',
              display:         'flex',
              alignItems:      'center',
            }}
          >
            {prefix}
          </div>
        )}
        <input
          id={id}
          type={type}
          inputMode={type === 'tel' || type === 'number' ? 'numeric' : undefined}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`form-input${error ? ' error' : ''}`}
          style={{ flex: 1 }}
        />
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}

function AddBankForm({ onSuccess }: AddBankFormProps) {
  const [form, setForm]           = useState<FormState>({
    accountNumber:     '',
    upiId:             '',
    accountHolderName: '',
    ifscCode:          '',
    bankName:          '',
    branch:            '',
    address:           '',
    phone:             '',
  })
  const [errors, setErrors]         = useState<FormErrors>({})
  const [disclaimer, setDisclaimer] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [serverError, setServerError] = useState('')

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function handleIFSCChange(value: string) {
    handleChange('ifscCode', value.toUpperCase())
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError('')

    const validation = validateForm(form)
    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/banks', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          ...form,
          ifscCode: form.ifscCode.toUpperCase(),
        }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        setServerError(json.message ?? 'Failed to add bank account')
        return
      }

      onSuccess(json.data.bankId)
    } catch {
      setServerError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = disclaimer && !loading


  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="page-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <p className="section-label" style={{ fontSize: '13px', marginBottom: 0 }}>
          ADD BANK ACCOUNT
        </p>

        <Field
          id="accountNumber"
          label="ACCOUNT NO."
          placeholder="Enter account number"
          value={form.accountNumber}
          onChange={(v) => handleChange('accountNumber', v)}
          type="number"
          error={errors.accountNumber}
        />

        <Field
          id="upiId"
          label="UPI ID"
          placeholder="yourname@upi"
          value={form.upiId}
          onChange={(v) => handleChange('upiId', v)}
          error={errors.upiId}
        />

        <Field
          id="accountHolderName"
          label="ACCOUNT HOLDER NAME"
          placeholder="Full name on account"
          value={form.accountHolderName}
          onChange={(v) => handleChange('accountHolderName', v)}
          error={errors.accountHolderName}
        />

        <Field
          id="ifscCode"
          label="IFSC CODE"
          placeholder="e.g. SBIN0001234"
          value={form.ifscCode}
          onChange={handleIFSCChange}
          error={errors.ifscCode}
        />

        <Field
          id="bankName"
          label="BANK NAME"
          placeholder="e.g. State Bank of India"
          value={form.bankName}
          onChange={(v) => handleChange('bankName', v)}
          error={errors.bankName}
        />

        <Field
          id="branch"
          label="BANK BRANCH"
          placeholder="Branch name (optional)"
          value={form.branch}
          onChange={(v) => handleChange('branch', v)}
          error={errors.branch}
        />

        <Field
          id="address"
          label="BANK ADDRESS"
          placeholder="Branch address (optional)"
          value={form.address}
          onChange={(v) => handleChange('address', v)}
          error={errors.address}
        />

        {/* Phone row — +91 prefix */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <p className="section-label">PHONE NO.</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div
              style={{
                padding:         '0 14px',
                minHeight:       '54px',
                background:      'var(--bg-input)',
                border:          '1px solid var(--border-subtle)',
                borderRadius:    'var(--radius-md)',
                fontSize:        '16px',
                fontWeight:      600,
                color:           'var(--text-secondary)',
                display:         'flex',
                alignItems:      'center',
                flexShrink:      0,
              }}
            >
              +91
            </div>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit phone number"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              className={`form-input${errors.phone ? ' error' : ''}`}
              style={{ flex: 1 }}
            />
          </div>
          {errors.phone && <p className="field-error">{errors.phone}</p>}
        </div>
      </div>

      {/* OTP disclaimer checkbox */}
      <div
        style={{
          display:       'flex',
          alignItems:    'flex-start',
          gap:           '12px',
          padding:       '14px 16px',
          background:    'rgba(245,166,35,0.06)',
          border:        '1px solid rgba(245,166,35,0.2)',
          borderRadius:  'var(--radius-md)',
        }}
      >
        <div style={{ flexShrink: 0, marginTop: '2px' }}>
          <input
            id="disclaimer"
            type="checkbox"
            checked={disclaimer}
            onChange={(e) => setDisclaimer(e.target.checked)}
            style={{
              width:         '20px',
              height:        '20px',
              accentColor:   'var(--accent-gold)',
              cursor:        'pointer',
              borderRadius:  '4px',
            }}
          />
        </div>
        <label htmlFor="disclaimer" style={{ cursor: 'pointer', lineHeight: 1.5 }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-gold)', letterSpacing: '0.05em' }}>
            IMPORTANT:{' '}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            An OTP will be sent to your registered phone number to verify this bank account.
          </span>
        </label>
      </div>

      {/* Server error */}
      {serverError && (
        <div className="error-banner">
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          {serverError}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="btn-gold"
        style={{
          opacity:        canSubmit ? 1 : 0.45,
          cursor:         canSubmit ? 'pointer' : 'not-allowed',
          transition:     'opacity 200ms ease-out, transform 150ms ease-out, box-shadow 150ms ease-out',
        }}
      >
        {loading ? (
          <>
            <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
            Sending OTP…
          </>
        ) : (
          'Verify & Add Bank Account'
        )}
      </button>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </form>
  )
}

// ─── Step 2: OTP Verification ─────────────────────────────────────────────────

interface OTPStepProps {
  bankId:  string
  onSuccess: () => void
}

function OTPStep({ bankId, onSuccess }: OTPStepProps) {
  const [otp, setOtp]               = useState('')
  const [loading, setLoading]       = useState(false)
  const [serverError, setServerError] = useState('')
  const [resending, setResending]   = useState(false)
  const { seconds, start, canResend } = useOTPCountdown(60)

  // Start countdown on mount
  useEffect(() => { start() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length !== 6) return
    setServerError('')
    setLoading(true)
    try {
      const res = await fetch('/api/banks/verify-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ bankId, otp }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setServerError(json.message ?? 'Verification failed')
        return
      }
      onSuccess()
    } catch {
      setServerError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (!canResend || resending) return
    setServerError('')
    setResending(true)
    try {
      // Re-trigger OTP by calling the bank's parent flow isn't available here
      // so we call /api/auth/otp/send with bank-verify purpose on the user's phone.
      // The user phone comes from their session — we pass an empty body the route
      // already knows the user from the cookie.
      const res = await fetch('/api/banks/resend-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ bankId }),
      })
      const json = await res.json()
      if (json.success) {
        start()
      } else {
        setServerError(json.message ?? 'Failed to resend OTP')
      }
    } catch {
      setServerError('Network error. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <form onSubmit={handleVerify} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="page-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
        <div
          style={{
            width:           '56px',
            height:          '56px',
            borderRadius:    '50%',
            background:      'rgba(245,166,35,0.1)',
            border:          '1px solid rgba(245,166,35,0.2)',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            margin:          '8px auto 0',
          }}
        >
          <span style={{ fontSize: '24px' }}>📱</span>
        </div>

        <div>
          <p style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Verify Your Number
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
            We sent a 6-digit OTP to your registered phone number. Enter it below to activate your bank account.
          </p>
        </div>

        {/* OTP Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p className="section-label" style={{ textAlign: 'left' }}>ENTER OTP</p>
          <input
            id="otp"
            type="tel"
            inputMode="numeric"
            maxLength={6}
            placeholder="• • • • • •"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="form-input otp-input"
            autoComplete="one-time-code"
            style={{ textAlign: 'center' }}
          />
        </div>

        {/* Resend */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {canResend ? "Didn't receive it?" : `Resend in ${seconds}s`}
          </span>
          {canResend && (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              style={{
                fontSize:   '13px',
                fontWeight: 600,
                color:      'var(--accent-gold)',
                cursor:     resending ? 'not-allowed' : 'pointer',
                opacity:    resending ? 0.6 : 1,
                background: 'none',
                border:     'none',
                padding:    '0',
              }}
            >
              {resending ? 'Sending…' : 'Resend OTP'}
            </button>
          )}
        </div>
      </div>

      {/* Server error */}
      {serverError && (
        <div className="error-banner">
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          {serverError}
        </div>
      )}

      {/* Verify button */}
      <button
        type="submit"
        disabled={otp.length !== 6 || loading}
        className="btn-gold"
        style={{
          opacity:  otp.length === 6 && !loading ? 1 : 0.45,
          cursor:   otp.length === 6 && !loading ? 'pointer' : 'not-allowed',
        }}
      >
        {loading ? (
          <>
            <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
            Verifying…
          </>
        ) : (
          'Verify Bank Account'
        )}
      </button>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </form>
  )
}

// ─── Step 3: Success ──────────────────────────────────────────────────────────

function SuccessStep() {
  const router = useRouter()

  useEffect(() => {
    const t = setTimeout(() => router.replace('/banks'), 2500)
    return () => clearTimeout(t)
  }, [router])

  return (
    <div
      className="page-card"
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        gap:            '16px',
        textAlign:      'center',
        padding:        '40px 20px',
        animation:      'fadeIn 200ms ease-out',
      }}
    >
      <CheckCircle2 size={56} style={{ color: 'var(--accent-green)' }} />
      <div>
        <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Bank Account Verified!
        </p>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>
          Your bank account is now active and ready to use.
        </p>
      </div>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
        Redirecting to Bank Accounts…
      </p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AddBankPage() {
  const [step, setStep]     = useState<Step>('form')
  const [bankId, setBankId] = useState('')

  function handleFormSuccess(id: string) {
    setBankId(id)
    setStep('otp')
  }

  function handleOTPSuccess() {
    setStep('success')
  }

  return (
    <div
      style={{
        display:       'flex',
        flexDirection: 'column',
        gap:           '16px',
        animation:     'fadeIn 200ms ease-out',
      }}
    >
      {/* Back nav + page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {step === 'form' && (
          <Link
            href="/banks"
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              width:          '40px',
              height:         '40px',
              borderRadius:   'var(--radius-sm)',
              background:     'rgba(255,255,255,0.06)',
              border:         '1px solid var(--border-subtle)',
              flexShrink:     0,
              touchAction:    'manipulation',
            }}
            aria-label="Back to bank accounts"
          >
            <ArrowLeft size={18} style={{ color: 'var(--text-secondary)' }} />
          </Link>
        )}
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {step === 'form'    ? 'Add Bank Account'
            : step === 'otp'   ? 'Verify OTP'
            : 'Account Added'}
          </h1>
          {/* Step indicator */}
          {step !== 'success' && (
            <div
              style={{
                display:    'flex',
                alignItems: 'center',
                gap:        '6px',
                marginTop:  '4px',
              }}
            >
              {(['form', 'otp'] as const).map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div
                    style={{
                      width:        '6px',
                      height:       '6px',
                      borderRadius: '50%',
                      background:   step === s
                        ? 'var(--accent-gold)'
                        : (i === 0 && step === 'otp')
                          ? 'var(--accent-green)'
                          : 'var(--text-muted)',
                      transition:   'background-color 250ms ease-out',
                    }}
                  />
                  {i === 0 && (
                    <div
                      style={{
                        width:        '20px',
                        height:       '2px',
                        borderRadius: '2px',
                        background:   step === 'otp' ? 'var(--accent-green)' : 'var(--border-default)',
                        transition:   'background-color 250ms ease-out',
                      }}
                    />
                  )}
                </div>
              ))}
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '4px' }}>
                Step {step === 'form' ? 1 : 2} of 2
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Step content */}
      {step === 'form'    && <AddBankForm onSuccess={handleFormSuccess} />}
      {step === 'otp'     && <OTPStep bankId={bankId} onSuccess={handleOTPSuccess} />}
      {step === 'success' && <SuccessStep />}
    </div>
  )
}
