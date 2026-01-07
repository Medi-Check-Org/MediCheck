// app/api/batches/route.ts
import { NextResponse } from "next/server";
import { createBatch } from "@/app/usecases/batches";
import { getActorFromClerk } from "@/app/auth/clerk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // Get authenticated actor
    const actor = await getActorFromClerk();
    if (!actor) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      organizationId,
      drugName,
      composition,
      batchSize,
      manufacturingDate,
      expiryDate,
      storageInstructions,
    } = body;

    // Call use case
    const result = await createBatch(
      {
        organizationId,
        drugName,
        composition,
        batchSize: parseInt(batchSize, 10),
        manufacturingDate,
        expiryDate,
        storageInstructions,
      },
      actor
    );

    // Return response
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating batch:", error);
    const message = error instanceof Error ? error.message : "Failed to create batch";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
