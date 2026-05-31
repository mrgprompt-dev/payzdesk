import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITutorialStepDoc extends Document {
	title: string;
	body: string;
	order: number;
	createdAt: Date;
	updatedAt: Date;
}

const TutorialStepSchema = new Schema<ITutorialStepDoc>(
	{
		title: { type: String, required: true, trim: true, maxlength: 160 },
		body: { type: String, required: true, trim: true, maxlength: 3000 },
		order: { type: Number, default: 0, index: true },
	},
	{ timestamps: true },
);

const TutorialStep: Model<ITutorialStepDoc> =
	mongoose.models.TutorialStep ||
	mongoose.model<ITutorialStepDoc>("TutorialStep", TutorialStepSchema);

export default TutorialStep;
