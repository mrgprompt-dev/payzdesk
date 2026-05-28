'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils'
import {
  LayoutDashboard,
  Building2,
  FileText,
  Settings,
  ChevronDown,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  BarChart3,
  HelpCircle,
  Gift,
  TrendingUp,
  Hash,
  ArrowDownToLine,
} from 'lucide-react'

// ─── Nav config ───────────────────────────────────────────────────────────────
// Exact order from CONVERSION_SPEC.md section 3 + DESIGN.md section 4

interface NavItem {
  label: string
  href?: string
  icon: React.ElementType
  children?: { label: string; href: string }[]
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Home',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'History',
    icon: FileText,
    children: [
      { label: 'Deposit Requests', href: '/deposits' },
      { label: 'Withdrawal Requests', href: '/withdrawals' },
      { label: 'Security Deposits', href: '/security-deposits' },
      { label: 'Security Withdrawals', href: '/security-withdrawals' },
    ],
  },
  {
    label: 'Bank Details',
    href: '/banks',
    icon: Building2,
  },
  {
    label: 'Change Password',
    href: '/settings/change-password',
    icon: Settings,
  },
  {
    label: 'Performance Commission',
    href: '/commission/performance',
    icon: TrendingUp,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
  {
    label: 'UTR',
    icon: Hash,
    children: [
      { label: 'Create UTR', href: '/utr/create' },
      { label: 'UTR History', href: '/utr' },
    ],
  },
  {
    label: 'Reports',
    icon: BarChart3,
    children: [
      { label: 'Finance Report', href: '/reports/finance' },
      { label: 'Adjustments', href: '/reports/adjustments' },
    ],
  },
  {
    label: 'Help',
    icon: HelpCircle,
    children: [
      { label: 'FAQ', href: '/help/faq' },
      { label: 'Tutorial', href: '/help/tutorial' },
      { label: 'Contact Support', href: '/support' },
    ],
  },
  {
    label: 'Refer & Earn',
    href: '/referral',
    icon: Gift,
  },
]

// ─── Accordion nav group (items with children) ────────────────────────────────

function NavGroup({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname()
  const childPaths = item.children?.map((c) => c.href) ?? []
  const isGroupActive = childPaths.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
  const [open, setOpen] = useState(isGroupActive)

  return (
    <div>
      {/* Accordion trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'drawer-item w-full text-left',
          isGroupActive && 'drawer-item-active'
        )}
      >
        <item.icon className="h-[18px] w-[18px] shrink-0 opacity-80" />
        <span className="flex-1">{item.label}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-secondary transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {/* Children */}
      {open && (
        <div className="mt-0.5 flex flex-col">
          {item.children?.map((child) => {
            const childActive =
              pathname === child.href || pathname.startsWith(child.href + '/')
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                className={cn('drawer-child', childActive && 'text-gold font-semibold')}
              >
                {child.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Simple nav link ──────────────────────────────────────────────────────────

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname()
  const isActive =
    pathname === item.href ||
    (item.href !== '/' && pathname.startsWith(item.href! + '/'))

  return (
    <Link
      href={item.href!}
      onClick={onNavigate}
      className={cn('drawer-item', isActive && 'drawer-item-active')}
    >
      <item.icon className="h-[18px] w-[18px] shrink-0 opacity-80" />
      <span>{item.label}</span>
    </Link>
  )
}

// ─── Shared sidebar content (desktop + mobile drawer) ────────────────────────

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuthStore()

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* ── User profile area (top) ── */}
      <div
        className="px-5 py-5"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        {/* Avatar + phone + profile link */}
        <div className="flex items-center gap-3">
          {/* Avatar circle */}
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: 'var(--text-secondary)',
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            {/* Phone number — bold white */}
            <p className="truncate text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>
              {user?.phone ? `+91 ${user.phone}` : '+91 —'}
            </p>
            {/* Profile link — green text */}
            <Link
              href="/profile"
              onClick={onNavigate}
              className="text-xs font-medium"
              style={{ color: 'var(--accent-green-light)' }}
            >
              Click here for Profile
            </Link>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav
        className="flex-1 overflow-y-auto py-2"
        style={{ scrollbarWidth: 'none' }}
        aria-label="Main navigation"
      >
        {NAV_ITEMS.map((item) =>
          item.children ? (
            <NavGroup key={item.label} item={item} onNavigate={onNavigate} />
          ) : (
            <NavLink key={item.label} item={item} onNavigate={onNavigate} />
          )
        )}
      </nav>

      {/* ── Logout ── */}
      <div style={{ borderTop: '1px solid var(--border-subtle)' }} className="p-3">
        <button
          onClick={logout}
          className="drawer-item w-full text-left"
          style={{ color: 'var(--accent-red-light)' }}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0 opacity-80" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

// ─── Desktop sidebar (fixed left, hidden on mobile) ───────────────────────────

export function Sidebar() {
  return (
    <aside
      className="hidden md:flex md:flex-col h-screen w-64 shrink-0 sticky top-0"
      style={{
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-5 py-[18px]"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: 'rgba(245, 166, 35, 0.15)' }}
        >
          <ShieldCheck className="h-4 w-4" style={{ color: 'var(--accent-gold)' }} />
        </div>
        <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Payz<span style={{ color: 'var(--accent-gold)' }}>Desk</span>
        </span>
      </div>

      <SidebarContent />
    </aside>
  )
}

// ─── Mobile header bar + slide-in drawer ─────────────────────────────────────

export function MobileHeader() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* ── Top bar (52px, always visible on mobile) ── */}
      <header
        className="flex items-center justify-between px-4 md:hidden"
        style={{
          height: '52px',
          background: 'var(--bg-sidebar)',
          borderBottom: '1px solid var(--border-subtle)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
      >
        {/* Hamburger — 44×44 tap target */}
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex items-center justify-center rounded-lg"
          style={{
            width: '44px',
            height: '44px',
            color: 'var(--text-secondary)',
            touchAction: 'manipulation',
          }}
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo — centred */}
        <span
          className="absolute left-1/2 -translate-x-1/2 text-base font-bold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          Payz<span style={{ color: 'var(--accent-gold)' }}>Desk</span>
        </span>

        {/* Deposit CTA — green pill, right */}
        <Link
          href="/deposit"
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
          style={{
            background: 'linear-gradient(145deg, var(--accent-blue-light), var(--accent-blue))',
            boxShadow: '0 4px 10px var(--accent-blue-dim)',
            color: '#f8fbff',
            touchAction: 'manipulation',
          }}
        >
          <ArrowDownToLine className="h-3.5 w-3.5" style={{ color: '#f8fbff' }} />
          Deposit
        </Link>
      </header>

      {/* ── Backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'var(--bg-overlay)' }}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Drawer (~85% screen width, slides from left) ── */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col shadow-2xl transition-transform duration-280 ease-out md:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{
          width: '85vw',
          maxWidth: '320px',
          background: 'var(--bg-sidebar)',
        }}
        aria-modal="true"
        role="dialog"
        aria-label="Navigation menu"
      >
        {/* Close button — top right of drawer */}
        <button
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="absolute right-3 top-3 flex items-center justify-center rounded-lg"
          style={{
            width: '44px',
            height: '44px',
            color: 'var(--text-secondary)',
            zIndex: 1,
          }}
        >
          <X className="h-5 w-5" />
        </button>

        <SidebarContent onNavigate={() => setOpen(false)} />
      </div>
    </>
  )
}