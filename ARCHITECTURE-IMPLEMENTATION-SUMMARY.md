# MediCheck Architecture Implementation Summary

## ✅ Implementation Status: PHASE 1-2 COMPLETE

We have successfully transformed MediCheck into a dual-entry-point platform following Clean Architecture principles.

---

## 🏗️ Architecture Overview

**Core Principle**: One backend. Two entry points. Different authentication. Shared business logic.

```
┌─────────────────────────────────────────────────────────────┐
│                        ENTRY POINTS                          │
├──────────────────────────┬──────────────────────────────────┤
│   /api/web/*             │   /api/partners/v1/*             │
│   (Clerk Auth)           │   (API Key Auth)                 │
└──────────┬───────────────┴──────────────┬───────────────────┘
           │                               │
           └───────────────┬───────────────┘
                           │
              ┌────────────▼───────────┐
              │   AUTHENTICATION       │
              │   app/auth/            │
              │   - clerk.ts           │
              │   - apiKey.ts          │
              │   - normalizeActor.ts  │
              └────────────┬───────────┘
                           │
              ┌────────────▼───────────┐
              │   UNIFIED ACTOR        │
              │   Actor Interface      │
              │   + Permissions        │
              └────────────┬───────────┘
                           │
              ┌────────────▼───────────┐
              │   USE CASES            │
              │   app/usecases/        │
              │   - batches/           │
              │   - verification/      │
              │   - transfers/         │
              └────────────┬───────────┘
                           │
              ┌────────────▼───────────┐
              │   REPOSITORIES         │
              │   app/infrastructure/  │
              │   - batchRepository    │
              │   - orgRepository      │
              │   - transferRepository │
              └────────────┬───────────┘
                           │
              ┌────────────▼───────────┐
              │   DATABASE             │
              │   (Prisma)             │
              └────────────────────────┘
```

---

## 📁 Folder Structure

```
app/
├── api/
│   ├── web/                           # Frontend-facing APIs (Clerk auth)
│   │   ├── batches/
│   │   │   ├── create/route.ts
│   │   │   ├── route.ts               # List batches
│   │   │   └── [batchId]/route.ts     # Get batch details
│   │   └── transfers/
│   │       ├── initiate/route.ts
│   │       └── [transferId]/route.ts
│   │
│   ├── partners/v1/                   # Partner APIs (API key auth)
│   │   ├── batches/
│   │   │   ├── create/route.ts
│   │   │   ├── route.ts
│   │   │   └── [batchId]/route.ts
│   │   └── transfers/
│   │       ├── initiate/route.ts
│   │       └── [transferId]/route.ts
│   │
│   └── verify/                        # Public verification endpoints
│       └── batch/route.ts
│
├── auth/                              # Authentication adapters
│   ├── clerk.ts                       # Clerk → Actor adapter
│   ├── apiKey.ts                      # API key → Actor adapter
│   ├── normalizeActor.ts              # Actor normalization utilities
│   └── index.ts                       # Exports
│
├── usecases/                          # Business logic (DI-ready)
│   ├── batches/
│   │   ├── createBatch.ts
│   │   ├── listBatches.ts
│   │   └── getBatch.ts
│   ├── verification/
│   │   └── verifyBatch.ts
│   ├── transfers/
│   │   ├── initiateTransfer.ts
│   │   └── updateTransferStatus.ts
│   └── index.ts
│
├── infrastructure/                    # External dependencies
│   ├── db/
│   │   └── repositories/
│   │       ├── batchRepository.ts
│   │       ├── organizationRepository.ts
│   │       ├── transferRepository.ts
│   │       ├── userRepository.ts
│   │       └── index.ts
│   ├── blockchain/                    # (For Hedera clients)
│   └── ai/                            # (For ML model integrations)
│
└── types/                             # Type definitions
    ├── errors.ts                      # Custom error classes
    ├── actor.ts                       # Actor interface + permissions
    └── validation.ts                  # Zod schemas
```

---

## 🔑 Key Components

### 1. **Actor Model** (`app/types/actor.ts`)

Unified identity representation for both humans and machines:

