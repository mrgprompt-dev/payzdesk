'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { formatINR } from '@/utils'
import {
  Building2,
  ArrowDownToLine,
  ArrowUpFromLine,
  Wallet,
  Shield,
  Clock,
  Landmark,
  AlertCircle,
  Zap,
  Lock,
  Headphones,
  ChevronRight,
  Users,
} from 'lucide-react'

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-[14px] border border-border bg-card p-4 space-y-3">
      <div className="h-3 w-1/2 rounded animate-pulse bg-[var(--bg-skeleton)]" />
      <div className="h-6 w-1/3 rounded animate-pulse bg-[var(--bg-skeleton)]" />
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ElementType
  iconColor: string
  label: string
  value: string
  valueColor?: string
}

function StatCard({ icon: Icon, iconColor, label, value, valueColor }: StatCardProps) {
  return (
    <div className="rounded-[14px] border border-border bg-card backdrop-blur-md p-[14px] flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Icon className="h-[14px] w-[14px] shrink-0" style={{ color: iconColor }} />
        <span className="text-[12px] text-muted leading-tight">{label}</span>
      </div>
      <span
        className="text-[20px] font-bold leading-none"
        style={{ color: valueColor ?? 'var(--text-primary)' }}
      >
        {value}
      </span>
    </div>
  )
}

// ─── Mini stat (bottom row of overview card) ──────────────────────────────────

interface MiniStatProps {
  icon: React.ElementType
  iconColor: string
  label: string
  value: string
}

function MiniStat({ icon: Icon, iconColor, label, value }: MiniStatProps) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1 py-3">
      <Icon className="h-4 w-4" style={{ color: iconColor }} />
      <span className="text-[11px] text-muted text-center leading-tight">{label}</span>
      <span className="text-[15px] font-bold text-primary">{value}</span>
    </div>
  )
}

// ─── Quick link button ────────────────────────────────────────────────────────

interface QuickLinkProps {
  icon: React.ElementType
  iconColor: string
  label: string
  href: string
}

function QuickLink({ icon: Icon, iconColor, label, href }: QuickLinkProps) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 touch-manipulation"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <div
        className="h-[52px] w-[52px] rounded-full flex items-center justify-center transition-transform active:scale-95"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <Icon className="h-5 w-5" style={{ color: iconColor }} />
      </div>
      <span className="text-[11px] font-semibold text-secondary text-center leading-tight max-w-[60px]">
        {label}
      </span>
    </Link>
  )
}

// ─── Inline transaction row ───────────────────────────────────────────────────

// Placeholder until /api/transactions is built
function EmptyListCard({ title }: { title: string }) {
  return (
    <div className="rounded-[14px] border border-border bg-card backdrop-blur-md p-4">
      <p className="text-[13px] font-bold uppercase tracking-wider text-primary mb-2">
        {title}
      </p>
      <p className="text-[13px] text-muted">No data available</p>
    </div>
  )
}

