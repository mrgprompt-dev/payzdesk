# Code Audit Remediation Tasks

- `[x]` **Phase 1: Critical Security & Financial Integrity**
  - `[x]` Update `src/app/api/auth/refresh/route.ts` to verify user exists and `isActive`
  - `[x]` Refactor `src/app/api/transactions/withdraw/route.ts` for atomic `findOneAndUpdate`
  - `[x]` Refactor `src/app/api/transactions/deposit/route.ts` for atomic update handling

- `[x]` **Phase 2: High Severity Features & Flows**
  - `[x]` Create `src/app/api/auth/change-password/route.ts`
  - `[x]` Update `src/lib/redis.ts` to separate `peekOTP` (verify) from `consumeOTP`
  - `[x]` Update OTP verify/send API endpoints to use new flow
  - `[x]` Update `/register`, `/forgot-password`, `/login` and `/banks/verify-otp` to consume OTP

- `[x]` **Phase 3: Medium Severity Fixes**
  - `[x]` `src/app/api/auth/otp/send/route.ts`: Generic responses to prevent enumeration
  - `[x]` `src/app/api/banks/verify-otp/route.ts`: Validate bank exists *before* consuming OTP

- `[x]` **Phase 4: Low Severity UI/UX Fixes**
  - `[x]` `src/app/(dashboard)/settings/page.tsx`: Call `fetchMe()` after toggle to sync dashboard + Fix linting
  - `[x]` `src/app/(dashboard)/page.tsx`: Correct "Deposit Requests" label to "Total Banks"
  - `[x]` Fix nested component linting in `src/app/(dashboard)/banks/add/page.tsx`
  - `[x]` Fix nested component linting in `src/app/(dashboard)/settings/change-password/page.tsx`
