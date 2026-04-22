import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { runInBatches } from "@/utils/helpers/batch";
import { DomainError } from "@/utils/types/errors";
import { createBatchRegistry } from "@/lib/hedera";
import {
  generateBatchQRPayload,
} from "@/lib/qrPayload";
import { ExternalServiceError } from "@/utils/types/errors";
import { MedicationUnit } from "@/lib/generated/prisma/client";
export const runtime = "nodejs";
import { logBatchEvent, registerUnitOnBatch } from "@/lib/hedera";
const UNIT_REG_CONCURRENCY = parseInt(process.env.UNIT_REG_CONCURRENCY || "10");
const QR_SECRET = process.env.QR_SECRET || "dev-secret";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";




export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const { drugName, unitStartRange, unitStopRange, productId, orgId } = body;

    // 1. Validation
    if (!unitStartRange || !unitStopRange || !orgId || !productId) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // 2. Fetch the existing units first to verify the range exists
    const existingUnits = await prisma.medicationUnit.findMany({
      where: {
        productId,
        orgId,
        batchId: null, // Critical: Only unbatched units
        mintedUnitId: {
          gte: unitStartRange,
          lte: unitStopRange,
        },
      },
      orderBy: { mintedUnitId: "asc" },
    });

    if (existingUnits.length === 0) {
      return NextResponse.json({ error: "No available units found in the specified range" }, { status: 400 });
    }

    // Corrected batch size calculation
    const calculatedBatchSize = existingUnits.length;

    // 3. Create Batch Identity & Hedera Registry
    const batchId = `BATCH-${Date.now()}${nanoid(5)}`;

    let registryTopicId: { topicId: string };
    try {
      registryTopicId = (await createBatchRegistry(
        batchId,
        organization.id,
        drugName,
      )) as { topicId: string };
    } catch (error) {
      throw new ExternalServiceError("Hedera", "Failed to create batch registry");
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new DomainError("Product not found", "NOT_FOUND", 404);

    const qrBatchPayload = generateBatchQRPayload(batchId, QR_SECRET, BASE_URL, registryTopicId.topicId);

    // 4. Create Batch Record
    const newBatch = await prisma.medicationBatch.create({
      data: {
        batchId,
        organizationId: organization.id,
        drugName,
        batchSize: calculatedBatchSize,
        productId,
        registryTopicId: registryTopicId.topicId,
        qrCodeData: qrBatchPayload.url,
        qrSignature: qrBatchPayload.signature,
      },
    });

    // 5. Register existing units on the new Batch Registry (HCS)
    const unitsData: Array<{ id: string; serialNumber: string; seq: number }> = [];
    const concurrency = UNIT_REG_CONCURRENCY || 10;

    await runInBatches<MedicationUnit>(existingUnits, concurrency, async (unit) => {
      // Register existing serial on the new batch topic
      const seq = await registerUnitOnBatch(
        registryTopicId.topicId,
        {
          serialNumber: unit.serialNumber,
          drugName: drugName,
          batchId,
        },
      );

      unitsData.push({
        id: unit.id,
        serialNumber: unit.serialNumber,
        seq,
      });

    });

    // 6. Bulk Update Units (Update ONLY batchId and sequence)
    if (unitsData.length > 0) {
      await Promise.all(
        unitsData.map((u) =>
          prisma.medicationUnit.update({
            where: { id: u.id },
            data: {
              batchId: newBatch.id,
              registrySequence: u.seq,
            },
          })
        )
      );
    }

    // 7. Final Logging
    const unitsRegisteredSeq = await logBatchEvent(
      registryTopicId.topicId,
      "BATCH_UNITS_REGISTERED",
      {
        batchId,
        organizationId: organization.id,
        units: unitsData.map((u) => u.serialNumber),
        count: unitsData.length,
      },
    );

    await prisma.batchEvent.create({
      data: {
        batchId: newBatch.id,
        eventType: "BATCH_UNITS_REGISTERED",
        hederaSeq: unitsRegisteredSeq ?? 0,
        payload: { units: unitsData.map((u) => u.serialNumber) },
        region: organization?.state ?? "",
      }
    });


    return NextResponse.json({ success: true, batchId: newBatch.batchId }, { status: 201 });

  }
  catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to attach units to batch" },
      { status: 500 }
    );
  }
}