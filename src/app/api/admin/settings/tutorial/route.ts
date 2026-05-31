import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAdminUser } from "@/lib/getAdminUser";
import TutorialStep from "@/models/TutorialStep";

export async function GET(req: NextRequest) {
	try {
		const payload = await getAdminUser(req);
		if (!payload) {
			return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
		}

		await connectDB();
		const steps = await TutorialStep.find().sort({ order: 1, createdAt: 1 }).lean();
		return NextResponse.json({ success: true, data: steps });
	} catch (error) {
		console.error("[GET /api/admin/settings/tutorial]", error);
		return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const payload = await getAdminUser(req);
		if (!payload) {
			return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
		}

		await connectDB();
		const body = await req.json();
		const title = String(body.title || "").trim();
		const stepBody = String(body.body || "").trim();
		const order = Number(body.order || 0);

		if (!title || !stepBody || !Number.isFinite(order)) {
			return NextResponse.json({ success: false, message: "Invalid tutorial step" }, { status: 400 });
		}

		const step = await TutorialStep.create({ title, body: stepBody, order });
		return NextResponse.json({ success: true, data: step }, { status: 201 });
	} catch (error) {
		console.error("[POST /api/admin/settings/tutorial]", error);
		return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
	}
}
