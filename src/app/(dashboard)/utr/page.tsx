'use client'

/**
 * /utr — UTR History
 *
 * Filter bar at top (status, search, date range), then list of UTR entries.
 * Each row: UTR number, bank name, amount, status badge, date.
 * Empty state when no results match filters.
 */

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Plus, Hash, Building2 } from 'lucide-react'
import { FilterBar, FilterState } from '@/components/shared/FilterBar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDateTime, formatINR } from '@/utils'
import type { IBankAccount, IUTR } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

// The populated bank field returned by the API (bankId is populated)
interface PopulatedUTR extends Omit<IUTR, 'bankId'> {
  bankId: Pick<IBankAccount, '_id' | 'bankName' | 'accountNumber' | 'ifscCode'> | string
}

function bankName(utr: PopulatedUTR): string {
  if (typeof utr.bankId === 'string') return '—'
  return utr.bankId.bankName
}

function bankAcctSuffix(utr: PopulatedUTR): string {
  if (typeof utr.bankId === 'string') return ''
  const acct = utr.bankId.accountNumber
  return acct ? ` ••••${acct.slice(-4)}` : ''
}

// ─── Status filter options ────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: '',          label: 'All'      },
  { value: 'pending',   label: 'Pending'  },
  { value: 'verified',  label: 'Verified' },
  { value: 'rejected',  label: 'Rejected' },
]

// ─── Fetch UTRs ───────────────────────────────────────────────────────────────

async function fetchUTRs(filter: FilterState): Promise<PopulatedUTR[]> {
  const params = new URLSearchParams()
  if (filter.status)   params.set('status',   filter.status)
  if (filter.search)   params.set('search',   filter.search)
  if (filter.dateFrom) params.set('dateFrom', filter.dateFrom)
  if (filter.dateTo)   params.set('dateTo',   filter.dateTo)

  const res = await fetch(`/api/utr?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch UTR history')
  const json = await res.json()
  return json.data ?? []
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function RowSkeleton() {
  return (
    <div
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            '12px',
        padding:        '14px 0',
        borderBottom:   '1px solid var(--border-subtle)',
      }}
    >
      <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div className="skeleton" style={{ height: '14px', width: '50%', borderRadius: '6px' }} />
        <div className="skeleton" style={{ height: '12px', width: '35%', borderRadius: '6px' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
        <div className="skeleton" style={{ height: '14px', width: '60px', borderRadius: '6px' }} />
        <div className="skeleton" style={{ height: '20px', width: '64px', borderRadius: '999px' }} />
      </div>
    </div>
  )
}

// ─── UTR row ─────────────────────────────────────────────────────────────────

function UTRRow({ utr }: { utr: PopulatedUTR }) {
  return (
    <div
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '12px',
        padding:      '14px 0',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width:          '36px',
          height:         '36px',
          borderRadius:   '50%',
          background:     'rgba(245,166,35,0.08)',
          border:         '1px solid rgba(245,166,35,0.15)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexShrink:     0,
        }}
      >
        <Hash size={15} style={{ color: 'var(--accent-gold)' }} />
      </div>

      {/* Left — UTR number + bank */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize:     '14px',
            fontWeight:   700,
            color:        'var(--text-primary)',
            fontFamily:   'monospace',
            letterSpacing:'0.04em',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
          }}
        >
          {utr.utrNumber}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
          <Building2 size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <p
            style={{
              fontSize:     '12px',
              color:        'var(--text-muted)',
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              whiteSpace:   'nowrap',
            }}
          >
            {bankName(utr)}{bankAcctSuffix(utr)}
          </p>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
          {formatDateTime(utr.createdAt)}
        </p>
      </div>

      {/* Right — amount + status */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flexShrink: 0 }}>
        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
          {formatINR(utr.amount)}
        </p>
        <StatusBadge status={utr.status as 'pending' | 'verified' | 'rejected'} />
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const EMPTY_FILTER: FilterState = { status: '', search: '', dateFrom: '', dateTo: '' }

export default function UTRPage() {
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER)

  // Use a stable query key including filter so results refresh when filter changes
  const queryKey = ['utrs', filter]

  const { data: utrs = [], isLoading, isError } = useQuery<PopulatedUTR[]>({
    queryKey,
    queryFn:   () => fetchUTRs(filter),
    staleTime: 20_000,
  })

  const handleFilterChange = useCallback((next: FilterState) => {
    setFilter(next)
  }, [])

  const hasActiveFilter =
    filter.status !== '' ||
    filter.search !== '' ||
    filter.dateFrom !== '' ||
    filter.dateTo !== ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 200ms ease-out' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
          UTR History
        </h1>
        <Link
          href="/utr/create"
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:            '6px',
            background:     'linear-gradient(145deg, var(--accent-gold-light), var(--accent-gold))',
            color:          '#1a1000',
            fontSize:       '14px',
            fontWeight:     700,
            padding:        '10px 16px',
            borderRadius:   'var(--radius-full)',
            textDecoration: 'none',
            minHeight:      '44px',
            whiteSpace:     'nowrap',
            boxShadow:      '0 4px 12px var(--accent-gold-dim)',
            touchAction:    'manipulation',
            transition:     'transform 150ms ease-out, box-shadow 150ms ease-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(245,166,35,0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = ''
            e.currentTarget.style.boxShadow = '0 4px 12px var(--accent-gold-dim)'
          }}
        >
          <Plus size={16} />
          Create UTR
        </Link>
      </div>

      {/* Filter bar */}
      <FilterBar
        value={filter}
        onChange={handleFilterChange}
        statusOptions={STATUS_OPTIONS}
        searchPlaceholder="Search UTR number…"
      />

      {/* Results card */}
      <div className="page-card" style={{ padding: '0 16px' }}>

        {/* Section heading */}
        <div
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        '14px 0 12px',
            borderBottom:   '1px solid var(--border-subtle)',
          }}
        >
          <p className="section-label" style={{ marginBottom: 0 }}>
            UTR DETAILS
          </p>
          {!isLoading && !isError && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {utrs.length} {utrs.length === 1 ? 'record' : 'records'}
            </p>
          )}
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div>
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </div>
        )}

        {/* Error */}
        {isError && (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Failed to load UTR history. Please refresh.
            </p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && utrs.length === 0 && (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              No Data Exists.
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {hasActiveFilter
                ? 'Please change the date range or filters.'
                : 'Submit your first UTR to see history here.'}
            </p>
            {!hasActiveFilter && (
              <Link
                href="/utr/create"
                style={{
                  display:        'inline-flex',
                  alignItems:     'center',
                  gap:            '6px',
                  marginTop:      '16px',
                  color:          'var(--accent-gold)',
                  fontSize:       '14px',
                  fontWeight:     600,
                  textDecoration: 'none',
                }}
              >
                <Plus size={14} />
                Create UTR
              </Link>
            )}
          </div>
        )}

        {/* UTR rows */}
        {!isLoading && !isError && utrs.length > 0 && (
          <div>
            {utrs.map((utr, i) => (
              <div
                key={utr._id}
                style={{
                  // Remove border from last row
                  ...(i === utrs.length - 1
                    ? { borderBottom: 'none' }
                    : {}),
                }}
              >
                <UTRRow utr={utr} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
