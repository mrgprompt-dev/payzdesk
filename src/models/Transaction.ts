import mongoose, { Schema, model, models } from "mongoose";

const transactionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["deposit", "withdrawal", "security_deposit", "security_withdrawal"],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      // 'disputed' aligned to ITransaction type; 'processing'/'cancelled' are
      // internal states not yet surfaced in the UI type (Phase 2)
      enum: ["pending", "processing", "completed", "failed", "disputed", "cancelled"],
      default: "pending",
      index: true,
    },
    // Field name aligned to ITransaction type (bankId, not bankAccountId)
    bankId: {
      type: Schema.Types.ObjectId,
      ref: "BankAccount",
      default: null,
    },
    utrNumber: {
      type: String,
      default: null,
    },
    referenceId: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index for efficient per-user filtered queries
transactionSchema.index({ userId: 1, type: 1, status: 1, createdAt: -1 });

export const Transaction =
  models.Transaction ?? model("Transaction", transactionSchema);
