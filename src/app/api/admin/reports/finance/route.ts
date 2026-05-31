import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getAdminUser } from "@/lib/getAdminUser";
import { Transaction } from "@/models/Transaction";
import Adjustment from "@/models/Adjustment";
import PerformanceCommission from "@/models/PerformanceCommission";
import ReferralCycle from "@/models/ReferralCycle";

function dateRange(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const from = searchParams.get("from");
	const to = searchParams.get("to");
	const createdAt: Record<string, Date> = {};

	if (from) createdAt.$gte = new Date(from);
	if (to) {
		const end = new Date(to);
		end.setHours(23, 59, 59, 999);
		createdAt.$lte = end;
	}

	return Object.keys(createdAt).length > 0 ? createdAt : undefined;
}

async function sumByField(model: mongoose.Model<unknown>, match: Record<string, unknown>, field: string) {
	const result = await model.aggregate([
		{ $match: match },
		{ $group: { _id: null, total: { $sum: `$${field}` }, count: { $sum: 1 } } },
	]);
	return { total: result[0]?.total || 0, count: result[0]?.count || 0 };
}

export async function GET(req: NextRequest) {
	try {
		const payload = await getAdminUser(req);
		if (!payload) {
			return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
		}

		await connectDB();

		const { searchParams } = new URL(req.url);
		const agentId = searchParams.get("agentId");
		const createdAt = dateRange(req);
		const baseMatch: Record<string, unknown> = {};

		if (agentId) {
			if (!mongoose.Types.ObjectId.isValid(agentId)) {
				return NextResponse.json({ success: false, message: "Invalid agent" }, { status: 400 });
			}
			baseMatch.userId = new mongoose.Types.ObjectId(agentId);
		}

		const datedMatch = createdAt ? { ...baseMatch, createdAt } : baseMatch;
		const updatedAt = createdAt ? { updatedAt: createdAt } : {};
		const userIdMatch = agentId ? { userId: new mongoose.Types.ObjectId(agentId) } : {};

		const [
			deposits,
			withdrawals,
			securityDeposits,
			securityWithdrawals,
			creditAdjustments,
			debitAdjustments,
			performanceReleased,
			referralReleased,
		] = await Promise.all([
			sumByField(Transaction, { ...datedMatch, type: "deposit", status: "completed" }, "amount"),
			sumByField(Transaction, { ...datedMatch, type: "withdrawal", status: "completed" }, "amount"),
			sumByField(Transaction, { ...datedMatch, type: "security_deposit", status: "completed" }, "amount"),
			sumByField(Transaction, { ...datedMatch, type: "security_withdrawal", status: "completed" }, "amount"),
			sumByField(Adjustment, { ...datedMatch, type: "credit" }, "amount"),
			sumByField(Adjustment, { ...datedMatch, type: "debit" }, "amount"),
			sumByField(
				PerformanceCommission,
				{ ...userIdMatch, ...updatedAt, status: "released" },
				"totalEarned",
			),
			sumByField(ReferralCycle, { ...userIdMatch, ...updatedAt, status: "credited" }, "amount"),
		]);

		return NextResponse.json({
			success: true,
			data: {
				deposits,
				withdrawals,
				securityDeposits,
				securityWithdrawals,
				commissionsReleased: {
					total: performanceReleased.total + referralReleased.total,
					count: performanceReleased.count + referralReleased.count,
				},
				adjustments: {
					credit: creditAdjustments,
					debit: debitAdjustments,
					net: creditAdjustments.total - debitAdjustments.total,
				},
			},
		});
	} catch (error) {
		console.error("[GET /api/admin/reports/finance]", error);
		return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
	}
}
