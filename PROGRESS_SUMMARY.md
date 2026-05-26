# PlayzDesk — Progress Summary

**Last updated:** 2026-05-25  
**Stack:** Next.js 16 · TypeScript · Tailwind v4 · App Router

---

## Done

### Bootstrap & deps
- Next.js project with TypeScript, Tailwind, App Router
- Packages installed: mongoose, axios, zustand, TanStack Query, react-hook-form, zod, jsonwebtoken, bcryptjs, ioredis, pusher, lucide-react, clsx, tailwind-merge

### Project structure
- Route groups: `(auth)`, `(dashboard)`, `api/*` folders
- Empty `page.tsx` shells for all MVP routes (no feature UI yet)
- Placeholder folders: `store/`, `hooks/`, `components/shared/`, API dirs (`.gitkeep` only)

### Environment
- `.env.local` template: MongoDB, Upstash Redis, JWT secrets, MSG91, Pusher

### Foundation (`src/lib`, `src/utils`, `src/types`, `src/models`)
- `db.ts` — MongoDB singleton
- `auth.ts` — JWT sign/verify
- `redis.ts` — Redis client (OTP)
- `axios.ts` — client + auth interceptors
- `utils/index.ts` — `cn`, `formatINR`, `formatDate`
- `types/index.ts` — User, BankAccount, Transaction, UTR
- Models: User, BankAccount, Transaction, UTR

### Design system & shell
- `globals.css` — dark navy, gold accent, green CTA tokens
- UI primitives: Button, Input, Card, Badge, Spinner
- `(dashboard)/layout.tsx` + empty Sidebar shell
- `middleware.ts` — protects dashboard; auth routes + `/api/auth` public

### Auth (API & Pages)
- `api/auth` fully built (register, login, OTP, refresh, logout, me, forgot-password)
- Auth pages fully built (`/login`, `/register`, `/forgot-password`, `/onboarding`)
- Zustand auth store (`authStore.ts`)
- JWT wired to `accessToken` and `refreshToken` cookies

### Docs
- `vision.md`, `CONVERSION_SPEC.md` (product + route reference)

---

## Not started (Phase 1 — MVP)

### API routes (`src/app/api/`)
- [ ] `banks` — CRUD + OTP verification
- [ ] `transactions` — deposits, withdrawals, list + filters
- [ ] `utr` — create + list + status

### Dashboard & core pages
- [ ] `/` — balances, stats, quick actions
- [ ] `/deposit`, `/deposit/payment`
- [ ] `/deposits`, `/withdrawals` — lists + filters
- [ ] `/banks`, `/banks/add`
- [ ] `/utr`, `/utr/create`
- [ ] `/profile`, `/settings`

### App wiring
- [ ] TanStack Query provider in root layout
- [ ] Sidebar nav links + mobile layout
- [ ] Shared components: StatCard, FilterBar, DataTable, EmptyState
- [ ] Fill `.env.local` and connect MongoDB + Redis

---

## Later (Phase 2+)

Per `vision.md` / `CONVERSION_SPEC.md` — not in folder tree yet:

- Live pool (`/live-pool`) + Pusher
- Referral, commission, tiers
- Security deposits/withdrawals
- Finance reports, adjustments, transaction detail
- FAQ, support, USDT flows

---

## Route checklist

| Route | Folder | Page UI | API |
|-------|--------|---------|-----|
| `/login` | ✅ | ✅ | ✅ |
| `/register` | ✅ | ✅ | ✅ |
| `/forgot-password` | ✅ | ✅ | ✅ |
| `/onboarding` | ✅ | ✅ | — |
| `/` | ✅ | ⬜ | ⬜ |
| `/deposit` | ✅ | ⬜ | ⬜ |
| `/deposits` | ✅ | ⬜ | ⬜ |
| `/withdrawals` | ✅ | ⬜ | ⬜ |
| `/banks` | ✅ | ⬜ | ⬜ |
| `/utr` | ✅ | ⬜ | ⬜ |
| `/profile` | ✅ | ⬜ | ⬜ |
| `/settings` | ✅ | ⬜ | ⬜ |

✅ = scaffold only · ⬜ = to build

---

## Suggested next step

1. Fill `.env.local` and verify DB/Redis connections  
2. Setup TanStack query provider in root layout
3. Dashboard home (`/`) then deposits/withdrawals flows
4. Build `api/banks` and `api/transactions`
