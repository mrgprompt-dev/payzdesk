import { Schema, model, models } from "mongoose";

const livePoolJobSchema = new Schema(
  {
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    // The target bank where the agent needs to send money to
    bankId: {
      type: Schema.Types.ObjectId,
      ref: "BankAccount",
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "grabbed", "expired", "completed"],
      default: "available",
      index: true,
    },
    grabbedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

export const LivePoolJob =
  models.LivePoolJob ?? model("LivePoolJob", livePoolJobSchema);
