'use client'

import { useQuery } from '@tanstack/react-query'
import { TrendingUp } from 'lucide-react'
import { apiClient } from '@/lib/axios'
import type { CommissionDetailsResponse, CommissionDetail } from '@/app/api/commission/details/route'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatINR(amount: number) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(amount)
}

function formatDate(iso: string) {
    if (!iso) return '—'
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
            <div className="skeleton page-card h-24" />
            {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton page-card h-16" />
            ))}
        </div>
    )
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({ totalEarned }: { totalEarned: number }) {
    return (
        <div className="page-card flex items-center justify-between">
            <div>
                <p className="text-[12px] font-semibold uppercase tracking-widest text-muted">
                    Total Commission Earned
                </p>
                <p className="mt-1 text-[26px] font-extrabold text-gold">
                    {formatINR(totalEarned)}
                </p>
            </div>
            <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: 'var(--accent-gold-dim)' }}
            >
                <TrendingUp size={22} className="text-gold" />
            </div>
        </div>
    )
}

// ─── Commission Row ───────────────────────────────────────────────────────────

function CommissionRow({ record }: { record: CommissionDetail }) {
    return (
        <div className="page-card flex items-center justify-between">
            <div className="flex flex-col gap-1">
                <p className="text-[14px] font-semibold text-primary">Referral Commission</p>
                {record.cycleStart && record.cycleEnd && (
                    <p className="text-[12px] text-secondary">
                        Cycle: {formatDate(record.cycleStart)} – {formatDate(record.cycleEnd)}
                    </p>
                )}
                <p className="text-[11px] text-muted">{formatDate(record.createdAt)}</p>
            </div>
            <span className="text-[16px] font-bold text-gold">
                +{formatINR(record.amount)}
            </span>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommissionDetailsPage() {
    const { data, isLoading, isError } = useQuery<CommissionDetailsResponse>({
        queryKey: ['commission', 'details'],
        queryFn: async () => {
            const res = await apiClient.get('/commission/details')
            return res.data.data as CommissionDetailsResponse
        },
    })

    return (
        <div className="flex flex-col gap-3" style={{ animation: 'fadeIn 200ms ease-out' }}>

            {/* Page title — desktop */}
            <h1 className="hidden text-lg font-bold text-primary md:block">
                Commission Details
            </h1>

            {isLoading && <Skeleton />}

            {isError && (
                <div className="error-banner">
                    Failed to load commission details. Please try again.
                </div>
            )}

            {data && (
                <>
                    {/* Summary */}
                    <SummaryCard totalEarned={data.totalEarned} />

                    {/* Section label */}
                    <p className="section-label mt-1">Commission History</p>

                    {/* Records */}
                    {data.records.length === 0 ? (
                        <div className="empty-state">
                            <p className="text-[15px] font-bold text-primary">No commission records yet.</p>
                            <p className="mt-1 text-[13px] text-secondary">
                                Commission will appear here once your referrals start transacting.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {data.records.map((record) => (
                                <CommissionRow key={record._id} record={record} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}