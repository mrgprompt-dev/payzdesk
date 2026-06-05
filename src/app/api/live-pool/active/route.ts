import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { LivePoolJob } from "@/models/LivePoolJob";
import "@/models/BankAccount";
import "@/models/Transaction";
import { getAuthUser } from "@/lib/getAuthUser";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = getAuthUser(req);
    if (!user)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );

    // Find all jobs grabbed by this agent that are still in "grabbed" status
    const jobs = await LivePoolJob.find({
      grabbedBy: user.userId,
      status: "grabbed",
    })
      .populate("bankId")
      .populate("transactionId")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: jobs });
  } catch (error: unknown) {
    console.error("Live Pool Active GET error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
