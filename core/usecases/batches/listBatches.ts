/**
 * Use Case: List Batches
 *
 * Retrieves batches accessible to the actor with filtering and pagination
 */

import { Actor, Permissions, requirePermission } from "@/utils/types/actor";
import {
  ListBatchesInput,
  ListBatchesSchema,
  validateInput,
} from "@/utils/types/validation";
import {
  BatchRepository,
  batchRepository,
  BatchWithRelations,
} from "@/core/infrastructure/db/repositories";
import { BatchStatus } from "@/lib/generated/prisma/enums";

export interface ListBatchesOutput {
  batches: BatchWithRelations[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class ListBatchesUseCase {
  constructor(private readonly batchRepo: BatchRepository) {}

  async execute(rawInput: unknown, actor: Actor): Promise<ListBatchesOutput> {
    // 1. Validate input
    const input = validateInput(ListBatchesSchema, rawInput);

    console.log(input)

    // 2. Check permissions
    requirePermission(actor, Permissions.BATCHES_READ);

    // 3. Determine organization filter
    // If actor has wildcard access, they can query any org
    // Otherwise, restrict to actor's organization
    const organizationId = actor.permissions.includes(Permissions.ALL)
      ? input.organizationId
      : actor.organizationId;

    // 4. Fetch batches
    const { batches, total } = await this.batchRepo.list({
      organizationId,
      status: input.filters?.status,
      drugName: input.filters?.drugName,
      startDate: input.filters?.startDate,
      endDate: input.filters?.endDate,
      page: input.page ?? 1,
      limit: input.limit ?? 20,
    });

    const page = input.page ?? 1;
    const limit = input.limit ?? 20;

    return {
      batches,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

// Singleton instance
export const listBatchesUseCase = new ListBatchesUseCase(batchRepository);

// Convenience function
export async function listBatches(
  input: unknown,
  actor: Actor
): Promise<ListBatchesOutput> {
  return listBatchesUseCase.execute(input, actor);
}
