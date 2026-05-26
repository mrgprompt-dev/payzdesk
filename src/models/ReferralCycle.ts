import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReferralCycleDoc extends Document {
	userId: mongoose.Types.ObjectId;
	startDate: Date;
	endDate: Date;
	amount: number;
	status: "pending_payout" | "credited";
	createdAt: Date;
	updatedAt: Date;
}

const ReferralCycleSchema = new Schema<IReferralCycleDoc>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		startDate: { type: Date, required: true },
		endDate: { type: Date, required: true },
		amount: { type: Number, default: 0 },
		status: {
			type: String,
			enum: ["pending_payout", "credited"],
			default: "pending_payout",
		},
	},
	{ timestamps: true },
);

// Index: one active cycle per user at a time
ReferralCycleSchema.index({ userId: 1, status: 1 });

const ReferralCycle: Model<IReferralCycleDoc> =
	mongoose.models.ReferralCycle ||
	mongoose.model<IReferralCycleDoc>("ReferralCycle", ReferralCycleSchema);

export default ReferralCycle;
