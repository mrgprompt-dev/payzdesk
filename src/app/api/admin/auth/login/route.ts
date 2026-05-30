import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Admin } from "@/models/Admin";
import {
	signAdminToken,
	ADMIN_COOKIE,
	adminCookieOptions,
} from "@/lib/adminAuth";
import {
	checkAdminLoginRateLimit,
	resetAdminLoginRateLimit,
} from "@/lib/redis";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { phone, password } = body;

		if (!phone || !password) {
			return NextResponse.json(
				{ success: false, message: "Phone and password are required" },
				{ status: 400 },
			);
		}

		const trimmedPhone = phone.trim();

		// ── Rate limit check ──────────────────────────────────────────────
		const rateCheck = await checkAdminLoginRateLimit(trimmedPhone);
		if (!rateCheck.allowed) {
			return NextResponse.json(
				{
					success: false,
					message: `Too many login attempts. Try again in ${Math.ceil(rateCheck.retryAfterSeconds / 60)} minutes.`,
				},
				{ status: 429 },
			);
		}

		await connectDB();

		const admin = await Admin.findOne({ phone: trimmedPhone });
		if (!admin) {
			return NextResponse.json(
				{ success: false, message: "Invalid credentials" },
				{ status: 401 },
			);
		}

		if (!admin.isActive) {
			return NextResponse.json(
				{ success: false, message: "This account has been disabled" },
				{ status: 403 },
			);
		}

		const isValid = await admin.comparePassword(password);
		if (!isValid) {
			return NextResponse.json(
				{ success: false, message: "Invalid credentials" },
				{ status: 401 },
			);
		}

		// Successful login — reset rate limit counter
		await resetAdminLoginRateLimit(trimmedPhone);

		const token = signAdminToken({
			adminId: admin._id.toString(),
			phone: admin.phone,
		});

		const res = NextResponse.json({
			success: true,
			message: "Login successful",
			data: { admin: admin.toJSON() },
		});

		res.cookies.set(ADMIN_COOKIE, token, adminCookieOptions);
		return res;
	} catch (error) {
		console.error("[POST /api/admin/auth/login]", error);
		return NextResponse.json(
			{ success: false, message: "Server error" },
			{ status: 500 },
		);
	}
}

