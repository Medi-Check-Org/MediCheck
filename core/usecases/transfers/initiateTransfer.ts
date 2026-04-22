/**
 * Use Case: Initiate Transfer
 *
 * Creates a new batch transfer between organizations
 */

import { Actor, Permissions, requirePermission } from "@/utils/types/actor";
import { logBatchEvent } from "@/lib/hedera";
import {
  InitiateTransferSchema,
  validateInput,
} from "@/utils/types/validation";
import {
  BatchRepository,
  OrganizationRepository,
  TransferRepository,
  batchRepository,
  organizationRepository,
  transferRepository,
} from "@/core/infrastructure/db/repositories";
import {
  ForbiddenError,
  BusinessRuleViolationError,
} from "@/utils/types/errors";
import { OwnershipTransfer } from "@/lib/generated/prisma/client";

export interface InitiateTransferOutput {
  transfer: OwnershipTransfer;
  transferId: string;
  eventSequence: number;
}

export class InitiateTransferUseCase {
  constructor(
    private readonly transferRepo: TransferRepository,
    private readonly batchRepo: BatchRepository,
    private readonly orgRepo: OrganizationRepository
  ) {}

  async execute(
    rawInput: unknown,
    actor: Actor
  ): Promise<InitiateTransferOutput> {
    // 1. Validate input
    const input = validateInput(InitiateTransferSchema, rawInput);

    // 2. Check permissions
    requirePermission(actor, Permissions.TRANSFERS_INITIATE);

    // 3. Load batch
    const batch = await this.batchRepo.getByBatchIdOrThrow(input.batchId);

    // 4. Verify actor has access to source organization
    if (actor.organizationId !== batch.organizationId) {
      throw new ForbiddenError(
        "Actor does not have access to the source organization"
      );
    }

    // 5. Check for pending transfers
    const pending = await this.transferRepo.findPendingTransfer(batch.id);
    if (pending) {
      throw new BusinessRuleViolationError(
        "Batch already has a pending transfer",
        "PENDING_TRANSFER_EXISTS"
      );
    }

    // 6. Verify destination organization exists
    await this.orgRepo.verifyExist(input.toOrgId);

    // 7. Verify destination org is different from source
    if (batch.organizationId === input.toOrgId) {
      throw new BusinessRuleViolationError(
        "Cannot transfer to the same organization",
        "SAME_ORGANIZATION"
      );
    }

    // 8. Create transfer record
    const transfer = await this.transferRepo.create({
      batchId: batch.id,
      fromOrgId: batch.organizationId,
      toOrgId: input.toOrgId,
      notes: input.notes,
      status: "PENDING",
    });

    // 8b. update the status of batch to
    console.log("batch.batchIdbatch.batchIdbatch.batchId", batch.batchId);
    await this.batchRepo.updateStatus(batch.batchId, "IN_TRANSIT");

    // 8B. STORE TRANSFER INITIATION ON CHAIN

    const transferSeq = await logBatchEvent(
      batch.registryTopicId ?? "",
      "BATCH_TRANSFER_INITIATION",
      {
        batchId: batch.batchId,
        transferFrom: batch.organizationId,
        transferTo: input.toOrgId,
        timestamp: new Date().toISOString(),
      },
    );

    // 9. Store off-chain event (HCS-2 logging for transfers TBD - event type not yet supported)
    await this.batchRepo.createEvent({
      batchId: batch.id,
      eventType: "TRANSFER_INITIATED",
      hederaSeq: transferSeq ?? 0,
      payload: {
        transferId: transfer.id,
        fromOrgId: batch.organizationId,
        toOrgId: input.toOrgId,
      },
    });




    return {
      transfer,
      transferId: transfer.id,
      eventSequence: transferSeq ?? 0
    };
    
  }
}

// Singleton instance
export const initiateTransferUseCase = new InitiateTransferUseCase(
  transferRepository,
  batchRepository,
  organizationRepository
);

// Convenience function
export async function initiateTransfer(
  input: unknown,
  actor: Actor
): Promise<InitiateTransferOutput> {
  return initiateTransferUseCase.execute(input, actor);
}