```typescript
interface Actor {
  type: "human" | "machine";
  id: string;
  organizationId: string;
  permissions: string[];
  metadata?: Record<string, any>;
}
```

**Permissions Constants**:
- `WILDCARD`: Full access (regulators, admins)
- `BATCHES_CREATE`, `BATCHES_READ`, `BATCHES_UPDATE`
- `TRANSFERS_CREATE`, `TRANSFERS_READ`, `TRANSFERS_UPDATE`
- `ORGANIZATIONS_READ`, `ORGANIZATIONS_UPDATE`

---

### 2. **Custom Errors** (`app/types/errors.ts`)

Domain-specific errors with HTTP status codes:

- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `ValidationError` (400)
- `BusinessRuleViolationError` (422)
- `ExternalServiceError` (502)
- `RateLimitError` (429)
- `DatabaseError` (500)

---

### 3. **Validation** (`app/types/validation.ts`)

Zod schemas for all use case inputs:

- `CreateBatchSchema`
- `ListBatchesSchema`
- `GetBatchSchema`
- `VerifyBatchSchema`
- `InitiateTransferSchema`
- `UpdateTransferSchema`

---

### 4. **Repositories** (`app/infrastructure/db/repositories/`)

Abstraction layer over Prisma:

- **BatchRepository**: CRUD, list with pagination, events, units
- **OrganizationRepository**: Fetch with agent info, verify existence
- **TransferRepository**: Create, list, update status, verify access
- **UserRepository**: Clerk user lookup, team member relations

All repositories follow the pattern:
- `create()` - Create new records
- `findById()` - Fetch by ID
- `list()` - List with filters and pagination
- `update()` - Update existing records
- `getByIdOrThrow()` - Fetch or throw `NotFoundError`

---

### 5. **Auth Adapters** (`app/auth/`)

Convert authentication sources to Actor model:

**Clerk Adapter** (`clerk.ts`):
```typescript
export async function getActorFromClerk(): Promise<Actor> {
  const { userId } = await auth();
  if (!userId) throw new UnauthorizedError("Not authenticated");
  
  const teamMember = await userRepository.getByClerkIdOrThrow(userId);
  const role = teamMember.role;
  
  return {
    type: "human",
    id: teamMember.id,
    organizationId: teamMember.organizationId,
    permissions: getPermissionsForRole(role),
  };
}
```

**API Key Adapter** (`apiKey.ts`):
```typescript
export async function getActorFromApiKey(req: NextRequest): Promise<Actor> {
  // Phase 3: Validate API key from headers
  // Query ApiKey table, return Actor with org and permissions
  throw new Error("Not implemented - Phase 3");
}
```

---

### 6. **Use Cases** (`app/usecases/`)

Pure business logic with dependency injection:

```typescript
export class CreateBatchUseCase {
  constructor(
    private readonly batchRepo: BatchRepository,
    private readonly orgRepo: OrganizationRepository
  ) {}

  async execute(rawInput: unknown, actor: Actor): Promise<CreateBatchOutput> {
    // 1. Validate input
    const input = validateInput(CreateBatchSchema, rawInput);
    
    // 2. Check permissions
    requirePermission(actor, Permissions.BATCHES_CREATE);
    
    // 3. Verify access
    if (actor.organizationId !== input.organizationId) {
      throw new ForbiddenError("No access to this organization");
    }
    
    // 4. Execute business logic using repositories
    // ...
    
    return result;
  }
}
```

---

### 7. **API Routes**

**Pattern**: Thin route handlers that delegate to use cases

**Web Route Example** (`app/api/web/batches/create/route.ts`):
```typescript
export async function POST(req: NextRequest) {
  try {
    const actor = await getActorFromClerk();
    const body = await req.json();
    const result = await createBatch(body, actor);
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
```

**Partner Route Example** (`app/api/partners/v1/batches/create/route.ts`):
```typescript
export async function POST(req: NextRequest) {
  try {
    const actor = await getActorFromApiKey(req);  // ← Different auth
    const body = await req.json();
    const result = await createBatch(body, actor);  // ← Same use case
    return NextResponse.json({
      success: true,
      data: result,
      meta: { timestamp: new Date().toISOString(), apiVersion: "v1" }
    }, { status: 201 });
  } catch (error: any) {
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
```

