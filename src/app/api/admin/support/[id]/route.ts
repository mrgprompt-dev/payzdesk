import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SupportTicket from "@/models/SupportTicket";
import { User } from "@/models/User";
import { getAdminUser } from "@/lib/getAdminUser";

export async function GET(
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

		const ticket = await SupportTicket.findById(id)
			.populate({ path: "userId", select: "name phone email", model: User })
			.lean();

		if (!ticket) {
			return NextResponse.json(
				{ success: false, message: "Ticket not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({
			success: true,
			data: ticket,
		});
	} catch (error) {
		console.error("[GET /api/admin/support/[id]]", error);
		return NextResponse.json(
			{ success: false, message: "Server error" },
			{ status: 500 },
		);
	}
}

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

		const { action, message } = body;

		const ticket = await SupportTicket.findById(id);
		if (!ticket) {
			return NextResponse.json(
				{ success: false, message: "Ticket not found" },
				{ status: 404 },
			);
		}

		if (action === "reply") {
			if (ticket.status === "closed") {
				return NextResponse.json(
					{ success: false, message: "Cannot reply to a closed ticket" },
					{ status: 400 },
				);
			}

			if (!message || message.trim() === "") {
				return NextResponse.json(
					{ success: false, message: "Message is required" },
					{ status: 400 },
				);
			}

			ticket.replies.push({
				sender: "admin",
				message: message.trim(),
				createdAt: new Date(),
			});

			await ticket.save();

			return NextResponse.json({
				success: true,
				message: "Reply added successfully",
				data: ticket,
			});
		} else if (action === "close") {
			ticket.status = "closed";
			await ticket.save();

			return NextResponse.json({
				success: true,
				message: "Ticket closed successfully",
				data: ticket,
			});
		} else if (action === "reopen") {
			ticket.status = "open";
			await ticket.save();

			return NextResponse.json({
				success: true,
				message: "Ticket reopened successfully",
				data: ticket,
			});
		} else {
			return NextResponse.json(
				{ success: false, message: "Invalid action" },
				{ status: 400 },
			);
		}
	} catch (error) {
		console.error("[PATCH /api/admin/support/[id]]", error);
		return NextResponse.json(
			{ success: false, message: "Server error" },
			{ status: 500 },
		);
	}
}
