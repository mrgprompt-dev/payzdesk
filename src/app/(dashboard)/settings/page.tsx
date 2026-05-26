'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'
import { ArrowRight, Fingerprint, Shield, ArrowDownToLine, AlertCircle } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserSettings {
  withdrawalEnabled: boolean
  maxWithdrawalPerTxn: number
  appLockEnabled: boolean
}

// ─── Fetch & Mutate ───────────────────────────────────────────────────────────

async function fetchSettings(): Promise<UserSettings> {
  const res = await fetch('/api/settings')
  if (!res.ok) throw new Error('Failed to fetch settings')
  const json = await res.json()
  return json.data
}

async function toggleWithdrawal(enabled: boolean): Promise<UserSettings> {
  const res = await fetch('/api/settings/withdrawal', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  })
  if (!res.ok) throw new Error('Failed to update withdrawal setting')
  const json = await res.json()
  return json.data
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="skeleton h-4 w-32 rounded mb-1" />
        <div className="skeleton h-[76px] rounded-[14px] w-full" />
        <div className="skeleton h-[76px] rounded-[14px] w-full" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="skeleton h-4 w-32 rounded mb-1" />
        <div className="skeleton h-[110px] rounded-[14px] w-full" />
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SettingsPage() {
  const queryClient = useQueryClient()
  
  const { data: settings, isLoading, isError } = useQuery<UserSettings>({
    queryKey: ['settings'],
    queryFn: fetchSettings,
    staleTime: 60_000,
  })

  const { mutate: setWithdrawal, isPending: isUpdatingWithdrawal } = useMutation({
    mutationFn: toggleWithdrawal,
    onSuccess: (newData) => {
      queryClient.setQueryData(['settings'], newData)
      // Invalidating auth will let Live Pool card unlock if user updates
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      // Sync Zustand store for immediate dashboard Live Pool update
      useAuthStore.getState().fetchMe()
    },
  })

  // Local state for optimistic UI updates for app lock (stubbed for MVP)
  const [localAppLock, setLocalAppLock] = useState<boolean | null>(null)
  const appLock = localAppLock ?? settings?.appLockEnabled ?? false

  if (isLoading) {
    return (
      <div className="animate-[fadeIn_200ms_ease-out]">
        <h1 className="text-lg font-bold text-primary mb-4">Settings</h1>
        <SettingsSkeleton />
      </div>
    )
  }

  if (isError || !settings) {
    return (
      <div className="animate-[fadeIn_200ms_ease-out]">
        <h1 className="text-lg font-bold text-primary mb-4">Settings</h1>
        <div className="error-banner">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          Failed to load settings. Please refresh the page.
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_200ms_ease-out]">
      <h1 className="text-lg font-bold text-primary">Settings</h1>

      {/* ── APP SECURITY ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <p className="section-label mb-0 px-1">APP SECURITY</p>
        
        <div className="page-card p-0! overflow-hidden flex flex-col divide-y divide-border-subtle">
          
          {/* App Lock Toggle */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.15)]">
                <Fingerprint className="w-5 h-5 text-blue" />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-bold text-primary truncate">App Lock</p>
                <p className="text-[12px] text-muted truncate">Require PIN / Biometrics</p>
              </div>
            </div>
            
            {/* Tailwind Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={appLock}
                onChange={() => setLocalAppLock(!appLock)}
              />
              <div className="w-11 h-6 bg-input border border-border-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green peer-checked:border-green"></div>
            </label>
          </div>

          {/* Change Password Link */}
          <Link
            href="/settings/change-password"
            className="flex items-center justify-between p-4 active:bg-[rgba(255,255,255,0.02)] transition-colors touch-manipulation"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.15)]">
                <Shield className="w-5 h-5 text-warning" />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-bold text-primary truncate">Change Password</p>
                <p className="text-[12px] text-muted truncate">Update your login password</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted" />
          </Link>
          
        </div>
      </div>

      {/* ── WITHDRAWAL ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <p className="section-label mb-0 px-1">WITHDRAWAL</p>
        
        <div className="page-card p-0! overflow-hidden flex flex-col">
          
          <div className="flex items-start justify-between p-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[rgba(245,166,35,0.08)] border border-[rgba(245,166,35,0.15)]">
                <ArrowDownToLine className="w-5 h-5 text-gold" />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-bold text-primary truncate">Withdrawal</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${settings.withdrawalEnabled ? 'bg-green' : 'bg-red'}`} />
                  <p className={`text-[12px] font-semibold ${settings.withdrawalEnabled ? 'text-green' : 'text-red'}`}>
                    {settings.withdrawalEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Tailwind Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer mt-1">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.withdrawalEnabled}
                disabled={isUpdatingWithdrawal}
                onChange={(e) => setWithdrawal(e.target.checked)}
              />
              <div className={`w-11 h-6 bg-input border border-border-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green peer-checked:border-green ${isUpdatingWithdrawal ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
            </label>
          </div>

          <div className="px-4 pb-4">
            <div className="rounded-[10px] bg-input border border-border-subtle p-3 flex flex-col gap-1">
              <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Max Withdrawal Limit Per Txn
              </p>
              <p className="text-[14px] font-bold text-primary font-mono">
                ₹{settings.maxWithdrawalPerTxn.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          
        </div>
      </div>

    </div>
  )
}
