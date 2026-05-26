# PayzDesk — Product Vision & Tech Stack

**Version:** 2.0
**Date:** 2026-05-26
**Status:** In development (Phase 1 — Auth complete)

---

## 1. What is PayzDesk?

PayzDesk is a **web-based payment agent management platform** built for the Indian market. It is designed for agents who manage deposit and withdrawal operations, track commissions, handle bank accounts, and process UPI/IFSC-based transactions — all from a clean, fast, browser-based dashboard.

PayzDesk is a **completely independent product**, built from scratch with its own codebase, backend, database, and infrastructure. No code, API, or data is shared with or derived from any existing application.

---

## 2. Vision

> **Empower payment agents with a professional, fast, and reliable web platform — accessible from any device, anywhere, without needing to install anything.**

The core goals of PayzDesk:

- Give agents a **single dashboard** to manage all their financial operations
- Make **deposits, withdrawals, and UTR submissions** fast and error-free
- Provide **real-time visibility** into commissions, balances, and live withdrawal pools
- Build a **referral and commission system** that rewards agent growth
- Deliver a **mobile-first experience** that also works on desktop browsers

---

## 3. How PayzDesk Differs from the Reference App

PayzDesk draws **UX and feature inspiration** from an Android agent app (SuperPayz), but is a fundamentally different product in every technical and product dimension.

| Dimension | Reference Android App | PayzDesk (Web) |
|---|---|---|
| Platform | Android only (APK) | Web browser — mobile-first, desktop supported |
| Codebase | React Native + Expo | Next.js + TypeScript (fresh build) |
| Backend | Unknown / third-party | Custom-built Node.js backend (ours) |
| Database | Unknown | MongoDB Atlas (designed by us) |
| Auth | Phone + biometric (device-dependent) | Phone + OTP (browser-based, device-independent) |
| SIM verification | Required (device SIM must match) | Replaced with SMS OTP (no device dependency) |
| App Lock | Device PIN / Face ID | Session timeout + optional 2FA |
| File sharing | Native Android share sheet | Web Share API + browser download |
| Real-time | Polling (likely) | WebSocket via Pusher (true real-time) |
| Deployment | APK install required | Open URL in any browser — zero install |
| Branding | SuperPayz | **PayzDesk** — independent brand identity |
| Design | Dark navy, gold/green accents | Refined dark theme — own design system |
| Navigation | Side drawer (hamburger) | Side drawer on mobile + fixed sidebar on desktop |
| Taglines & copy | Original app content | Rewritten for PayzDesk brand voice |
| Data ownership | Third-party controlled | 100% owned and controlled by us |

---

## 4. Core Features (Phase 1 — MVP)

- **Authentication** — Register, login, forgot password, OTP verification
- **Dashboard** — Overview card (net balance, commission earned, blocked deposits, WDR hold), bank stats row (total/active banks, disputed WDR), Live Pool promo card (locked), quick links, referral banner, customer support button, inline deposit/withdrawal request lists
- **Deposit Management** — Start deposits, view deposit request list with filters (status, date, search)
- **Withdrawal Management** — View withdrawal requests, initiate withdrawals
- **Bank Accounts** — Add and manage bank accounts (account number, UPI ID, IFSC, branch, address, phone) with OTP verification replacing SIM check
- **UTR Submissions** — Submit UTR proofs (bank dropdown, UTR number, amount) and view UTR history with filters
- **Settings** — Toggle withdrawal on/off (shows Enabled/Disabled status + max ₹40,000/txn limit), change password
- **Profile** — View and edit user profile
- **Responsive UI** — Mobile-first; drawer nav on mobile, fixed sidebar on desktop

---

## 5. Extended Features (Phase 2 & 3)

- **Live Pool** — Real-time withdrawal job board; agents grab available jobs (WebSocket-powered via Pusher). Locked until withdrawal is enabled in Settings.
- **Performance Commission** — Weekly commission tracker with earnings card (gold "Released" badge), active programs list (gift icon, T&C link, frequency, last released date, Bonus Tracker button)
- **Referral Program** — Lifetime earnings card, referral code pill (copyable), commission cycle card (gold background, date range, PENDING PAYOUT status), WhatsApp/Share/FAQ action row, segmented tab (Referred List / Commission Details)
- **Security Deposits & Withdrawals** — Dedicated list + detail screens, same filter pattern as deposits
- **Finance Reports** — Detailed financial reports with export (CSV/PDF)
- **Adjustment Transactions** — View and manage adjustment records
- **Tier Benefits** — Agent tier system with rewards and unlocks
- **FAQ & Support** — In-app FAQ, tutorial guides, customer support contact
- **USDT / Crypto Flows** — USDT TRC20 support (if applicable)
- **Session Security** — App-lock equivalent with inactivity timeout

---

## 6. Tech Stack

