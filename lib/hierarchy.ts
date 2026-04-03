import { prisma } from "./prisma";

export async function getFullLineageTopicIds(batchId: string, topicIds: string[] = []): Promise<string[]> {
    
  const batch = await prisma.medicationBatch.findUnique({
    where: { id: batchId },
    select: { registryTopicId: true, parentBatchId: true }
  });

  if (!batch) return topicIds;

  // Add current topic if it exists
  if (batch.registryTopicId) {
    topicIds.push(batch.registryTopicId);
  }

  // If there's a parent, recurse upwards
  if (batch.parentBatchId) {
    return getFullLineageTopicIds(batch.parentBatchId, topicIds);
  }

  return topicIds;
}