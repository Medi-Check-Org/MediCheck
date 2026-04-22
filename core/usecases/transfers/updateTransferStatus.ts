/**
 * Use Case: Update Transfer Status
 *
 * Accepts or rejects a pending transfer
 */

import { Actor, Permissions, requirePermission } from "@/utils/types/actor";
import { logBatchEvent } from "@/lib/hedera";
import {
  UpdateTransferStatusSchema,
  validateInput,
} from "@/utils/types/validation";
import {
  BatchRepository,
  TransferRepository,
  batchRepository,
  transferRepository,
} from "@/core/infrastructure/db/repositories";
import {
  BusinessRuleViolationError,
} from "@/utils/types/errors";
import {
  TransferStatus,
  OwnershipTransfer,
} from "@/lib/generated/prisma/client";

export interface UpdateTransferOutput {
  transfer: OwnershipTransfer;
  batchUpdated: boolean;
}

export class UpdateTransferStatusUseCase {
  constructor(
    private readonly transferRepo: TransferRepository,
    private readonly batchRepo: BatchRepository
  ) {}

  async execute(
    rawInput: unknown,
    actor: Actor
  ): Promise<UpdateTransferOutput> {
    // 1. Validate input
    const input = validateInput(UpdateTransferStatusSchema, rawInput);

    // 2. Check permissions
    requirePermission(actor, Permissions.TRANSFERS_UPDATE);

    // 3. Load transfer with relations
    const transfer = await this.transferRepo.getByIdOrThrow(input.transferId);

    // 4. Verify transfer is pending
    if (transfer.status !== "PENDING") {
      throw new BusinessRuleViolationError(
        `Transfer is already ${transfer.status}`,
        "TRANSFER_NOT_PENDING"
      );
    }

    // 5. Update transfer status
    const updatedTransfer = await this.transferRepo.updateStatus(
      transfer.id,
      input.status
    );

    // 6. If completed, update batch ownership
    let batchUpdated = false;

    if (input.status === "CANCELLED") {

      await this.batchRepo.updateStatus(transfer.batch.batchId, "CREATED");

      const eventSeq = await logBatchEvent(
        transfer.batch.registryTopicId ?? "",
        "TRANSFER_CANCELLED",
        {
          batchId: transfer.batch.batchId,
          transferFrom: transfer.fromOrg.id,
          transferTo: transfer.toOrg.id,
          timestamp: new Date().toISOString(),
        },
      );

      // 7. Store off-chain event (HCS-2 logging for transfers TBD - event type not yet supported)
      await this.batchRepo.createEvent({
        batchId: transfer.batchId,
        eventType: "TRANSFER_CANCELLED",
        hederaSeq: eventSeq ?? 0,
        payload: {
          transferId: transfer.id,
          status: input.status,
          processedBy: actor.id,
        },
      });

      batchUpdated = true;
      
    }


    return {
      transfer: updatedTransfer,
      batchUpdated,
    };

  }
}

// Singleton instance
export const updateTransferStatusUseCase = new UpdateTransferStatusUseCase(
  transferRepository,
  batchRepository
);

// Convenience function
export async function updateTransferStatus(
  input: unknown,
  actor: Actor
): Promise<UpdateTransferOutput> {
  return updateTransferStatusUseCase.execute(input, actor);
}
