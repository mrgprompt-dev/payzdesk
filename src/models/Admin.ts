import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IAdminDocument extends Document {
	name: string;
	phone: string;
	passwordHash: string;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
	_rawPassword?: string;
	comparePassword(password: string): Promise<boolean>;
}

const AdminSchema = new Schema<IAdminDocument>(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			minlength: 2,
			maxlength: 60,
		},
		phone: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			match: [/^[0-9]{10}$/, "Phone must be a 10-digit number"],
		},
		passwordHash: {
			type: String,
			required: true,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true },
);

AdminSchema.methods.comparePassword = async function (
	password: string,
): Promise<boolean> {
	return bcrypt.compare(password, this.passwordHash);
};

// Virtual setter: set `admin.password = 'raw'` to trigger hashing on save.
// The `passwordHash` field is always a bcrypt hash — never raw text.
AdminSchema.virtual("password").set(function (value: string) {
	this._rawPassword = value;
});

AdminSchema.pre("save", async function () {
	if (this._rawPassword) {
		this.passwordHash = await bcrypt.hash(this._rawPassword, 12);
		this._rawPassword = undefined;
	}
});

AdminSchema.set("toJSON", {
	transform: (_doc, ret) => {
		const admin = { ...ret } as Record<string, unknown>;
		delete admin.passwordHash;
		return admin;
	},
});

export const Admin =
	mongoose.models.Admin || mongoose.model<IAdminDocument>("Admin", AdminSchema);
