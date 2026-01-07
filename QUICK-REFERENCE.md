# MediCheck Clean Architecture - Quick Reference

## 🗂️ Directory Structure

```
app/
├── api/
│   ├── web/                    # Frontend (Clerk auth)
│   ├── partners/v1/            # Partner API (API key)
│   └── verify/                 # Public endpoints
├── auth/                       # Auth adapters
├── usecases/                   # Business logic
├── infrastructure/
│   └── db/repositories/        # Database abstraction
└── types/                      # Shared types
```

---

## 🔐 Authentication

### Clerk (Web API)
```typescript
import { getActorFromClerk } from "@/app/auth";
const actor = await getActorFromClerk();
```

### API Key (Partner API)
```typescript
import { getActorFromApiKey } from "@/app/auth";
const actor = await getActorFromApiKey(req);
```

---

## 👤 Actor Model

```typescript
interface Actor {
  type: "human" | "machine";
  id: string;
  organizationId: string;
  permissions: string[];
  metadata?: Record<string, any>;
}
```

---

## ✅ Permissions

```typescript
import { Permissions, requirePermission } from "@/app/types/actor";

Permissions.WILDCARD               // Full access
Permissions.BATCHES_CREATE         // Create batches
Permissions.BATCHES_READ           // Read batches
Permissions.TRANSFERS_CREATE       // Create transfers
Permissions.TRANSFERS_UPDATE       // Accept/reject transfers

// Check permission in use case
requirePermission(actor, Permissions.BATCHES_CREATE);
```

---

## ❌ Error Handling

```typescript
import {
  UnauthorizedError,       // 401
  ForbiddenError,          // 403
  NotFoundError,           // 404
  ValidationError,         // 400
  BusinessRuleViolationError, // 422
  toErrorResponse,         // Convert to JSON
} from "@/app/types/errors";

// Throw custom errors
throw new ForbiddenError("No access to this resource");

// Convert to response
const errorResponse = toErrorResponse(error);
```

---

## 🔍 Validation

```typescript
import { validateInput, CreateBatchSchema } from "@/app/types/validation";

// Validate input
const input = validateInput(CreateBatchSchema, rawInput);
```

---

## 🗄️ Repositories

```typescript
import {
  batchRepository,
  organizationRepository,
  transferRepository,
  userRepository,
} from "@/app/infrastructure/db/repositories";

// Use in use cases
const batch = await batchRepository.getByBatchIdOrThrow(batchId);
const org = await organizationRepository.getByIdOrThrow(orgId);
```

---

## 🎯 Use Cases

```typescript
import { createBatch, listBatches, getBatch } from "@/app/usecases";

// Call from route handlers
const result = await createBatch(input, actor);
```

---

## 🛣️ Route Pattern

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getActorFromClerk } from "@/app/auth";
import { createBatch } from "@/app/usecases";
import { toErrorResponse } from "@/app/types/errors";

export async function POST(req: NextRequest) {
  try {
    const actor = await getActorFromClerk();
    const body = await req.json();
    const result = await createBatch(body, actor);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, { 
      status: errorResponse.statusCode 
    });
  }
}
```

---

## 📋 API Endpoints

### Web API (Clerk Auth)
```
POST   /api/web/batches/create
GET    /api/web/batches
GET    /api/web/batches/:batchId
POST   /api/web/transfers/initiate
PATCH  /api/web/transfers/:transferId
```

### Partner API (API Key)
```
POST   /api/partners/v1/batches/create
GET    /api/partners/v1/batches
GET    /api/partners/v1/batches/:batchId
POST   /api/partners/v1/transfers/initiate
PATCH  /api/partners/v1/transfers/:transferId
```

### Public API
```
POST   /api/verify/batch
```

---

## 🧪 Testing

### Unit Test Use Case
```typescript
import { CreateBatchUseCase } from "@/app/usecases/batches/createBatch";

// Mock repositories
const mockBatchRepo = { create: jest.fn() };
const mockOrgRepo = { getByIdOrThrow: jest.fn() };

// Test use case
const useCase = new CreateBatchUseCase(mockBatchRepo, mockOrgRepo);
await useCase.execute(input, actor);
```

### Integration Test Route
```typescript
import { POST } from "@/app/api/web/batches/create/route";

const req = new NextRequest("http://localhost/api/web/batches/create", {
  method: "POST",
  body: JSON.stringify(batchData),
});

const response = await POST(req);
expect(response.status).toBe(201);
```

---

## 🔧 Common Patterns

### Creating a New Use Case

1. **Define validation schema** in `app/types/validation.ts`
2. **Create use case class** with constructor accepting repositories
3. **Implement execute method**:
   - Validate input
   - Check permissions
   - Verify access
   - Execute business logic
4. **Export singleton and convenience function**

### Creating a New Route

1. **Create route file** in `app/api/web/` or `app/api/partners/v1/`
2. **Import auth adapter and use case**
3. **Implement handler**:
   - Authenticate
   - Parse input
   - Call use case
   - Return response
   - Handle errors

---

## 💡 Pro Tips

- **Always use repositories** - Never call Prisma directly in use cases
- **Validate at boundary** - Use Zod schemas at use case entry
- **Throw custom errors** - Use domain-specific error classes
- **Check permissions early** - Fail fast on authorization
- **Keep routes thin** - Business logic goes in use cases
- **DI-ready use cases** - Accept dependencies in constructor
- **Type everything** - Full TypeScript coverage

---

## 📚 Documentation

- `ARCHITECTURE-IMPLEMENTATION-SUMMARY.md` - Architecture overview
- `API-REQUEST-FLOW.md` - Request flow diagrams
- `MIGRATION-GUIDE.md` - Migration instructions
- `MediCheck-Extended-Architecture.md` - Original specs

---

## 🚀 Quick Start

1. **Import what you need**:
```typescript
import { getActorFromClerk } from "@/app/auth";
import { createBatch } from "@/app/usecases";
import { toErrorResponse } from "@/app/types/errors";
```

2. **Authenticate**:
```typescript
const actor = await getActorFromClerk();
```

3. **Execute use case**:
```typescript
const result = await createBatch(input, actor);
```

4. **Handle errors**:
```typescript
catch (error) {
  const errorResponse = toErrorResponse(error);
  return NextResponse.json(errorResponse, { 
    status: errorResponse.statusCode 
  });
}
```

---

**Built with Clean Architecture principles** 🏗️  
**One backend. Two entry points. Different authentication. Shared business logic.** ✨
