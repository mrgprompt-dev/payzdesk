import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPerformanceCommissionDoc extends Document {
	userId: mongoose.Types.ObjectId;
	totalEarned: number;
	status: "released" | "pending";
	lastReleasedDate: Date | null;
	frequencyDays: number;
	activePrograms: Array<{
		name: string;
		termsUrl?: string;
		bonusTrackerUrl?: string;
	}>;
	createdAt: Date;
	updatedAt: Date;
}

const PerformanceCommissionSchema = new Schema<IPerformanceCommissionDoc>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			unique: true, // one record per user, updated in-place
			index: true,
		},
		totalEarned: { type: Number, default: 0 },
		status: { type: String, enum: ["released", "pending"], default: "pending" },
		lastReleasedDate: { type: Date, default: null },
		frequencyDays: { type: Number, default: 7 },
		activePrograms: [
			{
				name: { type: String, required: true },
				termsUrl: { type: String },
				bonusTrackerUrl: { type: String },
			},
		],
	},
	{ timestamps: true },
);

const PerformanceCommission: Model<IPerformanceCommissionDoc> =
	mongoose.models.PerformanceCommission ||
	mongoose.model<IPerformanceCommissionDoc>(
		"PerformanceCommission",
		PerformanceCommissionSchema,
	);

export default PerformanceCommission;
