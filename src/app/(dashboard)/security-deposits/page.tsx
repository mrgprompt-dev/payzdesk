'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Shield, Building2, Plus } from 'lucide-react'
import { FilterBar, FilterState } from '@/components/shared/FilterBar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { apiClient } from '@/lib/axios'
import { formatDateTime, formatINR } from '@/utils'
import type { ITransaction, IBankAccount } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PopulatedTransaction extends Omit<ITransaction, 'bankId'> {
  bankId?: Pick<IBankAccount, '_id' | 'bankName' | 'accountNumber' | 'ifscCode'> | string | null
  referenceId?: string
  notes?: string
}

function getBankName(txn: PopulatedTransaction): string {
  if (!txn.bankId || typeof txn.bankId === 'string') return '—'
  return txn.bankId.bankName
}

function getBankSuffix(txn: PopulatedTransaction): string {
  if (!txn.bankId || typeof txn.bankId === 'string') return ''
  const acct = txn.bankId.accountNumber
  return acct ? ` ••••${acct.slice(-4)}` : ''
}

// ─── Status options ───────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: '',          label: 'All'       },
  { value: 'pending',   label: 'Pending'   },
  { value: 'completed', label: 'Completed' },
  { value: 'failed',    label: 'Failed'    },
]

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchSecurityDeposits(filter: FilterState): Promise<PopulatedTransaction[]> {
  const params = new URLSearchParams()
  if (filter.status)   params.set('status',   filter.status)
  if (filter.search)   params.set('search',   filter.search)
  if (filter.dateFrom) params.set('dateFrom', filter.dateFrom)
  if (filter.dateTo)   params.set('dateTo',   filter.dateTo)

  const res = await apiClient.get(`/security-deposits?${params}`)
  return res.data.data ?? []
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-border-subtle">
      <div className="skeleton w-9 h-9 rounded-full shrink-0" />
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="skeleton h-3.5 w-1/2 rounded" />
        <div className="skeleton h-3 w-1/3 rounded" />
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <div className="skeleton h-3.5 w-14 rounded" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
    </div>
  )
}

// ─── Transaction row ──────────────────────────────────────────────────────────

function TxnRow({ txn }: { txn: PopulatedTransaction }) {
  return (
    <Link
      href={`/transactions/${txn._id}`}
      className="flex items-center gap-3 py-3.5 border-b border-border-subtle last:border-0 transition-colors hover:bg-[rgba(255,255,255,0.02)] cursor-pointer"
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border"
        style={{
          background: 'var(--accent-green-dim)',
          borderColor: 'rgba(22,163,74,0.15)',
        }}
      >
        <Shield className="w-4 h-4 text-green" />
      </div>

      {/* Left */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-primary truncate">
          {formatINR(txn.amount)}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <Building2 className="w-3 h-3 text-muted shrink-0" />
          <p className="text-[12px] text-muted truncate">
            {getBankName(txn)}{getBankSuffix(txn)}
          </p>
        </div>
        <p className="text-[11px] text-muted mt-0.5">
          {formatDateTime(txn.createdAt)}
        </p>
      </div>

      {/* Right */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <StatusBadge status={txn.status as 'pending' | 'completed' | 'failed'} />
      </div>
    </Link>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const EMPTY_FILTER: FilterState = { status: '', search: '', dateFrom: '', dateTo: '' }

export default function SecurityDepositsPage() {
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER)

  const { data: txns = [], isLoading, isError } = useQuery<PopulatedTransaction[]>({
    queryKey:  ['security-deposits', filter],
    queryFn:   () => fetchSecurityDeposits(filter),
    staleTime: 20_000,
  })

  const handleFilterChange = useCallback((next: FilterState) => setFilter(next), [])

  const hasActiveFilter = filter.status !== '' || filter.search !== '' || filter.dateFrom !== '' || filter.dateTo !== ''

  return (
    <div className="flex flex-col gap-4 animate-[fadeIn_200ms_ease-out]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-primary">Security Deposits</h1>
        <Link
          href="/security-deposits/add"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-bold min-h-11 touch-manipulation whitespace-nowrap transition-transform active:scale-95"
          style={{
            background: 'linear-gradient(145deg, var(--accent-green-light), var(--accent-green))',
            boxShadow: '0 4px 12px var(--accent-green-dim)',
            color : 'var(--text-primary)',
          }}
        >
          <Plus className="w-4 h-4" />
          Add Deposit
        </Link>
      </div>

      {/* Filter */}
      <FilterBar
        value={filter}
        onChange={handleFilterChange}
        statusOptions={STATUS_OPTIONS}
        searchPlaceholder="Search reference…"
      />

      {/* Results */}
      <div className="page-card p-0! overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-subtle">
          <p className="section-label mb-0">SECURITY DEPOSITS</p>
          {!isLoading && !isError && (
            <p className="text-[12px] text-muted">
              {txns.length} {txns.length === 1 ? 'record' : 'records'}
            </p>
          )}
        </div>

        <div className="px-4">
          {/* Loading */}
          {isLoading && <><RowSkeleton /><RowSkeleton /><RowSkeleton /></>}

          {/* Error */}
          {isError && (
            <p className="text-sm text-muted text-center py-8">
              Failed to load. Please refresh.
            </p>
          )}

          {/* Empty state */}
          {!isLoading && !isError && txns.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-[15px] font-bold text-primary">No Data Exists.</p>
              <p className="text-[13px] text-muted mt-1">
                {hasActiveFilter
                  ? 'Please change the date range.'
                  : 'No security deposits yet.'}
              </p>
            </div>
          )}

          {/* Rows */}
          {!isLoading && !isError && txns.length > 0 &&
            txns.map((txn) => <TxnRow key={txn._id} txn={txn} />)
          }
        </div>
      </div>
    </div>
  )
}
