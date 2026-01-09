/**
 * Transfer Repository
 *
 * Handles all database operations related to ownership transfers.
 */

import { prisma } from "@/lib/prisma";
import type {
  OwnershipTransfer,
  TransferStatus,
  Prisma,
} from "@/lib/generated/prisma";
import { NotFoundError } from "@/utils/types/errors";

export interface TransferWithRelations extends OwnershipTransfer {
  batch: {
    id: string;
    batchId: string;
    drugName: string;
    batchSize: number;
    manufacturingDate: Date;
    expiryDate: Date;
    organizationId: string;
    registryTopicId?: string | null;
  };
  fromOrg: {
    id: string;
    companyName: string;
    organizationType: string;
    contactEmail: string;
  };
  toOrg: {
    id: string;
    companyName: string;
    organizationType: string;
    contactEmail: string;
  };
}

export interface CreateTransferData {
  batchId: string; // Database ID
  fromOrgId: string;
  toOrgId: string;
  notes?: string;
  status?: TransferStatus;
}

export interface ListTransfersFilters {
  organizationId: string;
  status?: TransferStatus;
  direction?: "OUTGOING" | "INCOMING" | "ALL";
}

export interface UpdateTransferData {
  status?: TransferStatus;
  notes?: string;
  transferDate?: Date;
}

export class TransferRepository {
  /**
   * Create a new transfer
   */
  async create(data: CreateTransferData): Promise<OwnershipTransfer> {
    return prisma.ownershipTransfer.create({
      data,
    });
  }

  /**
   * Find transfer by ID
   */
  async findById(id: string): Promise<TransferWithRelations | null> {
    return prisma.ownershipTransfer.findUnique({
      where: { id },
      include: {
        batch: {
          select: {
            id: true,
            batchId: true,
            drugName: true,
            composition: true,
            batchSize: true,
            manufacturingDate: true,
            expiryDate: true,
            storageInstructions: true,
            status: true,
            organizationId: true,
            registryTopicId: true,
          },
        },
        fromOrg: {
          select: {
            id: true,
            companyName: true,
            organizationType: true,
            contactEmail: true,
            address: true,
          },
        },
        toOrg: {
          select: {
            id: true,
            companyName: true,
            organizationType: true,
            contactEmail: true,
            address: true,
          },
        },
      },
    }) as Promise<TransferWithRelations | null>;
  }

  /**
   * Find pending transfer for a batch (any pending transfer)
   */
  async findPendingTransfer(
    batchId: string
  ): Promise<OwnershipTransfer | null> {
    return prisma.ownershipTransfer.findFirst({
      where: {
        batchId,
        status: "PENDING",
      },
    });
  }

  /**
   * List transfers with filters
   */
  async list(filters: ListTransfersFilters): Promise<TransferWithRelations[]> {
    const whereClause: Prisma.OwnershipTransferWhereInput = {};

    // Apply direction filter
    if (filters.direction === "OUTGOING") {
      whereClause.fromOrgId = filters.organizationId;
    } else if (filters.direction === "INCOMING") {
      whereClause.toOrgId = filters.organizationId;
    } else {
      // ALL - both incoming and outgoing
      whereClause.OR = [
        { fromOrgId: filters.organizationId },
        { toOrgId: filters.organizationId },
      ];
    }

    // Apply status filter
    if (filters.status) {
      whereClause.status = filters.status as TransferStatus;
    }

    return prisma.ownershipTransfer.findMany({
      where: whereClause,
      include: {
        batch: {
          select: {
            id: true,
            batchId: true,
            drugName: true,
            batchSize: true,
            manufacturingDate: true,
            expiryDate: true,
            organizationId: true,
            registryTopicId: true,
          },
        },
        fromOrg: {
          select: {
            id: true,
            companyName: true,
            organizationType: true,
            contactEmail: true,
          },
        },
        toOrg: {
          select: {
            id: true,
            companyName: true,
            organizationType: true,
            contactEmail: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }) as unknown as Promise<TransferWithRelations[]>;
  }

  /**
   * Update transfer
   */
  async update(
    id: string,
    data: UpdateTransferData
  ): Promise<OwnershipTransfer> {
    return prisma.ownershipTransfer.update({
      where: { id },
      data,
    });
  }

  /**
   * Update transfer status
   */
  async updateStatus(
    id: string,
    status: TransferStatus
  ): Promise<OwnershipTransfer> {
    return prisma.ownershipTransfer.update({
      where: { id },
      data: {
        status,
      },
    });
  }

  /**
   * Check if transfer exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await prisma.ownershipTransfer.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Get or throw if not found
   */
  async getByIdOrThrow(id: string): Promise<TransferWithRelations> {
    const transfer = await this.findById(id);
    if (!transfer) {
      throw new NotFoundError("Transfer", id);
    }
    return transfer;
  }

  /**
   * Verify organization has access to transfer (as sender or receiver)
   */
  async verifyOrganizationAccess(
    transferId: string,
    organizationId: string
  ): Promise<boolean> {
    const count = await prisma.ownershipTransfer.count({
      where: {
        id: transferId,
        OR: [{ fromOrgId: organizationId }, { toOrgId: organizationId }],
      },
    });
    return count > 0;
  }
}

// Singleton instance
export const transferRepository = new TransferRepository();
