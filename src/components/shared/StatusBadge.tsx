'use client'

/**
 * StatusBadge — domain-aware status chip used across banks, deposits,
 * withdrawals, and UTR lists.
 *
 * Colors are pulled from CSS variables defined in globals.css so they
 * automatically adapt if we ever add a light theme.
 *
 * Accepted status values:
 *   Bank:        'active' | 'pending' | 'inactive'
 *   Transaction: 'completed' | 'failed' | 'disputed' | 'pending'
 *   UTR:         'verified' | 'rejected' | 'pending'
 */

import { cn } from '@/utils'

export type StatusValue =
  // Bank
  | 'active'
  | 'pending'
  | 'inactive'
  // Transaction
  | 'completed'
  | 'failed'
  | 'disputed'
  // UTR
  | 'verified'
  | 'rejected'

interface StatusConfig {
  label:   string
  textVar: string   // CSS variable name for text color
  bgVar:   string   // CSS variable name for background color
}

const STATUS_MAP: Record<StatusValue, StatusConfig> = {
  // ── Bank ────────────────────────────────────────────────────────────────
  active: {
    label:   'Active',
    textVar: '--status-completed-text',   // green
    bgVar:   '--status-completed-bg',
  },
  pending: {
    label:   'Pending',
    textVar: '--status-pending-text',     // amber
    bgVar:   '--status-pending-bg',
  },
  inactive: {
    label:   'Inactive',
    textVar: '--text-muted',             // muted grey
    bgVar:   '--bg-input',
  },
  // ── Transaction ─────────────────────────────────────────────────────────
  completed: {
    label:   'Completed',
    textVar: '--status-completed-text',   // green
    bgVar:   '--status-completed-bg',
  },
  failed: {
    label:   'Failed',
    textVar: '--status-failed-text',      // red
    bgVar:   '--status-failed-bg',
  },
  disputed: {
    label:   'Disputed',
    textVar: '--status-disputed-text',    // orange
    bgVar:   '--status-disputed-bg',
  },
  // ── UTR ─────────────────────────────────────────────────────────────────
  verified: {
    label:   'Verified',
    textVar: '--status-completed-text',   // green
    bgVar:   '--status-completed-bg',
  },
  rejected: {
    label:   'Rejected',
    textVar: '--status-failed-text',      // red
    bgVar:   '--status-failed-bg',
  },
}

interface StatusBadgeProps {
  status:    StatusValue
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? {
    label:   status,
    textVar: '--text-muted',
    bgVar:   '--bg-input',
  }

  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-0.5', className)}
      style={{
        fontSize:        '11px',
        fontWeight:      600,
        letterSpacing:   '0.02em',
        color:           `var(${config.textVar})`,
        backgroundColor: `var(${config.bgVar})`,
        lineHeight:      '1.6',
      }}
    >
      {config.label}
    </span>
  )
}
