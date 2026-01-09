/**
 * Use Case: Initiate Transfer
 *
 * Creates a new batch transfer between organizations
 */

import { Actor, Permissions, requirePermission } from "@/utils/types/actor";
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
import { hedera10Client } from "@/lib/hedera10Client";
import type { OwnershipTransfer } from "@/lib/generated/prisma";

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

    // 9. Store off-chain event (HCS-2 logging for transfers TBD - event type not yet supported)
    const eventSeq = 0;
    await this.batchRepo.createEvent({
      batchId: batch.id,
      eventType: "TRANSFER_INITIATED",
      hederaSeq: eventSeq,
      payload: {
        transferId: transfer.id,
        fromOrgId: batch.organizationId,
        toOrgId: input.toOrgId,
      },
    });

    // 10. Announce via HCS-10 if available
    const fromOrg = await this.orgRepo.findById(batch.organizationId);
    if (fromOrg?.organizationAgent?.outboundTopic) {
      try {
        await hedera10Client.sendMessage(
          fromOrg.organizationAgent.outboundTopic,
          JSON.stringify({
            p: "hcs-10",
            op: "transfer_initiated",
            batch_id: batch.batchId,
            transfer_id: transfer.id,
            to_org: input.toOrgId,
          }),
          "Transfer initiation announcement"
        );
      } catch (e) {
        console.warn("Failed to announce transfer initiation (non-fatal):", e);
      }
    }

    return {
      transfer,
      transferId: transfer.id,
      eventSequence: eventSeq,
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
