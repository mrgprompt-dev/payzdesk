import mongoose, { Schema, model, models } from "mongoose";

const bankAccountSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    accountNumber: { type: String, required: true },
    upiId:         { type: String, default: "" },
    accountHolderName: { type: String, required: true },
    ifscCode:      { type: String, required: true },
    bankName:      { type: String, required: true },
    branch:        { type: String, default: "" },
    address:       { type: String, default: "" },
    phone:         { type: String, default: "" }, // stored for records, OTP sent to user's registered phone
    status: {
      type: String,
      enum: ["active", "inactive", "pending", "rejected"],
      default: "pending",
    },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const BankAccount =
  models.BankAccount ?? model("BankAccount", bankAccountSchema);
