'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
    Copy,
    Check,
    MessageCircle,
    Share2,
    HelpCircle,
    PartyPopper,
    Clock,
} from 'lucide-react'
import { apiClient } from '@/lib/axios'
import type { ReferralStats, IReferredUser, IReferralCommission } from '@/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatINR(amount: number) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(amount)
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function ReferralSkeleton() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="skeleton page-card"
                    style={{ height: i === 1 ? 180 : i === 2 ? 120 : 72 }}
                />
            ))}
        </div>
    )
}

// ─── Earnings Card ────────────────────────────────────────────────────────────

function EarningsCard({
    stats,
    copied,
    onCopy,
}: {
    stats: ReferralStats
    copied: boolean
    onCopy: () => void
}) {
    return (
        <div className="page-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Header */}
            <div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Your Lifetime Referral Earnings
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                        style={{
                            fontSize: 32,
                            fontWeight: 800,
                            color: 'var(--accent-gold)',
                            letterSpacing: '-0.5px',
                        }}
                    >
                        {formatINR(stats.lifetimeEarnings)}
                    </span>
                    <PartyPopper size={24} style={{ color: 'var(--accent-gold)' }} />
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
                    Invite &amp; Refer your circle, share the benefits, and enjoy rewards together.
                </p>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--border-subtle)' }} />

            {/* Referral code pill */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <button
                    onClick={onCopy}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        background: 'linear-gradient(145deg, var(--accent-gold-light), var(--accent-gold))',
                        color: '#1a1000',
                        fontWeight: 700,
                        fontSize: 16,
                        padding: '10px 24px',
                        borderRadius: 'var(--radius-full)',
                        letterSpacing: '0.08em',
                        transition: 'transform var(--transition-fast)',
                        touchAction: 'manipulation',
                    }}
                    onMouseDown={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(0.97)')}
                    onMouseUp={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')}
                >
                    {stats.referralCode}
                    {copied ? (
                        <Check size={16} style={{ color: '#1a1000' }} />
                    ) : (
                        <Copy size={16} style={{ color: '#1a1000' }} />
                    )}
                </button>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {copied ? '✅ Copied to clipboard!' : 'Tap above to copy your referral code ✨'}
                </p>
            </div>
        </div>
    )
}

// ─── Commission Cycle Card (GOLD background) ──────────────────────────────────

