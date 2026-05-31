import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFAQItemDoc extends Document {
	question: string;
	answer: string;
	order: number;
	createdAt: Date;
	updatedAt: Date;
}

const FAQItemSchema = new Schema<IFAQItemDoc>(
	{
		question: { type: String, required: true, trim: true, maxlength: 200 },
		answer: { type: String, required: true, trim: true, maxlength: 2000 },
		order: { type: Number, default: 0, index: true },
	},
	{ timestamps: true },
);

const FAQItem: Model<IFAQItemDoc> =
	mongoose.models.FAQItem || mongoose.model<IFAQItemDoc>("FAQItem", FAQItemSchema);

export default FAQItem;
