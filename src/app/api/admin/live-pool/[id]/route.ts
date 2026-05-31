import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { LivePoolJob } from "@/models/LivePoolJob";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import { getAdminUser } from "@/lib/getAdminUser";
import { pusherServer } from "@/lib/pusher";

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

		const { action } = body; // expect action = "cancel"

		if (action !== "cancel") {
			return NextResponse.json(
				{ success: false, message: "Invalid action" },
				{ status: 400 },
			);
		}

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return NextResponse.json(
				{ success: false, message: "Invalid job" },
				{ status: 400 },
			);
		}

		const session = await mongoose.startSession();
		let cancelledJob: any = null;
		let jobIdToBroadcast: string | null = null;

		try {
			await session.withTransaction(async () => {
				cancelledJob = await LivePoolJob.findOneAndUpdate(
					{ _id: id, status: "available" },
					{ $set: { status: "expired" } },
					{ new: true, session },
				);

				if (!cancelledJob) {
					throw new Error("NOT_AVAILABLE");
				}

				jobIdToBroadcast = cancelledJob._id.toString();

				const transaction = await Transaction.findByIdAndUpdate(
					cancelledJob.transactionId,
					{
						$set: {
							status: "cancelled",
							notes: "Live pool job cancelled by admin",
						},
					},
					{ new: true, session },
				);

				if (transaction?.userId && transaction.amount > 0) {
					await User.findByIdAndUpdate(
						transaction.userId,
						{ $inc: { blockedDeposit: -transaction.amount } },
						{ session },
					);
				}
			});
		} finally {
			await session.endSession();
		}

		if (!cancelledJob || !jobIdToBroadcast) {
			return NextResponse.json(
				{ success: false, message: "Only available jobs can be cancelled" },
				{ status: 400 },
			);
		}

		// Broadcast expired event so agents' UIs remove it
		try {
			await pusherServer.trigger("private-live-pool", "job.expired", {
				jobId: jobIdToBroadcast,
			});
		} catch (pusherErr) {
			console.error("Pusher broadcast failed:", pusherErr);
		}

		return NextResponse.json({
			success: true,
			message: "Job cancelled successfully",
			data: cancelledJob,
		});
	} catch (error: unknown) {
		if (error instanceof Error && error.message === "NOT_AVAILABLE") {
			return NextResponse.json(
				{ success: false, message: "Only available jobs can be cancelled" },
				{ status: 400 },
			);
		}
		console.error("[PATCH /api/admin/live-pool/[id]]", error);
		return NextResponse.json(
			{ success: false, message: "Server error" },
			{ status: 500 },
		);
	}
}
