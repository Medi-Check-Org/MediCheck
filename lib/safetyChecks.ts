import { autoFlagBatchUnit } from "./autoFlagBatch";
import { HederaSafetyCheckPayload } from "@/utils/types/hedera";

// Check: Verify this specific serial number was registered in this batch
export function checkUnitInBatch(events: any[], unitSerialNumber: string) {

  const registrationEvent = events.find(
    (e) => e.eventType === "BATCH_UNITS_REGISTERED"
  );

  if (!registrationEvent) {
    return {
      passed: false,
      reasonIfFail: "Batch exists, but no units have been officially registered on the ledger yet.",
    };
  }

  const isRegistered = registrationEvent.units?.includes(unitSerialNumber);

  if (!isRegistered) {
    return {
      passed: false,
      reasonIfFail: "Identity Mismatch: This serial number is not part of the officially registered units for this batch.",
    };
  }

  return {
    passed: true,
    reasonIfFail: "",
  };
  
}

// Check 1: Batch Flagged
export function checkFlagged(events: HederaSafetyCheckPayload[]) {
  // Collect all flag events
  const flaggedEvents = events.filter((e) => e.eventType === "BATCH_FLAG");

  if (flaggedEvents.length > 0) {
    // Map reasons with org
    const reasons = flaggedEvents.map((e) => {
      const org = e.organizationId || "Unknown Org";
      const reason = e.flagReason || "No reason provided";
      return `Flagged by ${org}: ${reason}`;
    });

    return {
      passed: false,
      reasonIfFail: reasons.join("; "),
    };
  }

  // If no flags at all
  return {
    passed: true,
    reasonIfFail: "",
  };
}

// Check 2: Check if this unit didgital footprint contains it's birth
export function checkBatchCreated(events: HederaSafetyCheckPayload[]) {
  const createdEvent = events.find((e) => e.eventType === "BATCH_CREATED");

  if (!createdEvent) {
    return {
      passed: false,
      reasonIfFail:
        "No BATCH_CREATED event found — this unit/batch may not originate from our system.",
    };
  }

  return {
    passed: true,
    reasonIfFail: "",
  };
}

// Check 3: Checks if one transfer ownership event has occured before it gets to the consumer
export function checkAtLeastOneTransfer(events: HederaSafetyCheckPayload[]) {
  // Look for ownership transfers
  const transferEvents = events.filter(
    (e) => e.eventType === "BATCH_OWNERSHIP",
  );

  if (transferEvents.length === 0) {
    return {
      passed: false,
      reasonIfFail:
        "No ownership transfer found — this unit's batch has not yet entered the supply chain from the manufacturer.",
    };
  }

  return {
    passed: true,
    reasonIfFail: "",
  };
}

// Check 4: Expiry Date
export function checkExpired(events: HederaSafetyCheckPayload[]) {
  const created = events.find((e) => e.eventType === "BATCH_CREATED");

  if (created?.expiryDate && new Date(created.expiryDate) < new Date()) {
    return {
      passed: false,
      reasonIfFail: `Batch expired on ${created.expiryDate}.`,
    };
  }

  return { passed: true, reasonIfFail: "" };
}

// Check 5: Ownership Transfer Complete
export function checkOwnership(events: HederaSafetyCheckPayload[]) {
  const ownershipTransfers = events.filter(
    (e) => e.eventType === "BATCH_OWNERSHIP",
  );

  const incomplete = ownershipTransfers.some(
    (t) => !t.transferFrom || !t.transferTo,
  );

  return incomplete
    ? { passed: false, reasonIfFail: "Ownership transfer mismatch detected." }
    : { passed: true, reasonIfFail: "" };
}

// Check 6: Duplicate Scan
export async function checkDuplicateScan(
  events: HederaSafetyCheckPayload[],
  unitId: string,
  batchId: string,
  organizationId: string,
  topicId: string,
) {
  const previouslyScanned = events.find((e) => e.eventType === "UNIT_SCANNED");

  if (previouslyScanned) {
    // Build reason for the failure
    const reason = `Duplicate scan detected. Unit previously scanned at lat: ${previouslyScanned.latitude}, long: ${previouslyScanned.longitude} on ${previouslyScanned.timestamp}.`;

    // Auto-flag the batch immediately with reason should a back up if it does not work
    await autoFlagBatchUnit(
      batchId,
      unitId,
      topicId ?? "",
      organizationId,
      reason,
    );

    return {
      passed: false,
      reasonIfFail: reason,
      duplicateScan: true,
    };
  }

  return {
    passed: true,
    reasonIfFail: "",
    duplicateScan: false,
  };
}

export async function runAllUnitAuthenticityChecks(
  events: HederaSafetyCheckPayload[],
  unitId: string,
  batchId: string,
  organizationId: string,
  topicId: string,
  serialNumber: string
) {
  // --- Sync checks first ---
  const syncChecks = [
    checkFlagged(events),
    checkBatchCreated(events),
    checkUnitInBatch(events, serialNumber),
    checkAtLeastOneTransfer(events),
    checkExpired(events),
    checkOwnership(events),
  ];

  // --- Async checks ---
  let duplicateCheckResult = null;

  if (unitId && batchId && organizationId && topicId) {
    duplicateCheckResult = await checkDuplicateScan(
      events,
      unitId,
      batchId,
      organizationId,
      topicId,
    );
  }

  // Combine all checks
  const allChecks = duplicateCheckResult
    ? [...syncChecks, duplicateCheckResult]
    : syncChecks;

  // Gather failed checks
  const failedChecks = allChecks.filter((checks) => !checks.passed);

  // Status logic
  const status: string = failedChecks.length ? "NOT_SAFE" : "AUTHENTIC";

  // Collect reasons
  const reasons = failedChecks.length
    ? failedChecks.map((c) => c.reasonIfFail)
    : ["All checks passed."];

  // Recommended action
  const recommendedAction =
    status === "NOT_SAFE"
      ? "Do not use this medicine. Contact your pharmacist or regulator immediately."
      : "This medicine is authentic and safe to use as prescribed.";

  const restul = {
    status,
    reasons,
    recommendedAction,
    duplicateScan: duplicateCheckResult?.duplicateScan,
  };

  return restul;
}
