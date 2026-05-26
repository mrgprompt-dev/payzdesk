'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Sparkles, Trophy, Gift, Clock, ChevronRight, ExternalLink } from 'lucide-react'
import { apiClient } from '@/lib/axios'
import type { IPerformanceCommission } from '@/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatINR(amount: number) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(amount)
}

function formatShortDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton() {
    return (
        <div className="flex flex-col gap-3">
            <div className="skeleton page-card h-44" />
            <div className="skeleton h-4 w-40 rounded" />
            <div className="skeleton page-card h-36 w-1/2" />
        </div>
    )
}

// ─── Earnings Card ────────────────────────────────────────────────────────────

function EarningsCard({ data }: { data: IPerformanceCommission }) {
    const isReleased = data.status === 'released'

    return (
        <div className="page-card flex flex-col gap-4">
            {/* Header row: label + Released badge */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-gold" />
                    <span className="text-[13px] font-bold uppercase tracking-widest text-gold">
                        Performance Commission
                    </span>
                </div>
                {isReleased && (
                    <span
                        className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-700"
                        style={{ borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }}
                    >
                        <Trophy size={11} />
                        Released
                    </span>
                )}
            </div>

            {/* Earnings value */}
            <div>
                <p className="text-sm font-semibold text-primary">
                    {data.totalEarned > 0 ? "You've Earned It!" : 'Start Earning'}
                </p>
                <p className="mt-1 text-[28px] font-extrabold text-primary">
                    {formatINR(data.totalEarned)}
                </p>
                <p className="mt-1 text-[13px] text-secondary">
                    {data.totalEarned > 0
                        ? 'Keep it up — your commissions are unlocking steadily.'
                        : 'Complete transactions to start earning performance commissions.'}
                </p>
            </div>

            {/* Divider */}
            <div className="h-px bg-border-subtle" />

            {/* Footer row */}
            <div className="flex items-center justify-between">
                <span className="text-[13px] text-secondary">Unlocked so far</span>
                <Link
                    href="/commission/details"
                    className="flex items-center gap-1 text-[13px] font-semibold text-gold"
                >
                    View details
                    <ChevronRight size={14} />
                </Link>
            </div>
        </div>
    )
}

// ─── Active Program Card ──────────────────────────────────────────────────────
// Spec: narrower card (~half screen width), not full-width

function ProgramCard({
    program,
    lastReleasedDate,
    frequencyDays,
}: {
    program: IPerformanceCommission['activePrograms'][number]
    lastReleasedDate: string | null
    frequencyDays: number
}) {
    return (
        <div className="page-card flex w-full flex-col gap-4 md:w-1/2">
            {/* Top row: gift icon + T&C button */}
            <div className="flex items-center justify-between">
                <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ background: 'var(--accent-amber-dim)' }}
                >
                    <Gift size={18} style={{ color: 'var(--accent-amber)' }} />
                </div>

                {program.termsUrl ? (
                    <a
                        href={program.termsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-full bg-input px-3 py-1.5 text-[12px] font-semibold text-secondary"
                    >
                        T&amp;C
                        <ExternalLink size={11} />
                    </a>
                ) : (
                    <span className="rounded-full bg-input px-3 py-1.5 text-[12px] font-semibold text-muted">
                        T&amp;C
                    </span>
                )}
            </div>

            {/* Frequency */}
            <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-secondary" />
                <span className="text-[13px] text-secondary">Every {frequencyDays} days</span>
            </div>

            {/* Program name */}
            <p className="text-[15px] font-bold text-primary">{program.name}</p>

            {/* Last released */}
            <div className="flex items-center justify-between text-[13px]">
                <span className="text-secondary">Last Released</span>
                <span className="font-semibold text-primary">
                    {lastReleasedDate ? formatShortDate(lastReleasedDate) : '—'}
                </span>
            </div>

            {/* Bonus Tracker button */}
            {program.bonusTrackerUrl ? (
                <a
                    href={program.bonusTrackerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-input py-3 text-[14px] font-bold text-primary"
                >
                    BONUS TRACKER
                    <ChevronRight size={15} />
                </a>
            ) : (
                <button
                    disabled
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-input py-3 text-[14px] font-bold text-muted"
                >
                    BONUS TRACKER
                    <ChevronRight size={15} />
                </button>
            )}
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PerformanceCommissionPage() {
    const { data, isLoading, isError } = useQuery<IPerformanceCommission>({
        queryKey: ['commission', 'performance'],
        queryFn: async () => {
            const res = await apiClient.get('/commission/performance')
            return res.data.data as IPerformanceCommission
        },
    })

    return (
        <div className="flex flex-col gap-3" style={{ animation: 'fadeIn 200ms ease-out' }}>

            {/* Page title — desktop */}
            <h1 className="hidden text-lg font-bold text-primary md:block">
                Performance Commission
            </h1>

            {isLoading && <Skeleton />}

            {isError && (
                <div className="error-banner">
                    Failed to load commission data. Please try again.
                </div>
            )}

            {data && (
                <>
                    {/* Earnings summary card */}
                    <EarningsCard data={data} />

                    {/* Section label */}
                    {data.activePrograms.length > 0 && (
                        <p className="section-label mt-2">Active Performance Commission</p>
                    )}

                    {/* Program cards — wrap on desktop, stack on mobile */}
                    <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
                        {data.activePrograms.length > 0 ? (
                            data.activePrograms.map((program, i) => (
                                <ProgramCard
                                    key={i}
                                    program={program}
                                    lastReleasedDate={data.lastReleasedDate}
                                    frequencyDays={data.frequencyDays}
                                />
                            ))
                        ) : (
                            <div className="empty-state">
                                <p className="text-[15px] font-bold text-primary">No active programs.</p>
                                <p className="mt-1 text-[13px] text-secondary">
                                    Performance commission programs will appear here when available.
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}