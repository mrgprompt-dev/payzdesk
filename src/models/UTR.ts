import mongoose, { Schema, model, models } from "mongoose";

const utrSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Field name aligned to IBankAccount and IUTR types (bankId, not bankAccountId)
    bankId: {
      type: Schema.Types.ObjectId,
      ref: "BankAccount",
      required: true,
      index: true,
    },
    utrNumber: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    // Status aligned to IUTR type: 'pending' | 'verified' | 'rejected'
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Compound index: enforce one UTR number per user (prevent duplicate submission)
utrSchema.index({ userId: 1, utrNumber: 1 }, { unique: true });

export const UTR = models.UTR ?? model("UTR", utrSchema);
