import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { LivePoolJob } from "@/models/LivePoolJob";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import { getAuthUser } from "@/lib/getAuthUser";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = getAuthUser(req);
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { jobId } = await req.json();
    if (!jobId) return NextResponse.json({ success: false, message: "Missing jobId" }, { status: 400 });

    const job = await LivePoolJob.findById(jobId);
    if (!job) {
      return NextResponse.json({ success: false, message: "Job not found" }, { status: 404 });
    }

    if (job.status !== "available") {
      return NextResponse.json({ success: false, message: "Job is no longer available" }, { status: 400 });
    }

    if (new Date(job.expiresAt) < new Date()) {
      job.status = "expired";
      await job.save();

      const transaction = await Transaction.findOneAndUpdate(
        { _id: job.transactionId, status: "pending" },
        {
          $set: {
            status: "cancelled",
            notes: "Live pool job expired",
          },
        },
        { new: true }
      );

      if (transaction?.userId && transaction.amount > 0) {
        await User.findByIdAndUpdate(transaction.userId, {
          $inc: { blockedDeposit: -transaction.amount },
        });
      }
      
      if (process.env.PUSHER_APP_ID && process.env.PUSHER_APP_ID !== 'not_set') {
        try {
          await pusherServer.trigger('private-live-pool', 'job.expired', { jobId });
        } catch (pusherErr) {
          console.error("Pusher broadcast failed:", pusherErr);
        }
      }
      
      return NextResponse.json({ success: false, message: "Job has expired" }, { status: 400 });
    }

    // Attempt to lock it
    // Use atomic findOneAndUpdate to prevent race conditions if multiple agents click grab simultaneously
    const grabbedJob = await LivePoolJob.findOneAndUpdate(
      { _id: jobId, status: "available" },
      { 
        $set: { 
          status: "grabbed", 
          grabbedBy: user.userId 
        } 
      },
      { new: true }
    );

    if (!grabbedJob) {
      return NextResponse.json({ success: false, message: "Job was just grabbed by someone else" }, { status: 409 });
    }

    // Broadcast grab event to remove it from other agents' screens
    if (process.env.PUSHER_APP_ID && process.env.PUSHER_APP_ID !== 'not_set') {
      try {
        await pusherServer.trigger('private-live-pool', 'job.grabbed', { jobId, grabbedBy: user.userId });
      } catch (pusherErr) {
        console.error("Pusher broadcast failed:", pusherErr);
      }
    }

    return NextResponse.json({ success: true, message: "Job grabbed successfully!", data: grabbedJob });

  } catch (error: unknown) {
    console.error("Live Pool Grab error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
