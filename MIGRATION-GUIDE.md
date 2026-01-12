# Migration Guide: Old Routes → New Architecture

## Overview

This guide explains how to migrate from the old route structure to the new clean architecture with separate web and partner APIs.

---

## Route Migration Map

### Batch Routes

| Old Route | New Web Route | New Partner Route |
|-----------|---------------|-------------------|
| `POST /api/batches` | `POST /api/web/batches/create` | `POST /api/partners/v1/batches/create` |
| `GET /api/batches` | `GET /api/web/batches` | `GET /api/partners/v1/batches` |
| `GET /api/batches/:id` | `GET /api/web/batches/:batchId` | `GET /api/partners/v1/batches/:batchId` |

### Transfer Routes

| Old Route | New Web Route | New Partner Route |
|-----------|---------------|-------------------|
| `POST /api/transfers` | `POST /api/web/transfers/initiate` | `POST /api/partners/v1/transfers/initiate` |
| `PATCH /api/transfers/:id` | `PATCH /api/web/transfers/:transferId` | `PATCH /api/partners/v1/transfers/:transferId` |

### Verification Routes (No Change)

| Route | Status |
|-------|--------|
| `POST /api/verify/batch` | ✅ Remains public |

---

## Code Changes Required

### Frontend (Web Application)

#### Before (Old)
```typescript
// Old batch creation
const response = await fetch('/api/batches', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(batchData),
});
```

#### After (New)
```typescript
// New batch creation
const response = await fetch('/api/web/batches/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(batchData),
});
```

**Note**: Clerk authentication is still handled automatically via cookies.

---

### Partner Integration (API Clients)

#### Before (Not Supported)
Partners had to use the same routes as the web interface, requiring Clerk authentication.

#### After (New)
```typescript
// Partner batch creation with API key
const response = await fetch('/api/partners/v1/batches/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Medicheck-Api-Key': 'your-api-key-here',  // ← New API key auth
  },
  body: JSON.stringify(batchData),
});
```

---

## File-by-File Migration Tasks

### ✅ Completed Files (New Architecture)

These files are already implemented and ready to use:

**Types & Infrastructure**:
- ✅ `app/types/errors.ts` - Custom error classes
- ✅ `app/types/actor.ts` - Actor model
- ✅ `app/types/validation.ts` - Zod schemas
- ✅ `app/infrastructure/db/repositories/batchRepository.ts`
- ✅ `app/infrastructure/db/repositories/organizationRepository.ts`
- ✅ `app/infrastructure/db/repositories/transferRepository.ts`
- ✅ `app/infrastructure/db/repositories/userRepository.ts`

**Authentication**:
- ✅ `app/auth/clerk.ts` - Clerk auth adapter
- ✅ `app/auth/apiKey.ts` - API key adapter (placeholder for Phase 3)

**Use Cases**:
- ✅ `app/usecases/batches/createBatch.ts`
- ✅ `app/usecases/batches/listBatches.ts`
- ✅ `app/usecases/batches/getBatch.ts`
- ✅ `app/usecases/verification/verifyBatch.ts`
- ✅ `app/usecases/transfers/initiateTransfer.ts`
- ✅ `app/usecases/transfers/updateTransferStatus.ts`

**Web API Routes**:
- ✅ `app/api/web/batches/create/route.ts`
- ✅ `app/api/web/batches/route.ts`
- ✅ `app/api/web/batches/[batchId]/route.ts`
- ✅ `app/api/web/transfers/initiate/route.ts`
- ✅ `app/api/web/transfers/[transferId]/route.ts`

**Partner API Routes**:
- ✅ `app/api/partners/v1/batches/create/route.ts`
- ✅ `app/api/partners/v1/batches/route.ts`
- ✅ `app/api/partners/v1/batches/[batchId]/route.ts`
- ✅ `app/api/partners/v1/transfers/initiate/route.ts`
- ✅ `app/api/partners/v1/transfers/[transferId]/route.ts`

**Public Routes**:
- ✅ `app/api/verify/batch/route.ts`

**Middleware**:
- ✅ `middleware.ts` - Updated to route web and partner traffic

---

### ⚠️ Deprecated Files (Old Architecture)

These files can be safely deleted or refactored:

**Old API Routes**:
- ❌ `app/api/batches/route.ts` - Replace with new web/partner routes
- ❌ `app/api/transfers/route.ts` - Replace with new web/partner routes
- ❌ Any other routes directly using Prisma

**Note**: Don't delete these yet until you've fully migrated frontend code to use new routes!

---

## Migration Checklist

### Phase 1: Setup (✅ COMPLETE)
- [x] Create new folder structure
- [x] Implement types (errors, actor, validation)
- [x] Implement repositories
- [x] Implement auth adapters
- [x] Implement use cases
- [x] Create web API routes
- [x] Create partner API routes
- [x] Update middleware

