import jwt from "jsonwebtoken";
import type { AdminTokenPayload } from "@/types";

const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET as string;

if (!ADMIN_SECRET) {
	throw new Error("ADMIN_JWT_SECRET is not defined in environment variables");
}

// ─── Sign ─────────────────────────────────────────────────────────────────────

export function signAdminToken(payload: AdminTokenPayload): string {
	return jwt.sign(payload, ADMIN_SECRET, { expiresIn: "8h" });
}

// ─── Verify ───────────────────────────────────────────────────────────────────

export function verifyAdminToken(token: string): AdminTokenPayload {
	return jwt.verify(token, ADMIN_SECRET) as AdminTokenPayload;
}

// ─── Cookie ───────────────────────────────────────────────────────────────────

export const ADMIN_COOKIE = "adminToken";

export const adminCookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: "strict" as const,
	path: "/",
	maxAge: 8 * 60 * 60, // 8 hours
};
