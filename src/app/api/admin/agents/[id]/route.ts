import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { BankAccount } from "@/models/BankAccount";
import { Transaction } from "@/models/Transaction";
import { getAdminUser } from "@/lib/getAdminUser";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const payload = await getAdminUser(req);
		if (!payload) {
			return NextResponse.json(
				{ success: false, message: "Not authenticated" },
				{ status: 401 },
			);
		}

		await connectDB();
		const { id } = await params;

		const user = await User.findById(id).select("-passwordHash").lean();
		if (!user) {
			return NextResponse.json(
				{ success: false, message: "Agent not found" },
				{ status: 404 },
			);
		}

		// Fetch related data
		const [banks, transactions] = await Promise.all([
			BankAccount.find({ userId: id }).lean(),
			Transaction.find({ userId: id })
				.sort({ createdAt: -1 })
				.limit(10)
				.lean(),
		]);

		return NextResponse.json({
			success: true,
			data: {
				...user,
				banks,
				transactions,
			},
		});
	} catch (error) {
		console.error("[GET /api/admin/agents/[id]]", error);
		return NextResponse.json(
			{ success: false, message: "Server error" },
			{ status: 500 },
		);
	}
}

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const payload = await getAdminUser(req);
		if (!payload) {
			return NextResponse.json(
				{ success: false, message: "Not authenticated" },
				{ status: 401 },
			);
		}

		await connectDB();
		const { id } = await params;
		const body = await req.json();

		const updates: any = {};
		if (typeof body.isActive === "boolean") {
			updates.isActive = body.isActive;
		}
		if (typeof body.maxWithdrawalPerTxn === "number" && body.maxWithdrawalPerTxn >= 0) {
			updates.maxWithdrawalPerTxn = body.maxWithdrawalPerTxn;
		} else if (typeof body.maxWithdrawalPerTxn === "number") {
			return NextResponse.json(
				{ success: false, message: "maxWithdrawalPerTxn must be >= 0" },
				{ status: 400 },
			);
		}
		
		if (Object.keys(updates).length === 0) {
			return NextResponse.json(
				{ success: false, message: "No valid updates provided" },
				{ status: 400 },
			);
		}

		const user = await User.findByIdAndUpdate(
			id,
			{ $set: updates },
			{ new: true }
		).select("-passwordHash").lean();

		if (!user) {
			return NextResponse.json(
				{ success: false, message: "Agent not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({
			success: true,
			message: "Agent updated successfully",
			data: user,
		});
	} catch (error) {
		console.error("[PATCH /api/admin/agents/[id]]", error);
		return NextResponse.json(
			{ success: false, message: "Server error" },
			{ status: 500 },
		);
	}
}