function CycleCard({ cycle }: { cycle: ReferralStats['currentCycle'] }) {
    if (!cycle) {
        return (
            <div className="page-card" style={{ textAlign: 'center', padding: '20px 16px' }}>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                    No active commission cycle yet.
                </p>
            </div>
        )
    }

    const isPending = cycle.status === 'pending_payout'

    return (
        <div
            style={{
                background: 'var(--accent-gold)',
                borderRadius: 'var(--radius-md)',
                padding: 16,
                color: '#1a1000',
            }}
        >
            {/* Chip label */}
            <div style={{ marginBottom: 10 }}>
                <span
                    style={{
                        display: 'inline-block',
                        background: 'rgba(0,0,0,0.15)',
                        borderRadius: 'var(--radius-full)',
                        padding: '3px 12px',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        color: '#1a1000',
                    }}
                >
                    Current Commission Cycle
                </span>
            </div>

            {/* Date range + amount */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                }}
            >
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {formatDate(cycle.startDate)} – {formatDate(cycle.endDate)}
                </span>
                <span style={{ fontSize: 20, fontWeight: 800 }}>{formatINR(cycle.amount)}</span>
            </div>

            {/* Status row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Clock size={14} />
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em' }}>
                    {isPending ? 'PENDING PAYOUT' : 'CREDITED'}
                </span>
            </div>
            <p style={{ fontSize: 12, lineHeight: 1.5, opacity: 0.8 }}>
                {isPending
                    ? 'Earnings will be credited after cycle completion and verification.'
                    : 'Commission has been credited to your account.'}
            </p>
        </div>
    )
}

// ─── Action Row (WhatsApp / Share / FAQ) ──────────────────────────────────────

function ActionRow({ referralCode }: { referralCode: string }) {
    const shareText = `Join PayzDesk — the professional payment agent platform! Use my referral code ${referralCode} to get started. https://playzdesk.com`

    const handleWhatsApp = () => {
        window.open(
            `https://wa.me/?text=${encodeURIComponent(shareText)}`,
            '_blank',
            'noopener,noreferrer'
        )
    }

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title: 'PayzDesk', text: shareText })
            } catch {
                // user dismissed — ignore
            }
        } else {
            await navigator.clipboard.writeText(shareText)
        }
    }

    const handleFaq = () => {
        window.location.href = '/help/faq'
    }

    const actions = [
        { icon: MessageCircle, label: 'WhatsApp', color: '#22c55e', onClick: handleWhatsApp },
        { icon: Share2, label: 'Share', color: 'var(--accent-blue)', onClick: handleShare },
        { icon: HelpCircle, label: 'FAQ', color: 'var(--accent-amber)', onClick: handleFaq },
    ]

    return (
        <div
            className="page-card"
            style={{ display: 'flex', justifyContent: 'space-around', padding: '14px 8px' }}
        >
            {actions.map(({ icon: Icon, label, color, onClick }) => (
                <button
                    key={label}
                    onClick={onClick}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 8,
                        flex: 1,
                        background: 'none',
                        cursor: 'pointer',
                        touchAction: 'manipulation',
                    }}
                >
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 'var(--radius-full)',
                            background: 'rgba(255,255,255,0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Icon size={20} style={{ color }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {label}
                    </span>
                </button>
            ))}
        </div>
    )
}

// ─── Segmented Tabs ───────────────────────────────────────────────────────────

function SegmentedTabs({
    active,
    onChange,
}: {
    active: 'referred' | 'commission'
    onChange: (tab: 'referred' | 'commission') => void
}) {
    return (
        <div className="segmented-tabs">
            <button
                className={`segmented-tab ${active === 'referred' ? 'active' : ''}`}
                onClick={() => onChange('referred')}
            >
                Referred List
            </button>
            <button
                className={`segmented-tab ${active === 'commission' ? 'active' : ''}`}
                onClick={() => onChange('commission')}
            >
                Commission Details
            </button>
        </div>
    )
}

// ─── Referred List ────────────────────────────────────────────────────────────

function ReferredList({ users }: { users: IReferredUser[] }) {
    if (users.length === 0) {
        return (
            <div className="empty-state">
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                    No referrals yet!
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                    Share your referral code to start earning.
                </p>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {users.map((u) => (
                <div key={u._id} className="page-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</p>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{u.phone}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            Joined {formatDate(u.joinedAt)}
                        </p>
                    </div>
                    {u.totalCommission > 0 && (
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-gold)' }}>
                            {formatINR(u.totalCommission)}
                        </span>
                    )}
                </div>
            ))}
        </div>
    )
}

// ─── Commission Details ───────────────────────────────────────────────────────

function CommissionDetails({ history }: { history: IReferralCommission[] }) {
    if (history.length === 0) {
        return (
            <div className="empty-state">
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                    No commission records yet.
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                    Commission details will appear here once earned.
                </p>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map((c) => (
                <div
                    key={c._id}
                    className="page-card"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                    <div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            Commission earned
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {formatDate(c.createdAt)}
                        </p>
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-gold)' }}>
                        +{formatINR(c.amount)}
                    </span>
                </div>
            ))}
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReferralPage() {
    const [copied, setCopied] = useState(false)
    const [activeTab, setActiveTab] = useState<'referred' | 'commission'>('referred')

    const { data, isLoading, isError } = useQuery<ReferralStats>({
        queryKey: ['referral'],
        queryFn: async () => {
            const res = await apiClient.get('/referral')
            return res.data.data as ReferralStats
        },
    })

    const handleCopy = async () => {
        if (!data?.referralCode) return
        await navigator.clipboard.writeText(data.referralCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeIn 200ms ease-out' }}>

            {/* Page title — desktop only */}
            <h1
                className="hidden md:block"
                style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}
            >
                Refer &amp; Earn
            </h1>

            {isLoading && <ReferralSkeleton />}

            {isError && (
                <div className="error-banner">
                    Failed to load referral data. Please try again.
                </div>
            )}

            {data && (
                <>
                    {/* Earnings + referral code card */}
                    <EarningsCard stats={data} copied={copied} onCopy={handleCopy} />

                    {/* Commission cycle card (gold bg) */}
                    <CycleCard cycle={data.currentCycle} />

                    {/* WhatsApp / Share / FAQ row */}
                    <ActionRow referralCode={data.referralCode} />

                    {/* Segmented tabs */}
                    <SegmentedTabs active={activeTab} onChange={setActiveTab} />

                    {/* Tab content */}
                    {activeTab === 'referred' ? (
                        <ReferredList users={data.referredUsers} />
                    ) : (
                        <CommissionDetails history={data.commissionHistory} />
                    )}
                </>
            )}
        </div>
    )
}