# PayzDesk — Design System

**Version:** 2.0  
**Updated:** 2026-05-26  
**Primary target:** Mobile browsers (375–430px). Desktop is a progressive enhancement.

---

> **Core principle:** PayzDesk is a working tool, not a marketing page. Every design decision optimises for speed of comprehension and accuracy of action — agents are processing financial transactions under time pressure, often on a phone with one hand. No decorative clutter. No ambiguous affordances. Every element earns its space.

---

## 1. Visual Identity

### Relationship to the reference app

PayzDesk takes direct inspiration from the SuperPayz Android app in layout structure and information hierarchy. The differences are intentional upgrades:

| Dimension        | SuperPayz (reference)        | PayzDesk                                |
| ---------------- | ---------------------------- | --------------------------------------- |
| Background       | Flat dark navy `#0d1526`     | Subtle gradient `#060a16 → #0f172a`     |
| Cards            | Flat dark fill `#1a2235`     | Glassmorphic with `backdrop-blur`       |
| Typography       | System sans-serif            | Inter — same family, tighter tracking   |
| Active nav state | Bold text only               | Gold left border + subtle bg tint       |
| Primary CTA      | Gold/amber (`#c9a84c` style) | Green (`#16a34a`) for deposit actions   |
| Gold accent      | CTAs + referral cards        | Branding, labels, focus rings, referral |
| Animations       | None (native transitions)    | Subtle fade-ins, skeleton loaders       |

The app is darker, more refined, and uses gold exclusively for brand/earnings contexts — green owns all "do something now" actions.

---

## 2. Color System

All values live in `globals.css` as CSS variables. **Never hardcode a color in a component.**

### Dark theme (default — always active)

```
Page background:    #060a16  (deepest layer)
Gradient end:       #0f172a
Card surface:       rgba(16, 24, 40, 0.70)  + backdrop-blur(16px)
Card solid:         #101828  (fallback, no blur support)
Input bg:           rgba(20, 29, 46, 0.60)
Input bg focused:   rgba(26, 38, 64, 0.80)
Sidebar bg:         #090e1b

Border default:     rgba(255,255,255, 0.08)
Border subtle:      rgba(255,255,255, 0.04)
Border strong:      rgba(255,255,255, 0.15)
Border focus:       #f5a623  (gold ring on active input)

Text primary:       #f8fafc
Text secondary:     #94a3b8
Text muted:         #64748b
Text link:          #f5a623
```

### Accent palette

| Token                  | Hex                     | Usage                                                                                             |
| ---------------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| `--accent-gold`        | `#f5a623`               | Logo "Desk", nav active state, focus rings, referral cards, commission values, referral code pill |
| `--accent-gold-light`  | `#fbbf24`               | Hover state of gold elements                                                                      |
| `--accent-gold-dim`    | `rgba(245,166,35,0.15)` | Gold card backgrounds, subtle tints                                                               |
| `--accent-green`       | `#16a34a`               | Deposit CTA button, Completed badge, success states                                               |
| `--accent-green-light` | `#22c55e`               | Green hover, button gradient top                                                                  |
| `--accent-blue`        | `#3b82f6`               | Info badges, support button, referral share                                                       |
| `--accent-red`         | `#ef4444`               | Cancel buttons, Failed badge, error states, Disabled status text                                  |
| `--accent-amber`       | `#f59e0b`               | Pending badge, warning states                                                                     |

### Status badge colours (used across all list screens)

| Status    | Text      | Background                     |
| --------- | --------- | ------------------------------ |
| Pending   | `#f59e0b` | `rgba(245,158,11, 0.12)`       |
| Completed | `#22c55e` | `rgba(34,197,94, 0.12)`        |
| Failed    | `#f87171` | `rgba(248,113,113, 0.12)`      |
| Disputed  | `#fb923c` | `rgba(251,146,60, 0.12)`       |
| Disabled  | `#ef4444` | transparent (inline text only) |
| Active    | `#22c55e` | transparent (inline text only) |

---

## 3. Typography

**Font:** Inter (Google Fonts, variable). Loaded via `next/font/google`.  
**CSS variable:** `--font-inter`

