import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Transaction } from "@/models/Transaction";
import { UTR } from "@/models/UTR";
import { BankAccount } from "@/models/BankAccount";
import { getAdminUser } from "@/lib/getAdminUser";

// Lazy-import models that may not exist yet — fail gracefully with 0
async function safeCount(
	modelName: string,
	filter: Record<string, unknown>,
): Promise<number> {
	try {
		// Dynamic import so missing models don't crash the whole route
		const mongoose = (await import("mongoose")).default;
		const Model = mongoose.models[modelName];
		if (!Model) return 0;
		return await Model.countDocuments(filter);
	} catch {
		return 0;
	}
}

export async function GET(req: NextRequest) {
	try {
		const payload = await getAdminUser(req);
		if (!payload) {
			return NextResponse.json(
				{ success: false, message: "Not authenticated" },
				{ status: 401 },
			);
		}

		await connectDB();

		const [
			totalAgents,
			pendingDeposits,
			pendingWithdrawals,
			pendingUTRs,
			pendingBanks,
			openTickets,
			activeLiveJobs,
		] = await Promise.all([
			User.countDocuments(),
			Transaction.countDocuments({ type: "deposit", status: "pending" }),
			Transaction.countDocuments({ type: "withdrawal", status: "pending" }),
			UTR.countDocuments({ status: "pending" }),
			BankAccount.countDocuments({ status: "pending" }),
			safeCount("SupportTicket", { status: "open" }),
			safeCount("LivePoolJob", { status: "available" }),
		]);

		return NextResponse.json({
			success: true,
			message: "OK",
			data: {
				totalAgents,
				pendingDeposits,
				pendingWithdrawals,
				pendingUTRs,
				pendingBanks,
				openTickets,
				activeLiveJobs,
			},
		});
	} catch (error) {
		console.error("[GET /api/admin/stats]", error);
		return NextResponse.json(
			{ success: false, message: "Server error" },
			{ status: 500 },
		);
	}
}
