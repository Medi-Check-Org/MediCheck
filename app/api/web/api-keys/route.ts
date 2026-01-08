import { NextRequest, NextResponse } from "next/server";
import { getActorFromClerk } from "@/app/auth";
import { apiKeyRepository } from "@/app/infrastructure/db/repositories";

// create an API key
export async function POST(req: NextRequest) {
  // steps:
  // 1. get actor and organization Id from clerk
  const actor = await getActorFromClerk();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const organizationId = actor.organizationId;
  if (!organizationId) {
    return NextResponse.json(
      { error: "Organization ID missing" },
      { status: 400 }
    );
  }
  // 2. parse body for name, permissions, expiresAt
  const body = await req.json();
  const { name, permissions, expiresAt } = body;
  if (!name || !permissions) {
    return NextResponse.json(
      { error: "Name and permissions are required" },
      { status: 400 }
    );
  }
  // 3. create the api key
  const rawKey = apiKeyRepository.createKey(
    organizationId,
    name,
    permissions,
    expiresAt && new Date(expiresAt)
  );

  // 4. return the raw key
  return NextResponse.json(
    {
      name: name,
      apiKey: rawKey,
      scopes: permissions,
      expiresAt: expiresAt || null,
    },
    { status: 201 }
  );
}

export async function GET(req: NextRequest) {
  // steps:
  // 1. get actor and organization Id from clerk
  const actor = await getActorFromClerk();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const organizationId = actor.organizationId;
  if (!organizationId) {
    return NextResponse.json(
      { error: "Organization ID missing" },
      { status: 400 }
    );
  }
  // 2. list api keys for organization
  const apiKeys = await apiKeyRepository.listKeys(organizationId);
  // 3. return list of api keys
  return NextResponse.json(apiKeys, { status: 200 });
}
