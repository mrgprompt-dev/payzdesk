import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import PerformanceCommission from "@/models/PerformanceCommission";
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

		if (action !== "release") {
			return NextResponse.json(
				{ success: false, message: "Invalid action" },
				{ status: 400 },
			);
		}

		const session = await mongoose.startSession();
		let updatedCommission;

		try {
			await session.withTransaction(async () => {
				const commission = await PerformanceCommission.findOneAndUpdate(
					{ _id: id, status: "pending" },
					{
						$set: {
							status: "released",
							lastReleasedDate: new Date(),
						},
					},
					{ new: true, session }
				);

				if (!commission) {
					throw new Error("ALREADY_PROCESSED_OR_NOT_FOUND");
				}

				if (commission.totalEarned > 0) {
					await User.findByIdAndUpdate(
						commission.userId,
						{ $inc: { commissionEarned: commission.totalEarned } },
						{ session }
					);
				}

				updatedCommission = commission;
			});
		} finally {
			await session.endSession();
		}

		if (!updatedCommission) {
			return NextResponse.json(
				{ success: false, message: "Commission is already released or invalid" },
				{ status: 400 },
			);
		}

		return NextResponse.json({
			success: true,
			message: "Performance commission released successfully",
			data: updatedCommission,
		});
	} catch (error: any) {
		if (error?.message === "ALREADY_PROCESSED_OR_NOT_FOUND") {
			return NextResponse.json(
				{ success: false, message: "Commission is already released or invalid" },
				{ status: 400 },
			);
		}
		console.error("[PATCH /api/admin/commissions/[id]]", error);
		return NextResponse.json(
			{ success: false, message: "Server error" },
			{ status: 500 },
		);
	}
}
