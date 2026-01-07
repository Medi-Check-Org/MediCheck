# MediCheck App Architecture

This document explains the **refactored architecture** of MediCheck's backend. Read this before making changes.

---

## 📁 Folder Structure

```
app/
├── api/                    # API Routes (thin wrappers)
│   ├── web/               # Frontend APIs (Clerk auth)
│   └── partners/          # Partner APIs (API key auth)
│       └── v1/            # Versioned endpoints
│
├── auth/                   # Authentication adapters
│   ├── clerk.ts           # Clerk → Actor
│   ├── apiKey.ts          # API Key → Actor
│   └── normalizeActor.ts  # Shared utilities
│
├── usecases/              # Business logic (THE CORE)
│   ├── batches/
│   ├── transfers/
│   ├── verification/
│   └── organizations/
│
├── infrastructure/        # External integrations
│   ├── db/repositories/   # Database access
│   ├── blockchain/        # Hedera integration
│   └── ai/                # ML predictions
│
└── types/                 # TypeScript types
    ├── actor.ts           # Unified identity
    ├── errors.ts          # Error classes
    └── validation.ts      # Zod schemas
```

---

## 🧠 Core Concept: The Actor Model

Every request (human or machine) resolves to an **Actor**:

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

**Why?** Business logic doesn't care HOW you authenticated. It only cares WHAT you're allowed to do.

---

## 🚪 Two Entry Points, One Logic

```
┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │   Partner App   │
│   (Dashboard)   │     │   (ERP/MES)     │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
   /api/web/*              /api/partners/v1/*
   (Clerk Auth)            (API Key Auth)
         │                       │
         └───────────┬───────────┘
                     ▼
              ┌─────────────┐
              │  Use Cases  │  ← Business logic lives HERE
              └─────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
   Repositories            Blockchain
   (Prisma)                (Hedera)
```

---

## 📝 How to Add a New Feature

### Step 1: Create the Use Case

```typescript
// app/usecases/batches/archiveBatch.ts

import { Actor, Permissions, requirePermission } from "@/app/types/actor";
import { batchRepository } from "@/app/infrastructure/db/repositories";
import { ArchiveBatchSchema } from "@/app/types/validation";
import { NotFoundError } from "@/app/types/errors";

interface ArchiveBatchInput {
  batchId: string;
}

interface ArchiveBatchOutput {
  success: boolean;
  batchId: string;
}

export async function archiveBatch(
  input: ArchiveBatchInput,
  actor: Actor
): Promise<ArchiveBatchOutput> {
  // 1. Validate input
  const validated = ArchiveBatchSchema.parse(input);

  // 2. Check permissions
  requirePermission(actor, Permissions.BATCHES_UPDATE);

  // 3. Execute business logic
  const batch = await batchRepository.getById(validated.batchId);
  if (!batch) {
    throw new NotFoundError("Batch not found");
  }

  await batchRepository.update(validated.batchId, { status: "ARCHIVED" });

  // 4. Return result
  return {
    success: true,
    batchId: validated.batchId,
  };
}
```

### Step 2: Export from Index

```typescript
// app/usecases/batches/index.ts
export * from "./archiveBatch";
```

### Step 3: Create Web Route

```typescript
// app/api/web/batches/[batchId]/archive/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getActorFromClerk } from "@/app/auth";
import { archiveBatch } from "@/app/usecases/batches";
import { toErrorResponse } from "@/app/types/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const actor = await getActorFromClerk();
    const { batchId } = await params;

    const result = await archiveBatch({ batchId }, actor);

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
```

### Step 4: Create Partner Route (if needed)

```typescript
// app/api/partners/v1/batches/[batchId]/archive/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getActorFromApiKey, extractApiKeyFromHeaders } from "@/app/auth";
import { archiveBatch } from "@/app/usecases/batches";
import { toErrorResponse, UnauthorizedError } from "@/app/types/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const apiKey = extractApiKeyFromHeaders(req.headers);
    if (!apiKey) {
      throw new UnauthorizedError("Missing API key");
    }
    const actor = await getActorFromApiKey(apiKey);
    const { batchId } = await params;

    const result = await archiveBatch({ batchId }, actor);

    return NextResponse.json({
      success: true,
      data: result,
      meta: { timestamp: new Date().toISOString(), apiVersion: "v1" },
    });
  } catch (error: unknown) {
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
```

---

## ⚠️ Important Rules

### DO ✅

- Put ALL business logic in `usecases/`
- Use `Actor` for identity everywhere
- Use `requirePermission()` for access control
- Use Zod schemas for validation
- Use custom error classes (`NotFoundError`, `ValidationError`, etc.)
- Use `error: unknown` (not `error: any`)
- Await `params` in dynamic routes (Next.js 15)

### DON'T ❌

- Put business logic in routes
- Use `any` type
- Access database directly from routes
- Skip permission checks
- Throw plain `Error` objects

---

## 🔐 Authentication Quick Reference

### For Web Routes (Frontend)

```typescript
import { getActorFromClerk } from "@/app/auth";

const actor = await getActorFromClerk();
// Throws UnauthorizedError if not logged in
```

### For Partner Routes (API)

```typescript
import { getActorFromApiKey, extractApiKeyFromHeaders } from "@/app/auth";

const apiKey = extractApiKeyFromHeaders(req.headers);
if (!apiKey) {
  throw new UnauthorizedError("Missing API key");
}
const actor = await getActorFromApiKey(apiKey);
```

---

## 🧪 Testing Use Cases

Use cases are easy to test because they're pure functions:

```typescript
import { createBatch } from "@/app/usecases/batches";

const mockActor: Actor = {
  id: "user-1",
  type: "human",
  organizationId: "org-1",
  organizationType: "MANUFACTURER",
  permissions: [Permissions.BATCHES_CREATE],
};

const result = await createBatch(
  {
    drugName: "Paracetamol",
    batchSize: 1000,
    // ...
  },
  mockActor
);

expect(result.batchId).toBeDefined();
```

---

## 📚 Related Documentation

- [MediCheck-Extended-Architecture.md](../MediCheck-Extended-Architecture.md) - Full architecture overview
- [MediCheck-Partner-API-Implementation-Plan.md](../MediCheck-Partner-API-Implementation-Plan.md) - Implementation roadmap
- [API-REQUEST-FLOW.md](../API-REQUEST-FLOW.md) - Request lifecycle details
