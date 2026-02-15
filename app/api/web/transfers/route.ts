import { NextRequest, NextResponse } from "next/server";
import { listTransfers } from "@/core/usecases/transfers";
import { getActorFromClerk } from "@/core/auth/clerk";

type directionProps = "all" | "outgoing" | "incoming";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated actor
    const actor = await getActorFromClerk();
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");
    const direction: directionProps = searchParams.get("direction") as directionProps; // outgoing, incoming, all

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Map direction to use case input format
    let directionFilter: "OUTGOING" | "INCOMING" | "ALL" = "ALL";
    if (direction === "outgoing") directionFilter = "OUTGOING";
    else if (direction === "incoming") directionFilter = "INCOMING";

    // Call use case
    const result = await listTransfers(
      {
        organizationId: orgId,
        direction: directionFilter,
      },
      actor
    );

    // Transform the data for easier frontend consumption (keep compatible format)
    const formattedTransfers = result.transfers.map((transfer) => ({
      id: transfer.id,
      batchId: transfer.batch.batchId,
      medicationName: transfer.batch.drugName,
      quantity: transfer.batch.batchSize,
      expiryDate: transfer.batch.product.expiryDate,
      fromOrganization: {
        name: transfer.fromOrg.companyName,
        type: transfer.fromOrg.organizationType,
      },
      toOrganization: {
        name: transfer.toOrg.companyName,
        type: transfer.toOrg.organizationType,
      },
      status: transfer.status,
      createdAt: transfer.createdAt,
      updatedAt: transfer.updatedAt,
      notes: transfer.notes,
    }));

    return NextResponse.json({ transfers: formattedTransfers });
  } catch (error: unknown) {
    console.error("Error fetching transfers:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch transfers";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
