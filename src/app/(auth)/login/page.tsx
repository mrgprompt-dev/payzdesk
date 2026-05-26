'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  phone: z
    .string()
    .length(10, 'Enter a valid 10-digit phone number')
    .regex(/^[0-9]{10}$/, 'Digits only, no spaces'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const { fetchMe } = useAuthStore()

  const [showPwd, setShowPwd] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setServerError('')
    try {
      await apiClient.post('/auth/login', data)
      await fetchMe()
      router.push(redirect)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Login failed. Please try again.'
      setServerError(msg)
    }
  }

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

        {/* ── Logo ── */}
        <div style={{ textAlign: 'center', margin: '10vh 0 4vh', animation: 'fadeIn var(--transition-slow)' }}>
          <h1 style={{
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: 0,
            color: '#fff', /* White for gradient contrast */
            textShadow: '0 2px 10px rgba(0,0,0,0.2)'
          }}>
            Payz<span style={{ color: 'var(--accent-gold)' }}>Desk</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 6, fontWeight: 500 }}>
            Agent Management Platform
          </p>
        </div>

        {/* ── Card ── */}
        <div className="auth-card">
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            Welcome back
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28 }}>
            Sign in to your agent account
          </p>

          <form
            method="POST"
            action="#"
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit(onSubmit)(e)
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
          >

            {/* Phone */}
            <div>
              <label className="field-label">Phone Number</label>
              <div style={{ position: 'relative' }}>
                {/* +91 prefix */}
                <span style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 14, color: 'var(--text-secondary)', userSelect: 'none', fontWeight: 500,
                }}>
                  +91
                </span>
                <input
                  {...register('phone')}
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="9876543210"
                  className={`form-input ${errors.phone ? 'error' : ''}`}
                  style={{ paddingLeft: 46 }}
                />
              </div>
              {errors.phone && <p className="field-error">{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="field-label" style={{ marginBottom: 0 }}>Password</label>
                <Link
                  href="/forgot-password"
                  style={{ fontSize: 12, color: 'var(--text-link)', fontWeight: 500 }}
                >
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  {...register('password')}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  style={{ paddingRight: 46 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-muted)', lineHeight: 0,
                    transition: 'color var(--transition-fast)',
                  }}
                >
                  {showPwd
                    ? <EyeOff size={17} />
                    : <Eye size={17} />
                  }
                </button>
              </div>
              {errors.password && <p className="field-error">{errors.password.message}</p>}
            </div>

            {/* Server error */}
            {serverError && <div className="error-banner">{serverError}</div>}

            {/* Submit */}
            <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ marginTop: 4 }}>
              {isSubmitting
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Signing in...</>
                : 'Sign In'
              }
            </button>
          </form>

          {/* Register link */}
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginTop: 24 }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" style={{ color: 'var(--text-link)', fontWeight: 600 }}>
              Register here
            </Link>
          </p>
        </div>
      </div>

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
