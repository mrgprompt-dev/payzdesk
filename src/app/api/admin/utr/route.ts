import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { UTR } from "@/models/UTR";
import { User } from "@/models/User";
import { BankAccount } from "@/models/BankAccount";
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
			// Find users matching search by phone or name to get their ObjectIds
			const users = await User.find({
				$or: [
					{ phone: { $regex: escaped, $options: "i" } },
					{ name: { $regex: escaped, $options: "i" } },
				],
			})
				.select("_id")
				.lean();
			const userIds = users.map((u: any) => u._id);

			// Search either by user phone/name or UTR number
			query.$or = [
				{ userId: { $in: userIds } },
				{ utrNumber: { $regex: escaped, $options: "i" } },
			];
		}

		const skip = (page - 1) * limit;

		const [utrs, total] = await Promise.all([
			UTR.find(query)
				.populate({ path: "userId", select: "name phone", model: User })
				.populate({ path: "bankId", select: "bankName accountNumber ifscCode", model: BankAccount })
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			UTR.countDocuments(query),
		]);

		return NextResponse.json({
			success: true,
			data: utrs,
			pagination: {
				total,
				page,
				limit,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("[GET /api/admin/utr]", error);
		return NextResponse.json(
			{ success: false, message: "Server error" },
			{ status: 500 },
		);
	}
}
