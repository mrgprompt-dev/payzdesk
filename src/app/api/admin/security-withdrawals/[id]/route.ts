import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import { getAdminUser } from "@/lib/getAdminUser";

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

		const { action, note } = body; // action = "approve" or "reject"

		if (action !== "approve" && action !== "reject") {
			return NextResponse.json(
				{ success: false, message: "Invalid action" },
				{ status: 400 },
			);
		}

		const newStatus = action === "approve" ? "completed" : "failed";

		const session = await mongoose.startSession();
		let updatedTransaction;

		try {
			await session.withTransaction(async () => {
				const txn = await Transaction.findOneAndUpdate(
					{ _id: id, status: "pending", type: "security_withdrawal" },
					{
						$set: {
							status: newStatus,
							...(note ? { notes: note } : {}),
						},
					},
					{ new: true, session }
				);

				if (!txn) {
					// Either not found, not pending, or not a security_withdrawal
					throw new Error("ALREADY_PROCESSED_OR_INVALID");
				}

				const amount = txn.amount;
				let userUpdates: Record<string, unknown> = {};

				if (action === "approve") {
					userUpdates = {
						$inc: { withdrawalHoldAmount: -amount },
					};
				} else if (action === "reject") {
					userUpdates = {
						$inc: { netBalance: amount, withdrawalHoldAmount: -amount },
					};
				}

				if (Object.keys(userUpdates).length > 0) {
					await User.findByIdAndUpdate(txn.userId, userUpdates, { session });
				}

				updatedTransaction = txn;
			});
		} finally {
			await session.endSession();
		}

		if (!updatedTransaction) {
			return NextResponse.json(
				{ success: false, message: "Transaction is already processed or invalid" },
				{ status: 400 },
			);
		}

		return NextResponse.json({
			success: true,
			message: `Security withdrawal ${newStatus} successfully`,
			data: updatedTransaction,
		});
	} catch (error: any) {
		if (error?.message === "ALREADY_PROCESSED_OR_INVALID") {
			return NextResponse.json(
				{ success: false, message: "Transaction is already processed or invalid" },
				{ status: 400 },
			);
		}
		console.error("[PATCH /api/admin/security-withdrawals/[id]]", error);
		return NextResponse.json(
			{ success: false, message: "Server error" },
			{ status: 500 },
		);
	}
}
