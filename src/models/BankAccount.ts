import mongoose, { Schema, model, models } from "mongoose";

const bankAccountSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    accountHolderName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifsc: { type: String, required: true },
    bankName: { type: String, required: true },
    branch: { type: String },
    upiId: { type: String },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const BankAccount =
  models.BankAccount ?? model("BankAccount", bankAccountSchema);
