import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Adjustment from "@/models/Adjustment";
import { User } from "@/models/User";
import { getAdminUser } from "@/lib/getAdminUser";

function escapeRegex(str: string) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

		const { searchParams } = new URL(req.url);
		const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
		const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
		const search = searchParams.get("search")?.trim() || "";
		const type = searchParams.get("type") || "all";
		const agentId = searchParams.get("agentId") || "";
		const from = searchParams.get("from") || "";
		const to = searchParams.get("to") || "";
		
		const query: Record<string, any> = {};

		if (type !== "all") {
			if (type !== "credit" && type !== "debit") {
				return NextResponse.json(
					{ success: false, message: "Invalid adjustment type" },
					{ status: 400 },
				);
			}
			query.type = type;
		}

		if (agentId) {
			if (!mongoose.Types.ObjectId.isValid(agentId)) {
				return NextResponse.json(
					{ success: false, message: "Invalid agent" },
					{ status: 400 },
				);
			}
			query.userId = new mongoose.Types.ObjectId(agentId);
		}

		const createdAt: Record<string, Date> = {};
		if (from) createdAt.$gte = new Date(from);
		if (to) {
			const endDate = new Date(to);
			endDate.setHours(23, 59, 59, 999);
			createdAt.$lte = endDate;
		}
		if (Object.keys(createdAt).length > 0) query.createdAt = createdAt;

		if (search) {
			const escaped = escapeRegex(search);
			const users = await User.find({
				$or: [
					{ phone: { $regex: escaped, $options: "i" } },
					{ name: { $regex: escaped, $options: "i" } },
				],
			}).select("_id").lean();
			const userIds = users.map((u: any) => u._id);
			
			// Can search by agent name/phone OR reference ID
			const searchOr = [
				{ userId: { $in: userIds } },
				{ referenceId: { $regex: escaped, $options: "i" } },
			];
			query.$and = [...(query.$and || []), { $or: searchOr }];
		}

		const skip = (page - 1) * limit;

		const [adjustments, total] = await Promise.all([
			Adjustment.find(query)
				.populate({ path: "userId", select: "name phone netBalance commissionEarned", model: User })
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			Adjustment.countDocuments(query),
		]);

		return NextResponse.json({
			success: true,
			data: adjustments,
			pagination: {
				total,
				page,
				limit,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("[GET /api/admin/adjustments]", error);
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
		const { userId, type, amount, targetWallet, description, referenceId } = body;

		if (!userId || !type || !amount || !targetWallet || !description) {
			return NextResponse.json(
				{ success: false, message: "Missing required fields" },
				{ status: 400 },
			);
		}

		if (type !== "credit" && type !== "debit") {
			return NextResponse.json(
				{ success: false, message: "Invalid type. Must be credit or debit." },
				{ status: 400 },
			);
		}

		if (targetWallet !== "netBalance" && targetWallet !== "commissionEarned") {
			return NextResponse.json(
				{ success: false, message: "Invalid target wallet." },
				{ status: 400 },
			);
		}

		const numAmount = Number(amount);
		if (isNaN(numAmount) || numAmount <= 0) {
			return NextResponse.json(
				{ success: false, message: "Invalid amount." },
				{ status: 400 },
			);
		}

		const session = await mongoose.startSession();
		let newAdjustment: any[] = [];

		try {
			await session.withTransaction(async () => {
				const user = await User.findById(userId).session(session);
				if (!user) {
					throw new Error("USER_NOT_FOUND");
				}

				// Check negative balance for debits
				if (type === "debit") {
					const currentBalance = user[targetWallet as keyof typeof user] as number || 0;
					if (currentBalance < numAmount) {
						throw new Error("INSUFFICIENT_BALANCE");
					}
				}

				// Apply balance update
				const incAmount = type === "credit" ? numAmount : -numAmount;
				await User.findByIdAndUpdate(
					userId,
					{ $inc: { [targetWallet]: incAmount } },
					{ session }
				);

				// Create adjustment record
				newAdjustment = await Adjustment.create(
					[
						{
							userId,
							type,
							amount: numAmount,
							targetWallet,
							description,
							referenceId,
						},
					],
					{ session }
				);
			});
		} finally {
			await session.endSession();
		}

		if (!newAdjustment || newAdjustment.length === 0) {
			return NextResponse.json(
				{ success: false, message: "Failed to create adjustment" },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			success: true,
			message: "Adjustment applied successfully",
			data: newAdjustment[0],
		});
	} catch (error: any) {
		if (error?.message === "USER_NOT_FOUND") {
			return NextResponse.json(
				{ success: false, message: "User not found" },
				{ status: 404 },
			);
		}
		if (error?.message === "INSUFFICIENT_BALANCE") {
			return NextResponse.json(
				{ success: false, message: "Insufficient balance for debit adjustment" },
				{ status: 400 },
			);
		}
		console.error("[POST /api/admin/adjustments]", error);
		return NextResponse.json(
			{ success: false, message: "Server error" },
			{ status: 500 },
		);
	}
}
