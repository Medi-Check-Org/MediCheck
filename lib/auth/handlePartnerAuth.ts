import { NextResponse } from "next/server";
import type { Actor } from "@/app/types/actor";
import { apiKeyRepository } from "@/app/infrastructure/db/repositories/apiKeyRepository";

export async function handlePartnerAuth(req: Request) {
  const authHeader = req.headers.get("authorization");
  const apiKeyHeader = req.headers.get("x-api-key");
  let foundHeader;

  if (authHeader?.startsWith("Bearer ")) {
    foundHeader = authHeader;
  } else if (apiKeyHeader) {
    foundHeader = apiKeyHeader;
  }

  if (!foundHeader) {
    return NextResponse.json(
      { error: "Missing API key" },
      { status: 401 }
    );
  }

  const rawKey = authHeader ? foundHeader.replace("Bearer ", "").trim() : foundHeader.trim();
  const apiKey = await apiKeyRepository.validateKey(rawKey);

  if (!apiKey) {
    return NextResponse.json(
      { error: "Invalid or expired API key" },
      { status: 401 }
    );
  }
  // async usage tracking
  apiKeyRepository.updateLastUsed(apiKey.id);

  // Build normalized actor
  const actor: Actor = {
    type: "machine",
    id: apiKey.id,
    organizationId: apiKey.organizationId,
    permissions: apiKey.scopes,
  };

  // Attach actor
  const res = NextResponse.next();
  res.headers.set("x-actor", JSON.stringify(actor));
  return res;
}
