/**
 * Helper to run tasks in batches with concurrency control
 */
export const runInBatches = async <T>(
  items: T[],
  batchSize: number,
  worker: (item: T) => Promise<void>
): Promise<void> => {
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    await Promise.all(chunk.map(worker));
  }
}