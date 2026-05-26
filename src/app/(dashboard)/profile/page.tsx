'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { User, Phone, Mail, Calendar, Hash, Copy, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react'
import { formatDateTime } from '@/utils'

export default function ProfilePage() {
  const { user, isLoading, fetchMe } = useAuthStore()
  const [copied, setCopied] = useState(false)

  // Ensure user is loaded
  useEffect(() => {
    if (!user) fetchMe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopyReferral = () => {
    if (!user?.referralCode) return
    navigator.clipboard.writeText(user.referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-[fadeIn_200ms_ease-out]">
        <h1 className="text-lg font-bold text-primary">Profile</h1>
        <div className="page-card flex flex-col gap-6">
          <div className="skeleton h-16 w-16 rounded-full mx-auto" />
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex flex-col gap-2">
                <div className="skeleton h-3 w-20 rounded" />
                <div className="skeleton h-5 w-full rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col gap-6 animate-[fadeIn_200ms_ease-out]">
        <h1 className="text-lg font-bold text-primary">Profile</h1>
        <div className="error-banner">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          Failed to load profile. Please refresh.
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_200ms_ease-out]">
      <h1 className="text-lg font-bold text-primary">Profile</h1>

      <div className="page-card flex flex-col items-center pt-8 pb-6 px-4">
        
        {/* Avatar Placeholder */}
        <div className="w-20 h-20 rounded-full bg-[rgba(255,255,255,0.06)] border border-border-subtle flex items-center justify-center mb-4 shrink-0">
          <User className="w-8 h-8 text-secondary" />
        </div>
        
        <h2 className="text-xl font-bold text-primary">{user.name}</h2>
        <div className="flex items-center gap-1.5 mt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-green" />
          <span className="text-[12px] font-semibold text-green uppercase tracking-wide">
            {user.isActive ? 'Active Account' : 'Inactive Account'}
          </span>
        </div>

        {/* Details Grid */}
        <div className="w-full mt-8 flex flex-col gap-5">
          
          {/* Phone */}
          <div className="flex items-center gap-3 pb-4 border-b border-border-subtle">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[rgba(255,255,255,0.04)] border border-border-subtle">
              <Phone className="w-4.5 h-4.5 text-muted" />
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">Phone Number</p>
              <p className="text-[15px] text-primary truncate">+91 {user.phone}</p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-3 pb-4 border-b border-border-subtle">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[rgba(255,255,255,0.04)] border border-border-subtle">
              <Mail className="w-4.5 h-4.5 text-muted" />
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">Email Address</p>
              <p className="text-[15px] text-primary truncate">{user.email || '—'}</p>
            </div>
          </div>

          {/* Referral Code */}
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[rgba(245,166,35,0.08)] border border-[rgba(245,166,35,0.15)]">
                <Hash className="w-4.5 h-4.5 text-gold" />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">Referral Code</p>
                <p className="text-[15px] font-mono font-bold text-gold truncate">{user.referralCode || '—'}</p>
              </div>
            </div>
            {user.referralCode && (
              <button
                onClick={handleCopyReferral}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-[rgba(255,255,255,0.06)] border border-border-subtle shrink-0 touch-manipulation transition-colors active:bg-[rgba(255,255,255,0.1)]"
                aria-label="Copy referral code"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-green" /> : <Copy className="w-4 h-4 text-secondary" />}
              </button>
            )}
          </div>

          {/* Joined Date */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[rgba(255,255,255,0.04)] border border-border-subtle">
              <Calendar className="w-4.5 h-4.5 text-muted" />
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">Joined Date</p>
              <p className="text-[15px] text-primary truncate">{formatDateTime(user.createdAt)}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
