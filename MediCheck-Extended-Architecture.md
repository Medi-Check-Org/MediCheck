# MediCheck Extended Architecture & API Integration Guide

This document describes the **updated MediCheck code structure** after introducing a **partner API (API Gateway pattern)** while preserving the existing frontend + Clerk-based authentication flow.

The goal of this architecture is to:
- Support **human users (frontend)** and **machine clients (manufacturers, partners)**
- Avoid breaking existing functionality
- Share business logic safely
- Prepare MediCheck to evolve into a true platform

---

## 🧠 Architectural Principle

> **One backend. Two entry points. Different authentication. Shared business logic.**

- Frontend requests → Clerk authentication
- Partner API requests → API Key authentication
- Both converge on the same use-case layer

---

## 📁 Updated High-Level Folder Structure

```text
src/
├── app/
│   ├── api/
│   │   ├── web/                     # Frontend-facing APIs (Clerk-authenticated)
│   │   │   ├── batches/
│   │   │   │   └── route.ts
│   │   │   ├── verify/
│   │   │   │   ├── batch/[batchId]/route.ts
│   │   │   │   └── unit/[serialNumber]/route.ts
│   │   │   ├── transfer/
│   │   │   ├── organizations/
│   │   │   └── team-members/
│   │   │
│   │   ├── partners/                # Partner / Manufacturer APIs
│   │   │   └── v1/                  # Versioned API surface
│   │   │       ├── batches/
│   │   │       │   └── route.ts
│   │   │       ├── verify/
│   │   │       │   ├── batch/[batchId]/route.ts
│   │   │       │   └── unit/[serialNumber]/route.ts
│   │   │       ├── transfers/
│   │   │       └── webhooks/
│   │   │
│   │   └── (legacy)/                # Existing routes (temporary during migration)
│   │
│   ├── dashboard/                   # UI dashboards (unchanged)
│   ├── auth/                        # Auth pages (unchanged)
│   └── public pages...
│
├── middleware.ts                    # Request routing & auth selection
│
├── auth/                            # Authentication adapters
│   ├── clerk.ts                    # Clerk auth → Actor
│   ├── apiKey.ts                   # API Key auth → Actor
│   └── normalizeActor.ts           # Shared Actor normalizer
│
├── usecases/                        # Core business logic (MOST IMPORTANT)
│   ├── batches/
│   │   ├── createBatch.ts
│   │   ├── listBatches.ts
│   │   └── verifyBatch.ts
│   │
│   ├── transfers/
│   │   ├── initiateTransfer.ts
│   │   └── acceptTransfer.ts
│   │
│   ├── verification/
│   │   ├── verifyUnit.ts
│   │   └── verifyBatch.ts
│   │
│   └── organizations/
│       └── getOrganization.ts
│
├── infrastructure/
│   ├── db/
│   │   ├── prisma.ts               # Prisma client
│   │   └── repositories/
│   │       ├── batchRepo.ts
│   │       ├── transferRepo.ts
│   │       ├── organizationRepo.ts
│   │       └── apiKeyRepo.ts       # API key persistence
│   │
│   ├── blockchain/
│   │   ├── hedera.ts               # Hedera integration
│   │   └── verifySignature.ts
│   │
│   └── ai/
│       └── hotspotPrediction.ts
│
├── lib/                             # Utilities & helpers (legacy + shared)
│   ├── qrPayload.ts
│   ├── transfer-utils.ts
│   └── mockaroo-service.ts
│
├── types/
│   ├── actor.ts                    # Unified identity model
│   ├── permissions.ts
│   └── api.ts
│
└── prisma/
    └── schema.prisma
```

**Note: You don't have adhere strictly to this folder structure, the only necessary changes are:**
  - **separation of the apis into web and partner folders**
  - **inclusion of the usecases folder to hold the business logic used by the routes.**

---

## 🔐 Authentication Model

### Actor (Unified Identity)

All requests resolve to an `Actor` object:

```ts
Actor {
  id: string
  organizationId: string
  type: "human" | "machine"
  permissions: string[]
}
```

- **Humans** → Clerk-authenticated users
- **Machines** → API keys owned by organizations

Business logic never cares *how* the actor was authenticated.

---

## 🚪 Request Entry Points

### Frontend (Humans)
- Path: `/api/web/*`
- Auth: Clerk
- Session-based
- Used by dashboards and UI flows

### Partner API (Machines)
- Path: `/api/partners/v1/*`
- Auth: API Keys
- Token-based
- Designed for ERP / MES / external systems

---

## 🧠 Use Case Layer (Shared Logic)

All real business behavior lives here:

- Batch creation
- Verification
- Transfers
- Blockchain writes
- AI predictions

Both frontend routes and partner routes call the **same usecases**, ensuring:
- No duplication
- No behavior drift
- One place to test business rules

---

## 🔄 Middleware Responsibility

`middleware.ts` acts as a **traffic director**:

- Detects request type by path
- Applies the correct authentication strategy
- Attaches `actor` to request context
- Blocks unauthenticated access early

No business logic lives in middleware.

---

## 🗄️ Database Extension (API Keys)

A minimal new table is introduced:

```prisma
model ApiKey {
  id              String   @id @default(cuid())
  hashedKey       String
  organizationId  String
  scopes          String[]
  isActive        Boolean  @default(true)
  lastUsedAt      DateTime?
  expiresAt       DateTime?
  createdAt       DateTime @default(now())
}
```

---

## 🚀 Benefits of This Structure

- Zero breaking changes
- Clean separation of concerns
- Safe partner integrations
- Easy API versioning
- Ready for future service extraction
- Industry-standard platform evolution

---

## 🧭 Long-Term Evolution Path

This structure naturally evolves into:
1. Dedicated Partner API service
2. External API Gateway (AWS / Kong / Apigee)
3. Multi-tenant, SLA-backed integrations

Without breaking existing clients.



