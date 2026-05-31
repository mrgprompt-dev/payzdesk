import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { LivePoolJob } from "@/models/LivePoolJob";
import { Transaction } from "@/models/Transaction";
import { BankAccount } from "@/models/BankAccount";
import { User } from "@/models/User";
import { getAdminUser } from "@/lib/getAdminUser";
import { pusherServer } from "@/lib/pusher";

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

		const { searchParams } = new URL(req.url);
		const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
		const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
		const status = searchParams.get("status") || "all";

		const query: Record<string, any> = {};
		if (status !== "all") {
			query.status = status;
		}

		const skip = (page - 1) * limit;

		const expiredJobs = await LivePoolJob.find({
			status: "available",
			expiresAt: { $lt: new Date() },
		}).select("_id transactionId");

		await Promise.all(
			expiredJobs.map(async (expiredJob) => {
				const claimedJob = await LivePoolJob.findOneAndUpdate(
					{ _id: expiredJob._id, status: "available" },
					{ $set: { status: "expired" } },
					{ new: true },
				);

				if (!claimedJob) return;

				const transaction = await Transaction.findOneAndUpdate(
					{ _id: claimedJob.transactionId, status: "pending" },
					{
						$set: {
							status: "cancelled",
							notes: "Live pool job expired",
						},
					},
					{ new: true },
				);

				if (transaction?.userId && transaction.amount > 0) {
					await User.findByIdAndUpdate(transaction.userId, {
						$inc: { blockedDeposit: -transaction.amount },
					});
				}
			}),
		);

		const [jobs, total] = await Promise.all([
			LivePoolJob.find(query)
				.populate({ path: "bankId", select: "bankName accountNumber", model: BankAccount })
				.populate({ path: "grabbedBy", select: "name phone", model: User })
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			LivePoolJob.countDocuments(query),
		]);

		return NextResponse.json({
			success: true,
			data: jobs,
			pagination: {
				total,
				page,
				limit,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("[GET /api/admin/live-pool]", error);
		return NextResponse.json(
			{ success: false, message: "Server error" },
			{ status: 500 },
		);
	}
}

export async function POST(req: NextRequest) {
	try {
		const payload = await getAdminUser(req);
		if (!payload) {
			return NextResponse.json(
				{ success: false, message: "Not authenticated" },
				{ status: 401 },
			);
		}

		await connectDB();
		const body = await req.json();
		const { bankId, amount, expiryMinutes } = body;

		if (!bankId || amount === undefined || expiryMinutes === undefined) {
			return NextResponse.json(
				{ success: false, message: "Missing required fields" },
				{ status: 400 },
			);
		}

		if (!mongoose.Types.ObjectId.isValid(bankId)) {
			return NextResponse.json(
				{ success: false, message: "Invalid bank account" },
				{ status: 400 },
			);
		}

		const numericAmount = Number(amount);
		const numericExpiryMinutes = Number(expiryMinutes);

		if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
			return NextResponse.json(
				{ success: false, message: "Invalid amount" },
				{ status: 400 },
			);
		}

		if (
			!Number.isInteger(numericExpiryMinutes) ||
			numericExpiryMinutes <= 0 ||
			numericExpiryMinutes > 1440
		) {
			return NextResponse.json(
				{ success: false, message: "Expiry duration must be between 1 and 1440 minutes" },
				{ status: 400 },
			);
		}

		// Verify bank exists and is active
		const bank = await BankAccount.findOne({ _id: bankId, status: "active" });
		if (!bank) {
			return NextResponse.json(
				{ success: false, message: "Selected bank account is invalid or not active" },
				{ status: 400 },
			);
		}

		// Calculate expiry
		const expiresAt = new Date();
		expiresAt.setMinutes(expiresAt.getMinutes() + numericExpiryMinutes);

		const session = await mongoose.startSession();
		let job: any = null;

		try {
			await session.withTransaction(async () => {
				// The underlying pending deposit belongs to the bank owner and must
				// reserve blockedDeposit so normal approval/rejection math balances.
				const [transaction] = await Transaction.create(
					[
						{
							userId: bank.userId,
							type: "deposit",
							amount: numericAmount,
							status: "pending",
							bankId: bank._id,
						},
					],
					{ session },
				);

				await User.findByIdAndUpdate(
					bank.userId,
					{ $inc: { blockedDeposit: numericAmount } },
					{ session },
				);

				const [createdJob] = await LivePoolJob.create(
					[
						{
							transactionId: transaction._id,
							amount: numericAmount,
							bankId: bank._id,
							status: "available",
							expiresAt,
						},
					],
					{ session },
				);

				job = createdJob;
			});
		} finally {
			await session.endSession();
		}

		if (!job) {
			return NextResponse.json(
				{ success: false, message: "Failed to create live pool job" },
				{ status: 500 },
			);
		}

		// Broadcast to Pusher
		try {
			await pusherServer.trigger("private-live-pool", "job.available", {
				jobId: job._id,
				amount: job.amount,
				expiresAt: job.expiresAt,
				bankName: bank.bankName,
			});
		} catch (pusherErr) {
			console.error("Pusher broadcast failed:", pusherErr);
			// We don't fail the API request if pusher fails, but good to log
		}

		return NextResponse.json({
			success: true,
			message: "Live pool job created and broadcasted",
			data: job,
		});
	} catch (error) {
		console.error("[POST /api/admin/live-pool]", error);
		return NextResponse.json(
			{ success: false, message: "Server error" },
			{ status: 500 },
		);
	}
}
