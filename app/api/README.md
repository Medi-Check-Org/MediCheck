# API Routes

This folder contains all API endpoints. Routes are **thin wrappers** that:
1. Authenticate the request
2. Extract input data
3. Call a use case
4. Return the response

**No business logic in routes!**

---

## 📁 Structure

```
api/
├── web/                    # Frontend APIs (Clerk auth)
│   ├── batches/
│   │   └── route.ts       # GET /api/web/batches
│   └── transfers/
│       └── route.ts       # GET, POST /api/web/transfers
│
├── partners/               # Partner APIs (API key auth)
│   └── v1/                # Version 1
│       ├── batches/
│       │   ├── route.ts   # GET, POST /api/partners/v1/batches
│       │   └── [batchId]/
│       │       └── route.ts
│       └── transfers/
│           └── route.ts
│
└── (legacy routes)         # Old routes being migrated
```

---

## 🌐 Web Routes vs Partner Routes

| Aspect | Web (`/api/web/*`) | Partner (`/api/partners/v1/*`) |
|--------|-------------------|-------------------------------|
| **Users** | Dashboard users | External systems (ERP, MES) |
| **Auth** | Clerk (session) | API Key (header) |
| **Response** | Simple JSON | JSON with `meta` object |
| **Versioning** | No | Yes (`v1`, `v2`, etc.) |

---

## 📝 Web Route Template

```typescript
// app/api/web/batches/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getActorFromClerk } from "@/app/auth";
import { listBatches, createBatch } from "@/app/usecases/batches";
import { toErrorResponse } from "@/app/types/errors";

// GET /api/web/batches
export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate
    const actor = await getActorFromClerk();

    // 2. Extract input
    const { searchParams } = new URL(req.url);
    const input = {
      organizationId: searchParams.get("organizationId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    };

    // 3. Call use case
    const result = await listBatches(input, actor);

    // 4. Return response
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

// POST /api/web/batches
export async function POST(req: NextRequest) {
  try {
    const actor = await getActorFromClerk();
    const body = await req.json();

    const result = await createBatch(body, actor);

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: unknown) {
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
```

---

## 📝 Partner Route Template

```typescript
// app/api/partners/v1/batches/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getActorFromApiKey, extractApiKeyFromHeaders } from "@/app/auth";
import { listBatches, createBatch } from "@/app/usecases/batches";
import { toErrorResponse, UnauthorizedError } from "@/app/types/errors";

// GET /api/partners/v1/batches
export async function GET(req: NextRequest) {
  try {
    // 1. Extract API key from header
    const apiKey = extractApiKeyFromHeaders(req.headers);
    if (!apiKey) {
      throw new UnauthorizedError("Missing API key");
    }

    // 2. Authenticate
    const actor = await getActorFromApiKey(apiKey);

    // 3. Extract input
    const { searchParams } = new URL(req.url);
    const input = {
      organizationId: searchParams.get("organizationId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    };

    // 4. Call use case
    const result = await listBatches(input, actor);

    // 5. Return response with meta
    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        apiVersion: "v1",
      },
    });
  } catch (error: unknown) {
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
```

---

## 🔗 Dynamic Routes (with params)

For routes with URL parameters like `/batches/[batchId]`:

```typescript
// app/api/web/batches/[batchId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getActorFromClerk } from "@/app/auth";
import { getBatch } from "@/app/usecases/batches";
import { toErrorResponse } from "@/app/types/errors";

// IMPORTANT: In Next.js 15, params is a Promise!
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const actor = await getActorFromClerk();
    
    // Await the params!
    const { batchId } = await params;

    const result = await getBatch({ batchId }, actor);

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
```

---

## ⚠️ Common Mistakes

### ❌ Wrong: Business logic in route

```typescript
export async function POST(req: NextRequest) {
  const body = await req.json();
  
  // DON'T DO THIS - logic should be in use case
  const batch = await prisma.batch.create({ data: body });
  await hedera.logEvent("BATCH_CREATED", batch);
  
  return NextResponse.json(batch);
}
```

### ✅ Correct: Route calls use case

```typescript
export async function POST(req: NextRequest) {
  const actor = await getActorFromClerk();
  const body = await req.json();
  
  // Use case handles everything
  const result = await createBatch(body, actor);
  
  return NextResponse.json({ success: true, data: result });
}
```

### ❌ Wrong: Using `error: any`

```typescript
} catch (error: any) {
  return NextResponse.json({ error: error.message });
}
```

### ✅ Correct: Using `error: unknown`

```typescript
} catch (error: unknown) {
  const errorResponse = toErrorResponse(error);
  return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
}
```

### ❌ Wrong: Not awaiting params (Next.js 15)

```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: { batchId: string } }  // Wrong!
) {
  const batchId = params.batchId;  // This won't work
}
```

### ✅ Correct: Await params

```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const { batchId } = await params;  // Correct!
}
```

---

## 📋 Route Checklist

- [ ] Authenticate with correct method (Clerk vs API Key)
- [ ] Extract input from body/query/params
- [ ] Call use case (not direct DB/blockchain access)
- [ ] Use `error: unknown` in catch
- [ ] Use `toErrorResponse()` for error handling
- [ ] Await `params` for dynamic routes
- [ ] Partner routes include `meta` in response
