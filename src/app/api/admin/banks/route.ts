import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { BankAccount } from "@/models/BankAccount";
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
		const status = searchParams.get("status") || "all";

		const query: Record<string, any> = {};

		if (status !== "all") {
			query.status = status;
		}

		if (search) {
			const escaped = escapeRegex(search);
			// Find users matching search by phone to get their ObjectIds
			const users = await User.find({ phone: { $regex: escaped, $options: "i" } })
				.select("_id")
				.lean();
			const userIds = users.map((u: any) => u._id);

			// Search either by user phone or account number
			query.$or = [
				{ userId: { $in: userIds } },
				{ accountNumber: { $regex: escaped, $options: "i" } },
			];
		}

		const skip = (page - 1) * limit;

		// We will sort pending banks to show at the top, then by created Date
		// Mongoose doesn't support complex sort orders based on enum directly without aggregation,
		// but since we usually view specific statuses, simple sort is fine. 
		// If status is "all", we sort by createdAt -1. In UI we can ensure pending is handled.
		// Actually, sorting by `status: -1` is not perfect. Let's just sort by createdAt -1.

		const [banks, total] = await Promise.all([
			BankAccount.find(query)
				.populate({ path: "userId", select: "name phone", model: User })
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			BankAccount.countDocuments(query),
		]);

		return NextResponse.json({
			success: true,
			data: banks,
			pagination: {
				total,
				page,
				limit,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("[GET /api/admin/banks]", error);
		return NextResponse.json(
			{ success: false, message: "Server error" },
			{ status: 500 },
		);
	}
}
