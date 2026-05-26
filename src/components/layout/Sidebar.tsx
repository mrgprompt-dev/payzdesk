'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils'
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  FileText,
  Settings,
  User,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Shield,
  ShieldCheck,
  BarChart3,
  HelpCircle,
  Gift,
  TrendingUp,
  Hash,
} from 'lucide-react'

// ─── Nav config ───────────────────────────────────────────────────────────────

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
    label: 'UTR',
    icon: Hash,
    children: [
      { label: 'Create UTR', href: '/utr/create' },
      { label: 'UTR History', href: '/utr' },
    ],
  },
  {
    label: 'Performance Commission',
    href: '/commission/performance',
    icon: TrendingUp,
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
    label: 'Refer & Earn',
    href: '/referral',
    icon: Gift,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
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
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavGroup({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname()
  const childPaths = item.children?.map((c) => c.href) ?? []
  const isActive = childPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))
  const [open, setOpen] = useState(isActive)

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-accent-gold/10 text-accent-gold'
            : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </button>

      {open && (
        <div className="ml-7 mt-1 flex flex-col gap-0.5 border-l border-border pl-3">
          {item.children?.map((child) => {
            const childActive = pathname === child.href || pathname.startsWith(child.href + '/')
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                className={cn(
                  'rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                  childActive
                    ? 'text-accent-gold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
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

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname()
  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href! + '/'))

  return (
    <Link
      href={item.href!}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
        isActive
          ? 'bg-accent-gold/10 text-accent-gold'
          : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span>{item.label}</span>
    </Link>
  )
}

// ─── Sidebar inner content (shared between desktop + mobile) ─────────────────

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuthStore()

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-border px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-gold/20">
          <ShieldCheck className="h-4 w-4 text-accent-gold" />
        </div>
        <span className="text-lg font-bold tracking-tight text-foreground">
          Payz<span className="text-accent-gold">Desk</span>
        </span>
      </div>

      {/* User pill */}
      {user && (
        <div className="mx-3 mt-4 flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-gold/20 text-xs font-bold text-accent-gold">
            {user.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">{user.name}</p>
            <p className="truncate text-[10px] text-muted-foreground">+91 {user.phone}</p>
          </div>
          <Link href="/profile" onClick={onNavigate}>
            <User className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </Link>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 mt-2" aria-label="Main navigation">
        {NAV_ITEMS.map((item) =>
          item.children ? (
            <NavGroup key={item.label} item={item} onNavigate={onNavigate} />
          ) : (
            <NavLink key={item.label} item={item} onNavigate={onNavigate} />
          )
        )}
      </nav>

      {/* Logout */}
      <div className="border-t border-border p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

// ─── Desktop sidebar ──────────────────────────────────────────────────────────

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:flex md:flex-col h-screen sticky top-0">
      <SidebarContent />
    </aside>
  )
}

// ─── Mobile header + drawer ───────────────────────────────────────────────────

export function MobileHeader() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-base font-bold tracking-tight">
          Payz<span className="text-accent-gold">Desk</span>
        </span>
        <Link href="/deposit">
          <span className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500 transition-colors">
            Deposit
          </span>
        </Link>
      </header>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-card shadow-2xl transition-transform duration-300 md:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="absolute right-3 top-4">
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/5"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent onNavigate={() => setOpen(false)} />
      </div>
    </>
  )
}