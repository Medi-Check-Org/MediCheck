/**
 * Input Validation Schemas
 * 
 * Centralized validation using Zod for type-safe input validation.
 * All use case inputs should be validated against these schemas.
 */

import { z } from "zod";
import { ValidationError } from "./errors";

// =====================================================
// Batch Schemas
// =====================================================

export const CreateBatchSchema = z.object({
  organizationId: z.string().cuid(),
  drugName: z
    .string()
    .min(1, "Drug name is required")
    .max(255, "Drug name must not exceed 255 characters"),
  batchSize: z
    .number()
    .int()
    .positive("Batch size must be a positive integer")
    .max(100000, "Batch size must not exceed 100,000 units"),
  productId: z.string().cuid(),
});

export type CreateBatchInput = z.infer<typeof CreateBatchSchema>;

export const ListBatchesSchema = z.object({
  organizationId: z.string().cuid(),
  filters: z.object({
    status: z.nativeEnum(BatchStatus).optional(),
    drugName: z.string().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
  }).optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
});

export type ListBatchesInput = z.infer<typeof ListBatchesSchema>;

export const GetBatchSchema = z.object({
  batchId: z.string().min(1),
});

export type GetBatchInput = z.infer<typeof GetBatchSchema>;

// =====================================================
// Transfer Schemas
// =====================================================

export const InitiateTransferSchema = z.object({
  batchId: z.string().min(1),
  fromOrgId: z.string().cuid(),
  toOrgId: z.string().cuid(),
  notes: z.string().max(1000).optional(),
});

export type InitiateTransferInput = z.infer<typeof InitiateTransferSchema>;

import { TransferStatus, BatchStatus, OrganizationType } from "@/lib/generated/prisma";

export const ListTransfersSchema = z.object({
  organizationId: z.string().cuid(),
  status: z.nativeEnum(TransferStatus).optional(),
  direction: z.enum(["OUTGOING", "INCOMING", "ALL"]).optional().default("ALL"),
});

export type ListTransfersInput = z.infer<typeof ListTransfersSchema>;

export const UpdateTransferStatusSchema = z.object({
  transferId: z.string().cuid(),
  organizationId: z.string().cuid(),
  status: z.nativeEnum(TransferStatus),
  notes: z.string().max(1000).optional(),
});

export type UpdateTransferStatusInput = z.infer<typeof UpdateTransferStatusSchema>;

export const GetTransferSchema = z.object({
  transferId: z.string().cuid(),
});

export type GetTransferInput = z.infer<typeof GetTransferSchema>;

// =====================================================
// Verification Schemas
// =====================================================

export const VerifyBatchSchema = z.object({
  batchId: z.string().min(1),
  signature: z.string().min(1),
  scannerOrgId: z.string().cuid(),
  scannerTeamMemberId: z.string().cuid(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
});

export type VerifyBatchInput = z.infer<typeof VerifyBatchSchema>;

export const VerifyUnitSchema = z.object({
  serialNumber: z.string().min(1),
  signature: z.string().min(1),
  consumerId: z.string().cuid().optional(),
  isAnonymous: z.boolean(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
});

export type VerifyUnitInput = z.infer<typeof VerifyUnitSchema>;

// =====================================================
// Organization Schemas
// =====================================================

export const GetOrganizationSchema = z.object({
  organizationId: z.string().cuid(),
});

export type GetOrganizationInput = z.infer<typeof GetOrganizationSchema>;

export const ListOrganizationsSchema = z.object({
  filters: z.object({
    organizationType: z.nativeEnum(OrganizationType).optional(),
    state: z.string().optional(),
  }).optional(),
});

export type ListOrganizationsInput = z.infer<typeof ListOrganizationsSchema>;

export const UpdateOrganizationSchema = z.object({
  organizationId: z.string().cuid(),
  data: z.object({
    companyName: z.string().min(1).max(255).optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().max(50).optional(),
    address: z.string().max(500).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    postalCode: z.string().max(20).optional(),
    country: z.string().max(100).optional(),
  }),
});

export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;

// =====================================================
// Validation Helper
// =====================================================

/**
 * Validates input against a Zod schema and throws ValidationError if invalid
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errors: Record<string, string[]> = {};
    
    result.error.errors.forEach((err) => {
      const path = err.path.length > 0 ? err.path.join(".") : "_root";
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(err.message);
    });

    throw new ValidationError("Validation failed", errors);
  }

  return result.data;
}
