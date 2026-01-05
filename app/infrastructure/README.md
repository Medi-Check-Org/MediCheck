# Infrastructure Layer

This folder contains all **external integrations** - database, blockchain, AI, etc.

Business logic (use cases) calls infrastructure, never the other way around.

---

## 📁 Structure

```
infrastructure/
├── db/
│   ├── prisma.ts              # Prisma client instance
│   └── repositories/          # Data access layer
│       ├── batchRepository.ts
│       ├── transferRepository.ts
│       ├── organizationRepository.ts
│       ├── userRepository.ts
│       └── index.ts
│
├── blockchain/
│   └── hedera.ts              # Hedera HCS integration
│
└── ai/
    └── hotspotPrediction.ts   # ML prediction service
```

---

## 🗄️ Repositories

Repositories abstract database access. Use cases should **never** call Prisma directly.

### Using a Repository

```typescript
import { batchRepository } from "@/app/infrastructure/db/repositories";

// Get by ID
const batch = await batchRepository.getById("batch-123");

// List with filters
const batches = await batchRepository.list({
  organizationId: "org-1",
  status: "ACTIVE",
});

// Create
const newBatch = await batchRepository.create({
  drugName: "Aspirin",
  batchSize: 1000,
  // ...
});

// Update
const updated = await batchRepository.update("batch-123", {
  status: "FLAGGED",
});
```

### Repository Pattern

Each repository follows this pattern:

```typescript
// infrastructure/db/repositories/batchRepository.ts

import { prisma } from "@/lib/generated/prisma";

export const batchRepository = {
  async getById(id: string) {
    return prisma.medicationBatch.findUnique({
      where: { id },
      include: { organization: true },
    });
  },

  async list(filters: BatchFilters) {
    return prisma.medicationBatch.findMany({
      where: {
        organizationId: filters.organizationId,
        status: filters.status,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async create(data: CreateBatchData) {
    return prisma.medicationBatch.create({
      data,
    });
  },

  async update(id: string, data: UpdateBatchData) {
    return prisma.medicationBatch.update({
      where: { id },
      data,
    });
  },
};
```

---

## ⛓️ Blockchain (Hedera)

Hedera integration for immutable logging:

```typescript
import { logBatchEvent } from "@/app/infrastructure/blockchain/hedera";

// Log a batch event to HCS
await logBatchEvent(topicId, "BATCH_CREATED", {
  batchId: "batch-123",
  organizationId: "org-1",
  drugName: "Aspirin",
  batchSize: "1000",
  manufacturingDate: "2024-01-01",
  expiryDate: "2026-01-01",
});
```

### Supported Event Types

| Event | Description |
|-------|-------------|
| `BATCH_CREATED` | New batch registered |
| `BATCH_OWNERSHIP` | Ownership transferred |
| `BATCH_FLAG` | Batch flagged |
| `BATCH_UNITS_REGISTERED` | Units added to batch |

---

## 🤖 AI Services

AI/ML prediction services:

```typescript
import { predictHotspots } from "@/app/infrastructure/ai/hotspotPrediction";

const predictions = await predictHotspots({
  region: "Lagos",
  drugType: "Antimalarial",
  timeRange: "30d",
});
```

---

## 📝 Adding a New Repository

### 1. Create the repository file

```typescript
// infrastructure/db/repositories/alertRepository.ts

import { prisma } from "@/lib/generated/prisma";
import { Alert } from "@/lib/generated/prisma";

export interface CreateAlertData {
  batchId: string;
  type: string;
  message: string;
}

export interface AlertFilters {
  batchId?: string;
  type?: string;
  resolved?: boolean;
}

export const alertRepository = {
  async getById(id: string): Promise<Alert | null> {
    return prisma.alert.findUnique({
      where: { id },
    });
  },

  async list(filters: AlertFilters): Promise<Alert[]> {
    return prisma.alert.findMany({
      where: {
        batchId: filters.batchId,
        type: filters.type,
        resolved: filters.resolved,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async create(data: CreateAlertData): Promise<Alert> {
    return prisma.alert.create({
      data,
    });
  },

  async resolve(id: string): Promise<Alert> {
    return prisma.alert.update({
      where: { id },
      data: { resolved: true, resolvedAt: new Date() },
    });
  },
};
```

### 2. Export from index

```typescript
// infrastructure/db/repositories/index.ts

export { batchRepository } from "./batchRepository";
export { transferRepository } from "./transferRepository";
export { organizationRepository } from "./organizationRepository";
export { userRepository } from "./userRepository";
export { alertRepository } from "./alertRepository";  // Add this
```

### 3. Use in use cases

```typescript
import { alertRepository } from "@/app/infrastructure/db/repositories";

const alerts = await alertRepository.list({ batchId: "batch-123" });
```

---

## ⚠️ Important Rules

1. **Use cases call repositories** - Never import Prisma in use cases
2. **Repositories don't check permissions** - That's the use case's job
3. **Repositories don't throw business errors** - They throw DB errors
4. **Keep repositories focused** - One repository per entity
5. **Type everything** - Define interfaces for inputs/outputs

---

## 📋 Prisma Import

Always import Prisma from the generated location:

```typescript
// Correct
import { prisma } from "@/lib/generated/prisma";

// Wrong - old location
import { prisma } from "@/lib/prisma";
```
