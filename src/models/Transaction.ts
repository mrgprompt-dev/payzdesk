import mongoose, { Schema, model, models } from "mongoose";

const transactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["deposit", "withdrawal", "security_deposit", "security_withdrawal"],
      required: true,
    },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "cancelled"],
      default: "pending",
    },
    bankAccountId: { type: Schema.Types.ObjectId, ref: "BankAccount" },
    utrNumber: { type: String },
    referenceId: { type: String },
  },
  { timestamps: true }
);

export const Transaction =
  models.Transaction ?? model("Transaction", transactionSchema);
