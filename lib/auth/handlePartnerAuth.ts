import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Actor } from "../../utils/types/actor";
import { hashApiKey } from "./hashApiKey";

export async function handlePartnerAuth(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing API key" },
      { status: 401 }
    );
  }

  const rawKey = authHeader.replace("Bearer ", "").trim();
  const hashedKey = hashApiKey(rawKey);

  const apiKey = await prisma.apiKey.findFirst({
    where: {
      hashedKey,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!apiKey) {
    return NextResponse.json(
      { error: "Invalid or expired API key" },
      { status: 401 }
    );
  }

  // async usage tracking
  prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() }
  }).catch(() => {});

  const actor: Actor = {
    type: "machine",
    apiKeyId: apiKey.id,
    organizationId: apiKey.organizationId,
    permissions: apiKey.scopes,
  };

  // Attach actor
  const res = NextResponse.next();
  res.headers.set("x-actor", JSON.stringify(actor));
  return res;
}
