# MediCheck API Request Flow

## Request Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT REQUEST                            │
└────────┬─────────────────────────────────────────┬───────────────┘
         │                                         │
         │ Frontend User                           │ Partner Machine
         │ (Clerk Session)                         │ (API Key)
         │                                         │
         ▼                                         ▼
┌────────────────────┐                  ┌────────────────────┐
│  POST /api/web/    │                  │ POST /api/partners/│
│  batches/create    │                  │ v1/batches/create  │
└────────┬───────────┘                  └────────┬───────────┘
         │                                        │
         │                                        │
    ┌────▼────────────────────────────────────────▼────┐
    │          MIDDLEWARE (middleware.ts)               │
    │  ✓ Routes /api/web/* → Skip to route handler     │
    │  ✓ Routes /api/partners/* → Skip to route handler│
    └────┬────────────────────────────────────────┬────┘
         │                                        │
         ▼                                        ▼
┌────────────────────┐                  ┌────────────────────┐
│  Route Handler     │                  │  Route Handler     │
│                    │                  │                    │
│  getActorFromClerk │                  │ getActorFromApiKey │
└────────┬───────────┘                  └────────┬───────────┘
         │                                        │
         │ ┌────────────────────────┐            │
         └►│  AUTH ADAPTERS         │◄───────────┘
           │  app/auth/             │
           │  - clerk.ts            │
           │  - apiKey.ts           │
           └────────┬───────────────┘
                    │
                    │ Returns Actor
                    ▼
           ┌────────────────────────┐
           │  Actor                 │
           │  {                     │
           │    type: "human",      │
           │    id: "usr_123",      │
           │    organizationId,     │
           │    permissions: [...]  │
           │  }                     │
           └────────┬───────────────┘
                    │
                    │ Passed to Use Case
                    ▼
           ┌────────────────────────┐
           │  USE CASE              │
           │  createBatch()         │
           │                        │
           │  1. Validate input     │
           │  2. Check permissions  │
           │  3. Verify access      │
           │  4. Execute logic      │
           └────────┬───────────────┘
                    │
                    │ Uses repositories
                    ▼
           ┌────────────────────────┐
           │  REPOSITORIES          │
           │  - batchRepository     │
           │  - orgRepository       │
           │                        │
           │  Abstracts Prisma      │
           └────────┬───────────────┘
                    │
                    │ Database queries
                    ▼
           ┌────────────────────────┐
           │  PRISMA / DATABASE     │
           │                        │
           │  Postgres              │
           └────────┬───────────────┘
                    │
                    │ Returns data
                    ▼
           ┌────────────────────────┐
           │  RESPONSE              │
           │  {                     │
           │    success: true,      │
           │    data: {...}         │
           │  }                     │
           └────────────────────────┘
```

---

## Example Request/Response

### Web API Request (Clerk Auth)

**Request**:
```http
POST /api/web/batches/create
Cookie: __session=clerk_session_abc123
Content-Type: application/json

{
  "organizationId": "org_manufacturer_001",
  "drugName": "Aspirin 500mg",
  "composition": "Acetylsalicylic acid 500mg",
  "batchSize": 10000,
  "manufacturingDate": "2024-01-15",
  "expiryDate": "2026-01-15",
  "storageInstructions": "Store below 25°C"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "batch": {
      "id": "batch_db_id_123",
      "batchId": "BATCH-1705320000abc12",
      "organizationId": "org_manufacturer_001",
      "drugName": "Aspirin 500mg",
      "batchSize": 10000,
      "status": "REGISTERED",
      "registryTopicId": "0.0.123456",
      "qrCodeData": "https://medicheck.app/verify/batch/BATCH-...",
      "createdAt": "2024-01-15T10:00:00.000Z"
    },
    "unitsCreated": 10000,
    "registryTopicId": "0.0.123456",
    "batchEventSeq": 1
  }
}
```

---

### Partner API Request (API Key Auth)

**Request**:
```http
POST /api/partners/v1/batches/create
X-API-Key: pk_live_abc123xyz456
Content-Type: application/json

{
  "organizationId": "org_manufacturer_002",
  "drugName": "Paracetamol 1000mg",
  "composition": "Acetaminophen 1000mg",
  "batchSize": 50000,
  "manufacturingDate": "2024-02-01",
  "expiryDate": "2026-02-01",
  "storageInstructions": "Store at room temperature"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "batch": {
      "id": "batch_db_id_456",
      "batchId": "BATCH-1706788800def34",
      "organizationId": "org_manufacturer_002",
      "drugName": "Paracetamol 1000mg",
      "batchSize": 50000,
      "status": "REGISTERED",
      "registryTopicId": "0.0.123457",
      "qrCodeData": "https://medicheck.app/verify/batch/BATCH-...",
      "createdAt": "2024-02-01T08:00:00.000Z"
    },
    "unitsCreated": 50000,
    "registryTopicId": "0.0.123457",
    "batchEventSeq": 1
  },
  "meta": {
    "timestamp": "2024-02-01T08:00:05.234Z",
    "apiVersion": "v1"
  }
}
```

---

## Error Response Examples

### 401 Unauthorized (Missing/Invalid Auth)

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Not authenticated",
    "statusCode": 401
  }
}
```

### 403 Forbidden (No Access to Resource)

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Actor does not have access to this organization",
    "statusCode": 403
  }
}
```

### 400 Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "statusCode": 400,
    "details": {
      "batchSize": "Must be a positive integer"
    }
  }
}
```

### 422 Business Rule Violation

```json
{
  "success": false,
  "error": {
    "code": "BUSINESS_RULE_VIOLATION",
    "message": "Batch already has a pending transfer",
    "statusCode": 422,
    "ruleCode": "PENDING_TRANSFER_EXISTS"
  }
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Batch not found",
    "statusCode": 404,
    "resourceType": "Batch",
    "resourceId": "BATCH-12345"
  }
}
```

---

## Authentication Flow Details

### Clerk Authentication (Web API)

```typescript
// 1. Clerk middleware validates session cookie
// 2. Route handler calls getActorFromClerk()
// 3. Auth adapter:
const { userId } = await auth();  // Clerk helper
if (!userId) throw new UnauthorizedError();

// 4. Lookup user in database
const teamMember = await userRepository.getByClerkIdOrThrow(userId);

// 5. Build Actor with permissions
return {
  type: "human",
  id: teamMember.id,
  organizationId: teamMember.organizationId,
  permissions: getPermissionsForRole(teamMember.role),
  metadata: { role: teamMember.role }
};
```

### API Key Authentication (Partner API)

```typescript
// 1. Extract API key from headers
const apiKey = extractApiKeyFromHeaders(req);
if (!apiKey) throw new UnauthorizedError("API key required");

// 2. Validate format
if (!isValidApiKeyFormat(apiKey)) {
  throw new UnauthorizedError("Invalid API key format");
}

// 3. Query database (Phase 3)
const keyRecord = await apiKeyRepository.findByKey(apiKey);
if (!keyRecord || !keyRecord.isActive) {
  throw new UnauthorizedError("Invalid or inactive API key");
}

// 4. Check rate limits
await rateLimiter.check(apiKey);

// 5. Build Actor
return {
  type: "machine",
  id: keyRecord.id,
  organizationId: keyRecord.organizationId,
  permissions: keyRecord.permissions,
  metadata: { keyName: keyRecord.name, tier: keyRecord.tier }
};
```

---

## Permission Checking

```typescript
// Use case permission check example
requirePermission(actor, Permissions.BATCHES_CREATE);

// Helper function checks:
if (actor.permissions.includes(Permissions.WILDCARD)) {
  return;  // Admin/regulator has full access
}

if (!actor.permissions.includes(Permissions.BATCHES_CREATE)) {
  throw new ForbiddenError("Insufficient permissions");
}

// Additional organization-level check
if (actor.organizationId !== input.organizationId) {
  throw new ForbiddenError("No access to this organization");
}
```

---

## Key Differences: Web vs Partner API

| Aspect | Web API (`/api/web/*`) | Partner API (`/api/partners/v1/*`) |
|--------|------------------------|-------------------------------------|
| **Authentication** | Clerk session cookie | API key in header |
| **Actor Type** | `human` | `machine` |
| **Rate Limiting** | Per user session | Per API key |
| **Response Meta** | None | `{ timestamp, apiVersion }` |
| **Use Cases** | Same business logic | Same business logic |
| **Error Format** | Same | Same |

**Key Point**: Both APIs use the **SAME use cases** and **SAME business logic**. Only authentication differs!

---

## Summary

✅ **One Backend** - Single codebase  
✅ **Two Entry Points** - `/api/web/*` and `/api/partners/v1/*`  
✅ **Different Authentication** - Clerk vs API keys  
✅ **Shared Business Logic** - Same use cases for both  
✅ **Clean Architecture** - Proper separation of concerns  
✅ **Type Safety** - Full TypeScript typing  
✅ **Error Handling** - Consistent error responses  
✅ **Validation** - Input validation at boundary  

This architecture enables MediCheck to serve both human users (via web UI) and machine clients (via API) with the same reliable business logic! 🚀
