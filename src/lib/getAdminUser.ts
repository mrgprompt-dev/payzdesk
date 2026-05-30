import { NextRequest } from "next/server";
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/adminAuth";
import { connectDB } from "@/lib/db";
import { Admin } from "@/models/Admin";
import type { AdminTokenPayload } from "@/types";

/**
 * Extract the authenticated admin payload from an API request.
 * Verifies the JWT AND confirms the admin is still active in the DB.
 * Returns null if the token is missing, invalid, expired, or admin is disabled.
 * Use this in every protected /api/admin/* route handler.
 */
export async function getAdminUser(
	req: NextRequest,
): Promise<AdminTokenPayload | null> {
	try {
		const token = req.cookies.get(ADMIN_COOKIE)?.value;
		if (!token) return null;

		const payload = verifyAdminToken(token);

		// Verify admin is still active in DB
		await connectDB();
		const admin = await Admin.findById(payload.adminId).select("isActive").lean();
		if (!admin || !admin.isActive) return null;

		return payload;
	} catch {
		return null;
	}
}
