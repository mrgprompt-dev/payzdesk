import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { BankAccount } from "@/models/BankAccount";
import { User } from "@/models/User";
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

		const { action } = body; // "approve" | "reject" | "activate" | "deactivate"

		let newStatus = "";
		switch (action) {
			case "approve":
			case "activate":
				newStatus = "active";
				break;
			case "deactivate":
				newStatus = "inactive";
				break;
			case "reject":
				newStatus = "rejected";
				break;
			default:
				return NextResponse.json(
					{ success: false, message: "Invalid action" },
					{ status: 400 },
				);
		}

		const bank = await BankAccount.findById(id);
		if (!bank) {
			return NextResponse.json(
				{ success: false, message: "Bank account not found" },
				{ status: 404 },
			);
		}

		bank.status = newStatus;
		if (action === "approve") {
			bank.verified = true;
		}

		await bank.save();

		// Recompute user bank counters (same pattern as user-side verify-otp)
		const allBanks = await BankAccount.find({ userId: bank.userId });
		const activeBanks = allBanks.filter((b) => b.status === "active").length;
		await User.findByIdAndUpdate(bank.userId, {
			totalBanks: allBanks.length,
			activeBanks,
		});

		return NextResponse.json({
			success: true,
			message: `Bank account ${action}d successfully`,
			data: bank,
		});
	} catch (error) {
		console.error("[PATCH /api/admin/banks/[id]]", error);
		return NextResponse.json(
			{ success: false, message: "Server error" },
			{ status: 500 },
		);
	}
}

