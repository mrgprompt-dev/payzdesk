import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReferralCommissionDoc extends Document {
	referrerId: mongoose.Types.ObjectId; // user who referred
	referredUserId: mongoose.Types.ObjectId;
	cycleId: mongoose.Types.ObjectId;
	amount: number;
	createdAt: Date;
	updatedAt: Date;
}

const ReferralCommissionSchema = new Schema<IReferralCommissionDoc>(
	{
		referrerId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		referredUserId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		cycleId: {
			type: Schema.Types.ObjectId,
			ref: "ReferralCycle",
			required: true,
		},
		amount: { type: Number, required: true, default: 0 },
	},
	{ timestamps: true },
);

ReferralCommissionSchema.index({ referrerId: 1, cycleId: 1 });

const ReferralCommission: Model<IReferralCommissionDoc> =
	mongoose.models.ReferralCommission ||
	mongoose.model<IReferralCommissionDoc>(
		"ReferralCommission",
		ReferralCommissionSchema,
	);

export default ReferralCommission;
