'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'

// Input wrapper with eye toggle
function PasswordInput({
  id, label, value, onChange, show, setShow, error
}: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  show: boolean; setShow: (v: boolean) => void; error?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[12px] font-bold text-secondary uppercase tracking-wider pl-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-input border ${error ? 'border-red focus:border-red' : 'border-border-subtle focus:border-border-focus'} rounded-[14px] px-4 py-3.5 text-sm text-primary transition-colors pr-12`}
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-[12px] text-red pl-1">{error}</p>}
    </div>
  )
}

export default function ChangePasswordPage() {
  const router = useRouter()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [errors, setErrors] = useState<{ currentPassword?: string; newPassword?: string; confirmPassword?: string; general?: string }>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const canSubmit = currentPassword && newPassword && confirmPassword && !loading

  function validate() {
    const errs: typeof errors = {}
    if (!currentPassword) errs.currentPassword = 'Required'
    
    if (!newPassword) {
      errs.newPassword = 'Required'
    } else if (newPassword.length < 8) {
      errs.newPassword = 'Must be at least 8 characters'
    } else if (newPassword === currentPassword) {
      errs.newPassword = 'New password must be different'
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Required'
    } else if (confirmPassword !== newPassword) {
      errs.confirmPassword = 'Passwords do not match'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || !validate()) return

    setLoading(true)
    setErrors({})

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      
      const json = await res.json()

      if (!res.ok || !json.success) {
        setErrors({ general: json.message ?? 'Failed to change password' })
        return
      }

      setSuccess(true)
      setTimeout(() => router.replace('/settings'), 1800)
    } catch {
      setErrors({ general: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }


  if (success) {
    return (
      <div className="page-card flex flex-col items-center gap-4 text-center py-10 animate-[fadeIn_200ms_ease-out]">
        <CheckCircle2 className="w-14 h-14 text-green" />
        <div>
          <p className="text-lg font-bold text-primary">Password Updated!</p>
          <p className="text-sm text-secondary mt-2">Your password has been changed successfully.</p>
        </div>
        <p className="text-[13px] text-muted">Redirecting to Settings…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6 animate-[fadeIn_200ms_ease-out]">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="flex items-center justify-center w-10 h-10 rounded-[10px] bg-[rgba(255,255,255,0.06)] border border-border-subtle shrink-0 touch-manipulation transition-opacity active:opacity-60"
        >
          <ArrowLeft className="w-4.5 h-4.5 text-secondary" />
        </Link>
        <h1 className="text-lg font-bold text-primary">Change Password</h1>
      </div>

      <div className="page-card flex flex-col gap-5">
        <PasswordInput
          id="current-password"
          label="Current Password"
          value={currentPassword}
          onChange={(v) => { setCurrentPassword(v); if (errors.currentPassword) setErrors(p => ({ ...p, currentPassword: undefined })) }}
          show={showCurrent}
          setShow={setShowCurrent}
          error={errors.currentPassword}
        />
        
        <PasswordInput
          id="new-password"
          label="New Password"
          value={newPassword}
          onChange={(v) => { setNewPassword(v); if (errors.newPassword) setErrors(p => ({ ...p, newPassword: undefined })) }}
          show={showNew}
          setShow={setShowNew}
          error={errors.newPassword}
        />

        <PasswordInput
          id="confirm-password"
          label="Confirm New Password"
          value={confirmPassword}
          onChange={(v) => { setConfirmPassword(v); if (errors.confirmPassword) setErrors(p => ({ ...p, confirmPassword: undefined })) }}
          show={showConfirm}
          setShow={setShowConfirm}
          error={errors.confirmPassword}
        />
      </div>

      {errors.general && (
        <div className="error-banner">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {errors.general}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className={`w-full bg-input border ${canSubmit ? 'border-border-strong text-primary' : 'border-border-subtle text-muted'} rounded-full py-4 text-base font-bold min-h-[54px] transition-all touch-manipulation ${canSubmit ? 'active:scale-[0.98]' : 'opacity-50 cursor-not-allowed'}`}
      >
        {loading ? 'Updating…' : 'Update Password'}
      </button>

    </form>
  )
}