### Scale

| Role          | Size                 | Weight | Usage                                                                                    |
| ------------- | -------------------- | ------ | ---------------------------------------------------------------------------------------- |
| Page title    | 18px / `text-lg`     | 700    | Screen header (e.g. "Settings", "UTR Details")                                           |
| Section label | 11px / `text-[11px]` | 600    | ALL CAPS, `tracking-widest`, muted colour — e.g. "APP SECURITY", "SELECT BANK", "FILTER" |
| Card heading  | 15px / `text-[15px]` | 600    | Primary label inside a card row                                                          |
| Card subtext  | 13px / `text-[13px]` | 400    | Description under a card heading                                                         |
| Body          | 14px / `text-sm`     | 400    | General content                                                                          |
| Metric value  | 22–28px              | 700    | Balance amounts, commission totals                                                       |
| Badge         | 11px                 | 600    | Status chips                                                                             |
| Button        | 15–16px              | 700    | All buttons                                                                              |
| Input         | 16px                 | 500    | Prevents iOS auto-zoom (must be ≥ 16px)                                                  |

### Section labels (pattern from screenshots)

The original app uses ALL CAPS grey labels above form groups and filter areas. Keep this — it creates visual hierarchy without needing heavy borders.

```tsx
// Use this pattern everywhere
<p className="section-label">SELECT BANK</p>
// CSS: font-size: 11px; font-weight: 600; letter-spacing: 0.1em;
//      text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;
```

---

## 4. Navigation

### Mobile (< 768px) — Side Drawer, NOT bottom tabs

The reference app uses a **hamburger → left slide-in drawer**. We replicate this exactly. The drawer covers ~85% of screen width, slides in from left, with a dark overlay behind it.

**This is the correct mobile nav pattern for this app.** A bottom tab bar was considered but rejected — the app has too many nav destinations (12+) for a bottom tab pattern to work.

#### Mobile header bar (always visible)

```
[☰ hamburger]   [PayzDesk logo — centered]   [Deposit → green pill]
```

- Height: 52px
- Background: `var(--bg-sidebar)` with bottom border
- Hamburger: left-aligned, 44×44px tap target
- Logo: centered, "Payz" white + "Desk" gold
- Deposit CTA: right-aligned green pill button, "Deposit" text

#### Drawer structure (matches screenshots exactly)

```
┌─────────────────────────────┐
│  [avatar circle]            │
│  9646882787                 │  ← phone number, bold white
│  Click here for Profile     │  ← green link text
├─────────────────────────────┤
│  🏠  Home                   │
│  🕐  History          ∧     │  ← expanded accordion
│      Deposit Requests       │
│      Withdrawal Requests    │
│      Security Deposits      │
│      Security Withdrawals   │
│  🏛  Bank Details           │
│  🔑  Change Password        │
│  🎖  Performance Commission │
│  ⚙️  Settings               │
│  #   UTR                ∧   │  ← expanded accordion
│      Create UTR             │
│      UTR History            │
│  📄  Reports          ∨     │
│      Finance Report         │
│      Adjustments            │
│  ❓  Help             ∨     │
│      FAQ                    │
│      Tutorial               │
│      Contact Support        │
│  👥  Refer & Earn           │
├─────────────────────────────┤
│  [→  Logout                ]│
└─────────────────────────────┘
```

#### Drawer styling rules

- Drawer bg: `var(--bg-sidebar)` (`#090e1b`)
- Item height: 48px minimum tap target
- Item padding: `12px 20px`
- Icon: 18px, `text-secondary`, in a 32px wrapper
- Active item: gold left border (3px) + `rgba(245,166,35,0.08)` bg tint + gold text
- Inactive item: white bold text
- Sub-items (accordion children): no icon, 14px, `text-secondary`, `padding-left: 56px`
- Section dividers: `1px solid var(--border-subtle)` between major groups
- Accordion chevron: right-aligned, rotates on open (CSS transition)

### Desktop (≥ 768px) — Fixed left sidebar

Same nav structure as the drawer, permanently visible. Width: 260px. Sticky, full height.

---

## 5. Layout Patterns