### Frontend

| Layer | Technology | Reason |
|---|---|---|
| Framework | **Next.js 16** (App Router) | Unified frontend + backend in one project; fast iteration |
| Language | **TypeScript** | Type safety across the full stack |
| Styling | **Tailwind CSS v4** | Utility-first; fast to build consistent dark theme |
| State Management | **Zustand** | Lightweight global state for auth, user, settings |
| Server State | **TanStack Query** | API caching, polling, loading/error states |
| HTTP Client | **Axios** | Interceptors for JWT attachment and 401 handling |
| Forms | **React Hook Form + Zod** | Fast form handling with schema validation |

### Backend

| Layer | Technology | Reason |
|---|---|---|
| Runtime | **Node.js** | Single language across full stack |
| Framework | **Next.js API Routes** | Backend lives inside same project; no separate server |
| Language | **TypeScript** | Shared types between frontend and backend |
| ODM | **Mongoose** | Schema modeling on top of MongoDB; flexible iteration |

### Database & Infrastructure

| Service | Technology | Reason |
|---|---|---|
| Primary Database | **MongoDB Atlas** | Flexible schema; fast iteration; managed cloud |
| Cache / OTP Store | **Upstash Redis** | OTP TTL, rate limiting, session data |
| Real-time | **Pusher** | Managed WebSocket for Live Pool; zero infra |
| SMS / OTP | **MSG91** | India-focused; reliable delivery; OTP templates |
| File Storage | **Cloudflare R2** | Document/receipt storage if needed |

### Hosting & Deployment

| What | Where | Reason |
|---|---|---|
| Full Application | **Vercel** | Next.js-native; zero-config; global CDN; free SSL |
| Database | **MongoDB Atlas** | Managed reliability for Mongo |
| Redis | **Upstash** | Serverless Redis; generous free tier |

---

## 7. Architecture Overview

```
Browser (Next.js Frontend)
        │
        ▼
Next.js API Routes  ◄──── Upstash Redis (OTP, rate limiting)
        │
        ├──── MongoDB Atlas (primary data store)
        ├──── Pusher (real-time WebSocket events)
        └──── MSG91 (SMS OTP delivery)
```

- The frontend and backend are **one unified Next.js project**
- Deployed as a single unit to **Vercel**
- No separate backend server to manage or deploy
- All secrets and environment variables managed via Vercel's dashboard

---

## 8. Design Language

| Element | Value |
|---|---|
| Background | Deep dark gradient `#060a16 → #0f172a` |
| Cards | Glassmorphic `rgba(16,24,40,0.70)` + `backdrop-blur(16px)` |
| Primary Text | White `#f8fafc` |
| Secondary Text | Muted grey `#94a3b8` |
| Primary Action (Deposit) | Green `#16a34a` |
| Accent (Commission, Referral, Branding) | Gold `#f5a623` |
| Danger / Cancel | Red `#ef4444` |
| Info / Support | Blue `#3b82f6` |
| Font | Inter (variable, Google Fonts) |
| Layout | Hamburger drawer on mobile, fixed sidebar on desktop |
| Nav pattern | Left slide-in drawer (NOT bottom tabs) |

---

## 9. Brand Identity

| Item | Value |
|---|---|
| Product Name | **PayzDesk** |
| Logo style | "Payz" white + "Desk" gold |
| Tagline | *(To be defined)* |
| Target Users | Payment agents (India) |
| Currency | INR (₹) |
| Payment Methods | UPI, IFSC bank transfer, USDT TRC20 |
| Primary Market | India (+91) |

---

## 10. Build Phases

### Phase 1 — MVP (Core Agent Platform) ← current
- ✅ Auth: login, register, forgot password, OTP, onboarding
- ✅ Foundation: DB, Redis, JWT, Axios, Zustand, types, models
- ✅ Design system: globals.css, UI primitives, dark theme tokens
- ⬜ App wiring: TanStack Query provider, Sidebar nav, .env
- ⬜ Dashboard: overview metrics, live pool card, quick links, referral banner, support CTA, inline lists
- ⬜ Deposit + Withdrawal: lists with filter bar, initiate flows
- ⬜ Banks: list + add bank form (OTP replace SIM check)
- ⬜ UTR: create form + history list
- ⬜ Settings: withdrawal toggle + change password
- ⬜ Profile page

### Phase 2 — Growth Features
Live Pool (Pusher), referral program, performance commission, security deposits/withdrawals, finance reports, FAQ & support

### Phase 3 — Advanced
Tier benefits, USDT/crypto flows, session security, analytics

---

## 11. Document History

| Date | Change |
|---|---|
| 2026-05-25 | v1.0 — Initial vision and tech stack |
| 2026-05-26 | v2.0 — Mobile-first correction; dashboard detail from screenshots; phase status updated |