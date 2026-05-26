'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Plus, Trash2, Building2, CreditCard, Phone } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { IBankAccount } from '@/types'

// ─── Fetch helpers ───────────────────────────────────────────────────────────

async function fetchBanks(): Promise<IBankAccount[]> {
  const res = await fetch('/api/banks')
  if (!res.ok) throw new Error('Failed to fetch banks')
  const json = await res.json()
  return json.data ?? []
}

async function deleteBank(id: string): Promise<void> {
  const res = await fetch(`/api/banks/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.message ?? 'Failed to delete bank')
  }
}

// ─── Mask account number — show only last 4 digits ───────────────────────────

function maskAccount(accountNumber: string): string {
  if (!accountNumber) return '—'
  if (accountNumber.length <= 4) return accountNumber
  const last4 = accountNumber.slice(-4)
  const masked = '•'.repeat(Math.min(accountNumber.length - 4, 8))
  return `${masked}${last4}`
}

// ─── Skeleton loader ─────────────────────────────────────────────────────────

function BankCardSkeleton() {
  return (
    <div className="page-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="skeleton" style={{ height: '18px', width: '55%', borderRadius: '8px' }} />
      <div className="skeleton" style={{ height: '14px', width: '40%', borderRadius: '8px' }} />
      <div className="skeleton" style={{ height: '14px', width: '30%', borderRadius: '8px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
        <div className="skeleton" style={{ height: '22px', width: '70px', borderRadius: '999px' }} />
        <div className="skeleton" style={{ height: '36px', width: '36px', borderRadius: '50%' }} />
      </div>
    </div>
  )
}

// ─── Individual bank card ────────────────────────────────────────────────────

interface BankCardProps {
  bank: IBankAccount
  onDelete: (id: string) => void
  deleting: boolean
}

function BankCard({ bank, onDelete, deleting }: BankCardProps) {
  const [confirming, setConfirming] = useState(false)

  function handleDeleteClick() {
    if (confirming) {
      onDelete(bank._id)
    } else {
      setConfirming(true)
      // Auto-cancel confirmation after 3s
      setTimeout(() => setConfirming(false), 3000)
    }
  }

  return (
    <div
      className="page-card"
      style={{
        display:       'flex',
        flexDirection: 'column',
        gap:           '10px',
        animation:     'fadeIn 200ms ease-out',
      }}
    >
      {/* Header row — bank name + delete */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <div
            style={{
              width:           '36px',
              height:          '36px',
              borderRadius:    'var(--radius-sm)',
              background:      'rgba(255,255,255,0.06)',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              flexShrink:      0,
            }}
          >
            <Building2 size={18} style={{ color: 'var(--accent-gold)' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize:     '15px',
                fontWeight:   700,
                color:        'var(--text-primary)',
                whiteSpace:   'nowrap',
                overflow:     'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {bank.bankName}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>
              {bank.accountHolderName}
            </p>
          </div>
        </div>

        {/* Delete button */}
        <button
          onClick={handleDeleteClick}
          disabled={deleting}
          aria-label={confirming ? 'Confirm delete bank' : 'Delete bank account'}
          style={{
            minWidth:        '44px',
            minHeight:       '44px',
            borderRadius:    'var(--radius-sm)',
            background:      confirming
              ? 'var(--accent-red-dim)'
              : 'rgba(255,255,255,0.04)',
            border:          confirming
              ? '1px solid rgba(239,68,68,0.3)'
              : '1px solid var(--border-subtle)',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            cursor:          deleting ? 'not-allowed' : 'pointer',
            transition:      'background-color 150ms ease-out, transform 100ms',
            flexShrink:      0,
            touchAction:     'manipulation',
          }}
        >
          <Trash2
            size={16}
            style={{ color: confirming ? 'var(--accent-red)' : 'var(--text-muted)' }}
          />
        </button>
      </div>

      {confirming && (
        <p style={{ fontSize: '12px', color: 'var(--accent-red)', fontWeight: 500 }}>
          Tap again to confirm deletion
        </p>
      )}

      {/* Account number row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <CreditCard size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
          {maskAccount(bank.accountNumber)}
        </span>
      </div>

      {/* UPI ID row */}
      {bank.upiId && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
            UPI
          </span>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {bank.upiId}
          </span>
        </div>
      )}

      {/* Phone row */}
      {bank.phone && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Phone size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            +91 {bank.phone}
          </span>
        </div>
      )}

      {/* Footer — IFSC + StatusBadge */}
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          paddingTop:     '8px',
          borderTop:      '1px solid var(--border-subtle)',
          marginTop:      '2px',
        }}
      >
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
          {bank.ifscCode}
        </span>
        <StatusBadge status={bank.status as 'active' | 'pending' | 'inactive'} />
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function BanksPage() {
  const queryClient = useQueryClient()

  const { data: banks = [], isLoading, isError } = useQuery<IBankAccount[]>({
    queryKey:  ['banks'],
    queryFn:   fetchBanks,
    staleTime: 30_000,
  })

  const { mutate: removeBank, isPending: isDeleting, variables: deletingId } = useMutation({
    mutationFn: deleteBank,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banks'] })
    },
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 200ms ease-out' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Bank Accounts
          </h1>
          {!isLoading && !isError && (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {banks.length === 0
                ? 'No bank accounts yet'
                : `${banks.length} account${banks.length !== 1 ? 's' : ''}`}
            </p>
          )}
        </div>

        <Link
          href="/banks/add"
          style={{
            display:         'flex',
            alignItems:      'center',
            gap:             '6px',
            background:      'linear-gradient(145deg, var(--accent-gold-light), var(--accent-gold))',
            color:           '#1a1000',
            fontSize:        '14px',
            fontWeight:      700,
            padding:         '10px 16px',
            borderRadius:    'var(--radius-full)',
            textDecoration:  'none',
            minHeight:       '44px',
            touchAction:     'manipulation',
            whiteSpace:      'nowrap',
            boxShadow:       '0 4px 12px var(--accent-gold-dim)',
            transition:      'transform 150ms ease-out, box-shadow 150ms ease-out',
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
          Add Bank
        </Link>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <BankCardSkeleton />
          <BankCardSkeleton />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="page-card">
          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Failed to load bank accounts
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Please refresh the page and try again.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && banks.length === 0 && (
        <div className="empty-state" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div
            style={{
              width:           '56px',
              height:          '56px',
              borderRadius:    '50%',
              background:      'rgba(245,166,35,0.1)',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              margin:          '0 auto 16px',
            }}
          >
            <Building2 size={26} style={{ color: 'var(--accent-gold)' }} />
          </div>
          <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
            No Bank Accounts
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px', marginBottom: '20px' }}>
            Add a bank account to start processing deposits and withdrawals.
          </p>
          <Link
            href="/banks/add"
            className="btn-gold"
            style={{ display: 'inline-flex', width: 'auto', padding: '12px 24px' }}
          >
            <Plus size={16} />
            Add Your First Bank
          </Link>
        </div>
      )}

      {/* Bank cards list */}
      {!isLoading && !isError && banks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {banks.map((bank) => (
            <BankCard
              key={bank._id}
              bank={bank}
              onDelete={(id) => removeBank(id)}
              deleting={isDeleting && deletingId === bank._id}
            />
          ))}
        </div>
      )}

      {/* Info note */}
      {!isLoading && !isError && banks.length > 0 && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', paddingBottom: '8px' }}>
          Only Active accounts can be used for transactions.
        </p>
      )}
    </div>
  )
}
