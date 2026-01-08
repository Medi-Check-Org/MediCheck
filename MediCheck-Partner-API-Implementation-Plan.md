# MediCheck API Platform Extension – Feature & Task Breakdown

This document outlines the **features to be implemented** and the **specific engineering tasks** required to extend MediCheck from a frontend-only system into a **platform that supports partner (manufacturer) API integrations**, while keeping existing functionality stable.

This is intended for:
- Sprint planning
- Task assignment
- Technical alignment across the team

---

## 🎯 Objective

Extend the current MediCheck backend to:
- Serve both **human users (frontend)** and **machine clients (manufacturers)**
- Support API-key-based authentication without altering Clerk-based auth
- Share business logic safely across both access patterns
- Prepare the system for future scale and external integrations

---

## 🧩 Feature Breakdown & Tasks

---

## 1 Refactor Business Logic into a Use Case Layer

### Goal
Decouple business logic from API routes so it can be reused by both frontend and partner APIs.

### Tasks
- Identify all API routes containing business logic
- Extract logic into dedicated `usecases/` modules
- Ensure each use case:
  - Accepts `(input, actor)`
  - Performs permission checks
  - Calls repositories, blockchain, and AI services
- Update existing API routes to call use cases instead of containing logic
- Add unit tests for use cases

### Deliverables
- `src/usecases/` directory populated
- API routes reduced to transport + response logic
- Passing tests for critical use cases

---

## 2 Split API Routes into Web and Partner Layers

### Goal
Create two explicit API entry points:
- `/api/web/*` for frontend (Clerk-authenticated)
- `/api/partners/v1/*` for manufacturers (API-key-authenticated)

### Tasks
- Create `app/api/web/` directory
- Move existing frontend-used routes into `web/`
- Create parallel routes under `partners/v1/`
- Ensure both route types call the same use cases
- Keep legacy routes temporarily (if needed) during migration

### Deliverables
- Clear separation of API layers
- No breaking changes to frontend
- Initial partner endpoints functional

---

## 3 Implement Middleware Routing & Auth Selection

### Goal
Route incoming requests to the correct authentication mechanism based on path.

### Tasks
- Extend `middleware.ts` to:
  - Detect `/api/web/*` routes → Clerk auth
  - Detect `/api/partners/*` routes → API key auth
  - Continue protecting `/dashboard/*`
- Normalize authenticated identities into a shared `Actor` object
- Block unauthenticated requests early

### Deliverables
- Middleware acting as traffic director
- No auth logic inside business use cases
- Consistent `actor` available downstream

---

## 4 Implement API Key Authentication

### Goal
Allow manufacturers to authenticate programmatically using API keys.

### Tasks
- Design and add `ApiKey` model to Prisma schema
- Implement secure API key generation & hashing
- Create API key repository (`apiKeyRepo`)
- Implement API key validation logic
- Support key expiration and revocation
- Attach scopes/permissions to keys
- Track last-used timestamps for auditing
- include api routes to send keys to manufacturers on the frontend

### Deliverables
- Working API key authentication
- Secure storage and validation
- Scoped permissions per key

---

## 5 Implement Rate Limiting & Quotas

### Goal
Protect the system from abuse and isolate partner traffic from frontend traffic.

### Tasks
- Choose rate-limiting strategy (e.g. Redis token bucket)
- Implement per-API-key rate limiting
- Implement per-organization quotas (optional phase 2)
- Apply stricter limits to `/api/partners/*`
- Add logging for rate-limit violations

### Deliverables
- Rate-limited partner APIs
- No impact on frontend UX
- Observability into API usage

---

## 6 API Versioning Strategy

### Goal
Ensure future API changes do not break existing partner integrations.

### Tasks
- Introduce `/v1/` namespace for partner APIs
- Freeze v1 contracts once published
- Define rules for backward-incompatible changes
- Prepare structure for `/v2/` in future

### Deliverables
- Versioned partner API paths
- Clear versioning conventions
- Stable external contract

---

## 7 Testing Strategy

### Goal
Ensure correctness, security, and non-regression.

### Tasks
- Unit tests for:
  - Use cases
  - Permission checks
  - API key validation
- Integration tests for:
  - Web APIs
  - Partner APIs
- Test middleware routing behavior
- Add basic load tests for partner endpoints

### Deliverables
- Automated test coverage for new architecture
- Confidence in parallel auth systems

---

## 8 Documentation

### Goal
Make the system understandable and usable by both internal engineers and external partners.

### Tasks
- Document updated folder structure
- Write internal architecture overview
- Create Partner API documentation:
  - Auth method
  - Endpoint list
  - Request/response examples
- Generate OpenAPI/Swagger spec (optional but recommended)
- Add onboarding guide for manufacturers

### Deliverables
- Architecture documentation
- Partner API reference
- Clear onboarding path

---

## Suggested Implementation Order

1. Extract use cases  
2. Split API routes (web vs partners)  
3. Middleware routing  
4. API key authentication  
5. Rate limiting  
6. API versioning finalization  
7. Testing  
8. Documentation  

---

## Definition of Done

- Frontend works unchanged
- Partner APIs function with API keys
- Shared business logic used everywhere
- Rate limiting enforced
- Tests passing
- Documentation published

---

