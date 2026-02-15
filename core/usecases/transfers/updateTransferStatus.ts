/**
 * Use Case: Update Transfer Status
 *
 * Accepts or rejects a pending transfer
 */

import { Actor, Permissions, requirePermission } from "@/utils/types/actor";
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
  ForbiddenError,
  BusinessRuleViolationError,
} from "@/utils/types/errors";
import type { OwnershipTransfer, TransferStatus } from "@/lib/generated/prisma";

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

    // 5. Verify actor has access to destination organization
    if (actor.organizationId !== transfer.toOrgId) {
      throw new ForbiddenError(
        "Only the destination organization can accept/reject this transfer"
      );
    }

    // 6. Update transfer status
    const updatedTransfer = await this.transferRepo.updateStatus(
      transfer.id,
      input.status
    );

    // 7. If completed, update batch ownership
    let batchUpdated = false;
    if (input.status === "COMPLETED") {
      await this.batchRepo.updateOrganization(
        transfer.batchId,
        transfer.toOrgId
      );
      batchUpdated = true;
    }

    // 8. Store off-chain event (HCS-2 logging for transfers TBD - event type not yet supported)
    const eventSeq = 0;
    await this.batchRepo.createEvent({
      batchId: transfer.batchId,
      eventType:
        input.status === "COMPLETED"
          ? "TRANSFER_COMPLETED"
          : "TRANSFER_CANCELLED",
      hederaSeq: eventSeq,
      payload: {
        transferId: transfer.id,
        status: input.status,
        processedBy: actor.id,
      },
    });

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