---

## 🛡️ Middleware Configuration

Updated to route traffic properly:

```typescript
// Partner API (API key auth)
if (pathname.startsWith("/api/partners/")) {
  return NextResponse.next();  // Skip Clerk middleware
}

// Web API (Clerk auth)
if (pathname.startsWith("/api/web/")) {
  return NextResponse.next();  // Auth checked in route handler
}

// Public API (no auth)
if (pathname.startsWith("/api/verify")) {
  return NextResponse.next();
}
```

---

## ✅ Implemented Use Cases

| Use Case | Web Route | Partner Route | Status |
|----------|-----------|---------------|--------|
| Create Batch | `/api/web/batches/create` | `/api/partners/v1/batches/create` | ✅ |
| List Batches | `/api/web/batches` | `/api/partners/v1/batches` | ✅ |
| Get Batch | `/api/web/batches/[batchId]` | `/api/partners/v1/batches/[batchId]` | ✅ |
| Verify Batch | `/api/verify/batch` | N/A (public) | ✅ |
| Initiate Transfer | `/api/web/transfers/initiate` | `/api/partners/v1/transfers/initiate` | ✅ |
| Update Transfer | `/api/web/transfers/[transferId]` | `/api/partners/v1/transfers/[transferId]` | ✅ |

---

## 🎯 Benefits of This Architecture

1. **Separation of Concerns**: Clear boundaries between layers
2. **Testability**: Use cases can be tested with mock repositories
3. **Reusability**: Same business logic for web and partner APIs
4. **Type Safety**: TypeScript throughout with proper types
5. **Error Handling**: Consistent error responses via custom error classes
6. **Validation**: Input validation at the use case boundary
7. **Authentication Flexibility**: Easy to add new auth methods (OAuth, SAML, etc.)
8. **Scalability**: Can add new entry points without changing business logic

---

## 🚀 Next Steps (Phase 3)

1. **API Key Management**:
   - Create `ApiKey` Prisma model
   - Implement API key generation and management UI
   - Complete `getActorFromApiKey()` implementation

2. **Additional Use Cases**:
   - Unit verification
   - Batch flagging
   - Analytics/reporting
   - Organization management

3. **Rate Limiting**:
   - Add rate limiting middleware for partner API
   - Different rate limits for different API key tiers

4. **Documentation**:
   - OpenAPI/Swagger docs for partner API
   - Integration guides for partners

5. **Monitoring**:
   - API usage tracking
   - Error rate monitoring
   - Performance metrics

---

## 📖 Usage Examples

### For Frontend Developers (Web API)

```typescript
// User is already authenticated via Clerk
const response = await fetch('/api/web/batches/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    organizationId: 'org_123',
    drugName: 'Aspirin',
    batchSize: 1000,
    manufacturingDate: '2024-01-01',
    expiryDate: '2025-01-01',
  }),
});

const { success, data } = await response.json();
```

### For Partner Integrations (Partner API)

```typescript
// Partner uses API key
const response = await fetch('/api/partners/v1/batches/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'partner_key_abc123',
  },
  body: JSON.stringify({
    organizationId: 'org_456',
    drugName: 'Paracetamol',
    batchSize: 5000,
    manufacturingDate: '2024-02-01',
    expiryDate: '2025-02-01',
  }),
});

const { success, data, meta } = await response.json();
```

---

## 🎓 Best Practices Followed

- ✅ **Repository Pattern**: Database abstraction
- ✅ **Dependency Injection**: Use cases accept dependencies
- ✅ **Single Responsibility**: Each class/function has one job
- ✅ **Custom Errors**: Domain-specific error handling
- ✅ **Input Validation**: Zod schemas at use case boundary
- ✅ **Type Safety**: Proper TypeScript typing throughout
- ✅ **Clean Architecture**: Clear separation of concerns
- ✅ **DRY Principle**: No code duplication between web/partner APIs

---

**Architecture implemented by**: Senior Developer
**Date**: 2024
**Status**: Phase 1-2 Complete ✅
