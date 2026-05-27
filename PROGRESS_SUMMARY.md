# PayzDesk — Progress Summary

**Last updated:** 2026-05-27 (Phase 2 ✅ COMPLETE)
**Stack:** Next.js 16 · TypeScript · Tailwind v4 · App Router

---

## Project Goal

Build **PayzDesk** — a complete web-based payment agent management platform — by converting the SuperPayz Android app into a mobile-first web app.

### What we are building

A feature-complete web replica of the SuperPayz Android APK, rebranded as PayzDesk, with:

- Our own independent codebase (Next.js + TypeScript)
- Our own backend (Next.js API routes)
- Our own database (MongoDB Atlas)
- Dark theme design system (deep navy + gold accent + green CTAs)
- Mobile-first UI with hamburger drawer nav (no bottom tabs)

### What we are changing from the reference app

| Item            | SuperPayz (reference)      | PayzDesk                               |
| --------------- | -------------------------- | -------------------------------------- |
| Name & branding | SuperPayz                  | PayzDesk ("Payz" white + "Desk" gold)  |
| Platform        | Android APK only           | Mobile-first web (any browser)         |
| Auth            | Phone + device SIM         | Phone + SMS OTP (no device dependency) |
| App Lock        | Device PIN / Face ID       | Session inactivity timeout             |
| Native share    | Android share sheet        | Web Share API + copy to clipboard      |
| Color theme     | Dark navy, amber/gold CTAs | Dark navy, gold accent, green CTAs     |
| Some taglines   | Original SuperPayz copy    | Rewritten for PayzDesk brand voice     |
| Referral prefix | SPZ…                       | PDK…                                   |

### What stays exactly the same

- All features and flows (deposits, withdrawals, UTR, banks, commissions, referral, live pool, reports, settings)
- Navigation structure (side drawer with exact same item order)
- Screen layouts and information hierarchy (matching screenshots)
- Filter bar pattern (status dropdown + search + CLEAR + DATE)
- Card/badge/button visual language

---

## Build Phases

### Phase 1 — User App MVP ✅ COMPLETE

All 15 core routes built: auth, dashboard, deposits, withdrawals, banks, UTR, settings, profile.

### Phase 2 — Earnings & Reporting ✅ COMPLETE

All 13 routes built:

| Priority | Route                       | Screen                    | Status |
| -------- | --------------------------- | ------------------------- | ------ |
| 1        | `/referral`                 | Refer & Earn              | ✅     |
| 2        | `/commission/performance`   | Performance Commission    | ✅     |
| 3        | `/commission/details`       | Commission Details        | ✅     |
| 4        | `/transactions/:id`         | Transaction Detail        | ✅     |
| 5        | `/security-deposits`        | Security Deposits list    | ✅     |
| 6        | `/security-deposits/add`    | Add Security Deposit      | ✅     |
| 7        | `/security-deposits/:id`    | Security Deposit Detail   | ✅     |
| 8        | `/security-withdrawals`     | Security Withdrawals list | ✅     |
| 9        | `/security-withdrawals/add` | Add Security Withdrawal   | ✅     |
| 10       | `/reports/finance`          | Finance Report            | ✅     |
| 11       | `/reports/finance/info`     | Finance Report Info       | ✅     |
| 12       | `/reports/adjustments`      | Adjustment Transactions   | ✅     |
| 13       | `/tiers`                    | Tier Benefits             | ✅     |

### Phase 3 — Real-time & Support (CURRENT TARGET)

#### Step 3.1 — Static Help Pages
| Route              | Screen                        | Status |
| ------------------ | ----------------------------- | ------ |
| `/help/faq`        | FAQ                           | ✅     |
| `/help/tutorial`   | Tutorial / How-to Guides      | ✅     |

#### Step 3.2 — Deposit Payment Flow
| Route              | Screen                        | Status |
| ------------------ | ----------------------------- | ------ |
| `/deposit/payment` | Payment Confirmation          | ✅     |

#### Step 3.3 — Customer Support
| Route              | Screen                        | Status |
| ------------------ | ----------------------------- | ------ |
| `/support`         | Support Chat or Contact Form  | ✅     |