### 5.1 Page structure (mobile)

```
┌──────────────────────┐
│   Mobile Header      │  52px fixed top
├──────────────────────┤
│                      │
│   Page Content       │  scrollable, padding: 16px
│                      │
│                      │
└──────────────────────┘
```

- No bottom navigation bar
- Content area: `padding: 16px`
- Max content width on desktop: `768px` centered

### 5.2 Page header (inside content area)

Most pages (Settings, UTR Details, Create UTR, Add Bank) show a page title inside the content area below the mobile header. This is separate from the mobile header bar.

```tsx
// Used on sub-pages only (not dashboard)
<div className="page-header">
	<h1>Settings</h1>
</div>
```

On mobile this is NOT shown since the mobile header already shows the page name in center. On desktop it IS shown as the page `<h1>`.

### 5.3 Cards

All content sections live in cards. Card = the fundamental layout unit.

```css
.card {
	background: var(--bg-card); /* glassmorphic */
	backdrop-filter: blur(12px);
	border: 1px solid var(--border-default);
	border-radius: 14px;
	padding: 16px;
}
```

Card variants:

- **Default card** — dark glass, for most content
- **Gold card** — `background: var(--accent-gold)` — used for commission cycle, referral earnings highlight. Text is dark (`#1a1000`).
- **Inset box** — darker bg inside a card, e.g. the "Max Withdrawal Limit" display in Settings. `background: rgba(0,0,0,0.2); border-radius: 10px; padding: 12px 16px;`

### 5.4 Form inputs

Inputs are full-width, tall, rounded, and have no visible border at rest — only bg contrast separates them from the card.

```css
.form-input {
	width: 100%;
	background: var(--bg-input);
	border: 1px solid var(--border-subtle); /* nearly invisible at rest */
	border-radius: 12px;
	padding: 16px;
	font-size: 16px; /* critical — prevents iOS zoom */
	color: var(--text-primary);
}
.form-input:focus {
	border-color: var(--border-focus); /* gold ring */
	background: var(--bg-input-focus);
}
```

**Section label above input:** ALL CAPS, 11px, muted, tracked — always present above form groups.

### 5.5 Buttons

| Variant       | Background                          | Text                | Usage                                                  |
| ------------- | ----------------------------------- | ------------------- | ------------------------------------------------------ |
| Primary green | `linear-gradient(#22c55e, #16a34a)` | White               | Deposit CTA, primary confirm actions                   |
| Primary gold  | `linear-gradient(#fbbf24, #f5a623)` | Dark `#1a1000`      | Referral code copy, "Verify & Add Bank"                |
| Danger red    | `#ef4444`                           | White               | Cancel, destructive actions                            |
| Ghost dark    | `var(--bg-input)`                   | White               | Secondary actions, CLEAR button                        |
| Disabled      | `var(--bg-input)`                   | `var(--text-muted)` | Inactive submit (e.g. SUBMIT UTR before fields filled) |

All buttons:

- Full width on mobile
- `border-radius: 9999px` (pill shape — as seen in screenshots)
- `padding: 16px 20px`
- `font-size: 16px; font-weight: 700`
- Active: `transform: scale(0.97)`
- Min height: 52px

**Special: segmented tab button** (Referral screen — "Referred List" / "Commission Details")

- Container: `border-radius: 9999px; background: var(--bg-input); padding: 4px; display: flex`
- Active tab: gold bg pill
- Inactive tab: transparent, muted text

### 5.6 Filter bar (Deposits, Withdrawals, UTR History)

Exact pattern from screenshots:

```
┌─────────────────────────────────┐
│ FILTER                          │  ← section label
├────────────────┬────────────────┤
│ [All      ▾]  │ [🔍 Search...] │  ← row 1: status dropdown + search
├────────────────┴────────────────┤
│ [↺ CLEAR]     │ [📅 DATE]      │  ← row 2: clear + date picker
└─────────────────────────────────┘
```

- Entire filter wrapped in a `.card`
- Status dropdown: white/light pill, left half of row
- Search: grey pill, right half of row (with magnifier icon)
- CLEAR + DATE: dark ghost buttons, equal width, row below
- All pill-shaped (`border-radius: 9999px`)

