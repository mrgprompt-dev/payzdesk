# SuperPayz → PayzDesk — App to Website Conversion Spec

**Version:** 2.0
**App:** SuperPayz v1.0.1 (`com.superpayz.app`)
**Sources:** Decompiled Android project, `superpayz.apk`, 11 screenshots, Hermes JS bundle
**PayzDesk API base:** `/api` (Next.js API routes — our own backend)

---

## 1. Product Summary

**SuperPayz** is an **India-focused payment-agent platform**. Users (agents) manage bank accounts, process **deposit** and **withdrawal** requests, submit **UTR** proofs, earn **commissions**, and participate in a **referral** program. Currency is **INR (₹)**; payments use **UPI**, bank transfers (IFSC), and likely **USDT (TRC20)**.

PayzDesk replicates all features with an independent codebase, our own backend, and a mobile-first web UI.

| Item | Detail |
|------|--------|
| Reference stack | React Native + Expo SDK 55, Hermes bundle |
| Reference API | `https://api.superpayz.site/` (not used — we build our own) |
| Auth | Phone-based (`+91`), OTP verified |
| Market | India (+91, IFSC, UPI) |

---

## 2. Complete Sitemap (pages / routes)

### Public / auth

| Route | Screen | Purpose |
|-------|--------|---------|
| `/login` | `AuthScreen` | Login |
| `/register` | `AuthScreen` | Registration |
| `/onboarding` | `OnboardingScreen` | First-time walkthrough |
| `/forgot-password` | `ResetPasswordScreen` | Password reset |

### Main (authenticated)

| Route | Screen | Purpose |
|-------|--------|---------|
| `/` | `DashboardScreen` | Home: overview metrics, live pool, quick links, lists |
| `/deposit` | `DepositScreen` | Start deposit |
| `/deposit/payment` | `DepositPaymentScreen` | Payment confirmation flow |
| `/deposits` | `DepositRequestsScreen` | Deposit request list + filters |
| `/withdrawals` | `WithdrawalRequestsScreen` | Withdrawal request list + filters |
| `/live-pool` | `LiveWithdrawalsScreen` | Grab withdrawal jobs (requires withdrawal ON) |

### Banks & UTR

| Route | Screen | Purpose |
|-------|--------|---------|
| `/banks` | `BankDetailsScreen` | List/manage bank accounts |
| `/banks/add` | `AddBankScreen` | Add bank + OTP verify |
| `/utr/create` | `CreateUTRScreen` | Submit UTR (bank, UTR no., amount) |
| `/utr` | `UtrDetailsScreen` | UTR history + filters |

### Money & reports

| Route | Screen | Purpose |
|-------|--------|---------|
| `/security-deposits` | `SecurityDepositsScreen` | Security deposit history |
| `/security-withdrawals` | `BFSecurityWithdrawalsScreen` | Security withdrawal history |
| `/security-deposits/add` | `AddSecurityDepositScreen` | Add security deposit |
| `/security-withdrawals/add` | `AddSecurityWithdrawalScreen` | Add security withdrawal |
| `/security-deposits/:id` | `SecurityDepositDetailScreen` | Detail view |
| `/reports/finance` | `FinanceReportScreen` | Finance report |
| `/reports/finance/info` | `FinanceReportInfoScreen` | Report info |
| `/reports/adjustments` | `AdjustmentTransactionScreen` | Adjustments |
| `/transactions/:id` | `TransactionDetailsScreen` | Single transaction detail |

### Earnings & referral

| Route | Screen | Purpose |
|-------|--------|---------|
| `/commission/performance` | `PerformanceCommissionScreen` | Performance commission dashboard |
| `/commission/details` | `CommissionDetailsScreen` | Commission breakdown |
| `/referral` | `ReferAndEarnScreen` | Referral code, earnings, referred list |
| `/tiers` | `TierBenefitsScreen` | Tier benefits |

### Account & support

| Route | Screen | Purpose |
|-------|--------|---------|
| `/profile` | `ProfileScreen` | User profile |
| `/settings` | `SettingsScreen` | Withdrawal toggle, limits, session |
| `/settings/change-password` | `ChangePasswordScreen` | Change password |
| `/support` | `ChatSupportScreen` | Customer support |
| `/help/faq` | `FAQScreen` | FAQ |
| `/help/tutorial` | — | How-to guides |

