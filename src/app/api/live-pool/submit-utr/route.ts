import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { LivePoolJob } from "@/models/LivePoolJob";
import { Transaction } from "@/models/Transaction";
import { getAuthUser } from "@/lib/getAuthUser";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = getAuthUser(req);
    if (!user)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );

    const { jobId, utrNumber } = await req.json();

    if (!jobId || !utrNumber) {
      return NextResponse.json(
        { success: false, message: "Missing jobId or utrNumber" },
        { status: 400 }
      );
    }

    // Validate UTR format — alphanumeric, 1-50 chars
    const utrTrimmed = utrNumber.trim();
    if (!/^[A-Za-z0-9]+$/.test(utrTrimmed) || utrTrimmed.length > 50) {
      return NextResponse.json(
        { success: false, message: "Invalid UTR number format" },
        { status: 400 }
      );
    }

    // Find the job and validate ownership
    const job = await LivePoolJob.findById(jobId);
    if (!job) {
      return NextResponse.json(
        { success: false, message: "Job not found" },
        { status: 404 }
      );
    }

    if (job.grabbedBy?.toString() !== user.userId) {
      return NextResponse.json(
        { success: false, message: "This job does not belong to you" },
        { status: 403 }
      );
    }

    if (job.status !== "grabbed") {
      return NextResponse.json(
        {
          success: false,
          message:
            job.status === "completed"
              ? "This job has already been completed"
              : "This job is no longer active",
        },
        { status: 400 }
      );
    }

    // Update the LivePoolJob to completed
    const completedJob = await LivePoolJob.findOneAndUpdate(
      { _id: jobId, status: "grabbed", grabbedBy: user.userId },
      {
        $set: {
          status: "completed",
          utrNumber: utrTrimmed,
          completedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!completedJob) {
      return NextResponse.json(
        { success: false, message: "Failed to complete job — it may have changed state" },
        { status: 409 }
      );
    }

    // Update the linked transaction with UTR and set to processing
    await Transaction.findByIdAndUpdate(completedJob.transactionId, {
      $set: {
        utrNumber: utrTrimmed,
        status: "processing",
        notes: `UTR submitted by agent: ${utrTrimmed}`,
      },
    });

    // Broadcast completion event
    if (
      process.env.PUSHER_APP_ID &&
      process.env.PUSHER_APP_ID !== "not_set"
    ) {
      try {
        await pusherServer.trigger("private-live-pool", "job.completed", {
          jobId,
          completedBy: user.userId,
          utrNumber: utrTrimmed,
        });
      } catch (pusherErr) {
        console.error("Pusher broadcast failed:", pusherErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "UTR submitted successfully! Job marked as completed.",
      data: completedJob,
    });
  } catch (error: unknown) {
    console.error("Live Pool Submit UTR error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
