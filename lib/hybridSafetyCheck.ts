import { checkUnitMinted } from "./independentUnitSafetyCheck";
import { checkUnitInBatch, runAllUnitAuthenticityChecks } from "./safetyChecks";

export async function runHybridUnitChecks(params: {
  orgLogs: any[];
  batchLogs: any[];
  serialNumber: string;
  unitId: string;
  batchId: string;
  organizationId: string;
  topicId: string;
  lat: number;
  long: number;
}) {
  const {
    orgLogs,
    batchLogs,
    serialNumber,
    unitId,
    batchId,
    organizationId,
    topicId,
    lat,
    long,
  } = params;

  // --- PHASE 1: Organization Birth Verification ---
  // We check the Org Topic to ensure this specific serial number was ever MINTED.
  const mintCheck = checkUnitMinted(orgLogs, serialNumber);

  if (!mintCheck.passed) {
    return {
      status: "NOT_SAFE",
      reasons: [mintCheck.reasonIfFail],
      recommendedAction:
        "This unit claims to be from this Org but has no birth record. Do not use.",
    };
  }

  // --- PHASE 2: Batch Membership Verification ---
  // We check the Batch Topic to ensure this unit was actually added to this specific batch.
  const membershipCheck = checkUnitInBatch(batchLogs, serialNumber);

  if (!membershipCheck.passed) {
    return {
      status: "NOT_SAFE",
      reasons: [membershipCheck.reasonIfFail],
      recommendedAction:
        "Identity mismatch: This unit was never officially added to this batch.",
    };
  }

  // --- PHASE 3: Standard Batch Lifecycle Checks ---
  // Now that we know it's a valid member, run the normal expiry/transfer/duplicate checks.
  return await runAllUnitAuthenticityChecks(
    batchLogs,
    unitId,
    batchId,
    organizationId,
    topicId,
    serialNumber,
  );
}
