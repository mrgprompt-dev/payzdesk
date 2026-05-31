import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import PerformanceCommission from "@/models/PerformanceCommission";
import ReferralCycle from "@/models/ReferralCycle";
import { getAdminUser } from "@/lib/getAdminUser";

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

		// Calculate total pending payouts (performance commissions)
		const perfAgg = await PerformanceCommission.aggregate([
			{ $match: { status: "pending" } },
			{ $group: { _id: null, total: { $sum: "$totalEarned" } } }
		]);
		const pendingPerf = perfAgg[0]?.total || 0;

		// Calculate total pending payouts (referral cycles)
		const refAgg = await ReferralCycle.aggregate([
			{ $match: { status: "pending_payout" } },
			{ $group: { _id: null, total: { $sum: "$amount" } } }
		]);
		const pendingRef = refAgg[0]?.total || 0;

		const totalPendingPayouts = pendingPerf + pendingRef;

		// Calculate total blocked deposits and global withdrawal hold across all users
		const userAgg = await User.aggregate([
			{
				$group: {
					_id: null,
					totalBlockedDeposit: { $sum: "$blockedDeposit" },
					totalWithdrawalHold: { $sum: "$withdrawalHoldAmount" },
				}
			}
		]);
		
		const totalBlockedDeposit = userAgg[0]?.totalBlockedDeposit || 0;
		const globalWithdrawalHold = userAgg[0]?.totalWithdrawalHold || 0;

		return NextResponse.json({
			success: true,
			data: {
				totalPendingPayouts,
				totalBlockedDeposit,
				globalWithdrawalHold,
			},
		});
	} catch (error) {
		console.error("[GET /api/admin/stats/finance]", error);
		return NextResponse.json(
			{ success: false, message: "Server error" },
			{ status: 500 },
		);
	}
}
