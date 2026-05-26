# PlayzDesk — Progress Summary

**Last updated:** 2026-05-26  
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
- `globals.css` — dark navy, gold accent, green CTA tokens (~800 lines); CSS vars + Tailwind v4 `@theme` bridge
- UI primitives: Button, Input, Card, Badge, Spinner
- `middleware.ts` — protects dashboard; auth routes + `/api/auth` public
- **Design rule going forward:** Tailwind utility classes first; inline `style` only for CSS vars Tailwind can't reach; no new custom CSS classes in `globals.css`

### Auth (API & Pages)
- `api/auth` fully built (register, login, OTP, refresh, logout, me, forgot-password)
- Auth pages fully built (`/login`, `/register`, `/forgot-password`, `/onboarding`)
- Zustand auth store (`authStore.ts`)
- JWT wired to `accessToken` and `refreshToken` cookies

### App wiring ✅ (completed 2026-05-26)
- `src/app/layout.tsx` — root layout with Inter font + TanStack Query provider; body bg/color driven by CSS vars only (no Tailwind override)
- `src/components/providers/QueryProvider.tsx` — TanStack Query client (30s staleTime, retry 1, no refetchOnWindowFocus)
- `src/app/(dashboard)/layout.tsx` — dashboard shell: gradient bg via CSS vars, `min-h-[100dvh]`, `max-w-3xl` content column, slots MobileHeader + Sidebar
- `src/components/layout/Sidebar.tsx` — full nav rebuilt to DESIGN.md spec:
  - Desktop: 260px sticky sidebar, `bg-sidebar`, logo, user area, nav, logout
  - Mobile: 52px fixed header (hamburger / centred logo / green Deposit pill), 85vw slide-in drawer
  - Active state: 3px gold left border + `bg-gold-dim` tint (Tailwind, no custom class)
  - Nav order matches `CONVERSION_SPEC.md` section 3 exactly (Home → History accordion → Bank Details → Change Password → Performance Commission → Settings → UTR accordion → Reports accordion → Help accordion → Refer & Earn → Logout)
  - All colors reference CSS vars / `@theme` tokens — zero hardcoded hex values

### Docs
- `vision.md`, `CONVERSION_SPEC.md` (product + route reference)
- `DESIGN.md` v2.0 — full design system, component patterns, mobile rules

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

### Shared components (build alongside pages)
- [ ] `StatCard` — dashboard metric tile
- [ ] `FilterBar` — status dropdown + search + clear + date
- [ ] `DataTable` / list rows — deposits, withdrawals, UTR
- [ ] `EmptyState` — "No Data Exists." card

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

✅ = done · ⬜ = to build

---

## Suggested next step

1. Fill `.env.local` and verify DB/Redis connections
2. Build dashboard home (`/`) — overview metrics, live pool card, quick links, referral banner, support CTA, inline deposit/withdrawal lists
3. Build `api/banks` + `api/transactions` in parallel
4. Build `/deposits` and `/withdrawals` list pages with FilterBar