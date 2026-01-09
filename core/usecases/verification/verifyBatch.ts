/**
 * Use Case: Verify Batch
 *
 * Public endpoint for consumers to verify batch authenticity
 */

import { Actor } from "@/utils/types/actor";
import {
  VerifyBatchInput,
  VerifyBatchSchema,
  validateInput,
} from "@/utils/types/validation";
import {
  BatchRepository,
  batchRepository,
  BatchWithRelations,
} from "@/core/infrastructure/db/repositories";
import { verifySignature } from "@/lib/verifySignature";
import { NotFoundError, ValidationError } from "@/utils/types/errors";

const QR_SECRET = process.env.QR_SECRET || "dev-secret";

export interface VerificationDetails {
  signatureValid: boolean;
  provenanceVerified: boolean;
  hederaSequence?: number;
  events?: Array<{
    type: string;
    timestamp: string;
    sequence: number;
  }>;
}

export interface VerifyBatchOutput {
  verified: boolean;
  batch: BatchWithRelations;
  validationDetails: VerificationDetails;
  riskScore?: number;
  flags?: string[];
}

export class VerifyBatchUseCase {
  constructor(private readonly batchRepo: BatchRepository) {}

  async execute(rawInput: unknown, actor?: Actor): Promise<VerifyBatchOutput> {
    // NOTE: This is a public endpoint - actor is optional
    // Consumers don't need authentication to verify batches

    // 1. Validate input
    const input = validateInput(VerifyBatchSchema, rawInput);

    // 2. Find batch
    const batch = await this.batchRepo.findByBatchId(input.batchId);
    if (!batch) {
      throw new NotFoundError("Batch", input.batchId);
    }

    // 3. Verify QR signature if provided
    let signatureValid = true;
    if (input.signature) {
      signatureValid = verifySignature(
        batch.batchId,
        input.signature,
        QR_SECRET
      );

      if (!signatureValid) {
        throw new ValidationError("Invalid QR signature", {
          signature: ["QR signature verification failed"],
        });
      }
    }

    // 4. Build verification response
    const validationDetails: VerificationDetails = {
      signatureValid,
      provenanceVerified: !!batch.registryTopicId,
      events: batch.batchEvents?.map((e) => ({
        type: e.eventType,
        timestamp: e.createdAt.toISOString(),
        sequence: e.hederaSeq ?? 0,
      })),
    };

    return {
      verified: signatureValid && validationDetails.provenanceVerified,
      batch,
      validationDetails,
    };
  }
}

// Singleton instance
export const verifyBatchUseCase = new VerifyBatchUseCase(batchRepository);

// Convenience function (actor is optional for public verification)
export async function verifyBatch(
  input: unknown,
  actor?: Actor
): Promise<VerifyBatchOutput> {
  return verifyBatchUseCase.execute(input, actor);
}