---

## 3. Navigation Structure (side drawer)

Exact order from screenshots:

```
[Avatar circle]  Phone number (bold)
                 Click here for Profile  ← green link

Home
History                     ∧  (accordion)
  ├── Deposit Requests
  ├── Withdrawal Requests
  ├── Security Deposits
  └── Security Withdrawals
Bank Details
Change Password
Performance Commission
Settings
UTR                         ∧  (accordion)
  ├── Create UTR
  └── UTR History
Reports                     ∨  (accordion)
  ├── Finance Report
  └── Adjustments
Help                        ∨  (accordion)
  ├── FAQ
  ├── Tutorial
  └── Contact Support
Refer & Earn
──────────────────────────────
Logout
```

**Drawer styling (from screenshots):**
- Background: `#090e1b` (darker than page)
- Top user area: circular grey avatar, white bold phone number, green "Click here for Profile" text
- Nav items: white bold text, `~48px` height, left-padded icon
- Active item: no visible bg tint in original — PayzDesk adds gold left border + subtle gold bg tint
- Sub-items: grey text, no icon, indented `~56px`
- Accordion chevron: right-aligned, rotates
- Divider above Logout

---

## 4. Dashboard — Full Layout (from screenshots)

### Mobile header bar
```
[☰]    [S superpayz logo]    [↓ Deposit]
```
PayzDesk version:
```
[☰]    [PayzDesk logo]       [↓ Deposit]
```
- Green pill button with download icon for Deposit CTA

### Overview card (screenshot Image 1 — top section)
```
┌──────────────────────────────────────────────┐
│ OVERVIEW    [Deposit Requests(0)] [Withdrawals(0)] │  ← two grey pill tabs, right-aligned
│                                              │
│ 🏦 Net Balance        ⚖️ Commission Earned    │
│    0.00                  0.00               │
│                                              │
│ 🔒 Blocked Deposit    🕐 WDR Hold Amount(0)  │
│    0.00                  0.00               │
├──────────────────────────────────────────────┤
│ [📱 Total Banks │ 🏛 Active Banks │ 🔴 Disputed WDR] │
│      0        │       0         │    0.00    │  ← 3 smaller sub-cards in a row
└──────────────────────────────────────────────┘
```

- "OVERVIEW" is ALL CAPS bold white label, left-aligned
- "Deposit Requests (0)" and "Withdrawals (0)" are grey pill chips, right side of header row
- Metric labels: icon + label text, muted grey, ~13px
- Metric values: bold white, ~22px
- Bottom row: 3 equal-width dark sub-cards with coloured icons (amber for Total Banks, blue for Active Banks, red for Disputed WDR)

### Live Pool card (locked state — screenshot Image 1)
```
┌──────────────────────────────────────────────┐
│ ⚡ LIVE                                       │  ← dark pill badge, gold/amber
│                                              │
│  Earn Extra Commission          🔒           │  ← heading + lock icon overlay
│  GRAB a withdrawal request before            │
│  someone else does!                          │
│                                              │
│  Enable Withdrawal in Settings to unlock     │  ← white text, centered
│  [        Open Live Pool  >        ]         │  ← grey disabled pill button
│                              How to use?    │  ← gold link, right-aligned
└──────────────────────────────────────────────┘
```
- Card background: dark amber/gold tinted `rgba(180, 120, 0, 0.3)` style
- Gold border
- Lock icon overlays the content, blurring it
- "Open Live Pool" button is disabled (dark ghost) until withdrawal enabled

### Quick Links card (screenshot Image 3)
```
┌──────────────────────────────────────────────┐
│ Quick Links                                  │
│                                              │
│  [🏛]      [↙]        [↗]       [📧]        │  ← circle icon buttons, dark bg
│  Bank    Deposit    Withdrawal  Withdraw     │
│ Accounts Requests   Requests               │
│                                              │
│  [  Click Here To Access Referral Program  ] │  ← blue banner strip, inside card
└──────────────────────────────────────────────┘
```
- Icons: coloured (green bank, blue deposit, amber withdrawal, red withdraw)
- Dark circle bg: `rgba(255,255,255,0.06)`
- Referral strip: blue bg strip inside the card, cyan/blue link text, full width