// ─── Dashboard page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, isLoading, fetchMe } = useAuthStore()

  // Hydrate user on mount if not already loaded
  useEffect(() => {
    if (!user) fetchMe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 animate-[fadeIn_200ms_ease-out]">
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  const fmt = (n: number) => formatINR(n)

  return (
    <div className="flex flex-col gap-4 animate-[fadeIn_200ms_ease-out]">

      {/* ══════════════════════════════════════════
          OVERVIEW CARD
          ══════════════════════════════════════════ */}
      <div className="rounded-[14px] border border-border bg-card backdrop-blur-md overflow-hidden">

        {/* Header row — OVERVIEW label + pill tabs */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 gap-2 flex-wrap">
          <span className="text-[15px] font-bold text-primary tracking-wide">OVERVIEW</span>
          <div className="flex items-center gap-2">
            <Link
              href="/deposits"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-secondary transition-colors active:scale-95"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <ArrowDownToLine className="h-3 w-3" />
              Deposit Requests ({user?.totalBanks ?? 0})
            </Link>
            <Link
              href="/withdrawals"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-secondary transition-colors active:scale-95"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <ArrowUpFromLine className="h-3 w-3" />
              Withdrawals (0)
            </Link>
          </div>
        </div>

        {/* 2×2 metric grid */}
        <div className="grid grid-cols-2 gap-3 px-4 pb-3">
          <StatCard
            icon={Landmark}
            iconColor="var(--accent-gold)"
            label="Net Balance"
            value={fmt(user?.netBalance ?? 0)}
            valueColor="var(--text-primary)"
          />
          <StatCard
            icon={Wallet}
            iconColor="var(--accent-green-light)"
            label="Commission Earned"
            value={fmt(user?.commissionEarned ?? 0)}
            valueColor="var(--accent-green-light)"
          />
          <StatCard
            icon={Shield}
            iconColor="var(--accent-amber)"
            label="Blocked Deposit"
            value={fmt(user?.blockedDeposit ?? 0)}
          />
          <StatCard
            icon={Clock}
            iconColor="var(--accent-blue)"
            label="WDR Hold Amount"
            value={fmt(user?.withdrawalHoldAmount ?? 0)}
          />
        </div>

        {/* Divider */}
        <div className="h-px mx-4" style={{ background: 'var(--border-subtle)' }} />

        {/* Bottom row — 3 mini stats */}
        <div className="flex divide-x px-2" style={{ borderColor: 'var(--border-subtle)' }}>
          <MiniStat
            icon={Building2}
            iconColor="var(--accent-amber)"
            label="Total Banks"
            value={String(user?.totalBanks ?? 0)}
          />
          <MiniStat
            icon={Landmark}
            iconColor="var(--accent-blue)"
            label="Active Banks"
            value={String(user?.activeBanks ?? 0)}
          />
          <MiniStat
            icon={AlertCircle}
            iconColor="var(--accent-red)"
            label="Disputed WDR"
            value={fmt(user?.disputedWithdrawalAmount ?? 0)}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════
          LIVE POOL CARD (locked state)
          ══════════════════════════════════════════ */}
      <div
        className="rounded-[14px] border p-4 relative overflow-hidden"
        style={{
          background: 'rgba(180, 120, 0, 0.18)',
          borderColor: 'var(--accent-gold)',
        }}
      >
        {/* LIVE badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3 text-[11px] font-bold"
          style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--accent-gold)' }}
        >
          <Zap className="h-3 w-3 fill-current" />
          LIVE
        </div>

        {/* Content + lock overlay */}
        <div className="relative">
          <div className="blur-[2px] select-none pointer-events-none">
            <p className="text-[15px] font-bold text-primary mb-1">Earn Extra Commission</p>
            <p className="text-[13px] text-secondary leading-snug">
              GRAB a withdrawal request before someone else does!
            </p>
          </div>
          {/* Lock icon centred over blurred content */}
          <div className="absolute inset-0 flex items-center justify-end pr-2">
            <Lock className="h-6 w-6" style={{ color: 'var(--accent-gold)' }} />
          </div>
        </div>

        <p className="text-[12px] text-secondary mt-3 mb-3">
          Enable Withdrawal in Settings to unlock
        </p>

        <div className="flex items-center justify-between gap-3">
          {/* Disabled button */}
          <button
            disabled
            className="flex-1 py-3 rounded-full text-[14px] font-bold text-muted flex items-center justify-center gap-2 cursor-not-allowed"
            style={{ background: 'var(--bg-input)' }}
          >
            Open Live Pool
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* How to use link */}
          <Link
            href="/help/faq"
            className="text-[12px] font-semibold shrink-0"
            style={{ color: 'var(--accent-gold)' }}
          >
            How to use?
          </Link>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          QUICK LINKS CARD
          ══════════════════════════════════════════ */}
      <div className="rounded-[14px] border border-border bg-card backdrop-blur-md p-4">
        <p className="text-[15px] font-bold text-primary mb-4">Quick Links</p>

        <div className="flex justify-around mb-4">
          <QuickLink
            icon={Building2}
            iconColor="var(--accent-green-light)"
            label="Bank Accounts"
            href="/banks"
          />
          <QuickLink
            icon={ArrowDownToLine}
            iconColor="var(--accent-blue)"
            label="Deposit Requests"
            href="/deposits"
          />
          <QuickLink
            icon={ArrowUpFromLine}
            iconColor="var(--accent-amber)"
            label="Withdrawal Requests"
            href="/withdrawals"
          />
          <QuickLink
            icon={Wallet}
            iconColor="var(--accent-red)"
            label="Withdraw"
            href="/withdrawals"
          />
        </div>

        {/* Referral strip */}
        <Link
          href="/referral"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[12px] font-semibold transition-opacity active:opacity-75"
          style={{
            background: 'var(--accent-blue-dim)',
            color: 'var(--accent-blue-light)',
            border: '1px solid rgba(59,130,246,0.2)',
          }}
        >
          <Users className="h-3.5 w-3.5" />
          Click Here To Access Referral Program
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* ══════════════════════════════════════════
          CUSTOMER SUPPORT — standalone pill button
          ══════════════════════════════════════════ */}
      <Link
        href="/support"
        className="flex items-center justify-center gap-2.5 w-full py-4 rounded-full text-[15px] font-bold text-white transition-opacity active:opacity-80"
        style={{
          background: 'linear-gradient(145deg, var(--accent-blue-light), var(--accent-blue))',
        }}
      >
        <Headphones className="h-4 w-4" />
        Customer Support
      </Link>

      {/* ══════════════════════════════════════════
          INLINE DEPOSIT REQUESTS LIST
          ══════════════════════════════════════════ */}
      <EmptyListCard title="Deposit Requests (0)" />

      {/* ══════════════════════════════════════════
          INLINE WITHDRAWAL REQUESTS LIST
          ══════════════════════════════════════════ */}
      <EmptyListCard title="Withdrawal Requests" />

    </div>
  )
}