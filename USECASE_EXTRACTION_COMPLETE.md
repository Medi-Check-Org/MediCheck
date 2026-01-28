# Use Case Extraction - Phase 1 Complete ✅

## Summary

Successfully extracted business logic from API routes into a dedicated use case layer. This is the first step in transforming MediCheck into a platform that can support both human users (frontend) and machine clients (manufacturer APIs).

## What Was Accomplished

### 1. Created Use Case Layer Structure
- **src/usecases/batches/** - Batch management use cases
- **src/usecases/verification/** - Verification use cases
- **src/usecases/transfers/** - Transfer management use cases
- **src/usecases/organizations/** - Organization management use cases

### 2. Implemented Core Use Cases

#### Batches (3 use cases)
- ✅ `createBatch` - Complete batch creation with Hedera registration, unit generation, and HCS-10 announcements
- ✅ `listBatches` - Retrieve batches for an organization with filtering
- ✅ `getBatch` - Get detailed batch information

#### Verification (2 use cases)
- ✅ `verifyBatch` - Batch QR verification with transfer logic, fraud detection, and event logging
- ✅ `verifyUnit` - Unit QR verification with authenticity checks and ML fraud detection

#### Transfers (4 use cases)
- ✅ `initiateTransfer` - Create new ownership transfer request
- ✅ `listTransfers` - Retrieve transfers with direction filtering
- ✅ `updateTransferStatus` - Update transfer status (accept/reject/complete)
- ✅ `getTransfer` - Get detailed transfer information

#### Organizations (3 use cases)
- ✅ `getOrganization` - Retrieve organization details
- ✅ `listOrganizations` - List all organizations (admin/regulator)
- ✅ `updateOrganization` - Update organization information

### 3. Created Actor Model (src/types/actor.ts)
- Unified identity model for both human and machine actors
- Permission checking helpers
- Supports future API key authentication

### 4. Created Auth Helpers (src/auth/actorHelpers.ts)
- `getActorFromClerk()` - Converts Clerk authentication to Actor
- `getActorFromApiKey()` - Placeholder for future API key auth

### 5. Refactored Routes to Use Use Cases
Updated the following routes to use the new use case layer:
- ✅ `/api/batches` (POST) - createBatch
- ✅ `/api/batches/[orgId]` (GET) - listBatches
- ✅ `/api/organizations` (GET) - listOrganizations
- ✅ `/api/transfers` (GET) - listTransfers
- ✅ `/api/transfer/ownership` (POST, GET) - initiateTransfer, listTransfers

## Benefits Achieved

1. **Separation of Concerns** - Business logic is now independent of HTTP transport
2. **Reusability** - Use cases can be called from multiple entry points (web, partner API)
3. **Testability** - Business logic can be tested without HTTP layer
4. **Permission Management** - Centralized actor-based authorization
5. **Zero Breaking Changes** - Existing frontend continues to work unchanged

## Next Steps (Phase 2: API Route Separation)

The use case layer is now ready. The next phase is to:

1. **Create API Route Structure**
   - `app/api/web/*` - Frontend routes (Clerk auth)
   - `app/api/partners/v1/*` - Partner routes (API key auth)

2. **Implement Middleware**
   - Route requests to correct auth mechanism
   - Normalize to Actor model

3. **Implement API Key Authentication**
   - Create ApiKey model in database
   - Implement secure key generation and validation
   - Add scoped permissions

4. **Add Rate Limiting**
   - Protect partner APIs from abuse
   - Implement per-organization quotas

## File Structure Created

```
src/
├── auth/
│   └── actorHelpers.ts         # Auth → Actor converters
├── types/
│   └── actor.ts                # Unified Actor interface
└── usecases/
    ├── batches/
    │   ├── createBatch.ts
    │   ├── listBatches.ts
    │   ├── getBatch.ts
    │   └── index.ts
    ├── verification/
    │   ├── verifyBatch.ts
    │   ├── verifyUnit.ts
    │   └── index.ts
    ├── transfers/
    │   ├── initiateTransfer.ts
    │   ├── listTransfers.ts
    │   ├── updateTransferStatus.ts
    │   ├── getTransfer.ts
    │   └── index.ts
    └── organizations/
        ├── getOrganization.ts
        ├── listOrganizations.ts
        ├── updateOrganization.ts
        └── index.ts
```

## Usage Example

Before (route with business logic):
```typescript
export async function POST(req: Request) {
  const body = await req.json();
  // 200+ lines of business logic here...
}
```

After (route calling use case):
```typescript
export async function POST(req: Request) {
  const actor = await getActorFromClerk();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const body = await req.json();
  const result = await createBatch({ ...body }, actor);
  
  return NextResponse.json(result, { status: 201 });
}
```

## Notes

- All use cases perform permission checks using the Actor model
- Error handling is consistent across all use cases
- Use cases throw errors that routes catch and convert to HTTP responses
- Actor permissions currently hard-coded but ready for database-driven permissions

---

**Status**: Phase 1 Complete ✅  
**Ready for**: Phase 2 - API Route Separation
