# PayzDesk — Progress Summary

**Last updated:** 2026-05-30
**Stack:** Next.js 16 · TypeScript · Tailwind v4 · App Router

---

## Project Goal

Build **PayzDesk** — a web-based payment agent management platform — by converting the SuperPayz Android APK into a mobile-first web app with an independent codebase, backend, and database.

---

## Foundation (Complete ✅)

- Next.js App Router, TypeScript, Tailwind v4, Zustand, TanStack Query, React Hook Form + Zod, Axios
- MongoDB (Mongoose), Upstash Redis (OTP/rate-limit), Pusher (WebSockets), MSG91 (SMS)
- `db.ts`, `auth.ts`, `redis.ts`, `axios.ts`, `getAuthUser.ts`, `otp.ts`, `pusher.ts`
- `globals.css` — full dark theme token system; CSS vars + Tailwind v4 `@theme` bridge
- UI primitives: Button, Input, Card, Badge, Spinner, StatusBadge, FilterBar
- `middleware.ts` — protects dashboard routes; `/api/auth` public
- Design rule: Tailwind utility classes first; inline `style` only for CSS vars; no new globals.css classes unless justified

---

## User App — All Phases Complete ✅

### Phase 1 — MVP (15 routes) ✅
Auth (login, register, forgot-password, onboarding), dashboard, deposit initiation, deposit/withdrawal lists, banks (list + add with OTP), UTR (create + history), settings (withdrawal toggle + change password), profile.

### Phase 2 — Earnings & Reporting (13 routes) ✅
Referral, performance commission, commission details, transaction detail, security deposits (list + add + detail), security withdrawals (list + add), finance report + info, adjustments, tiers.

### Phase 3 — Real-time & Support (5 routes) ✅
FAQ, tutorial, deposit payment confirmation, support (form + ticket history), live pool (Pusher real-time job feed + grab).

### User Route Checklist

| Route | UI | API |
|-------|----|-----|
| `/login` | ✅ | ✅ |
| `/register` | ✅ | ✅ |
| `/forgot-password` | ✅ | ✅ |
| `/onboarding` | ✅ | — |
| `/` (dashboard) | ✅ | ✅ |
| `/deposit` | ✅ | ✅ |
| `/deposit/payment` | ✅ | — |
| `/deposits` | ✅ | ✅ |
| `/withdrawals` | ✅ | ✅ |
| `/banks` | ✅ | ✅ |
| `/banks/add` | ✅ | ✅ |
| `/utr` | ✅ | ✅ |
| `/utr/create` | ✅ | ✅ |
| `/settings` | ✅ | ✅ |
| `/settings/change-password` | ✅ | ✅ |
| `/profile` | ✅ | ✅ |
| `/referral` | ✅ | ✅ |
| `/commission/performance` | ✅ | ✅ |
| `/commission/details` | ✅ | ✅ |
| `/transactions/:id` | ✅ | ✅ |
| `/security-deposits` | ✅ | ✅ |
| `/security-deposits/add` | ✅ | ✅ |
| `/security-deposits/:id` | ✅ | ✅ |
| `/security-withdrawals` | ✅ | ✅ |
| `/security-withdrawals/add` | ✅ | ✅ |
| `/reports/finance` | ✅ | ✅ |
| `/reports/finance/info` | ✅ | — |
| `/reports/adjustments` | ✅ | ✅ |
| `/tiers` | ✅ | ✅ |
| `/live-pool` | ✅ | ✅ |
| `/help/faq` | ✅ | — |
| `/help/tutorial` | ✅ | — |
| `/support` | ✅ | ✅ |

### Data Models (User Side)

| Model | Key Fields | Status |
|-------|-----------|--------|
| `User` | phone, passwordHash, netBalance, commissionEarned, blockedDeposit, withdrawalHoldAmount, totalBanks, activeBanks, disputedWithdrawalAmount, withdrawalEnabled, maxWithdrawalPerTxn, referralCode, referredBy | ✅ |
| `BankAccount` | userId, accountNumber, upiId, ifscCode, bankName, branch, address, phone, status, verified | ✅ |
| `Transaction` | userId, type (deposit/withdrawal/security_deposit/security_withdrawal), amount, status, bankId, utrNumber, referenceId, notes | ✅ |
| `UTR` | userId, bankId, utrNumber, amount, status — compound unique index (userId, utrNumber) | ✅ |
| `ReferralCycle` | userId, startDate, endDate, amount, status | ✅ |
| `ReferralCommission` | referrerId, referredUserId, cycleId, amount | ✅ |
| `PerformanceCommission` | userId, totalEarned, status, lastReleasedDate, frequencyDays, activePrograms[] | ✅ |
| `Adjustment` | userId, type (credit/debit), amount, description, referenceId | ✅ |
| `SupportTicket` | userId, subject, message, status | ✅ |
| `LivePoolJob` | transactionId, amount, bankId, status (available/grabbed/expired), grabbedBy, expiresAt | ✅ |

