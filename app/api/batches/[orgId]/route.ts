// app/api/batches/[orgId]/route.ts
import { NextResponse } from "next/server";
import { listBatches } from "@/app/usecases/batches";
import { getActorFromClerk } from "@/app/auth/clerk";

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    // Get authenticated actor
    const actor = await getActorFromClerk();
    if (!actor) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { orgId } = await params;

    // Call use case
    const result = await listBatches(
      {
        organizationId: orgId,
      },
      actor
    );

    return NextResponse.json(result.batches, { status: 200 });
  }
  catch (error: unknown) {
    console.error("Error fetching batches:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch batches";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
