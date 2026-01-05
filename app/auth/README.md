# Authentication Layer

This folder contains authentication adapters that convert different auth methods into a unified `Actor` model.

---

## 🔐 The Actor Model

All authenticated requests resolve to an `Actor`:

```typescript
interface Actor {
  id: string;              // User or API key ID
  type: "human" | "machine";
  organizationId: string;
  organizationType: string;
  permissions: string[];
  name?: string;
  email?: string;
}
```

**Why?** Business logic doesn't need to know HOW you authenticated. It just needs to know WHO you are and WHAT you can do.

---

## 📁 Files

| File | Purpose |
|------|---------|
| `clerk.ts` | Clerk session → Actor |
| `apiKey.ts` | API key header → Actor |
| `normalizeActor.ts` | Shared utilities |
| `index.ts` | Central exports |

---

## 🎯 Usage

### In Web Routes (Clerk)

```typescript
import { getActorFromClerk } from "@/app/auth";

export async function GET(req: NextRequest) {
  // Throws UnauthorizedError if not logged in
  const actor = await getActorFromClerk();
  
  // Now use actor in use case
  const result = await listBatches(input, actor);
}
```

### In Partner Routes (API Key)

```typescript
import { getActorFromApiKey, extractApiKeyFromHeaders } from "@/app/auth";
import { UnauthorizedError } from "@/app/types/errors";

export async function GET(req: NextRequest) {
  // Extract key from Authorization header
  const apiKey = extractApiKeyFromHeaders(req.headers);
  if (!apiKey) {
    throw new UnauthorizedError("Missing API key");
  }
  
  // Validate and get actor
  const actor = await getActorFromApiKey(apiKey);
  
  // Now use actor in use case
  const result = await listBatches(input, actor);
}
```

---

## 🔑 API Key Format

API keys are passed in the `Authorization` header:

```
Authorization: Bearer mk_live_abc123xyz...
```

The `extractApiKeyFromHeaders` function handles:
- `Bearer <token>` format
- `ApiKey <token>` format
- Just `<token>` (raw)

---

## 📝 Adding a New Auth Method

If you need to add a new authentication method (e.g., JWT, OAuth):

### 1. Create the adapter

```typescript
// app/auth/jwt.ts

import { Actor } from "@/app/types/actor";
import { UnauthorizedError } from "@/app/types/errors";

export async function getActorFromJWT(token: string): Promise<Actor> {
  // Validate token
  const payload = verifyJWT(token);
  if (!payload) {
    throw new UnauthorizedError("Invalid token");
  }
  
  // Load user/organization
  const user = await userRepository.getById(payload.userId);
  
  // Build actor
  return {
    id: user.id,
    type: "human",
    organizationId: user.organizationId,
    organizationType: user.organization.type,
    permissions: getPermissionsForRole(user.role),
    name: user.name,
    email: user.email,
  };
}
```

### 2. Export from index

```typescript
// app/auth/index.ts
export { getActorFromJWT } from "./jwt";
```

### 3. Use in routes

```typescript
import { getActorFromJWT } from "@/app/auth";

const actor = await getActorFromJWT(token);
```

---

## 🛡️ Security Notes

1. **Never log full API keys** - Use `sanitizeActorForLogging()`
2. **API keys are hashed** - We store hashes, not plain keys
3. **Keys have scopes** - Limit what each key can do
4. **Keys can expire** - Set `expiresAt` for temporary access
5. **Track usage** - `lastUsedAt` for auditing

---

## 📋 Exports

```typescript
// All exports from app/auth/index.ts

// Clerk auth
export { getActorFromClerk, getActorFromClerkOptional } from "./clerk";

// API key auth
export { getActorFromApiKey, extractApiKeyFromHeaders, isValidApiKeyFormat } from "./apiKey";

// Utilities
export { normalizeActor, mergePermissions, sanitizeActorForLogging } from "./normalizeActor";
```
