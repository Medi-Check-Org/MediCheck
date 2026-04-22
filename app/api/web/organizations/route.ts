// /app/api/organizations/route.ts
import { NextResponse } from "next/server";
import { listOrganizations } from "@/core/usecases/organizations";
import { getActorFromClerk } from "@/core/auth/clerk";

export const runtime = "nodejs";

/**
 * GET /api/organizations
 * Returns a list of all organizations
 */
export async function GET() {
  try {
    // Get authenticated actor
    const actor = await getActorFromClerk();
    if (!actor) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Call use case
    const result = await listOrganizations({}, actor);

    return NextResponse.json(result.organizations, { status: 200 });
  } catch (error: unknown) {
    console.error("Error fetching organizations:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch organizations";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
