'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
    Users,
    ArrowDownToLine,
    ArrowUpFromLine,
    Hash,
    Building2,
    MessageSquare,
    Zap,
    AlertCircle,
} from 'lucide-react'
import type { AdminStats } from '@/types'

// ─── Fetch stats ──────────────────────────────────────────────────────────────

async function fetchStats(): Promise<AdminStats> {
    const res = await fetch('/api/admin/stats')
    if (!res.ok) throw new Error('Failed to load stats')
    const json = await res.json()
    return json.data
}

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
    label: string
    value: number | undefined
    icon: React.ElementType
    iconColor: string
    href: string
    badge?: boolean // true = show warning dot if value > 0
}

function StatCard({ label, value, icon: Icon, iconColor, href, badge }: StatCardProps) {
    const hasPending = badge && value !== undefined && value > 0

    return (
        <Link
            href={href}
            className={`flex flex-col gap-3 p-5 bg-card-solid border rounded-sm no-underline transition-colors duration-150 ease-out ${hasPending ? 'border-[rgba(245,158,11,0.35)]' : 'border-border'
                }`}
        >
            <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-[8px] bg-[rgba(255,255,255,0.05)] flex items-center justify-center">
                    <Icon className="w-[18px] h-[18px]" style={{ color: iconColor }} />
                </div>
                {hasPending && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-(--accent-amber) bg-(--accent-amber-dim) py-0.5 px-2 rounded-full">
                        <AlertCircle className="w-[11px] h-[11px]" />
                        Pending
                    </span>
                )}
            </div>
            <div>
                <p
                    className={`text-[28px] font-bold leading-none ${hasPending ? 'text-(--accent-amber)' : 'text-primary'
                        }`}
                >
                    {value ?? '—'}
                </p>
                <p className="text-[13px] text-muted mt-1">
                    {label}
                </p>
            </div>
        </Link>
    )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function StatSkeleton() {
    return (
        <div className="p-5 bg-card-solid border border-border rounded-md flex flex-col gap-3">
            <div className="skeleton w-9 h-9 rounded-[8px]" />
            <div className="flex flex-col gap-1.5">
                <div className="skeleton w-[60px] h-[28px] rounded-[6px]" />
                <div className="skeleton w-[100px] h-[14px] rounded-[4px]" />
            </div>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
    const { data: stats, isLoading, isError } = useQuery<AdminStats>({
        queryKey: ['admin-stats'],
        queryFn: fetchStats,
        staleTime: 30_000,
        refetchInterval: 60_000, // auto-refresh every minute
    })

    return (
        <div className="flex flex-col gap-6">

            {/* Page header */}
            <div>
                <h1 className="text-[20px] font-bold text-primary">
                    Dashboard
                </h1>
                <p className="text-[13px] text-muted mt-1">
                    Platform overview — refreshes every 60 seconds
                </p>
            </div>

            {/* Error state */}
            {isError && (
                <div className="py-3.5 px-4 bg-danger-dim border border-[rgba(239,68,68,0.3)] rounded-[8px] text-sm text-danger-light">
                    Failed to load stats. Check your connection and refresh.
                </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                {isLoading ? (
                    Array.from({ length: 7 }).map((_, i) => <StatSkeleton key={i} />)
                ) : (
                    <>
                        <StatCard
                            label="Total Agents"
                            value={stats?.totalAgents}
                            icon={Users}
                            iconColor="var(--accent-blue)"
                            href="/admin/agents"
                        />
                        <StatCard
                            label="Pending Deposits"
                            value={stats?.pendingDeposits}
                            icon={ArrowDownToLine}
                            iconColor="var(--accent-green-light)"
                            href="/admin/transactions"
                            badge
                        />
                        <StatCard
                            label="Pending Withdrawals"
                            value={stats?.pendingWithdrawals}
                            icon={ArrowUpFromLine}
                            iconColor="var(--accent-amber)"
                            href="/admin/transactions"
                            badge
                        />
                        <StatCard
                            label="Pending UTRs"
                            value={stats?.pendingUTRs}
                            icon={Hash}
                            iconColor="var(--accent-gold)"
                            href="/admin/utr"
                            badge
                        />
                        <StatCard
                            label="Pending Banks"
                            value={stats?.pendingBanks}
                            icon={Building2}
                            iconColor="var(--accent-blue-light)"
                            href="/admin/banks"
                            badge
                        />
                        <StatCard
                            label="Open Tickets"
                            value={stats?.openTickets}
                            icon={MessageSquare}
                            iconColor="var(--accent-red-light)"
                            href="/admin/support"
                            badge
                        />
                        <StatCard
                            label="Active Live Jobs"
                            value={stats?.activeLiveJobs}
                            icon={Zap}
                            iconColor="var(--accent-gold)"
                            href="/admin/live-pool"
                        />
                    </>
                )}
            </div>

            {/* Quick actions */}
            <div>
                <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-muted mb-3">
                    Quick Actions
                </p>
                <div className="flex gap-3 flex-wrap">
                    {[
                        { label: 'Create Live Job', href: '/admin/live-pool/create' },
                        { label: 'Add Adjustment', href: '/admin/adjustments/create' },
                        { label: 'View All Agents', href: '/admin/agents' },
                        { label: 'Platform Settings', href: '/admin/settings' },
                    ].map((action) => (
                        <Link
                            key={action.href}
                            href={action.href}
                            className="py-2 px-4 bg-card-solid border border-border rounded-[6px] text-[13px] font-medium text-secondary no-underline transition-colors duration-150 ease-out"
                        >
                            {action.label}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}