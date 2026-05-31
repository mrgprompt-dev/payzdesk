import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGlobalSettingDoc extends Document {
	maintenanceMode: boolean;
	globalMinWithdrawal: number;
	globalMaxWithdrawal: number;
	defaultMaxWithdrawal: number;
	performanceCommissionRate: number;
	referralCommissionRate: number;
	announcementMessage: string;
	depositUpiIds: string[];
	tiers: Array<{
		name: string;
		minDeposit: number;
		commissionRate: number;
		withdrawalLimit: number;
	}>;
	updatedAt: Date;
}

const TierSettingSchema = new Schema(
	{
		name: { type: String, required: true, trim: true, maxlength: 60 },
		minDeposit: { type: Number, required: true, min: 0 },
		commissionRate: { type: Number, required: true, min: 0 },
		withdrawalLimit: { type: Number, required: true, min: 0 },
	},
	{ _id: false },
);

const GlobalSettingSchema = new Schema<IGlobalSettingDoc>(
	{
		// Since it's a singleton, we only need one document
		maintenanceMode: { type: Boolean, default: false },
		globalMinWithdrawal: { type: Number, default: 100 },
		globalMaxWithdrawal: { type: Number, default: 50000 },
		defaultMaxWithdrawal: { type: Number, default: 40000 },
		performanceCommissionRate: { type: Number, default: 0 },
		referralCommissionRate: { type: Number, default: 0 },
		announcementMessage: { type: String, default: "", trim: true },
		depositUpiIds: [{ type: String, trim: true }],
		tiers: {
			type: [TierSettingSchema],
			default: [
				{ name: "Bronze", minDeposit: 0, commissionRate: 0.5, withdrawalLimit: 10000 },
				{ name: "Silver", minDeposit: 50000, commissionRate: 1, withdrawalLimit: 25000 },
				{ name: "Gold", minDeposit: 200000, commissionRate: 1.5, withdrawalLimit: 50000 },
				{ name: "Platinum", minDeposit: 500000, commissionRate: 2, withdrawalLimit: 100000 },
			],
		},
	},
	{ timestamps: true },
);

const GlobalSetting: Model<IGlobalSettingDoc> =
	mongoose.models.GlobalSetting ||
	mongoose.model<IGlobalSettingDoc>("GlobalSetting", GlobalSettingSchema);

export default GlobalSetting;
