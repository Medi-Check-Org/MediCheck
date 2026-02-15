/**
 * Use Case: Create Batch
 *
 * Handles the complete business logic for creating a new medication batch.
 * Built with dependency injection and repository pattern for proper separation of concerns.
 */

import { Actor, Permissions, requirePermission } from "@/utils/types/actor";
import {
  CreateBatchInput,
  CreateBatchSchema,
  validateInput,
} from "@/utils/types/validation";
import {
  BatchRepository,
  OrganizationRepository,
  batchRepository,
  organizationRepository,
} from "@/core/infrastructure/db/repositories";
import {
  ForbiddenError,
  BusinessRuleViolationError,
  ExternalServiceError,
  DomainError,
} from "@/utils/types/errors";
import { nanoid } from "nanoid";
import {
  registerUnitOnBatch,
  createBatchRegistry,
  logBatchEvent,
} from "@/lib/hedera";
import { generateQRPayload, generateBatchQRPayload } from "@/lib/qrPayload";
import { hedera10Client } from "@/lib/hedera10Client";
import { prisma } from "@/lib/prisma";
import type { MedicationBatch } from "@/lib/generated/prisma";
import { Product } from "@/lib/generated/prisma";

const QR_SECRET = process.env.QR_SECRET || "dev-secret";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const UNIT_REG_CONCURRENCY = parseInt(process.env.UNIT_REG_CONCURRENCY || "10", 10);

export interface CreateBatchOutput {
  batch: MedicationBatch;
  unitsCreated: number;
  registryTopicId: string;
  batchEventSeq: number;
}

/**
 * Helper to run tasks in batches with concurrency control
 */
async function runInBatches<T>(
  items: T[],
  batchSize: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    await Promise.all(chunk.map(worker));
  }
}


/**
 * Create Batch Use Case
 *
 * Dependencies injected for testability and loose coupling
 */
export class CreateBatchUseCase {

  constructor(
    private readonly batchRepo: BatchRepository,
    private readonly orgRepo: OrganizationRepository
  ) {}

