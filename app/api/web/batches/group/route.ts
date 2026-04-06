import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { createBatchRegistry, registerUnitOnBatch } from "@/lib/hedera";
import { nanoid } from "nanoid";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    
    const { userId } = await auth();
    
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    
    const { drugName, selectedBatchIds, productId, orgId } = body;

    // 1. Fetch the candidate children
    const childBatches = await prisma.medicationBatch.findMany({
      where: {
        id: { in: selectedBatchIds },
        organizationId: orgId,
      },
    });

    // 2. Critical Safety Check: Ensure none of these batches already have a parent
    // If Batch B is already in Batch C, it cannot be put into Batch D.
    const alreadyNested = childBatches.filter((b) => b.parentBatchId !== null);
    
    if (alreadyNested.length > 0) {
      return NextResponse.json(
        {
          error: `Batch ${alreadyNested[0].batchId} is already assigned to a parent.`,
        },
        { status: 400 },
      );
    }

    // 3. Create the New Batch (The "Higher Level" Container)
    const newBatchId = `BATCH-${Date.now()}${nanoid(5)}`;
    
    const registryTopicId = (await createBatchRegistry(
      newBatchId,
      orgId,
      drugName,
    )) as { topicId: string };

    const parentBatch = await prisma.medicationBatch.create({
      data: {
        batchId: newBatchId,
        organizationId: orgId,
        drugName,
        batchSize: childBatches.length, // Number of items (batches ) inside
        productId,
        registryTopicId: registryTopicId.topicId,
      },
    });

    // 4. The "Link & Register" Loop
    await Promise.all(
      childBatches.map(async (child) => {
        // Register the child's ID on the parent's blockchain topic
        const seq = await registerUnitOnBatch(registryTopicId.topicId, {
          serialNumber: child.batchId,
          drugName: drugName,
          batchId: newBatchId,
        });

        // Update the child to point to this new parent
        return prisma.medicationBatch.update({
          where: { id: child.id },
          data: { parentBatchId: parentBatch.id },
        });
      }),
    );

    return NextResponse.json(
      { success: true, batchId: parentBatch.batchId },
      { status: 201 },
    );
  }
  catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}