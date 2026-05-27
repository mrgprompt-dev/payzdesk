import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { LivePoolJob } from "@/models/LivePoolJob";
import { getAuthUser } from "@/lib/getAuthUser";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = getAuthUser(req);
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    // Find all available jobs that have not expired
    const jobs = await LivePoolJob.find({
      status: "available",
      expiresAt: { $gt: new Date() },
    })
      .populate("bankId")
      .populate("transactionId")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: jobs });
  } catch (error: unknown) {
    console.error("Live Pool GET error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
