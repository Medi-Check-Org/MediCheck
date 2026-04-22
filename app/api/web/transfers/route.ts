import { NextRequest, NextResponse } from "next/server";
import { listTransfers } from "@/core/usecases/transfers";
import { getActorFromClerk } from "@/core/auth/clerk";

type DirectionParam = "all" | "outgoing" | "incoming";

/** Single transfer in the GET response (frontend-friendly shape) */
export interface FormattedTransfer {
  id: string;
  batchId: string;
  medicationName: string;
  quantity: number;
  expiryDate: Date | null;
  fromOrg: { id: string; name: string; type: string };
  toOrg: { id: string; name: string; type: string };
  status: string;
  createdAt: Date;
  updatedAt: Date;
  notes: string | null;
  direction: "INCOMING" | "OUTGOING";
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


    const formattedTransfers: FormattedTransfer[] = result.transfers.map(
      (transfer) => ({
        id: transfer.id,
        batchId: transfer.batch.batchId,
        medicationName: transfer.batch.drugName,
        quantity: transfer.batch.batchSize,
        expiryDate: transfer.batch.product?.expiryDate ?? null,
        fromOrg: {
          id: transfer.fromOrg.id,
          name: transfer.fromOrg.companyName,
          type: transfer.fromOrg.organizationType,
        },
        toOrg: {
          id: transfer.toOrg.id,
          name: transfer.toOrg.companyName,
          type: transfer.toOrg.organizationType,
        },
        status: transfer.status,
        createdAt: transfer.createdAt,
        updatedAt: transfer.updatedAt,
        notes: transfer.notes,
        direction: transfer.fromOrg.id === orgId ? "OUTGOING" : "INCOMING",
      }),
    );

    console.log(JSON.stringify(formattedTransfers, null, 2));

    const response: TransfersListResponse = { transfers: formattedTransfers };

    return NextResponse.json(response);

  }
  catch (error: unknown) {
    console.error("Error fetching transfers:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch transfers";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