### Phase 2: Frontend Migration (TODO)
- [ ] Update all frontend API calls to use `/api/web/*` routes
- [ ] Test all frontend functionality
- [ ] Update any hardcoded API URLs
- [ ] Update API documentation

### Phase 3: Partner API Setup (TODO)
- [ ] Create `ApiKey` Prisma model
- [ ] Implement API key management UI
- [ ] Complete `getActorFromApiKey()` in `app/auth/apiKey.ts`
- [ ] Add rate limiting for partner API
- [ ] Generate OpenAPI/Swagger documentation
- [ ] Create partner onboarding guide

### Phase 4: Cleanup (TODO)
- [ ] Delete old route files after verifying migration
- [ ] Remove unused imports
- [ ] Update tests
- [ ] Deploy and monitor

---

## Testing the New Routes

### Test Web API (Clerk Auth)

```bash
# Requires valid Clerk session cookie
curl -X POST http://localhost:3000/api/web/batches/create \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=your_clerk_session" \
  -d '{
    "organizationId": "org_123",
    "drugName": "Test Drug",
    "batchSize": 1000,
    "manufacturingDate": "2024-01-01",
    "expiryDate": "2025-01-01"
  }'
```

### Test Partner API (API Key Auth)

```bash
# Requires valid API key (Phase 3)
curl -X POST http://localhost:3000/api/partners/v1/batches/create \
  -H "Content-Type: application/json" \
  -H "Medicheck-Api-Key: pk_test_abc123" \
  -d '{
    "organizationId": "org_456",
    "drugName": "Test Drug",
    "batchSize": 5000,
    "manufacturingDate": "2024-01-01",
    "expiryDate": "2025-01-01"
  }'
```

### Test Public Verification

```bash
# No auth required
curl -X POST http://localhost:3000/api/verify/batch \
  -H "Content-Type: application/json" \
  -d '{
    "batchId": "BATCH-123456",
    "signature": "signature_hash"
  }'
```

---

## Common Issues & Solutions

### Issue 1: Old Routes Still Being Called

**Problem**: Frontend still using `/api/batches` instead of `/api/web/batches/create`

**Solution**: Search codebase for old API paths:
```bash
# Search for old batch routes
grep -r "/api/batches" app/ --include="*.ts" --include="*.tsx"

# Search for old transfer routes
grep -r "/api/transfers" app/ --include="*.ts" --include="*.tsx"
```

---

### Issue 2: 404 Not Found on New Routes

**Problem**: New routes return 404

**Solution**: Verify middleware config in `middleware.ts`:
```typescript
// Should skip Clerk middleware for new routes
if (pathname.startsWith("/api/web/") || pathname.startsWith("/api/partners/")) {
  return NextResponse.next();
}
```

---

### Issue 3: Authorization Errors

**Problem**: 403 Forbidden on valid requests

**Solution**: Check Actor permissions:
```typescript
// Debug in auth adapter
console.log("Actor:", actor);
console.log("Permissions:", actor.permissions);
console.log("Required permission:", Permissions.BATCHES_CREATE);
```

---

## Rollback Plan

If issues arise, you can temporarily rollback:

1. **Revert middleware changes**:
   ```typescript
   // Temporarily allow old routes
   if (pathname.startsWith("/api/batches") || pathname.startsWith("/api/transfers")) {
     return NextResponse.next();
   }
   ```

2. **Keep old route files** until migration is complete

3. **Use feature flags** to gradually roll out new routes

---

## Benefits After Migration

✅ **Better separation of concerns** - Clear layer boundaries  
✅ **Easier testing** - Use cases can be tested independently  
✅ **Partner API support** - Machine-to-machine integration  
✅ **Consistent error handling** - Unified error responses  
✅ **Type safety** - Full TypeScript coverage  
✅ **Scalability** - Easy to add new authentication methods  
✅ **Maintainability** - Cleaner, more organized code  

---

## Next Steps

1. ✅ **Review this guide** - Understand the changes
2. ⏳ **Update frontend** - Migrate API calls to `/api/web/*`
3. ⏳ **Test thoroughly** - Verify all functionality works
4. ⏳ **Implement Phase 3** - Add API key management
5. ⏳ **Clean up** - Delete old route files
6. ⏳ **Document** - Update API documentation for partners

---

**Questions?** Refer to:
- `ARCHITECTURE-IMPLEMENTATION-SUMMARY.md` - High-level architecture overview
- `API-REQUEST-FLOW.md` - Detailed request flow diagrams
- `MediCheck-Extended-Architecture.md` - Original architecture document