### Below Quick Links (screenshot Image 3)
```
[         🎧 Customer Support          ]   ← full-width blue pill button, separate from card

┌──────────────────────────────────────────────┐
│ DEPOSIT REQUESTS (0)                         │
│ No data available                            │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ WITHDRAWAL REQUESTS                          │
│ No data available                            │
└──────────────────────────────────────────────┘
```
- Customer Support is a standalone blue pill button, NOT inside a card
- Deposit Requests and Withdrawal Requests are separate dark cards, ALL CAPS bold heading + grey "No data available" text

---

## 5. Deposit Requests / Withdrawals / UTR — Filter Bar (from screenshots)

All three list pages share identical filter bar pattern:

```
┌──────────────────────────────────────────────┐
│ FILTER                                       │  ← ALL CAPS section label
├──────────────────────┬───────────────────────┤
│ [All            ▾]  │ [🔍 Search         ]  │  ← row 1
├──────────────────────┼───────────────────────┤
│ [↺  CLEAR      ]    │ [📅  DATE          ]  │  ← row 2
└──────────────────────┴───────────────────────┘
```
Below filter: either data list OR empty state card.

Empty state (exact copy from screenshots):
```
┌──────────────────────────────────────────────┐
│ No Data Exists.                              │  ← bold white, 15px
│ Please change the date range.               │  ← grey, 13px
└──────────────────────────────────────────────┘
```

---

## 6. Settings Screen (from screenshot)

```
APP SECURITY                      ← ALL CAPS section label

┌──────────────────────────────────────────────┐
│ [🔒 icon]  App Lock              [toggle]    │
│            Lock app with PIN when opening    │
└──────────────────────────────────────────────┘

WITHDRAWAL                        ← ALL CAPS section label

┌──────────────────────────────────────────────┐
│ [🏛 icon]  Withdrawal            [toggle]    │
│            Enable or disable withdrawal      │
│            instantly                         │
│ ─────────────────────────────────────────── │
│ Withdrawal Status:  Disabled                 │  ← "Disabled" in red / "Enabled" in green
│                                              │
│ ┌─────────────────────────────────────────┐  │
│ │ Max Withdrawal Limit Per Txn : ₹ 40000  │  │  ← inset darker box, green value
│ └─────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

---

## 7. Add Bank Form (from screenshot)

```
ADD BANK ACCOUNT                  ← ALL CAPS section label inside card

[ Account No.          ]
[ UPI ID               ]
[ Account Holder Name  ]
[ IFSC Code            ]
[ Bank Name            ]
[ Bank Branch          ]
[ Bank Address         ]
[ +91 ] [ Phone No.    ]          ← prefix box + input side-by-side

☐  IMPORTANT: To ensure successful activation,
   use the SIM associated with the provided
   phone number on the same device.           ← PayzDesk changes to OTP verification

[    Verify & Add Bank Account    ]           ← gold pill button, disabled until checkbox
```

**PayzDesk change:** Replace the SIM disclaimer with: "An OTP will be sent to the registered phone number to verify this bank account." Button enables after user accepts.

---

## 8. Create UTR Form (from screenshot)

```
SELECT BANK                       ← ALL CAPS section label
[ Choose bank              ▾ ]    ← custom dropdown

ENTER UTR                         ← ALL CAPS section label
[ UTR Number            ID ]      ← "ID" suffix on right

ENTER AMOUNT                      ← ALL CAPS section label
[ Amount              💳 ]        ← card/rupee icon on right

