import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const socketId = String(formData.get("socket_id") || "");
    const channelName = String(formData.get("channel_name") || "");

    if (!socketId || channelName !== "private-live-pool") {
      return NextResponse.json(
        { success: false, message: "Invalid channel authorization request" },
        { status: 400 }
      );
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channelName);
    return NextResponse.json(authResponse);
  } catch (error: unknown) {
    console.error("Pusher auth error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
