import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import { BankAccount } from "@/models/BankAccount";
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

		const transaction = await Transaction.findById(id)
			.populate({ path: "userId", select: "name phone netBalance", model: User })
			.populate({ path: "bankId", select: "bankName accountNumber ifscCode", model: BankAccount })
			.lean();

		if (!transaction) {
			return NextResponse.json(
				{ success: false, message: "Transaction not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({
			success: true,
			data: transaction,
		});
	} catch (error) {
		console.error("[GET /api/admin/transactions/[id]]", error);
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

		const { action, note } = body; // action = "approve" or "reject"

		if (action !== "approve" && action !== "reject") {
			return NextResponse.json(
				{ success: false, message: "Invalid action" },
				{ status: 400 },
			);
		}

		const newStatus = action === "approve" ? "completed" : "failed";

		// ── Atomic update inside a MongoDB transaction ─────────────────────
		const session = await mongoose.startSession();
		let updatedTransaction;

		try {
			await session.withTransaction(async () => {
				// Atomically claim the transaction (only if still pending)
				const txn = await Transaction.findOneAndUpdate(
					{ _id: id, status: "pending" },
					{
						$set: {
							status: newStatus,
							...(note ? { notes: note } : {}),
						},
					},
					{ new: true, session },
				);

				if (!txn) {
					throw new Error("ALREADY_PROCESSED");
				}

				// Calculate balance updates based on type + action
				const amount = txn.amount;
				const type = txn.type;
				let userUpdates: Record<string, unknown> = {};

				if (type === "deposit") {
					if (action === "approve") {
						userUpdates = {
							$inc: { netBalance: amount, blockedDeposit: -amount },
						};
					} else {
						userUpdates = {
							$inc: { blockedDeposit: -amount },
						};
					}
				} else if (type === "withdrawal") {
					if (action === "approve") {
						userUpdates = {
							$inc: { withdrawalHoldAmount: -amount },
						};
					} else {
						userUpdates = {
							$inc: { netBalance: amount, withdrawalHoldAmount: -amount },
						};
					}
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
				{ success: false, message: "Transaction is already processed" },
				{ status: 400 },
			);
		}

		return NextResponse.json({
			success: true,
			message: `Transaction ${newStatus} successfully`,
			data: updatedTransaction,
		});
	} catch (error: any) {
		if (error?.message === "ALREADY_PROCESSED") {
			return NextResponse.json(
				{ success: false, message: "Transaction is already processed" },
				{ status: 400 },
			);
		}
		console.error("[PATCH /api/admin/transactions/[id]]", error);
		return NextResponse.json(
			{ success: false, message: "Server error" },
			{ status: 500 },
		);
	}
}

