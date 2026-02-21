import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "No authenticated user" },
        { status: 401 },
      );
    }

    await (await clerkClient()).users.deleteUser(userId);

    return NextResponse.json({ success: true });
  }
  catch (error) {
    console.error("Cleanup error:", error);

    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
