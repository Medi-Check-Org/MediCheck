/**
 * Use Case: Get Batch Details
 *
 * Retrieves detailed information about a specific batch
 */

import { Actor, Permissions, requirePermission } from "@/utils/types/actor";
import {
  GetBatchInput,
  GetBatchSchema,
  validateInput,
} from "@/utils/types/validation";
import {
  BatchRepository,
  batchRepository,
  BatchWithRelations,
} from "@/core/infrastructure/db/repositories";
import { ForbiddenError } from "@/utils/types/errors";

export interface GetBatchOutput {
  batch: BatchWithRelations;
}

export class GetBatchUseCase {
  constructor(private readonly batchRepo: BatchRepository) {}

  async execute(rawInput: unknown, actor: Actor): Promise<GetBatchOutput> {
    // 1. Validate input
    const input = validateInput(GetBatchSchema, rawInput);

    // 2. Check permissions
    requirePermission(actor, Permissions.BATCHES_READ);

    // 3. Fetch batch with relations
    const batch = await this.batchRepo.getByBatchIdOrThrow(input.batchId);

    // 4. Verify access (unless wildcard permissions)
    if (!actor.permissions.includes(Permissions.ALL)) {
      if (batch.organizationId !== actor.organizationId) {
        throw new ForbiddenError("Actor does not have access to this batch");
      }
    }

    return { batch };
  }
}

// Singleton instance
export const getBatchUseCase = new GetBatchUseCase(batchRepository);

// Convenience function
export async function getBatch(
  input: unknown,
  actor: Actor
): Promise<GetBatchOutput> {
  return getBatchUseCase.execute(input, actor);
}