#### Step 3.4 — Live Pool
| Route              | Screen                        | Status |
| ------------------ | ----------------------------- | ------ |
| `/live-pool`       | Live Withdrawal Pool (Pusher) | ⬜     |

*New model needed:* `LivePoolJob` (jobId, transactionId, amount, bankId, status: available/grabbed/expired, grabbedBy, expiresAt).
*Pusher events:* `job.available`, `job.grabbed`, `job.expired` broadcast to all agents on channel `live-pool`.

---

## Done

### Bootstrap & deps

- Next.js project with TypeScript, Tailwind, App Router
- Packages: mongoose, axios, zustand, TanStack Query, react-hook-form, zod, jsonwebtoken, bcryptjs, upstash Redis, pusher, lucide-react, clsx, tailwind-merge

### Project structure

- Route groups: `(auth)`, `(dashboard)`, `api/*`
- Empty `page.tsx` shells for all MVP routes
- Placeholder folders: `store/`, `hooks/`, `components/shared/`

### Foundation

- `db.ts` — MongoDB singleton
- `auth.ts` — JWT sign/verify
- `redis.ts` — Redis client (OTP)
- `axios.ts` — client + auth interceptors
- `utils/index.ts` — `cn`, `formatINR`, `formatDate`
- `types/index.ts` — User, BankAccount, Transaction, UTR
- Models: User, BankAccount, Transaction, UTR

### Design system & shell

- `globals.css` — full dark theme token system (~800 lines); CSS vars + Tailwind v4 `@theme` bridge
- UI primitives: Button, Input, Card, Badge, Spinner
- `middleware.ts` — protects dashboard routes; `/api/auth` public
- Design rule: Tailwind utility classes first; inline `style` only for CSS vars; no new custom classes unless justified

### Auth (API & Pages) ✅

- API: register, login, OTP send/verify, refresh, logout, me, forgot-password, change-password
- Pages: `/login`, `/register`, `/forgot-password`, `/onboarding`
- Zustand auth store, JWT cookies (accessToken + refreshToken)

### App wiring ✅

- Root layout with Inter font + QueryProvider
- Dashboard layout: gradient bg, `min-h-[100dvh]`, `max-w-3xl` content column
- Sidebar: desktop 260px sticky + mobile 52px header + 85vw slide-in drawer
- Active state: 3px gold left border + gold dim bg tint
- Nav order matches CONVERSION_SPEC §3 exactly

### Banks feature ✅

- BankAccount model with full schema (upiId, branch, address, phone, status, verified)
- `getAuthUser.ts` — shared JWT helper for API handlers
- API: list, add (+ OTP send), delete, verify-otp, resend-otp
- Pages: bank list with masked account numbers + StatusBadge + delete; add bank two-step form with OTP

### UTR feature ✅

- UTR model with compound unique index (userId, utrNumber)
- API: list (filtered), create (bank ownership + active check + duplicate guard)
- FilterBar shared component (status dropdown + search + CLEAR + DATE range)
- Pages: create UTR form (exact CONVERSION_SPEC §8 layout); UTR history with filters

### Transactions feature ✅

- Transaction model with all statuses including 'disputed'
- API: list (filtered), deposit, withdrawal (4 business rules), single by ID
- Pages: deposit list, withdrawal list, initiate deposit form

### Dashboard ✅

- Overview card: 4 metrics + 3 bank stat sub-cards
- Live Pool card (locked/unlocked based on withdrawalEnabled)
- Quick Links: 4 circle icons + referral banner strip + customer support button
- Inline deposit + withdrawal lists (last 3 rows each)

### Settings & Profile ✅

- API: get settings, toggle withdrawal
- Pages: settings (App Security + Withdrawal toggles + inset limit box), change password, profile (read-only + copyable referral code)

### Security & Code Audit ✅

- Session revocation: refresh checks User.isActive
- Atomic transactions: $gte guards, rollback on failure
- OTP: peekOTP / consumeOTP split (no premature burn)
- Privacy: generic OTP success strings for login/reset

### Phase 2: Referral & Commission ✅

