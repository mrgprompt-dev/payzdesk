import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/getAuthUser";
import { User } from "@/models/User";
import ReferralCycle from "@/models/ReferralCycle";
import ReferralCommission from "@/models/ReferralCommission";
import type { ApiResponse, ReferralStats } from "@/types";

// GET /api/referral
// Returns the authenticated user's referral stats:
//   lifetimeEarnings, referralCode, currentCycle, referredUsers[], commissionHistory[]
export async function GET(req: NextRequest) {
	try {
		await connectDB();

		const auth = getAuthUser(req);
		if (!auth) {
			return NextResponse.json<ApiResponse>(
				{ success: false, message: "Unauthorised" },
				{ status: 401 },
			);
		}

		// ── 1. Fetch the current user (for referralCode + commissionEarned) ──
		const user = await User.findById(auth.userId).lean();
		if (!user) {
			return NextResponse.json<ApiResponse>(
				{ success: false, message: "User not found" },
				{ status: 404 },
			);
		}

		// ── 2. Current (most recent) cycle ──
		const currentCycle = await ReferralCycle.findOne({ userId: auth.userId })
			.sort({ createdAt: -1 })
			.lean();

		// ── 3. Referred users — users whose referredBy === this user's referralCode ──
		const referredUsers = await User.find(
			{ referredBy: user.referralCode },
			{ name: 1, phone: 1, createdAt: 1 },
		)
			.sort({ createdAt: -1 })
			.lean();

		// Mask phone: show only last 4 digits, e.g. ******3210
		const maskedReferredUsers = referredUsers.map((u) => ({
			_id: String(u._id),
			name: u.name,
			phone: String(u.phone).slice(-4).padStart(10, "*"),
			joinedAt: u.createdAt.toISOString(),
			totalCommission: 0, // will be enriched in phase 3 with per-user commission aggregation
		}));

		// ── 4. Commission history for this user ──
		const commissionHistory = await ReferralCommission.find(
			{ referrerId: auth.userId },
			{ referredUserId: 1, cycleId: 1, amount: 1, createdAt: 1 },
		)
			.sort({ createdAt: -1 })
			.limit(50)
			.lean();

		const mappedCommission = commissionHistory.map((c) => ({
			_id: String(c._id),
			referrerId: String(c.referrerId),
			referredUserId: String(c.referredUserId),
			cycleId: String(c.cycleId),
			amount: c.amount,
			createdAt: c.createdAt.toISOString(),
		}));

		// ── 5. Assemble response ──
		const stats: ReferralStats = {
			lifetimeEarnings: user.commissionEarned ?? 0,
			referralCode: user.referralCode,
			currentCycle: currentCycle
				? {
						_id: String(currentCycle._id),
						startDate: currentCycle.startDate.toISOString(),
						endDate: currentCycle.endDate.toISOString(),
						amount: currentCycle.amount,
						status: currentCycle.status,
					}
				: null,
			referredUsers: maskedReferredUsers,
			commissionHistory: mappedCommission,
		};

		return NextResponse.json<ApiResponse<ReferralStats>>({
			success: true,
			message: "Referral stats fetched",
			data: stats,
		});
	} catch (err) {
		console.error("[GET /api/referral]", err);
		return NextResponse.json<ApiResponse>(
			{ success: false, message: "Internal server error" },
			{ status: 500 },
		);
	}
}
