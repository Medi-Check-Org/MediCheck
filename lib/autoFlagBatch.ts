import { HederaLogPayload } from "@/utils";
import { prisma } from "./prisma";
import { hedera2Client } from "./hedera2Client";

export async function autoFlagBatchUnit(
  batchId: string,
  unitId: string,
  topicId: string,
  organizationId: string,
  flagReason: string,
) {
  // 1. Update the unit in Postgres first
  await prisma.medicationUnit.update({
    where: { id: unitId },
    data: {
      status: "FLAGGED",
    },
  });

  // prepare payload for log event
  const payload: HederaLogPayload = {
    batchId,
    unitId,
    organizationId,
    flagReason,
  };

  // Compose event message
  const message = JSON.stringify({
    type: "EVENT_LOG",
    eventType: "UNIT_FLAGGED",
    timestamp: new Date().toISOString(),
    ...payload,
  });

  // Post to Hedera
  const response = await hedera2Client.registerEntry(topicId, {
    targetTopicId: topicId,
    metadata: message,
  });

  //
  if (!response.success) {
    throw new Error(`Failed to auto-flag unit ${unitId}`);
  }
}
