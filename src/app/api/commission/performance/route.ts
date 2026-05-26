import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/getAuthUser";
import PerformanceCommission from "@/models/PerformanceCommission";
import type { ApiResponse, IPerformanceCommission } from "@/types";

// GET /api/commission/performance
// Returns the authenticated user's performance commission record.
// If no record exists yet (new user), returns a default zero-state.
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

		let record = await PerformanceCommission.findOne({
			userId: auth.userId,
		}).lean();

		// If no record yet, return a sensible zero-state (don't create one — admin does that)
		if (!record) {
			const zeroState: IPerformanceCommission = {
				totalEarned: 0,
				status: "pending",
				lastReleasedDate: null,
				frequencyDays: 7,
				activePrograms: [
					{
						name: "Performance Commission",
						termsUrl: undefined,
						bonusTrackerUrl: undefined,
					},
				],
			};
			return NextResponse.json<ApiResponse<IPerformanceCommission>>({
				success: true,
				message: "No commission record yet",
				data: zeroState,
			});
		}

		const data: IPerformanceCommission = {
			totalEarned: record.totalEarned,
			status: record.status,
			lastReleasedDate: record.lastReleasedDate
				? record.lastReleasedDate.toISOString()
				: null,
			frequencyDays: record.frequencyDays,
			activePrograms: record.activePrograms.map((p) => ({
				name: p.name,
				termsUrl: p.termsUrl,
				bonusTrackerUrl: p.bonusTrackerUrl,
			})),
		};

		return NextResponse.json<ApiResponse<IPerformanceCommission>>({
			success: true,
			message: "Performance commission fetched",
			data,
		});
	} catch (err) {
		console.error("[GET /api/commission/performance]", err);
		return NextResponse.json<ApiResponse>(
			{ success: false, message: "Internal server error" },
			{ status: 500 },
		);
	}
}
