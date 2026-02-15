/**
 * Use Case: List Transfers
 *
 * Retrieves transfers for an organization (sent, received, or both)
 */

import { Actor, Permissions, requirePermission } from "@/utils/types/actor";
import {
  ListTransfersInput,
  ListTransfersSchema,
  validateInput,
} from "@/utils/types/validation";
import {
  TransferRepository,
  transferRepository,
  TransferWithRelations,
} from "@/core/infrastructure/db/repositories";
import type { TransferStatus } from "@/lib/generated/prisma";
import { ForbiddenError } from "@/utils/types/errors";

export interface ListTransfersOutput {
  transfers: TransferWithRelations[];
  total: number;
}

export class ListTransfersUseCase {
  constructor(private readonly transferRepo: TransferRepository) {}

  async execute(
    rawInput: unknown,
    actor: Actor
  ): Promise<ListTransfersOutput> {
    // 1. Validate input
    const input = validateInput(ListTransfersSchema, rawInput);

    // 2. Check permissions
    requirePermission(actor, Permissions.TRANSFERS_READ);

    // 3. Verify organization access
    if (!actor.permissions.includes(Permissions.ALL)) {
      if (actor.organizationId !== input.organizationId) {
        throw new ForbiddenError(
          "Cannot list transfers for other organizations"
        );
      }
    }

    // 4. Fetch transfers
    const transfers = await this.transferRepo.list({
      organizationId: input.organizationId,
      direction: input.direction,
      status: input.status,
    });

    return {
      transfers,
      total: transfers.length,
    };
  }
}

// Singleton instance
export const listTransfersUseCase = new ListTransfersUseCase(transferRepository);

// Convenience function
export async function listTransfers(
  input: unknown,
  actor: Actor
): Promise<ListTransfersOutput> {
  return listTransfersUseCase.execute(input, actor);
}