---

## Admin Panel — Build Plan

### Architecture Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Admin model | Separate `Admin` collection | Completely isolated from agents; no accidental role mixing |
| Admin login URL | `/[adminKey]/login` where `adminKey` must match `ADMIN_SECRET_KEY` env var; mismatch → 404 | Security through obscurity + credential auth on top |
| First admin | `scripts/seed-admin.ts` — one-time CLI script | No env phone hack needed; clean and explicit |
| Admin JWT | Separate secret (`ADMIN_JWT_SECRET`), stored in `adminToken` cookie | Fully decoupled from agent auth |
| Admin UI | Clean functional layouts, reuse existing components (Card, Badge, StatusBadge, FilterBar, Spinner) | No glassmorphic/gradient/transition effects; desktop-first |
| Admin middleware | Separate from user middleware; checks `adminToken` cookie + role | All `/admin/*` routes and `/api/admin/*` protected |

### Transaction Approval — Balance Logic (hardwired into all approval APIs)

| Action | Balance Effect |
|--------|---------------|
| Deposit approved | `netBalance += amount` · `blockedDeposit -= amount` |
| Deposit rejected | `blockedDeposit -= amount` |
| Withdrawal approved | `withdrawalHoldAmount -= amount` |
| Withdrawal rejected | `netBalance += amount` · `withdrawalHoldAmount -= amount` |

---

### Phase A1 — Foundation ✅
*Admin model, auth, middleware, login page, sidebar, dashboard — all built and security-audited.*

#### Step A1.1 — Admin Model, Seed Script & Auth
- `src/models/Admin.ts` — `name`, `phone`, `passwordHash`, `isActive`, `createdAt`
- `scripts/seed-admin.ts` — CLI script: prompts for name/phone/password, hashes, inserts into Admin collection; exits if admin already exists
- `src/lib/adminAuth.ts` — `signAdminToken(id)`, `verifyAdminToken(token)` using `ADMIN_JWT_SECRET`
- `src/lib/getAdminUser.ts` — shared helper: reads `adminToken` cookie, verifies, returns admin payload (used in all `/api/admin/*` handlers)
- API routes:
  - `POST /api/admin/auth/login` — phone + password → sets `adminToken` cookie
  - `POST /api/admin/auth/logout` — clears `adminToken` cookie
  - `GET /api/admin/auth/me` — returns current admin from cookie

#### Step A1.2 — Admin Shell, Middleware & Dashboard
- `src/middleware.ts` (update) — add `/admin/*` guard: checks `adminToken` cookie; redirect to `/${ADMIN_SECRET_KEY}/login` if missing
- `src/app/[adminKey]/login/page.tsx` — middleware validates key segment matches env var before rendering; simple phone + password form
- `src/app/(admin)/layout.tsx` — fixed left sidebar (desktop-first, no mobile drawer), admin nav, logout
- `src/app/(admin)/admin/page.tsx` — dashboard: 6 stat cards (total agents, pending deposits, pending withdrawals, pending UTRs, open support tickets, active live pool jobs)
- `GET /api/admin/stats` — aggregated counts for dashboard

**Routes:** `/[adminKey]/login` · `/admin`

---

### Phase A2 — Core Operations ✅
*The bread and butter — what admin needs daily to operate the platform.*

#### Step A2.1 — Agent Management ✅
- Agent list: table with phone, name, balance, status, join date; search by phone/name; filter by active/inactive
- Agent detail: profile card, balance breakdown (netBalance, blockedDeposit, withdrawalHoldAmount, commissionEarned), bank accounts list, last 10 transactions
- Actions on detail page: toggle active/inactive, override `maxWithdrawalPerTxn`
- APIs:
  - `GET /api/admin/agents` — paginated list, search + status filter
  - `GET /api/admin/agents/[id]` — full agent detail with populated banks + recent transactions
  - `PATCH /api/admin/agents/[id]` — `isActive` toggle, `maxWithdrawalPerTxn` update

**Routes:** `/admin/agents` · `/admin/agents/[id]`

