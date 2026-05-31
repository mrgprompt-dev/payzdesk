import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getAdminUser } from "@/lib/getAdminUser";
import TutorialStep from "@/models/TutorialStep";

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
			return NextResponse.json({ success: false, message: "Invalid tutorial step" }, { status: 400 });
		}

		const body = await req.json();
		const update: Record<string, string | number> = {};
		if (body.title !== undefined) update.title = String(body.title).trim();
		if (body.body !== undefined) update.body = String(body.body).trim();
		if (body.order !== undefined) {
			const order = Number(body.order);
			if (!Number.isFinite(order)) {
				return NextResponse.json({ success: false, message: "Invalid order" }, { status: 400 });
			}
			update.order = order;
		}

		const step = await TutorialStep.findByIdAndUpdate(id, update, {
			new: true,
			runValidators: true,
		});
		if (!step) {
			return NextResponse.json({ success: false, message: "Tutorial step not found" }, { status: 404 });
		}

		return NextResponse.json({ success: true, data: step });
	} catch (error) {
		console.error("[PATCH /api/admin/settings/tutorial/[id]]", error);
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
			return NextResponse.json({ success: false, message: "Invalid tutorial step" }, { status: 400 });
		}

		const step = await TutorialStep.findByIdAndDelete(id);
		if (!step) {
			return NextResponse.json({ success: false, message: "Tutorial step not found" }, { status: 404 });
		}

		return NextResponse.json({ success: true, message: "Tutorial step deleted" });
	} catch (error) {
		console.error("[DELETE /api/admin/settings/tutorial/[id]]", error);
		return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
	}
}
