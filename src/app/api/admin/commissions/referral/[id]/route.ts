import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import ReferralCycle from "@/models/ReferralCycle";
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

		const { action } = body;

		if (action !== "release" && action !== "close") {
			return NextResponse.json(
				{ success: false, message: "Invalid action" },
				{ status: 400 },
			);
		}

		if (action === "close") {
			const cycle = await ReferralCycle.findOneAndUpdate(
				{ _id: id, status: "active" },
				{ $set: { status: "closed", endDate: new Date() } },
				{ new: true },
			);

			if (!cycle) {
				return NextResponse.json(
					{ success: false, message: "Referral cycle is not active or was not found" },
					{ status: 400 },
				);
			}

			return NextResponse.json({
				success: true,
				message: "Referral cycle closed successfully",
				data: cycle,
			});
		}

		const session = await mongoose.startSession();
		let updatedCycle;

		try {
			await session.withTransaction(async () => {
				const cycle = await ReferralCycle.findOneAndUpdate(
					{ _id: id, status: { $in: ["closed", "pending_payout"] } },
					{
						$set: {
							status: "credited",
						},
					},
					{ new: true, session }
				);

				if (!cycle) {
					throw new Error("ALREADY_PROCESSED_OR_NOT_FOUND");
				}

				if (cycle.amount > 0) {
					await User.findByIdAndUpdate(
						cycle.userId,
						{ $inc: { commissionEarned: cycle.amount } },
						{ session }
					);
				}

				updatedCycle = cycle;
			});
		} finally {
			await session.endSession();
		}

		if (!updatedCycle) {
			return NextResponse.json(
				{ success: false, message: "Referral cycle is already credited or invalid" },
				{ status: 400 },
			);
		}

		return NextResponse.json({
			success: true,
			message: "Referral cycle payout released successfully",
			data: updatedCycle,
		});
	} catch (error: any) {
		if (error?.message === "ALREADY_PROCESSED_OR_NOT_FOUND") {
			return NextResponse.json(
				{ success: false, message: "Referral cycle is already credited or invalid" },
				{ status: 400 },
			);
		}
		console.error("[PATCH /api/admin/commissions/referral/[id]]", error);
		return NextResponse.json(
			{ success: false, message: "Server error" },
			{ status: 500 },
		);
	}
}
