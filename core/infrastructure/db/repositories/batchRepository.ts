/**
 * Batch Repository
 *
 * Handles all database operations related to medication batches.
 * Provides clean abstraction over Prisma for batch operations.
 */

import { prisma } from "@/lib/prisma";
import type {
  Prisma,
  MedicationBatch,
  MedicationUnit,
  BatchEvent,
  BatchStatus,
  Product,
} from "@/lib/generated/prisma";
import { NotFoundError } from "@/utils/types/errors";

export interface BatchWithRelations extends MedicationBatch {
  organization?: {
    id: string;
    companyName: string;
    organizationType: string;
    contactEmail: string;
  };
  medicationUnits?: Array<{
    id: string;
    serialNumber: string;
    status: string;
    registrySequence: number | null;
  }>;
  batchEvents?: BatchEvent[];
  product?: Product | null;
  _count?: {
    medicationUnits: number;
  };
}

export interface CreateBatchData {
  batchId: string;
  organizationId: string;
  drugName: string;
  productId: string;
  batchSize: number;
  registryTopicId?: string | null;
  qrCodeData?: string;
  qrSignature?: string;
  status?: BatchStatus;
}

export interface ListBatchesFilters {
  organizationId?: string;
  status?: BatchStatus;
  drugName?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface CreateUnitsData {
  serialNumber: string;
  batchId: string;
  registrySequence: number;
  qrCode: string;
  qrSignature: string;
}

export class BatchRepository {
  /**
   * Create a new batch
   */
  async create(data: CreateBatchData): Promise<MedicationBatch> {
    return prisma.medicationBatch.create({
      data,
    });
  }

  /**
   * Find batch by batchId (string identifier)
   */
  async findByBatchId(batchId: string): Promise<BatchWithRelations | null> {
    return prisma.medicationBatch.findUnique({
      where: { batchId },
      include: {
        organization: {
          select: {
            id: true,
            companyName: true,
            organizationType: true,
            contactEmail: true,
          },
        },
        product: true,
      },
    });
  }

  /**
   * Find batch by database ID
   */
  async findById(id: string): Promise<BatchWithRelations | null> {
    return prisma.medicationBatch.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            companyName: true,
            organizationType: true,
            contactEmail: true,
          },
        },
        product: true,
      },
    });
  }

  /**
   * Get batch with full details (including units and events)
   */
  async findByIdWithDetails(id: string): Promise<BatchWithRelations | null> {
    return prisma.medicationBatch.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            companyName: true,
            organizationType: true,
            contactEmail: true,
          },
        },
        medicationUnits: {
          select: {
            id: true,
            serialNumber: true,
            status: true,
            registrySequence: true,
          },
          take: 100, // Limit units returned
        },
        batchEvents: {
          orderBy: {
            createdAt: "desc",
          },
          take: 20, // Limit events returned
        },
        product: true,
      },
    });
  }

  /**
   * List batches with filters
   */
  async list(
    filters: ListBatchesFilters
  ): Promise<{ batches: BatchWithRelations[]; total: number }> {
    const whereClause: Prisma.MedicationBatchWhereInput = {};

    if (filters.organizationId) {
      whereClause.organizationId = filters.organizationId;
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.drugName) {
      whereClause.drugName = {
        contains: filters.drugName,
        mode: "insensitive",
      };
    }

    // manufacturingDate & expiryDate live on Product in schema, not MedicationBatch
    if (filters.startDate || filters.endDate) {
      whereClause.product = {
        manufacturingDate: {
          ...(filters.startDate && { gte: filters.startDate }),
          ...(filters.endDate && { lte: filters.endDate }),
        },
      };
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const [batches, total] = await Promise.all([
      prisma.medicationBatch.findMany({
        where: whereClause,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          organization: {
            select: {
              id: true,
              companyName: true,
              organizationType: true,
              contactEmail: true,
            },
          },
          product: true,
          _count: {
            select: {
              medicationUnits: true,
            },
          },
        },
        skip,
        take: limit,
      }),
      prisma.medicationBatch.count({ where: whereClause }),
    ]);

    return { batches, total };
  }

  /**
   * Update batch status
   */
  async updateStatus(
    batchId: string,
    status: BatchStatus
  ): Promise<MedicationBatch> {
    return prisma.medicationBatch.update({
      where: { batchId },
      data: { status },
    });
  }

  /**
   * Update batch by database ID
   */
  async update(
    id: string,
    data: Partial<CreateBatchData>
  ): Promise<MedicationBatch> {
    return prisma.medicationBatch.update({
      where: { id },
      data,
    });
  }

  /**
   * Create multiple units in bulk
   */
  async createUnits(units: CreateUnitsData[]): Promise<number> {
    const result = await prisma.medicationUnit.createMany({
      data: units,
    });
    return result.count;
  }

  /**
   * Log batch event
   */
  async createEvent(data: {
    batchId: string; // This is the database ID
    eventType: string;
    hederaSeq: number;
    payload: Record<string, unknown>;
    region?: string;
  }): Promise<BatchEvent> {
    return prisma.batchEvent.create({
      data: {
        batchId: data.batchId,
        eventType: data.eventType,
        hederaSeq: data.hederaSeq,
        payload: data.payload as object,
        region: data.region ?? "",
      },
    });
  }

  /**
   * Get batch events
   */
  async getEvents(batchId: string): Promise<BatchEvent[]> {
    return prisma.batchEvent.findMany({
      where: { batchId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Check if batch exists
   */
  async exists(batchId: string): Promise<boolean> {
    const count = await prisma.medicationBatch.count({
      where: { batchId },
    });
    return count > 0;
  }

  /**
   * Get or throw if not found
   */
  async getByBatchIdOrThrow(batchId: string): Promise<BatchWithRelations> {
    const batch = await this.findByBatchId(batchId);
    if (!batch) {
      throw new NotFoundError("Batch", batchId);
    }
    return batch;
  }

  /**
   * Update batch organization (for transfers)
   */
  async updateOrganization(
    batchId: string,
    organizationId: string
  ): Promise<MedicationBatch> {
    return prisma.medicationBatch.update({
      where: { id: batchId },
      data: { organizationId },
    });
  }
}

// Singleton instance
export const batchRepository = new BatchRepository();
