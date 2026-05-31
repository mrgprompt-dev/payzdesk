import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAdminUser } from "@/lib/getAdminUser";
import FAQItem from "@/models/FAQItem";

export async function GET(req: NextRequest) {
	try {
		const payload = await getAdminUser(req);
		if (!payload) {
			return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
		}

		await connectDB();
		const items = await FAQItem.find().sort({ order: 1, createdAt: 1 }).lean();
		return NextResponse.json({ success: true, data: items });
	} catch (error) {
		console.error("[GET /api/admin/settings/faq]", error);
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
		const question = String(body.question || "").trim();
		const answer = String(body.answer || "").trim();
		const order = Number(body.order || 0);

		if (!question || !answer || !Number.isFinite(order)) {
			return NextResponse.json({ success: false, message: "Invalid FAQ item" }, { status: 400 });
		}

		const item = await FAQItem.create({ question, answer, order });
		return NextResponse.json({ success: true, data: item }, { status: 201 });
	} catch (error) {
		console.error("[POST /api/admin/settings/faq]", error);
		return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
	}
}
