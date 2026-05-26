import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/getAuthUser";
import ReferralCommission from "@/models/ReferralCommission";
import ReferralCycle from "@/models/ReferralCycle";
import type { ApiResponse } from "@/types";

export interface CommissionDetail {
	_id: string;
	cycleId: string;
	cycleStart: string;
	cycleEnd: string;
	amount: number;
	createdAt: string;
}

export interface CommissionDetailsResponse {
	totalEarned: number;
	records: CommissionDetail[];
}

// GET /api/commission/details
// Returns a full breakdown of all referral commission records for the user,
// joined with cycle dates for display.
export async function GET(req: NextRequest) {
	try {
		await connectDB();

		const auth = await getAuthUser(req);
		if (!auth) {
			return NextResponse.json<ApiResponse>(
				{ success: false, message: "Unauthorised" },
				{ status: 401 },
			);
		}

		// Fetch all commission records for this user, newest first
		const commissions = await ReferralCommission.find({
			referrerId: auth.userId,
		})
			.sort({ createdAt: -1 })
			.lean();

		if (commissions.length === 0) {
			return NextResponse.json<ApiResponse<CommissionDetailsResponse>>({
				success: true,
				message: "No commission records",
				data: { totalEarned: 0, records: [] },
			});
		}

		// Fetch all referenced cycles in one query
		const cycleIds = [...new Set(commissions.map((c) => String(c.cycleId)))];
		const cycles = await ReferralCycle.find({ _id: { $in: cycleIds } }).lean();
		const cycleMap = new Map(cycles.map((cy) => [String(cy._id), cy]));

		const records: CommissionDetail[] = commissions.map((c) => {
			const cycle = cycleMap.get(String(c.cycleId));
			return {
				_id: String(c._id),
				cycleId: String(c.cycleId),
				cycleStart: cycle ? cycle.startDate.toISOString() : "",
				cycleEnd: cycle ? cycle.endDate.toISOString() : "",
				amount: c.amount,
				createdAt: c.createdAt.toISOString(),
			};
		});

		const totalEarned = records.reduce((sum, r) => sum + r.amount, 0);

		return NextResponse.json<ApiResponse<CommissionDetailsResponse>>({
			success: true,
			message: "Commission details fetched",
			data: { totalEarned, records },
		});
	} catch (err) {
		console.error("[GET /api/commission/details]", err);
		return NextResponse.json<ApiResponse>(
			{ success: false, message: "Internal server error" },
			{ status: 500 },
		);
	}
}