#### Step A2.2 — Transaction Approval ✅
- Pending deposits queue: sorted oldest-first; each row shows agent phone, amount, bank, submitted date; inline Approve / Reject buttons; reject opens a note input
- Pending withdrawals queue: same pattern
- All transactions view: full cross-agent history; filters: type, status, agent search, date range (reuse FilterBar)
- Transaction detail: all fields + approve/reject action if still pending; shows balance effect preview
- APIs:
  - `GET /api/admin/transactions` — all transactions, all filters, pagination
  - `GET /api/admin/transactions/[id]` — single transaction + agent info
  - `PATCH /api/admin/transactions/[id]` — `approve` or `reject` (+ optional note); triggers balance update atomically

**Routes:** `/admin/transactions` · `/admin/transactions/[id]`

#### Step A2.3 — Bank Account Approval ✅
- All bank accounts across all agents: filter by status (pending/active/inactive/rejected); search by agent phone or account number
- Pending accounts surfaced at top; Approve / Reject inline
- Approved accounts can be deactivated; inactive accounts can be reactivated
- APIs:
  - `GET /api/admin/banks` — all banks, status filter, agent search
  - `PATCH /api/admin/banks/[id]` — `approve`, `reject`, `activate`, `deactivate`

**Routes:** `/admin/banks`

---

### Phase A3 — UTR & Security ⬜

#### Step A3.1 — UTR Verification
- Pending UTR queue: UTR number, amount, agent, bank name, submitted date; Verify / Reject inline; reject requires reason
- Full UTR history: status filter + agent search + date range (reuse FilterBar)
- APIs:
  - `GET /api/admin/utr` — all UTRs, filters
  - `PATCH /api/admin/utr/[id]` — `verify` or `reject` (+ reason stored in notes field)

**Routes:** `/admin/utr`

#### Step A3.2 — Security Operations
- Security deposits list (all agents): pending ones at top; Approve / Reject inline
- Security withdrawals list (all agents): same pattern
- Both use FilterBar (status + date)
- APIs:
  - `GET /api/admin/security-deposits` — all, filters
  - `PATCH /api/admin/security-deposits/[id]` — approve/reject (triggers balance update same as deposit logic)
  - `GET /api/admin/security-withdrawals` — all, filters
  - `PATCH /api/admin/security-withdrawals/[id]` — approve/reject (triggers balance update same as withdrawal logic)

**Routes:** `/admin/security-deposits` · `/admin/security-withdrawals`

---

### Phase A4 — Live Pool Management ⬜

#### Step A4.1 — Job Management
- Jobs list: filter by status (available/grabbed/expired); shows amount, bank, created time, expiry countdown, grabbed-by agent if applicable
- Create job form: select bank (from all active banks across all agents), amount, expiry duration (minutes)
- Cancel an active job: updates status to expired, broadcasts `job.expired` Pusher event
- On create: broadcasts `job.available` Pusher event to `live-pool` channel
- APIs:
  - `GET /api/admin/live-pool` — all jobs, status filter
  - `POST /api/admin/live-pool` — create job (validates bank exists + active; broadcasts Pusher event)
  - `PATCH /api/admin/live-pool/[id]` — cancel/force-expire (broadcasts Pusher event)

**Routes:** `/admin/live-pool` · `/admin/live-pool/create`

---

### Phase A5 — Finance & Commissions ⬜

#### Step A5.1 — Commission Management
- Performance commissions list: all agents, filter by status (pending/released); Release button per row; release credits `commissionEarned` on agent atomically
- Referral cycles list: all cycles across agents, status (active/closed/paid); Close Cycle button ends active cycle; Release Payout button credits agent `commissionEarned`
- APIs:
  - `GET /api/admin/commissions` — performance records, status filter
  - `PATCH /api/admin/commissions/[id]` — release (updates PerformanceCommission status + agent commissionEarned)
  - `GET /api/admin/commissions/referral` — referral cycles, status filter
  - `PATCH /api/admin/commissions/referral/[id]` — close cycle or release payout

**Routes:** `/admin/commissions` · `/admin/commissions/referral`

#### Step A5.2 — Manual Adjustments
- Create adjustment: pick agent (search by phone), type (credit/debit), amount, description; credit adds to `netBalance`, debit subtracts (with balance floor check)
- All adjustments log: filter by agent, type (credit/debit), date range (reuse FilterBar)
- APIs:
  - `GET /api/admin/adjustments` — all adjustments, filters
  - `POST /api/admin/adjustments` — create; atomically updates agent `netBalance`

**Routes:** `/admin/adjustments` · `/admin/adjustments/create`