[         SUBMIT UTR         ]    ← ghost dark button (disabled by default)
[           Cancel           ]    ← red pill button, full width
```

---

## 9. Referral Page (from screenshot)

```
┌──────────────────────────────────────────────┐  ← dark glass card
│ Your Lifetime Referral Earnings              │
│ ₹0.00 🎉                                    │  ← gold value, large
│ Invite & Refer your circle, share the        │
│ benefits, and enjoy rewards together.        │
│                                              │
│ [ SPZ453715  📋 ]                            │  ← gold pill, referral code + copy icon
│ Tap above to copy your referral code ✨      │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐  ← GOLD card (solid amber bg)
│ [Current Commission Cycle]                   │  ← dark pill chip label
│ 01/03/2026 - 08/03/2026        ₹0.00        │
│                                              │
│ ⏳ PENDING PAYOUT                            │
│ Earnings will be credited after cycle        │
│ completion and verification                  │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐  ← dark card
│  💬 WhatsApp   🔗 Share    ❓ FAQ            │  ← 3 equal icon+label columns
└──────────────────────────────────────────────┘

[  Referred List  ] [  Commission Details  ]   ← segmented pill tabs (gold active)

No referrals yet!                              ← plain text empty state
```

---

## 10. Performance Commission Page (from screenshot)

```
┌──────────────────────────────────────────────┐
│ ✨ PERFORMANCE COMMISSION    [🏆 Released]   │  ← gold label + gold outlined pill badge
│                                              │
│ You've Earned It!                            │
│ ₹ 0.00                                      │  ← large value
│ Keep it up — your commissions are            │
│ unlocking steadily.                          │
│ ─────────────────────────────────────────── │
│ Unlocked so far        View details >        │
└──────────────────────────────────────────────┘

ACTIVE PERFORMANCE COMMISSION     ← ALL CAPS section label

