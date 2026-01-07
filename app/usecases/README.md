# Use Cases Layer

This folder contains **all business logic** for MediCheck. Routes don't contain logic—they just call use cases.

---

## 📁 Structure

```
usecases/
├── batches/
│   ├── createBatch.ts      # Create a new medication batch
│   ├── listBatches.ts      # List batches with filters
│   ├── getBatch.ts         # Get single batch details
│   └── index.ts            # Exports
│
├── transfers/
│   ├── initiateTransfer.ts     # Start a batch transfer
│   ├── updateTransferStatus.ts # Accept/reject transfer
│   └── index.ts
│
├── verification/
│   ├── verifyBatch.ts      # Verify batch authenticity
│   └── index.ts
│
├── organizations/
│   ├── listOrganizations.ts
│   └── index.ts
│
└── index.ts                # Central exports
```

---

## 🧩 Use Case Pattern

Every use case follows this structure:

```typescript
export async function doSomething(
  input: DoSomethingInput,    // What data is needed
  actor: Actor                 // Who is making the request
): Promise<DoSomethingOutput> {
  
  // 1. VALIDATE - Parse input with Zod
  const validated = DoSomethingSchema.parse(input);

  // 2. AUTHORIZE - Check permissions
  requirePermission(actor, Permissions.SOMETHING_DO);

  // 3. EXECUTE - Do the actual work
  const result = await repository.doThing(validated);

  // 4. RETURN - Send back the result
  return { success: true, data: result };
}
```

---

## 📝 Creating a New Use Case

### 1. Create the file

```typescript
// usecases/batches/flagBatch.ts

import { Actor, Permissions, requirePermission } from "@/app/types/actor";
import { batchRepository } from "@/app/infrastructure/db/repositories";
import { FlagBatchSchema } from "@/app/types/validation";
import { NotFoundError, ForbiddenError } from "@/app/types/errors";

// Define input type
interface FlagBatchInput {
  batchId: string;
  reason: string;
}

// Define output type
interface FlagBatchOutput {
  batchId: string;
  status: string;
  flaggedAt: Date;
}

// The use case function
export async function flagBatch(
  input: FlagBatchInput,
  actor: Actor
): Promise<FlagBatchOutput> {
  // Validate
  const validated = FlagBatchSchema.parse(input);

  // Authorize
  requirePermission(actor, Permissions.BATCHES_UPDATE);

  // Get batch
  const batch = await batchRepository.getById(validated.batchId);
  if (!batch) {
    throw new NotFoundError("Batch not found");
  }

  // Check ownership
  if (batch.organizationId !== actor.organizationId) {
    throw new ForbiddenError("Cannot flag batch from another organization");
  }

  // Update
  const updated = await batchRepository.update(validated.batchId, {
    status: "FLAGGED",
    flagReason: validated.reason,
  });

  return {
    batchId: updated.id,
    status: updated.status,
    flaggedAt: updated.updatedAt,
  };
}
```

### 2. Export from index

```typescript
// usecases/batches/index.ts
export * from "./createBatch";
export * from "./listBatches";
export * from "./getBatch";
export * from "./flagBatch";  // Add this line
```

### 3. Use in routes

```typescript
import { flagBatch } from "@/app/usecases/batches";

const result = await flagBatch({ batchId, reason }, actor);
```

---

## 🔐 Permission Checking

Always check permissions before doing anything:

```typescript
import { requirePermission, Permissions } from "@/app/types/actor";

// Single permission
requirePermission(actor, Permissions.BATCHES_CREATE);

// Check manually if needed
import { hasPermission } from "@/app/types/actor";

if (hasPermission(actor, Permissions.BATCHES_DELETE)) {
  // Can delete
}
```

### Available Permissions

| Permission | Description |
|------------|-------------|
| `BATCHES_CREATE` | Create new batches |
| `BATCHES_READ` | View batch details |
| `BATCHES_UPDATE` | Modify batches |
| `BATCHES_DELETE` | Delete batches |
| `TRANSFERS_INITIATE` | Start transfers |
| `TRANSFERS_READ` | View transfers |
| `TRANSFERS_UPDATE` | Modify transfers |
| `TRANSFERS_ACCEPT` | Accept incoming transfers |
| `TRANSFERS_REJECT` | Reject transfers |
| `VERIFICATION_SCAN` | Scan QR codes |
| `VERIFICATION_READ` | View verification results |
| `ORGANIZATIONS_READ` | View organization info |
| `ORGANIZATIONS_UPDATE` | Modify organization |
| `ALL` | Admin wildcard (`*`) |

---

## ⚠️ Error Handling

Use custom error classes, not generic `Error`:

```typescript
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
  ConflictError,
} from "@/app/types/errors";

// Resource not found
throw new NotFoundError("Batch not found");

// Permission denied
throw new ForbiddenError("Cannot access this resource");

// Invalid input
throw new ValidationError("Invalid input", {
  batchSize: ["Must be positive number"],
});

// Already exists
throw new ConflictError("Batch ID already exists");
```

---

## 🧪 Testing

Use cases are easy to test because they're just functions:

```typescript
describe("createBatch", () => {
  it("should create a batch", async () => {
    const actor = mockActor({ permissions: [Permissions.BATCHES_CREATE] });
    
    const result = await createBatch({
      organizationId: "org-1",
      drugName: "Aspirin",
      batchSize: 100,
      manufacturingDate: "2024-01-01",
      expiryDate: "2026-01-01",
    }, actor);

    expect(result.batchId).toBeDefined();
    expect(result.drugName).toBe("Aspirin");
  });

  it("should reject without permission", async () => {
    const actor = mockActor({ permissions: [] });

    await expect(
      createBatch({ ... }, actor)
    ).rejects.toThrow(ForbiddenError);
  });
});
```

---

## 📋 Checklist for New Use Cases

- [ ] Input type defined
- [ ] Output type defined
- [ ] Zod schema for validation (if needed)
- [ ] Permission check with `requirePermission()`
- [ ] Proper error handling with custom errors
- [ ] Exported from index file
- [ ] Unit tests written
