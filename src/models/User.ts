import mongoose, { Document, Schema } from 'mongoose'
import bcrypt from 'bcryptjs'
import { generateReferralCode } from '@/utils'

export interface IUserDocument extends Document {
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
  createdAt: Date
  updatedAt: Date
  comparePassword(password: string): Promise<boolean>
}

const UserSchema = new Schema<IUserDocument>(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^[0-9]{10}$/, 'Phone must be a 10-digit number'],
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    referralCode: {
      type: String,
      unique: true,
      default: generateReferralCode,
    },
    referredBy: {
      type: String,
      default: null,
    },
    // Financial fields — default zero, updated by backend logic
    netBalance: { type: Number, default: 0 },
    commissionEarned: { type: Number, default: 0 },
    blockedDeposit: { type: Number, default: 0 },
    withdrawalHoldAmount: { type: Number, default: 0 },
    totalBanks: { type: Number, default: 0 },
    activeBanks: { type: Number, default: 0 },
    disputedWithdrawalAmount: { type: Number, default: 0 },
    // Settings
    withdrawalEnabled: { type: Boolean, default: false },
    maxWithdrawalPerTxn: { type: Number, default: 40000 },
    appLockEnabled: { type: Boolean, default: false },
    hasPinSetup: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
)

// ─── Instance method: compare password ───────────────────────────────────────

UserSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash)
}

// ─── Pre-save: hash password if modified ─────────────────────────────────────

UserSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return
  // passwordHash field is used to store raw password before hashing
  // Only hash if it doesn't look like a bcrypt hash already
  if (!this.passwordHash.startsWith('$2')) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12)
  }
})

// ─── Remove sensitive fields from JSON output ────────────────────────────────

UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const user = { ...ret } as Record<string, unknown>
    delete user.passwordHash
    return user
  },
})

export const User =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema)
