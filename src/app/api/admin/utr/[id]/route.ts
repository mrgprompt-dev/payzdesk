import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { UTR } from "@/models/UTR";
import { getAdminUser } from "@/lib/getAdminUser";

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const payload = await getAdminUser(req);
		if (!payload) {
			return NextResponse.json(
				{ success: false, message: "Not authenticated" },
				{ status: 401 },
			);
		}

		await connectDB();
		const { id } = await params;
		const body = await req.json();

		const { action, note } = body; // action = "verify" or "reject"

		if (action !== "verify" && action !== "reject") {
			return NextResponse.json(
				{ success: false, message: "Invalid action" },
				{ status: 400 },
			);
		}

		const newStatus = action === "verify" ? "verified" : "rejected";

		const utr = await UTR.findOneAndUpdate(
			{ _id: id, status: "pending" },
			{
				$set: {
					status: newStatus,
					...(note ? { notes: note } : {}),
				},
			},
			{ new: true }
		);

		if (!utr) {
			return NextResponse.json(
				{ success: false, message: "UTR not found or already processed" },
				{ status: 404 },
			);
		}

		return NextResponse.json({
			success: true,
			message: `UTR ${newStatus} successfully`,
			data: utr,
		});
	} catch (error) {
		console.error("[PATCH /api/admin/utr/[id]]", error);
		return NextResponse.json(
			{ success: false, message: "Server error" },
			{ status: 500 },
		);
	}
}