  async execute(rawInput: unknown, actor: Actor): Promise<CreateBatchOutput> {

    // 1. Validate input
    const input = validateInput(CreateBatchSchema, rawInput);

    // 2. Check permissions
    requirePermission(actor, Permissions.BATCHES_CREATE);

    // 3. Verify actor belongs to the organization
    if (actor.organizationId !== input.organizationId) {
      throw new ForbiddenError(
        "Actor does not have access to this organization"
      );
    }

    // 4. Load organization with agent info
    const org = await this.orgRepo.getByIdOrThrow(input.organizationId);

    // 5. Additional business rule validations

    // Check if batch size is reasonable (at least 1, checked by schema, but double-check)
    if (input.batchSize < 1 || input.batchSize > 100000) {
      throw new BusinessRuleViolationError(
        "Batch size must be between 1 and 100,000 units"
      );
    }

    // 6. Generate batch ID
    const batchId = `BATCH-${Date.now()}${nanoid(5)}`;

    // 7. Check for duplicate batch ID (extremely rare, but good practice)
    const existingBatch = await this.batchRepo.findByBatchId(batchId);
    if (existingBatch) {
      throw new BusinessRuleViolationError(
        `Batch ID ${batchId} already exists. Please try again.`
      );
    }

    // 8. Create batch registry on Hedera
    interface RegistryResult {
      topicId: string;
      transactionId?: string;
    }

    let registryTopicId: RegistryResult;

    try {
      registryTopicId = (await createBatchRegistry(
        batchId,
        org.id,
        input.drugName
      )) as RegistryResult;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new ExternalServiceError(
        "Hedera",
        `Failed to create batch registry: ${errorMessage}`
      );
    }

    // Product validity check
    const product = await prisma.product.findUnique({
      where: {
        id: input.productId,
      },
    });

    console.log(product)

    if (!product) {
      throw new DomainError("Product does not exist", "PRODUCT_NOT_FOUND", 404);
    }

    // 7. Generate batch QR payload
    const qrBatchPayload = generateBatchQRPayload(
      batchId,
      QR_SECRET,
      BASE_URL,
      registryTopicId.topicId as string
    );

    // 8. Create batch record in database
    const newBatch = await this.batchRepo.create({
      batchId,
      organizationId: input.organizationId,
      drugName: input.drugName,
      batchSize: input.batchSize,
      productId: input.productId,
      registryTopicId: registryTopicId.topicId ?? null,
      qrCodeData: qrBatchPayload.url,
      qrSignature: qrBatchPayload.signature,
    });

    // 9. Log batch creation event to HCS-2
    const eventSeq = await logBatchEvent(
      registryTopicId?.topicId as string,
      "BATCH_CREATED",
      {
        batchId,
        organizationId: input.organizationId,
        drugName: input.drugName,
        batchSize: String(input.batchSize),
        manufacturingDate: product.manufacturingDate ? new Date(product.manufacturingDate).toISOString() : "",
        expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString() : "",
      },
    );

    // 10. Store off-chain event record
    await this.batchRepo.createEvent({
      batchId: newBatch.id,
      eventType: "BATCH_CREATED",
      hederaSeq: eventSeq ?? 0,
      payload: {
        batchId,
        organizationId: input.organizationId,
        drugName: input.drugName,
        batchSize: input.batchSize,
        manufacturingDate: product.manufacturingDate ? new Date(product.manufacturingDate).toISOString() : "",
        expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString() : "",
      },
      region: org?.state ?? "",
    });

    // 11. Announce via HCS-10 if organization agent exists
    if (org.organizationAgent?.outboundTopic) {
      try {
        await hedera10Client.sendMessage(
          org.organizationAgent.outboundTopic,
          JSON.stringify({
            p: "hcs-10",
            op: "announce_batch",
            batch_id: batchId,
            registry_topic: registryTopicId,
            status: "registered",
          }),
          "Batch creation announcement"
        );
        console.log(
          "Announced batch on agent outbound topic:",
          org.organizationAgent.outboundTopic
        );
      } catch (e) {
        console.warn(
          "Failed to announce to HCS-10 outbound topic (non-fatal):",
          e
        );
      }
    }

    // 12. Create and register individual units
    const unitsData: Array<any> = [];
    const unitIndexes = Array.from({ length: input.batchSize }, (_, i) => i);
    const concurrency = UNIT_REG_CONCURRENCY > 0 ? UNIT_REG_CONCURRENCY : 10;

    await runInBatches<number>(unitIndexes, concurrency, async (i) => {
      const unitNumber = String(i + 1).padStart(4, "0");
      const randomSuffix = nanoid(3);
      const serialNumber = `UNIT-${batchId}-${unitNumber}${randomSuffix}`;

      // Register unit on HCS-2 registry
      const seq = await registerUnitOnBatch(
        registryTopicId?.topicId as string,
        {
          serialNumber,
          drugName: input.drugName,
          batchId,
        }
      );

      const qrUnitPayload = generateQRPayload(
        serialNumber,
        batchId,
        seq,
        QR_SECRET,
        BASE_URL
      );

      unitsData.push({
        serialNumber,
        batchId: newBatch.id,
        registrySequence: seq,
        qrCode: qrUnitPayload.url,
        productId: input.productId,
        qrSignature: qrUnitPayload.signature,
      });
    });

    // 13. Bulk insert units to database
    if (unitsData.length > 0) {
      await this.batchRepo.createUnits(unitsData);
    }

    // 14. Log units registration event
    const unitsRegisteredSeq = await logBatchEvent(
      registryTopicId?.topicId as string,
      "BATCH_UNITS_REGISTERED",
      {
        batchId,
        organizationId: org.id,
        units: unitsData.map((u) => u.serialNumber),
        count: unitsData.length,
      }
    );

    await this.batchRepo.createEvent({
      batchId: newBatch.id,
      eventType: "BATCH_UNITS_REGISTERED",
      hederaSeq: unitsRegisteredSeq ?? 0,
      payload: { units: unitsData.map((u) => u.serialNumber) },
      region: org?.state ?? "",
    });

    // 15. Announce on managed registry if available
    if (org.managedRegistry) {
      try {
        await hedera10Client.sendMessage(
          org.managedRegistry,
          JSON.stringify({
            type: "BATCH_CREATED",
            orgId: input.organizationId,
            batchId,
            drugName: input.drugName,
            timestamp: new Date().toISOString(),
            topicId: registryTopicId?.topicId as string,
          }),
          "New batch announcement"
        );
        console.log(
          `📢 Announced new batch ${batchId} on managed registry ${org.managedRegistry}`
        );
      } catch (e) {
        console.warn("Failed to announce on managed registry (non-fatal):", e);
      }
    }

    return {
      batch: newBatch,
      unitsCreated: unitsData.length,
      registryTopicId: registryTopicId.topicId as string,
      batchEventSeq: eventSeq ?? 0,
    };
  }
}


// Create singleton instance with injected dependencies
export const createBatchUseCase = new CreateBatchUseCase(
  batchRepository,
  organizationRepository
);


// Export convenience function
export async function createBatch(
  input: unknown,
  actor: Actor
): Promise<CreateBatchOutput> {
  return createBatchUseCase.execute(input, actor);
}

