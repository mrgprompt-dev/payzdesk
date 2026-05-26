'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { apiClient } from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'

/* ── Schemas ─────────────────────────────────────────────────────────────── */

const step1Schema = z.object({
  name: z.string().min(2, 'At least 2 characters').max(60),
  phone: z
    .string()
    .length(10, 'Must be exactly 10 digits')
    .regex(/^[0-9]{10}$/, 'Digits only'),
  password: z.string().min(6, 'Minimum 6 characters'),
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

const step2Schema = z.object({
  otp: z.string().length(6, 'Enter the 6-digit OTP').regex(/^[0-9]{6}$/),
})

type Step1 = z.infer<typeof step1Schema>
type Step2 = z.infer<typeof step2Schema>

/* ── Component ───────────────────────────────────────────────────────────── */

export default function RegisterPage() {
  const router = useRouter()
  const { fetchMe } = useAuthStore()

  const [step, setStep] = useState<1 | 2>(1)
  const [step1Data, setStep1Data] = useState<Step1 | null>(null)
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const form1 = useForm<Step1>({ resolver: zodResolver(step1Schema) })
  const form2 = useForm<Step2>({ resolver: zodResolver(step2Schema) })

  const startCooldown = () => {
    setCooldown(60)
    const iv = setInterval(() => setCooldown(c => {
      if (c <= 1) { clearInterval(iv); return 0 }
      return c - 1
    }), 1000)
  }

  const sendOtp = async (phone: string) => {
    setOtpSending(true)
    try {
      await apiClient.post('/auth/otp/send', { phone, purpose: 'register' })
      startCooldown()
    } finally {
      setOtpSending(false)
    }
  }

  const onStep1 = async (data: Step1) => {
    setServerError('')
    try {
      await sendOtp(data.phone)
      setStep1Data(data)
      setStep(2)
    } catch (err: unknown) {
      setServerError(
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Failed to send OTP. Try again.'
      )
    }
  }

  const onStep2 = async (data: Step2) => {
    if (!step1Data) return
    setServerError('')
    try {
      await apiClient.post('/auth/register', {
        name: step1Data.name,
        phone: step1Data.phone,
        password: step1Data.password,
        otp: data.otp,
        referralCode: step1Data.referralCode || undefined,
      })
      await fetchMe()
      router.push('/')
    } catch (err: unknown) {
      setServerError(
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Registration failed. Try again.'
      )
    }
  }

  const resend = async () => {
    if (!step1Data || cooldown > 0) return
    setServerError('')
    try {
      await sendOtp(step1Data.phone)
    } catch (err: unknown) {
      setServerError(
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Could not resend OTP.'
      )
    }
  }

  /* ── Shared input style helper ── */
  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    borderColor: hasError ? 'var(--accent-red)' : undefined,
    boxShadow: hasError ? '0 0 0 3px var(--accent-red-dim)' : undefined,
  })

  return (
    <div className="auth-page">
      <div style={{ 
        width: '100%', 
        maxWidth: 440, 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        margin: '0 auto' 
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', margin: '4vh 0 3vh', animation: 'fadeIn var(--transition-slow)' }}>
          <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: 0, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
            Payz<span style={{ color: 'var(--accent-gold)' }}>Desk</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 6, fontWeight: 500 }}>
            Agent Management Platform
          </p>
        </div>

        {/* Step bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24, padding: '0 8px', animation: 'fadeIn var(--transition-base)' }}>
          {[1, 2].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: s < 2 ? 1 : 'initial' }}>
              <div className={`step-dot ${step > s ? 'done' : step === s ? 'active' : 'upcoming'}`}>
                {step > s ? <CheckCircle2 size={14} /> : s}
              </div>
              {i < 1 && (
                <div className={`step-line ${step > s ? 'done' : ''}`} />
              )}
            </div>
          ))}
          <div style={{ marginLeft: 10, fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
            Step {step} of 2
          </div>
        </div>

        {/* Card */}
        <div className="auth-card">

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                Create account
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 22 }}>
                Fill in your details to get started
              </p>

              <form
                method="POST"
                action="#"
                onSubmit={(e) => {
                  e.preventDefault()
                  form1.handleSubmit(onStep1)(e)
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >

                {/* Name */}
                <div>
                  <label className="field-label">Full Name</label>
                  <input
                    {...form1.register('name')}
                    type="text"
                    placeholder="Your full name"
                    className="form-input"
                    style={inputStyle(!!form1.formState.errors.name)}
                  />
                  {form1.formState.errors.name && (
                    <p className="field-error">{form1.formState.errors.name.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="field-label">Phone Number</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                      fontSize: 14, color: 'var(--text-secondary)', userSelect: 'none', fontWeight: 500,
                    }}>+91</span>
                    <input
                      {...form1.register('phone')}
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="9876543210"
                      className="form-input"
                      style={{ paddingLeft: 46, ...inputStyle(!!form1.formState.errors.phone) }}
                    />
                  </div>
                  {form1.formState.errors.phone && (
                    <p className="field-error">{form1.formState.errors.phone.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="field-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      {...form1.register('password')}
                      type={showPwd ? 'text' : 'password'}
                      placeholder="Minimum 6 characters"
                      className="form-input"
                      style={{ paddingRight: 46, ...inputStyle(!!form1.formState.errors.password) }}
                    />
                    <button type="button" onClick={() => setShowPwd(v => !v)} style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--text-muted)', lineHeight: 0,
                    }}>
                      {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {form1.formState.errors.password && (
                    <p className="field-error">{form1.formState.errors.password.message}</p>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="field-label">Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      {...form1.register('confirmPassword')}
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Repeat your password"
                      className="form-input"
                      style={{ paddingRight: 46, ...inputStyle(!!form1.formState.errors.confirmPassword) }}
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)} style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--text-muted)', lineHeight: 0,
                    }}>
                      {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {form1.formState.errors.confirmPassword && (
                    <p className="field-error">{form1.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Referral code */}
                <div>
                  <label className="field-label">
                    Referral Code{' '}
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    {...form1.register('referralCode')}
                    type="text"
                    placeholder="e.g. PDABC123"
                    className="form-input"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>

                {serverError && <div className="error-banner">{serverError}</div>}

                <button
                  type="submit"
                  disabled={form1.formState.isSubmitting || otpSending}
                  className="btn-primary"
                  style={{ marginTop: 4 }}
                >
                  {(form1.formState.isSubmitting || otpSending)
                    ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sending OTP...</>
                    : 'Continue →'
                  }
                </button>
              </form>
            </>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === 2 && step1Data && (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                Verify your number
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 22, lineHeight: 1.5 }}>
                OTP sent to{' '}
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  +91 {step1Data.phone}
                </span>
              </p>

              <form
                method="POST"
                action="#"
                onSubmit={(e) => {
                  e.preventDefault()
                  form2.handleSubmit(onStep2)(e)
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >

                <div>
                  <label className="field-label">Enter OTP</label>
                  <input
                    {...form2.register('otp')}
                    type="tel"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    className={`form-input otp-input ${form2.formState.errors.otp ? 'error' : ''}`}
                    autoFocus
                  />
                  {form2.formState.errors.otp && (
                    <p className="field-error">{form2.formState.errors.otp.message}</p>
                  )}
                </div>

                {/* Resend / back row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setServerError('') }}
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    ← Change number
                  </button>
                  <button
                    type="button"
                    onClick={resend}
                    disabled={cooldown > 0 || otpSending}
                    style={{
                      color: cooldown > 0 ? 'var(--text-muted)' : 'var(--text-link)',
                      fontWeight: 500,
                    }}
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                  </button>
                </div>

                {serverError && <div className="error-banner">{serverError}</div>}

                <button
                  type="submit"
                  disabled={form2.formState.isSubmitting}
                  className="btn-primary"
                  style={{ marginTop: 4 }}
                >
                  {form2.formState.isSubmitting
                    ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating account...</>
                    : 'Verify & Create Account'
                  }
                </button>
              </form>
            </>
          )}

          {/* Login link */}
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginTop: 24 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--text-link)', fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
