'use client'

/**
 * FilterBar — shared filter control used on /utr, /deposits, /withdrawals.
 *
 * Layout (from CONVERSION_SPEC.md §5 / DESIGN.md §5.6):
 *
 *   ┌──────────────────────────────────────────┐
 *   │ FILTER                                   │  ← section label
 *   ├──────────────────┬───────────────────────┤
 *   │ [All        ▾]  │ [🔍 Search...       ]  │  ← row 1
 *   ├──────────────────┴───────────────────────┤
 *   │ [↺ CLEAR]         │ [📅 DATE]            │  ← row 2
 *   └──────────────────────────────────────────┘
 */

import { useState, useRef } from 'react'
import { Search, RotateCcw, Calendar, ChevronDown } from 'lucide-react'

export interface FilterState {
  status:   string   // '' = all
  search:   string
  dateFrom: string   // ISO date string or ''
  dateTo:   string   // ISO date string or ''
}

export interface StatusOption {
  value: string
  label: string
}

interface FilterBarProps {
  value:         FilterState
  onChange:      (next: FilterState) => void
  statusOptions: StatusOption[]   // e.g. [{value:'',label:'All'},{value:'pending',label:'Pending'}]
  searchPlaceholder?: string
}

const EMPTY_FILTER: FilterState = {
  status: '', search: '', dateFrom: '', dateTo: '',
}

export function FilterBar({
  value,
  onChange,
  statusOptions,
  searchPlaceholder = 'Search…',
}: FilterBarProps) {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const dateRef = useRef<HTMLDivElement>(null)

  function set(partial: Partial<FilterState>) {
    onChange({ ...value, ...partial })
  }

  function handleClear() {
    onChange(EMPTY_FILTER)
    setShowDatePicker(false)
  }

  const hasActiveFilter =
    value.status !== '' ||
    value.search !== '' ||
    value.dateFrom !== '' ||
    value.dateTo !== ''

  return (
    <div className="filter-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Section label */}
      <p className="section-label" style={{ marginBottom: 0 }}>FILTER</p>

      {/* Row 1: Status dropdown + Search */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {/* Status dropdown */}
        <div style={{ position: 'relative', flex: '0 0 auto' }}>
          <select
            id="filter-status"
            value={value.status}
            onChange={(e) => set({ status: e.target.value })}
            style={{
              appearance:      'none',
              WebkitAppearance:'none',
              background:      'var(--bg-input)',
              border:          '1px solid var(--border-subtle)',
              borderRadius:    'var(--radius-full)',
              padding:         '10px 36px 10px 14px',
              fontSize:        '14px',
              fontWeight:      600,
              color:           value.status ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor:          'pointer',
              minHeight:       '44px',
              outline:         'none',
              whiteSpace:      'nowrap',
            }}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            style={{
              position:       'absolute',
              right:          '12px',
              top:            '50%',
              transform:      'translateY(-50%)',
              color:          'var(--text-muted)',
              pointerEvents:  'none',
            }}
          />
        </div>

        {/* Search input */}
        <div
          style={{
            flex:         1,
            position:     'relative',
            display:      'flex',
            alignItems:   'center',
          }}
        >
          <Search
            size={14}
            style={{
              position:      'absolute',
              left:          '12px',
              color:         'var(--text-muted)',
              pointerEvents: 'none',
              flexShrink:    0,
            }}
          />
          <input
            id="filter-search"
            type="search"
            placeholder={searchPlaceholder}
            value={value.search}
            onChange={(e) => set({ search: e.target.value })}
            style={{
              width:        '100%',
              background:   'var(--bg-input)',
              border:       '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              padding:      '10px 14px 10px 34px',
              fontSize:     '14px',
              color:        'var(--text-primary)',
              minHeight:    '44px',
              outline:      'none',
              transition:   'border-color 150ms ease-out',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--border-focus)' }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
          />
        </div>
      </div>

      {/* Row 2: Clear + Date */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {/* Clear button */}
        <button
          type="button"
          onClick={handleClear}
          style={{
            flex:         1,
            display:      'flex',
            alignItems:   'center',
            justifyContent:'center',
            gap:          '6px',
            background:   hasActiveFilter ? 'var(--accent-red-dim)' : 'var(--bg-input)',
            border:       `1px solid ${hasActiveFilter ? 'rgba(239,68,68,0.25)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-full)',
            padding:      '10px 14px',
            fontSize:     '13px',
            fontWeight:   700,
            color:        hasActiveFilter ? 'var(--accent-red)' : 'var(--text-secondary)',
            letterSpacing:'0.05em',
            minHeight:    '44px',
            cursor:       'pointer',
            transition:   'background-color 150ms ease-out, color 150ms ease-out, border-color 150ms ease-out',
            touchAction:  'manipulation',
          }}
        >
          <RotateCcw size={13} />
          CLEAR
        </button>

        {/* Date button */}
        <button
          type="button"
          onClick={() => setShowDatePicker((v) => !v)}
          style={{
            flex:          1,
            display:       'flex',
            alignItems:    'center',
            justifyContent:'center',
            gap:           '6px',
            background:    (value.dateFrom || value.dateTo) ? 'var(--accent-gold-dim)' : 'var(--bg-input)',
            border:        `1px solid ${(value.dateFrom || value.dateTo) ? 'rgba(245,166,35,0.3)' : 'var(--border-subtle)'}`,
            borderRadius:  'var(--radius-full)',
            padding:       '10px 14px',
            fontSize:      '13px',
            fontWeight:    700,
            color:         (value.dateFrom || value.dateTo) ? 'var(--accent-gold)' : 'var(--text-secondary)',
            letterSpacing: '0.05em',
            minHeight:     '44px',
            cursor:        'pointer',
            transition:    'background-color 150ms ease-out, color 150ms ease-out',
            touchAction:   'manipulation',
          }}
        >
          <Calendar size={13} />
          DATE
        </button>
      </div>

      {/* Date range picker — shown inline when DATE is tapped */}
      {showDatePicker && (
        <div
          ref={dateRef}
          style={{
            display:       'grid',
            gridTemplateColumns: '1fr 1fr',
            gap:           '8px',
            padding:       '12px 0 4px',
            borderTop:     '1px solid var(--border-subtle)',
            animation:     'fadeIn 150ms ease-out',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p className="section-label" style={{ marginBottom: 0 }}>FROM</p>
            <input
              id="filter-date-from"
              type="date"
              value={value.dateFrom}
              onChange={(e) => set({ dateFrom: e.target.value })}
              max={value.dateTo || undefined}
              style={{
                background:   'var(--bg-input)',
                border:       '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding:      '10px 12px',
                fontSize:     '14px',
                color:        'var(--text-primary)',
                colorScheme:  'dark',
                outline:      'none',
                width:        '100%',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p className="section-label" style={{ marginBottom: 0 }}>TO</p>
            <input
              id="filter-date-to"
              type="date"
              value={value.dateTo}
              onChange={(e) => set({ dateTo: e.target.value })}
              min={value.dateFrom || undefined}
              style={{
                background:   'var(--bg-input)',
                border:       '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding:      '10px 12px',
                fontSize:     '14px',
                color:        'var(--text-primary)',
                colorScheme:  'dark',
                outline:      'none',
                width:        '100%',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