┌────────────────────────┐
│ [🎁 gift icon]  [T&C >]│  ← amber circle icon, T&C pill button, top row
│                        │
│ 🕐 Every 7 days        │
│ Performance Commission │  ← bold white heading
│                        │
│ Last Released  08-03-2026│
│                        │
│ [BONUS TRACKER  >]     │  ← dark ghost pill button
└────────────────────────┘
```

Note: The program card is narrower (about half screen width), not full-width.

---

## 11. Features Matrix (app → website)

| Feature | App behavior | PayzDesk approach |
|---------|--------------|-------------------|
| Dashboard overview | OVERVIEW card with 4 metrics + 3 bank stat sub-cards | Same layout |
| Deposit Requests pill | Grey pill tab on OVERVIEW card header | Same |
| Live Pool | Locked gold card with blur overlay | Same; unlock via withdrawal toggle in settings |
| Quick Links | 4 circle icons + referral strip + inside same card | Same |
| Customer Support | Full-width blue pill button below quick links | Same |
| Deposit/WDR lists | ALL CAPS section card with empty state | Same |
| Filter bar | FILTER label, status dropdown + search row, CLEAR + DATE row | Identical pattern |
| Add bank | SIM-on-device warning | Replace with OTP verification disclaimer |
| Create UTR | ALL CAPS labels, ID suffix, card icon | Identical |
| Referral | Gold pill code, gold commission cycle card, 3-icon row, segmented tab | Identical |
| Performance commission | Earnings card + Released badge + active program card | Identical |
| Settings | Toggle rows with icon circles, status text, inset limit box | Identical |
| App Lock (settings) | PIN toggle | Session timeout equivalent (no PIN in browser) |

---

## 12. Data Models (confirmed from screenshots + inference)

### User
```typescript
{
  _id: string
  phone: string              // primary identifier, +91
  name: string
  email?: string
  passwordHash: string
  isVerified: boolean
  isActive: boolean
  referralCode: string       // e.g. "PDK453715" (PayzDesk prefix)
  referredBy?: string
  netBalance: number
  commissionEarned: number
  blockedDeposit: number
  withdrawalHoldAmount: number
  totalBanks: number
  activeBanks: number
  disputedWithdrawalAmount: number
  withdrawalEnabled: boolean
  maxWithdrawalPerTxn: number  // default 40000
  appLockEnabled: boolean
  createdAt: string
  updatedAt: string
}
```

### BankAccount
```typescript
{
  _id: string
  userId: string
  accountNumber: string
  upiId: string
  accountHolderName: string
  ifscCode: string
  bankName: string
  branch: string
  address: string
  phone: string              // +91 format
  status: 'active' | 'inactive' | 'pending'
  verified: boolean
  createdAt: string
  updatedAt: string
}
```

### Transaction (Deposit / Withdrawal)
```typescript
{
  _id: string
  userId: string
  type: 'deposit' | 'withdrawal'
  amount: number
  status: 'pending' | 'completed' | 'failed' | 'disputed'
  bankId?: string
  utrNumber?: string
  createdAt: string
  updatedAt: string
  // List query filters: status, search, dateFrom, dateTo
}
```

### UTR
```typescript
{
  _id: string
  userId: string
  bankId: string
  utrNumber: string
  amount: number
  status: 'pending' | 'verified' | 'rejected'
  createdAt: string
  updatedAt: string
}
```

### Referral
```typescript
{
  lifetimeEarnings: number
  referralCode: string
  currentCycle: {
    startDate: string        // e.g. "01/03/2026"
    endDate: string          // e.g. "08/03/2026"
    amount: number
    status: 'pending_payout' | 'credited'
  }
  referredUsers: Array
  commissionDetails: Array<Record>
}
```

### PerformanceCommission
```typescript
{
  totalEarned: number
  status: 'released' | 'pending'
  lastReleasedDate: string   // e.g. "08-03-2026"
  frequencyDays: number      // 7 (every 7 days)
  activePrograms: Array<{
    name: string             // "Performance Commission"
    termsUrl?: string
    bonusTrackerUrl?: string
  }>
}
```

---

## 13. Our API Routes (Next.js — PayzDesk backend)

### Auth (complete)
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/otp/send` | Send OTP |
| POST | `/api/auth/otp/verify` | Verify OTP |
| POST | `/api/auth/refresh` | Refresh JWT |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/forgot-password` | Forgot password |
| POST | `/api/auth/change-password` | Change password |

### To build (Phase 1)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/banks` | List user's banks |
| POST | `/api/banks` | Add bank |
| PATCH | `/api/banks/:id` | Update bank |
| DELETE | `/api/banks/:id` | Remove bank |
| POST | `/api/banks/verify-otp` | Verify bank OTP |
| GET | `/api/transactions` | List (type, status, search, dateFrom, dateTo) |
| POST | `/api/transactions/deposit` | Initiate deposit |
| POST | `/api/transactions/withdraw` | Initiate withdrawal |
| GET | `/api/transactions/:id` | Single transaction |
| POST | `/api/utr` | Submit UTR |
| GET | `/api/utr` | UTR history (filters) |
| GET | `/api/settings` | Get settings |
| PATCH | `/api/settings/withdrawal` | Toggle withdrawal on/off |

### To build (Phase 2)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/referral` | Referral stats |
| GET | `/api/commission/performance` | Performance commission |
| GET | `/api/live-pool` | Live withdrawal jobs |
| POST | `/api/live-pool/:id/grab` | Grab a job |
| GET | `/api/security-deposits` | Security deposits list |
| GET | `/api/security-withdrawals` | Security withdrawals list |
| GET | `/api/reports/finance` | Finance report |
| GET | `/api/reports/adjustments` | Adjustments |

---

## 14. Web Conversion — Required Changes from App

| Mobile-only | PayzDesk replacement |
|-------------|----------------------|
| SIM must match phone on same device | OTP sent to registered phone number |
| Face ID / fingerprint biometric | Password + optional 2FA/WebAuthn |
| Native share sheet (WhatsApp, etc.) | Web Share API + copy to clipboard |
| Portrait-only layout | Mobile-first responsive |
| `expo-sharing` file export | Browser download (PDF/CSV) |
| App Lock PIN on open | Session inactivity timeout |
| "SuperPayz" branding everywhere | "PayzDesk" — logo, referral code prefix, copy |

---

## 15. Document History

| Date | Change |
|------|--------|
| 2026-05-25 | v1.0 — Initial spec from APK, bundle strings, screenshots |
| 2026-05-26 | v2.0 — Full dashboard layout from screenshots; filter bar, settings, add bank, UTR, referral, performance commission screens documented exactly; our own API routes added; mobile-first direction confirmed |