#### Step A5.3 — Reports
- Platform finance report: date range picker; totals for deposits, withdrawals, security deposits, security withdrawals, commissions released, adjustments (credit vs debit)
- Per-agent drill-down: same breakdown but filtered to one agent (link from agent detail page)
- CSV export for any report view
- APIs:
  - `GET /api/admin/reports/finance` — aggregated platform totals, date filter, optional `?agentId=X` for per-agent
  - `GET /api/admin/reports/finance/export` — streams CSV

**Routes:** `/admin/reports`

---

### Phase A6 — Support & Settings ⬜

#### Step A6.1 — Support Tickets
- Tickets list: filter by status (open/closed), date; open tickets surfaced first
- Ticket detail: full message thread (agent message + admin replies in order); reply form at bottom; Close Ticket button
- APIs:
  - `GET /api/admin/support` — all tickets, status filter, date filter
  - `GET /api/admin/support/[id]` — ticket + full reply thread
  - `POST /api/admin/support/[id]/reply` — adds admin reply to thread
  - `PATCH /api/admin/support/[id]` — close/reopen ticket

**Routes:** `/admin/support` · `/admin/support/[id]`

#### Step A6.2 — Platform Settings
- Withdrawal: global default `maxWithdrawalPerTxn` (agent-level override takes precedence if set)
- Commission rates: performance commission percentage, referral commission percentage
- Maintenance mode toggle: when ON, all agent logins are rejected with a maintenance message (checked in user `middleware.ts`)
- Tier config: edit each tier's name, minimum deposit threshold, commission rate, withdrawal limit
- FAQ management: add / edit / delete FAQ items (used by `/help/faq` user page)
- Tutorial management: add / edit / delete tutorial steps (used by `/help/tutorial` user page)
- APIs:
  - `GET /api/admin/settings` — all platform settings as single object
  - `PATCH /api/admin/settings` — partial update (any field)
  - `GET /api/admin/settings/faq` — all FAQ items
  - `POST /api/admin/settings/faq` — add item
  - `PATCH /api/admin/settings/faq/[id]` — edit item
  - `DELETE /api/admin/settings/faq/[id]` — delete item
  - `GET /api/admin/settings/tutorial` — all tutorial steps
  - `POST /api/admin/settings/tutorial` — add step
  - `PATCH /api/admin/settings/tutorial/[id]` — edit step
  - `DELETE /api/admin/settings/tutorial/[id]` — delete step

**Routes:** `/admin/settings`

---

### Admin Route Checklist

| Phase | Route | UI | API |
|-------|-------|----|-----|
| A1 | `/[adminKey]/login` | ✅ | ✅ |
| A1 | `/admin` (dashboard) | ✅ | ✅ |
| A2 | `/admin/agents` | ✅ | ✅ |
| A2 | `/admin/agents/[id]` | ✅ | ✅ |
| A2 | `/admin/transactions` | ✅ | ✅ |
| A2 | `/admin/transactions/[id]` | ✅ | ✅ |
| A2 | `/admin/banks` | ✅ | ✅ |
| A3 | `/admin/utr` | ⬜ | ⬜ |
| A3 | `/admin/security-deposits` | ⬜ | ⬜ |
| A3 | `/admin/security-withdrawals` | ⬜ | ⬜ |
| A4 | `/admin/live-pool` | ⬜ | ⬜ |
| A4 | `/admin/live-pool/create` | ⬜ | ⬜ |
| A5 | `/admin/commissions` | ⬜ | ⬜ |
| A5 | `/admin/commissions/referral` | ⬜ | ⬜ |
| A5 | `/admin/adjustments` | ⬜ | ⬜ |
| A5 | `/admin/adjustments/create` | ⬜ | ⬜ |
| A5 | `/admin/reports` | ⬜ | ⬜ |
| A6 | `/admin/support` | ⬜ | ⬜ |
| A6 | `/admin/support/[id]` | ⬜ | ⬜ |
| A6 | `/admin/settings` | ⬜ | ⬜ |

### Admin Data Models (To Create)

| Model | Key Fields | Phase | Status |
|-------|-----------|-------|--------|
| `Admin` | name, phone, passwordHash, isActive, createdAt | A1 | ✅ |
| `PlatformSettings` | maintenanceMode, defaultMaxWithdrawal, performanceCommissionRate, referralCommissionRate, updatedAt | A6 | ⬜ |
| `FAQItem` | question, answer, order, createdAt | A6 | ⬜ |
| `TutorialStep` | title, body, order, createdAt | A6 | ⬜ |
| `AdminReply` | ticketId, adminId, message, createdAt | A6 | ⬜ |

> `SupportTicket` model already exists from Phase 3 — extend with `replies[]` array or use `AdminReply` collection.