### 5.7 Settings rows

```
┌──────────────────────────────────┐
│ SECTION LABEL                    │
│                                  │
│ [icon bg]  Title          [toggle]│
│            Subtitle              │
│ ─────────────────────────────── │
│ Status:  Enabled / Disabled      │  ← coloured inline text
│                                  │
│ [  Inset info box value  ]       │
└──────────────────────────────────┘
```

- Icon: 40×40px dark circle (`rgba(255,255,255,0.06)`), icon inside at 18px
- Toggle: native-styled, green when on
- Status text: inline, `color: var(--accent-green)` if enabled, `var(--accent-red)` if disabled

### 5.8 Empty state

```
┌─────────────────────────────┐
│ No Data Exists.             │  ← bold white, 15px
│ Please change the date range│  ← muted, 13px
└─────────────────────────────┘
```

Simple card, left-aligned text, no illustration. Matches the functional, no-clutter reference app.

---

## 6. Specific Screen Patterns

### 6.1 Dashboard

- Metric grid: 2-column grid of stat cards (Net Balance, Commission Earned, Blocked Deposit, WDR Hold, Total Banks, Active Banks, Disputed WDR)
- Each stat card: label (muted, 12px), value (bold, 20px, white or gold for monetary)
- Quick links row: 4 icon circles with labels below — Bank Accounts, Deposit Requests, Withdrawal Requests, Withdraw
- Live Pool promo card: locked state, gold accent, "Enable Withdrawal in Settings to unlock"
- Referral banner: thin strip, gold text, tap to navigate
- Deposit/Withdrawal count tabs below metrics

### 6.2 Sidebar / Drawer (see Section 4)

Matches screenshots exactly. User avatar circle + phone + profile link at top. Logout at very bottom with divider above.

### 6.3 Add Bank form

- Single scrollable card
- ALL CAPS section title "ADD BANK ACCOUNT"
- All fields stacked vertically, full width
- Phone row: `+91` prefix box (dark, fixed width) + phone input (flex-1), side by side
- Disclaimer row: gold-bordered checkbox + amber/gold bold "IMPORTANT:" label + grey body text
- CTA: gold pill button at bottom — "Verify & Add Bank Account" (disabled until checkbox ticked)

### 6.4 Create UTR form

- Single card
- Section labels: "SELECT BANK", "ENTER UTR", "ENTER AMOUNT" — ALL CAPS, muted
- Bank: custom dropdown (not native select)
- UTR input: "ID" suffix icon on right
- Amount input: rupee/card icon on right
- Submit: ghost dark button (disabled state by default)
- Cancel: full-width red pill button below submit

### 6.5 Referral page

- Top card (dark glass): "Your Lifetime Referral Earnings", gold `₹0.00` value, subtitle, referral code pill (gold, copyable), tap hint
- Commission cycle card (GOLD background): "Current Commission Cycle" chip label, date range + amount, PENDING PAYOUT status
- Action row: 3 equal icon+label buttons (WhatsApp, Share, FAQ) in a dark card
- Segmented tab: "Referred List" (gold active) / "Commission Details"
- Content below tab: list or empty state

---

## 7. Component CSS Classes (globals.css additions)

These utility classes belong in `globals.css` and are used across JSX:

```css
.section-label       /* ALL CAPS 11px muted tracked label above form groups */
.page-card           /* standard glass card — most content container */
.gold-card           /* solid gold card — commission/referral highlights */
.inset-box           /* darker inset within a card — info display */
.filter-card         /* card containing the filter bar */
.setting-row         /* flex row: icon + text block + toggle/value */
.btn-gold            /* gold gradient pill button */
.btn-danger          /* red pill button */
.btn-ghost-dark      /* dark ghost pill button */
.segmented-tabs      /* referral screen tab switcher */
.stat-card           /* dashboard metric card */
.quick-link          /* dashboard quick link circle + label */
.empty-state         /* no data card */
.drawer-item         /* sidebar nav item */
.drawer-child        /* sidebar accordion sub-item */
```

---

## 8. Micro-interactions & Animation

