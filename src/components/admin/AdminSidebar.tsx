'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useAdminStore } from '@/store/adminStore'
import { cn } from '@/utils'
import {
    LayoutDashboard,
    Users,
    ArrowDownToLine,
    ArrowUpFromLine,
    Building2,
    Hash,
    Shield,
    Zap,
    TrendingUp,
    SlidersHorizontal,
    BarChart3,
    MessageSquare,
    Settings,
    LogOut,
    ChevronRight,
} from 'lucide-react'

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Agents', href: '/admin/agents', icon: Users },
    { label: 'Transactions', href: '/admin/transactions', icon: ArrowDownToLine },
    { label: 'Banks', href: '/admin/banks', icon: Building2 },
    { label: 'UTR', href: '/admin/utr', icon: Hash },
    { label: 'Security Deposits', href: '/admin/security-deposits', icon: Shield },
    { label: 'Security Withdrawals', href: '/admin/security-withdrawals', icon: ArrowUpFromLine },
    { label: 'Live Pool', href: '/admin/live-pool', icon: Zap },
    { label: 'Commissions', href: '/admin/commissions', icon: TrendingUp },
    { label: 'Adjustments', href: '/admin/adjustments', icon: SlidersHorizontal },
    { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { label: 'Support', href: '/admin/support', icon: MessageSquare },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
]

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function AdminSidebar() {
    const pathname = usePathname()
    const { admin, fetchMe, logout } = useAdminStore()

    useEffect(() => {
        if (!admin) fetchMe()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <aside className="w-[220px] shrink-0 h-screen sticky top-0 flex flex-col bg-sidebar border-r border-(--border-subtle) overflow-y-auto">
            {/* Logo */}
            <div className="py-4 px-5 border-b border-(--border-subtle) shrink-0">
                <p className="text-base font-bold text-primary">
                    Payz<span className="text-gold">Desk</span>
                </p>
                <p className="text-[11px] text-muted mt-[2px] font-semibold tracking-wider uppercase">
                    Admin Panel
                </p>
            </div>

            {/* Admin info */}
            {admin && (
                <div className="py-3 px-5 border-b border-(--border-subtle) shrink-0">
                    <p className="text-[13px] font-semibold text-primary">
                        {admin.name}
                    </p>
                    <p className="text-xs text-muted mt-px">
                        +91 {admin.phone}
                    </p>
                </div>
            )}

            {/* Nav */}
            <nav className="flex-1 py-2 overflow-y-auto">
                {NAV.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== '/admin' && pathname.startsWith(item.href + '/'))
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors',
                                isActive
                                    ? 'text-gold border-l-2 border-gold bg-gold-dim'
                                    : 'text-secondary hover:text-primary hover:bg-white/3 border-l-2 border-transparent'
                            )}
                        >
                            <item.icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-gold' : 'text-muted')} />
                            <span className="flex-1">{item.label}</span>
                            {isActive && (
                                <ChevronRight className="w-3.5 h-3.5 text-gold" />
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* Logout */}
            <div className="py-3 px-2 border-t border-(--border-subtle) shrink-0">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-5 py-2.5 text-sm font-medium text-secondary hover:text-danger transition-colors rounded"
                >
                    <LogOut className="w-4 h-4 shrink-0" />
                    Logout
                </button>
            </div>
        </aside>
    )
}