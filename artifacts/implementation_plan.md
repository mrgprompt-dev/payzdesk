# Code Audit Remediation Plan

This plan addresses the 11 findings from the recent code audit, categorized by severity. The most critical issues (security and financial integrity) will be tackled first, followed by functional breakages, UX issues, and linting.

## User Review Required

> [!IMPORTANT]
> **Database Transactions**
> The safest way to fix the financial drift (Issue #4) is to use native MongoDB Sessions/Transactions. However, MongoDB transactions require the database to be running as a Replica Set. If your local or production database is a standalone instance, transactions will throw an error. 
> 
> **Are you running a MongoDB Replica Set?**
> - If **Yes**: We will use `db.startSession()` and `session.withTransaction()`.
> - If **No / Not Sure**: We will use atomic `findOneAndUpdate()` checks (which are safe for standalone instances) to handle withdrawals and deposits without drifting. *I will proceed with the atomic `findOneAndUpdate()` approach by default as it is universally compatible.*

## Finding Analysis & Severity

### 🔴 Critical Severity (Fix First)
1. **Suspended users keeping access (Refresh Route)**: Currently, `/api/auth/refresh` mints a new access token just by verifying the JWT signature. It does not check if the user is suspended or deleted in the DB.
2. **Withdrawal balance non-atomic**: `withdraw/route.ts` reads the user balance, creates the transaction, and then decrements the balance in a separate DB query. A race condition could allow an overdraw.
3. **Financial counters drifting**: `deposit/route.ts` and `withdraw/route.ts` execute multiple DB writes without a transaction. If one fails, the user's balances drift from their actual transaction history.

### 🟠 High Severity (Fix Second)
4. **Missing Change Password API**: The frontend posts to `/api/auth/change-password`, but this route does not exist.
5. **Public OTP verify consumes OTP**: The public `/api/auth/otp/verify` endpoint verifies and deletes the OTP. If called before `/api/auth/register` (which expects the OTP to still be valid), the register flow breaks.

### 🟡 Medium Severity (Fix Third)
6. **Lint errors**: Nested components inside render (`banks/add`, `change-password`, `settings`), and sync `setState` in effects.
7. **OTP send leaks account existence**: Requesting an OTP tells the user if the phone is registered or not (enumeration vulnerability).
8. **Bank verify consumes OTP early**: `/api/banks/verify-otp` deletes the OTP before confirming if the requested `bankId` actually exists and belongs to the user.

### 🔵 Low Severity (Fix Last)
9. **Dashboard state staleness**: Toggling withdrawal in Settings doesn't update the dashboard Live Pool because `authStore` (Zustand) isn't told to refetch.
10. **Dashboard counter mismatch**: "Deposit Requests" label on the dashboard top bar incorrectly shows `user.totalBanks`.
11. **Unbuilt Sidebar routes**: Several sidebar links point to Phase 2+ features, leading to 404s.

---

## Proposed Changes

### Phase 1: Critical Security & Financial Integrity

#### [MODIFY] `src/app/api/auth/refresh/route.ts`
- Query the `User` collection after verifying the refresh token.
- Ensure the user exists and `isActive === true`. If not, return 401.

#### [MODIFY] `src/app/api/transactions/withdraw/route.ts`
- Replace the separate balance check and deduct logic with an atomic `User.findOneAndUpdate({ _id: userId, netBalance: { $gte: amount }, withdrawalEnabled: true }, { $inc: ... })`.
- If the atomic update fails (returns null), return "Insufficient balance or withdrawals disabled".
- If it succeeds, create the `Transaction`. If the `Transaction` creation fails, rollback the user's balance.

#### [MODIFY] `src/app/api/transactions/deposit/route.ts`
- Create the transaction first. 
- Atomically `$inc` the `blockedDeposit` counter on the `User`.
- If the User update fails, delete the transaction to prevent drift.

### Phase 2: High Severity Features & Flows

#### [NEW] `src/app/api/auth/change-password/route.ts`
- Create the missing endpoint.
- Extract `currentPassword` and `newPassword`, verify via `bcrypt`, and update the user's hash.

#### [MODIFY] `src/lib/redis.ts` & `src/app/api/auth/otp/verify/route.ts`
- Split OTP verification into `peekOTP()` (checks without deleting) and `consumeOTP()` (checks and deletes).
- Update the public `/verify` endpoint to use `peekOTP()` (so the frontend knows it's valid).
- Update `/register`, `/forgot-password`, and `/login` to use `consumeOTP()` when the final action is taken.

### Phase 3: Medium Severity Fixes

#### [MODIFY] `src/app/api/auth/otp/send/route.ts`
- Change responses to be generic: "If the number is registered, an OTP has been sent." to prevent account enumeration.

#### [MODIFY] `src/app/api/banks/verify-otp/route.ts`
- Move the `BankAccount.findOne` check *before* consuming the OTP. If the bank doesn't exist, return 404 without burning the OTP.

#### [MODIFY] UI Files (Linting)
- `src/app/(dashboard)/banks/add/page.tsx`
- `src/app/(dashboard)/settings/change-password/page.tsx`
- `src/app/(dashboard)/settings/page.tsx`
- Move nested inline components out of the main render function and fix `useEffect` sync state updates.

### Phase 4: Low Severity UI/UX Fixes

#### [MODIFY] `src/app/(dashboard)/settings/page.tsx`
- Import `useAuthStore` and call `fetchMe()` upon successful mutation to sync Zustand state, ensuring the Dashboard Live Pool updates immediately.

#### [MODIFY] `src/app/(dashboard)/page.tsx`
- Correct the "Deposit Requests" button to show the actual deposit request count (by moving the `useQuery` fetch to a higher level, or changing the label to "Total Banks" to match the data). *Will change label to "Total Banks" to match the data being passed.*

#### [MODIFY] `src/components/layout/Sidebar.tsx`
- Comment out or add `disabled` visual states to the links that point to Phase 2+ routes (`/security-deposits`, `/reports`, etc.) so users cannot hit 404s.

## Verification Plan
- **Automated tests**: Run `npm run lint` to verify all lint errors are resolved.
- **Manual Verification**:
  1. Test the full Change Password flow.
  2. Create a test user, login, set `isActive=false` in DB, and call `/refresh` to ensure it fails.
  3. Attempt parallel withdrawals in code to verify the atomic check prevents negative balances.
  4. Ensure OTP flows (register/login/bank) do not break after fixing the verification logic.
