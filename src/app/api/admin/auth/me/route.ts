import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Admin } from "@/models/Admin";
import { getAdminUser } from "@/lib/getAdminUser";

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
		const admin = await Admin.findById(payload.adminId);

		if (!admin || !admin.isActive) {
			return NextResponse.json(
				{ success: false, message: "Admin not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({
			success: true,
			message: "OK",
			data: { admin: admin.toJSON() },
		});
	} catch (error) {
		console.error("[GET /api/admin/auth/me]", error);
		return NextResponse.json(
			{ success: false, message: "Server error" },
			{ status: 500 },
		);
	}
}
