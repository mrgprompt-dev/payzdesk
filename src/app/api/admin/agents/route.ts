import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
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

		if (search) {
			const escaped = escapeRegex(search);
			query.$or = [
				{ phone: { $regex: escaped, $options: "i" } },
				{ name: { $regex: escaped, $options: "i" } },
			];
		}

		if (status === "active") {
			query.isActive = true;
		} else if (status === "inactive") {
			query.isActive = false;
		}

		const skip = (page - 1) * limit;

		const [agents, total] = await Promise.all([
			User.find(query)
				.select("-passwordHash")
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			User.countDocuments(query),
		]);

		return NextResponse.json({
			success: true,
			data: agents,
			pagination: {
				total,
				page,
				limit,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("[GET /api/admin/agents]", error);
		return NextResponse.json(
			{ success: false, message: "Server error" },
			{ status: 500 },
		);
	}
}
