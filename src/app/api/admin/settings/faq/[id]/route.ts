import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getAdminUser } from "@/lib/getAdminUser";
import FAQItem from "@/models/FAQItem";

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const payload = await getAdminUser(req);
		if (!payload) {
			return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
		}

		await connectDB();
		const { id } = await params;
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return NextResponse.json({ success: false, message: "Invalid FAQ item" }, { status: 400 });
		}

		const body = await req.json();
		const update: Record<string, string | number> = {};
		if (body.question !== undefined) update.question = String(body.question).trim();
		if (body.answer !== undefined) update.answer = String(body.answer).trim();
		if (body.order !== undefined) {
			const order = Number(body.order);
			if (!Number.isFinite(order)) {
				return NextResponse.json({ success: false, message: "Invalid order" }, { status: 400 });
			}
			update.order = order;
		}

		const item = await FAQItem.findByIdAndUpdate(id, update, {
			new: true,
			runValidators: true,
		});
		if (!item) {
			return NextResponse.json({ success: false, message: "FAQ item not found" }, { status: 404 });
		}

		return NextResponse.json({ success: true, data: item });
	} catch (error) {
		console.error("[PATCH /api/admin/settings/faq/[id]]", error);
		return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
	}
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const payload = await getAdminUser(req);
		if (!payload) {
			return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
		}

		await connectDB();
		const { id } = await params;
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return NextResponse.json({ success: false, message: "Invalid FAQ item" }, { status: 400 });
		}

		const item = await FAQItem.findByIdAndDelete(id);
		if (!item) {
			return NextResponse.json({ success: false, message: "FAQ item not found" }, { status: 404 });
		}

		return NextResponse.json({ success: true, message: "FAQ item deleted" });
	} catch (error) {
		console.error("[DELETE /api/admin/settings/faq/[id]]", error);
		return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
	}
}
