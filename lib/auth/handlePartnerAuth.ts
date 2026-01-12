import { NextResponse } from "next/server";
import type { Actor } from "@/utils/types/actor";
import { apiKeyRepository } from "@/core/infrastructure/db/repositories/apiKeyRepository";

export async function handlePartnerAuth(req: Request) {

  const apiKeyHeader = req.headers.get("Medicheck-Api-Key");

  const foundHeader = apiKeyHeader;

  if (!foundHeader) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }

  const rawKey = foundHeader.trim();

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
