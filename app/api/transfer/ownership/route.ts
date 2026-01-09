// /app/api/transfer/ownership/route.ts
import { NextResponse } from "next/server";
import { initiateTransfer, listTransfers } from "@/core/usecases/transfers";
import { getActorFromClerk } from "@/core/auth/clerk";

export const runtime = "nodejs";

// POST - Create new transfer ownership record
export async function POST(req: Request) {
  try {
    // Get authenticated actor
    const actor = await getActorFromClerk();
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { batchId, fromOrgId, toOrgId, notes } = body;

    // Call use case
    const result = await initiateTransfer(
      {
        batchId,
        fromOrgId,
        toOrgId,
        notes,
      },
      actor
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("Transfer Creation Error:", error);
    const message = error instanceof Error ? error.message : "Failed to create transfer ownership";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}


// GET - Get all transfers where organization is sender OR receiver
export async function GET(req: Request) {
  try {
    // Get authenticated actor
    const actor = await getActorFromClerk();
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");
    const status = searchParams.get("status");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId parameter is required" },
        { status: 400 }
      );
    }

    // Call use case
    const result = await listTransfers(
      {
        organizationId,
        status: status || undefined,
        direction: "ALL",
      },
      actor
    );

    return NextResponse.json(
      {
        transfers: result.transfers,
        total: result.total,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Get Transfers Error:", error);
    const message = error instanceof Error ? error.message : "Failed to retrieve transfers";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
