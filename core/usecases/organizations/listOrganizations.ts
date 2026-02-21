/**
 * Use Case: List Organizations
 *
 * Retrieves all organizations accessible to the actor
 */

import { Actor, Permissions, requirePermission } from "@/utils/types/actor";
import {
  ListOrganizationsInput,
  ListOrganizationsSchema,
  validateInput,
} from "@/utils/types/validation";
import {
  OrganizationRepository,
  organizationRepository,
} from "@/core/infrastructure/db/repositories";
import type { Organization } from "@/lib/generated/prisma/client";

export interface ListOrganizationsOutput {
  organizations: Organization[];
}

export class ListOrganizationsUseCase {
  constructor(private readonly orgRepo: OrganizationRepository) {}

  async execute(
    rawInput: unknown,
    actor: Actor
  ): Promise<ListOrganizationsOutput> {
    // 1. Validate input
    const input = validateInput(ListOrganizationsSchema, rawInput);

    // 2. Check permissions - only admins and regulators can list all orgs
    requirePermission(actor, Permissions.ORGANIZATIONS_READ);

    // 3. Fetch organizations
    const organizations = await this.orgRepo.list(input.filters);

    return { organizations };
  }
}

// Singleton instance
export const listOrganizationsUseCase = new ListOrganizationsUseCase(
  organizationRepository
);

// Convenience function
export async function listOrganizations(
  input: unknown,
  actor: Actor
): Promise<ListOrganizationsOutput> {
  return listOrganizationsUseCase.execute(input, actor);
}
