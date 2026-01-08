# Types

This folder contains TypeScript types, interfaces, and constants used throughout the app.

---

## 📁 Files

| File | Purpose |
|------|---------|
| `actor.ts` | Actor model & permissions |
| `errors.ts` | Custom error classes |
| `validation.ts` | Zod schemas for input validation |

---

## 👤 Actor (`actor.ts`)

The unified identity model:

```typescript
interface Actor {
  id: string;
  type: "human" | "machine";
  organizationId: string;
  organizationType: string;
  permissions: string[];
  name?: string;
  email?: string;
}
```

### Permissions

```typescript
import { Permissions, requirePermission, hasPermission } from "@/app/types/actor";

// Check permission (throws if denied)
requirePermission(actor, Permissions.BATCHES_CREATE);

// Check permission (returns boolean)
if (hasPermission(actor, Permissions.BATCHES_DELETE)) {
  // Can delete
}
```

### Available Permissions

```typescript
Permissions.BATCHES_CREATE      // "batches:create"
Permissions.BATCHES_READ        // "batches:read"
Permissions.BATCHES_UPDATE      // "batches:update"
Permissions.BATCHES_DELETE      // "batches:delete"

Permissions.TRANSFERS_INITIATE  // "transfers:initiate"
Permissions.TRANSFERS_READ      // "transfers:read"
Permissions.TRANSFERS_UPDATE    // "transfers:update"
Permissions.TRANSFERS_ACCEPT    // "transfers:accept"
Permissions.TRANSFERS_REJECT    // "transfers:reject"

Permissions.VERIFICATION_SCAN   // "verification:scan"
Permissions.VERIFICATION_READ   // "verification:read"

Permissions.ORGANIZATIONS_READ   // "organizations:read"
Permissions.ORGANIZATIONS_UPDATE // "organizations:update"
Permissions.ORGANIZATIONS_LIST   // "organizations:list"

Permissions.TEAM_MEMBERS_MANAGE  // "team-members:manage"

Permissions.ALL                  // "*" (admin wildcard)
```

---

## ❌ Errors (`errors.ts`)

Custom error classes for consistent error handling:

```typescript
import {
  UnauthorizedError,   // 401 - Not logged in
  ForbiddenError,      // 403 - No permission
  NotFoundError,       // 404 - Resource not found
  ValidationError,     // 400 - Invalid input
  ConflictError,       // 409 - Already exists
} from "@/app/types/errors";
```

### Usage

```typescript
// Not found
throw new NotFoundError("Batch not found");

// Forbidden
throw new ForbiddenError("Cannot access this batch");

// Validation error with field details
throw new ValidationError("Invalid input", {
  batchSize: ["Must be a positive number"],
  expiryDate: ["Must be after manufacturing date"],
});

// Conflict
throw new ConflictError("Batch ID already exists");
```

### Converting to Response

```typescript
import { toErrorResponse } from "@/app/types/errors";

try {
  // ... do stuff
} catch (error: unknown) {
  const errorResponse = toErrorResponse(error);
  return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
}
```

Response format:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Batch not found"
  },
  "statusCode": 404
}
```

---

## ✅ Validation (`validation.ts`)

Zod schemas for input validation:

```typescript
import { CreateBatchSchema, ListBatchesSchema } from "@/app/types/validation";

// Validate input
const validated = CreateBatchSchema.parse(input);

// Safe parse (doesn't throw)
const result = CreateBatchSchema.safeParse(input);
if (!result.success) {
  throw new ValidationError("Invalid input", result.error.flatten().fieldErrors);
}
```

### Available Schemas

```typescript
// Batches
CreateBatchSchema
ListBatchesSchema
GetBatchSchema

// Transfers
InitiateTransferSchema
UpdateTransferStatusSchema

// Verification
VerifyBatchSchema
```

### Adding a New Schema

```typescript
// validation.ts

import { z } from "zod";

export const FlagBatchSchema = z.object({
  batchId: z.string().min(1, "Batch ID is required"),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
});

export type FlagBatchInput = z.infer<typeof FlagBatchSchema>;
```

---

## 📝 Best Practices

1. **Always validate input** - Use Zod schemas in use cases
2. **Use custom errors** - Not generic `Error`
3. **Type everything** - No `any` types
4. **Export from index** - Keep imports clean
