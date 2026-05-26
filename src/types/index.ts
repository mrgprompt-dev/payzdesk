// ─── User ────────────────────────────────────────────────────────────────────

export interface IUser {
  _id: string
  phone: string
  name: string
  email?: string
  passwordHash: string
  isVerified: boolean
  isActive: boolean
  referralCode: string
  referredBy?: string
  netBalance: number
  commissionEarned: number
  blockedDeposit: number
  withdrawalHoldAmount: number
  totalBanks: number
  activeBanks: number
  disputedWithdrawalAmount: number
  withdrawalEnabled: boolean
  maxWithdrawalPerTxn: number
  appLockEnabled: boolean
  hasPinSetup: boolean
  createdAt: string
  updatedAt: string
}

export type PublicUser = Omit<IUser, 'passwordHash'>

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthTokenPayload {
  userId: string
  phone: string
  iat?: number
  exp?: number
}

export interface LoginRequest {
  phone: string
  password: string
}

export interface RegisterRequest {
  phone: string
  name: string
  password: string
  referralCode?: string
}

export interface OtpSendRequest {
  phone: string
  purpose: 'register' | 'login' | 'forgot-password' | 'bank-verify'
}

export interface OtpVerifyRequest {
  phone: string
  otp: string
  purpose: 'register' | 'login' | 'forgot-password' | 'bank-verify'
}

// ─── Bank Account ─────────────────────────────────────────────────────────────

export interface IBankAccount {
  _id: string
  userId: string
  accountNumber: string
  upiId: string
  accountHolderName: string
  ifscCode: string
  bankName: string
  branch: string
  address: string
  phone: string
  status: 'active' | 'inactive' | 'pending'
  verified: boolean
  createdAt: string
  updatedAt: string
}

// ─── Transaction ──────────────────────────────────────────────────────────────

export interface ITransaction {
  _id: string
  userId: string
  type: 'deposit' | 'withdrawal'
  amount: number
  status: 'pending' | 'completed' | 'failed' | 'disputed'
  bankId?: string
  utrNumber?: string
  createdAt: string
  updatedAt: string
}

// ─── UTR ──────────────────────────────────────────────────────────────────────

export interface IUTR {
  _id: string
  userId: string
  bankId: string
  utrNumber: string
  amount: number
  status: 'pending' | 'verified' | 'rejected'
  createdAt: string
  updatedAt: string
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}