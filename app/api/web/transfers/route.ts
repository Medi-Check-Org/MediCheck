import { NextRequest, NextResponse } from "next/server";
import { listTransfers } from "@/core/usecases/transfers";
import { getActorFromClerk } from "@/core/auth/clerk";

type DirectionParam = "all" | "outgoing" | "incoming";

/** Single transfer in the GET response (frontend-friendly shape) */
interface FormattedTransfer {
  id: string;
  batchId: string;
  medicationName: string;
  quantity: number;
  expiryDate: Date | null;
  fromOrganization: { name: string; type: string };
  toOrganization: { name: string; type: string };
  status: string;
  createdAt: Date;
  updatedAt: Date;
  notes: string | null;
}

/** Response shape for GET /api/web/transfers */
interface TransfersListResponse {
  transfers: FormattedTransfer[];
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated actor
    const actor = await getActorFromClerk();
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");
    const direction = searchParams.get("direction") as DirectionParam | null;

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

    const result = await listTransfers(
      {
        organizationId: orgId,
        direction: directionFilter,
      },
      actor
    );

    const formattedTransfers: FormattedTransfer[] = result.transfers.map((transfer) => ({
      id: transfer.id,
      batchId: transfer.batch.batchId,
      medicationName: transfer.batch.drugName,
      quantity: transfer.batch.batchSize,
<<<<<<< HEAD
      expiryDate: transfer.batch.product.expiryDate,
=======
      expiryDate: transfer.batch.product?.expiryDate ?? null,
>>>>>>> 841d174e04b6c8afbb0c45238d9b751ea33fc7d9
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

    const response: TransfersListResponse = { transfers: formattedTransfers };
    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Error fetching transfers:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch transfers";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