- Models: ReferralCycle, ReferralCommission, PerformanceCommission, Adjustment
- API: referral stats (GET), performance commission (GET), commission details (GET), transaction detail (GET by ID)
- API: security deposits (GET list, POST create), security withdrawals (GET list, POST create)
- API: finance report (GET, aggregation with date filter), adjustments (GET, type + date filter), tiers (GET, static config + deposit aggregation)
- Pages: referral (earnings card + cycle + WhatsApp/Share/FAQ + segmented tabs), performance commission (earnings + program cards), commission details (summary + history)
- Pages: transaction detail (hero card + details + bank info + notes, supports all 4 transaction types)
- Pages: security deposits list (filter bar + rows), add security deposit form, security withdrawals list, add security withdrawal form
- Pages: finance report (date filter + net balance + deposits/withdrawals/security breakdown + wallet summary), finance report info (static explanations)
- Pages: adjustments (FilterBar reuse + summary strip + credit/debit rows), tiers (current tier card + progress bar + tier benefit cards)
- Types updated: ITransaction now includes all 4 types + 6 statuses + referenceId/notes; ITier, TiersResponse, FinanceReportSummary, IAdjustment, AdjustmentsResponse added
- All pages use apiClient (axios with token refresh), formatINR/formatDateTime from @/utils

---

## Route Checklist

### Phase 1 (Complete)

| Route                       | Page UI | API |
| --------------------------- | ------- | --- |
| `/login`                    | ✅      | ✅  |
| `/register`                 | ✅      | ✅  |
| `/forgot-password`          | ✅      | ✅  |
| `/onboarding`               | ✅      | —   |
| `/` (dashboard)             | ✅      | ✅  |
| `/deposit`                  | ✅      | ✅  |
| `/deposits`                 | ✅      | ✅  |
| `/withdrawals`              | ✅      | ✅  |
| `/banks`                    | ✅      | ✅  |
| `/banks/add`                | ✅      | ✅  |
| `/settings`                 | ✅      | ✅  |
| `/settings/change-password` | ✅      | ✅  |
| `/profile`                  | ✅      | ✅  |
| `/utr`                      | ✅      | ✅  |
| `/utr/create`               | ✅      | ✅  |

### Phase 2 (Complete)

| Route                       | Page UI | API |
| --------------------------- | ------- | --- |
| `/referral`                 | ✅      | ✅  |
| `/commission/performance`   | ✅      | ✅  |
| `/commission/details`       | ✅      | ✅  |
| `/transactions/:id`         | ✅      | ✅  |
| `/security-deposits`        | ✅      | ✅  |
| `/security-deposits/add`    | ✅      | ✅  |
| `/security-deposits/:id`    | ✅      | ✅  |
| `/security-withdrawals`     | ✅      | ✅  |
| `/security-withdrawals/add` | ✅      | ✅  |
| `/reports/finance`          | ✅      | ✅  |
| `/reports/finance/info`     | ✅      | —   |
| `/reports/adjustments`      | ✅      | ✅  |
| `/tiers`                    | ✅      | ✅  |

### Phase 3 (To Build)

| Route              | Page UI | API |
| ------------------ | ------- | --- |
| `/live-pool`       | ⬜      | ⬜  |
| `/deposit/payment` | ✅      | —   |
| `/help/faq`        | ✅      | —   |
| `/help/tutorial`   | ✅      | —   |
| `/support`         | ✅      | ✅  |

✅ = done · ⬜ = to build

---

## Data Models — Phase 2 (All Created ✅)

| Model                    | Fields                                                                  | Used by                       | Status |
| ------------------------ | ----------------------------------------------------------------------- | ----------------------------- | ------ |
| `ReferralCycle`          | userId, startDate, endDate, amount, status                              | `/api/referral`               | ✅     |
| `ReferralCommission`     | referrerId, referredUserId, cycleId, amount                             | `/api/referral`, `/api/commission/details` | ✅ |
| `PerformanceCommission`  | userId (unique), totalEarned, status, lastReleasedDate, frequencyDays, activePrograms[] | `/api/commission/performance` | ✅ |
| `Adjustment`             | userId, type (credit/debit), amount, description, referenceId           | `/api/reports/adjustments`    | ✅     |
| `Transaction` (extended) | Added `security_deposit`/`security_withdrawal` types, `referenceId`, `notes` | Security deposits/withdrawals | ✅ |

Referral fields (commissionEarned, referralCode, referredBy) exist on the User model.
Tiers are static config in `/api/tiers/route.ts` — no DB model needed.