Keep animations subtle — this is a financial tool, not a consumer app.

| Interaction            | Animation                                  |
| ---------------------- | ------------------------------------------ |
| Page mount             | `fadeIn` 200ms ease-out                    |
| Auth card (mobile)     | `slideUp` 300ms cubic-bezier(0.4,0,0.2,1)  |
| Drawer open            | `translateX` 280ms ease-out                |
| Drawer close           | `translateX` 220ms ease-in                 |
| Button press           | `scale(0.97)` 100ms                        |
| Button hover (desktop) | `translateY(-1px)` 150ms                   |
| Skeleton loader        | `skeleton-pulse` 1.6s ease-in-out infinite |
| Accordion open         | `max-height` transition 200ms ease-out     |
| Toggle switch          | Native CSS transition, green fill          |

No bounce, no spring physics, no parallax. Clean and fast.

---

## 9. Mobile-Specific Rules

1. **Font size ≥ 16px on all inputs** — prevents iOS Safari auto-zoom
2. **Min tap target: 44×44px** — apply `min-h-[44px] min-w-[44px]` to all interactive elements
3. **`touch-action: manipulation`** on buttons and links — removes 300ms tap delay
4. **`-webkit-tap-highlight-color: transparent`** globally — no grey flash on tap
5. **`env(safe-area-inset-*)`** on body padding — handles notch/home indicator on iOS
6. **No hover-only states** — any hover interaction must have an equivalent active/focus state
7. **Scrollbar hidden on iOS, 4px on Android** — already in globals.css
8. **`100dvh` for full-screen containers** — use `dvh` with `vh` fallback for correct mobile viewport

---

## 10. What We Are NOT Doing

- ❌ Bottom navigation bar — too few destinations per tab, drawer works better
- ❌ Light theme as primary — dark only; light theme CSS variables exist but are not surfaced to user in MVP
- ❌ Illustrations or empty-state artwork — plain text empty states like the reference app
- ❌ Gradient mesh backgrounds on inner pages — gradient only on auth pages and page bg
- ❌ Purple, pink, or any off-brand accent colours
- ❌ Floating action buttons (FABs) — all actions are inline or in the header
- ❌ Card carousels / horizontal scroll for key data — vertical stacking only
- ❌ Modal dialogs for navigation — drawer and page routing only

---

## 11. globals.css Class Reference

The following custom utility classes must exist in `globals.css`. Components import them by class name — no inline style props for design tokens.

| Class               | Description                                     |
| ------------------- | ----------------------------------------------- |
| `.auth-page`        | Full-screen gradient wrapper for login/register |
| `.auth-card`        | Glassmorphic floating card for auth forms       |
| `.form-input`       | Standard full-width rounded input               |
| `.form-input.error` | Red border + red dim bg variant                 |
| `.field-label`      | Label above input                               |
| `.field-error`      | Red error text below input                      |
| `.error-banner`     | Red banner for form-level errors                |
| `.btn-primary`      | Green gradient pill — main CTA                  |
| `.btn-gold`         | Gold gradient pill — referral/verify actions    |
| `.btn-danger`       | Red pill — cancel/destructive                   |
| `.btn-ghost`        | Dark ghost pill — secondary actions             |
| `.section-label`    | ALL CAPS muted section header                   |
| `.page-card`        | Standard glass content card                     |
| `.gold-card`        | Solid gold card for earnings display            |
| `.inset-box`        | Dark inset within a card                        |
| `.stat-card`        | Dashboard metric tile                           |
| `.empty-state`      | No-data card                                    |
| `.skeleton`         | Animated loading placeholder                    |
| `.otp-input`        | Large monospace OTP field                       |
| `.step-dot`         | Multi-step progress indicator dot               |
| `.step-line`        | Connector between step dots                     |
| `.drawer-item`      | Sidebar/drawer nav row                          |
| `.drawer-child`     | Accordion sub-item in sidebar                   |
| `.setting-row`      | Settings screen icon+text+control row           |
| `.filter-card`      | Filter bar wrapper card                         |
| `.segmented-tabs`   | Two-option pill tab switcher                    |
