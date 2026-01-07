/**
 * Organization Repository
 * 
 * Handles all database operations related to organizations.
 */

import { prisma } from "@/lib/prisma";
import type { Organization, Agent, Prisma, OrganizationType } from "@/lib/generated/prisma";
import { NotFoundError } from "@/app/types/errors";

export interface OrganizationWithAgent extends Organization {
  organizationAgent?: Agent | null;
}

export interface OrganizationWithDetails extends Organization {
  organizationAgent?: {
    id: number;
    agentName: string;
    inboundTopic: string;
    outboundTopic: string;
  } | null;
  medicationBatches?: {
    id: string;
    batchId: string;
    drugName: string;
    status: string;
    createdAt: Date;
  }[];
}

export interface ListOrganizationsFilters {
  organizationType?: string;
  state?: string;
}

export interface UpdateOrganizationData {
  companyName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export class OrganizationRepository {
  /**
   * Find organization by ID
   */
  async findById(id: string): Promise<OrganizationWithAgent | null> {
    return prisma.organization.findUnique({
      where: { id },
      include: {
        organizationAgent: true,
      },
    });
  }

  /**
   * Find organization with full details
   */
  async findByIdWithDetails(id: string): Promise<OrganizationWithDetails | null> {
    return prisma.organization.findUnique({
      where: { id },
      include: {
        organizationAgent: {
          select: {
            id: true,
            agentName: true,
            inboundTopic: true,
            outboundTopic: true,
          },
        },
        medicationBatches: {
          select: {
            id: true,
            batchId: true,
            drugName: true,
            status: true,
            createdAt: true,
          },
          take: 10,
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  /**
   * List organizations with optional filters
   */
  async list(filters?: ListOrganizationsFilters): Promise<Organization[]> {
    const whereClause: Prisma.OrganizationWhereInput = {};

    if (filters?.organizationType) {
      whereClause.organizationType = filters.organizationType as OrganizationType;
    }

    if (filters?.state) {
      whereClause.state = filters.state;
    }

    return prisma.organization.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Update organization
   */
  async update(id: string, data: UpdateOrganizationData): Promise<Organization> {
    return prisma.organization.update({
      where: { id },
      data,
    });
  }

  /**
   * Check if organization exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await prisma.organization.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Get or throw if not found
   */
  async getByIdOrThrow(id: string): Promise<OrganizationWithAgent> {
    const org = await this.findById(id);
    if (!org) {
      throw new NotFoundError("Organization", id);
    }
    return org;
  }

  /**
   * Verify organization exists (throws if not)
   */
  async verifyExist(id: string): Promise<void> {
    const exists = await this.exists(id);
    if (!exists) {
      throw new NotFoundError("Organization", id);
    }
  }

  /**
   * Verify multiple organizations exist
   */
  async verifyMultipleExist(ids: string[]): Promise<void> {
    const count = await prisma.organization.count({
      where: {
        id: {
          in: ids,
        },
      },
    });

    if (count !== ids.length) {
      throw new NotFoundError("One or more organizations");
    }
  }
}

// Singleton instance
export const organizationRepository = new OrganizationRepository();
