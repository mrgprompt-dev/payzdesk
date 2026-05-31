import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAdjustmentDoc extends Document {
	userId: mongoose.Types.ObjectId;
	type: "credit" | "debit";
	amount: number;
	description: string;
	referenceId?: string;
	targetWallet: "netBalance" | "commissionEarned";
	createdAt: Date;
	updatedAt: Date;
}

const AdjustmentSchema = new Schema<IAdjustmentDoc>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		type: { type: String, enum: ["credit", "debit"], required: true },
		amount: { type: Number, required: true },
		description: { type: String, required: true, trim: true },
		referenceId: { type: String, trim: true },
		targetWallet: { 
			type: String, 
			enum: ["netBalance", "commissionEarned"], 
			default: "netBalance" 
		},
	},
	{ timestamps: true },
);

AdjustmentSchema.index({ userId: 1, createdAt: -1 });

const Adjustment: Model<IAdjustmentDoc> =
	mongoose.models.Adjustment ||
	mongoose.model<IAdjustmentDoc>("Adjustment", AdjustmentSchema);

export default Adjustment;
