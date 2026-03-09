import { NextRequest, NextResponse } from "next/server";
import { getActorFromClerk } from "@/core/auth";
import { apiKeyRepository } from "@/core/infrastructure/db/repositories";
import { toErrorResponse, ValidationError } from "@/utils/types/errors";

export async function POST(req: NextRequest) {
  try {
    const actor = await getActorFromClerk();
    const organizationId = actor.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID missing" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { name, permissions, expiresAt } = body;

    const validationErrors: Record<string, string[]> = {};
    const nameStr = typeof name === "string" ? name.trim() : "";
    if (!nameStr) {
      validationErrors.name = ["Name is required and must be a non-empty string"];
    }
    if (!Array.isArray(permissions) || permissions.length === 0) {
      validationErrors.permissions = ["At least one permission (scope) is required"];
    }
    let expiresAtDate: Date | null = null;
    if (expiresAt != null && expiresAt !== "") {
      const parsed = new Date(expiresAt);
      if (Number.isNaN(parsed.getTime())) {
        validationErrors.expiresAt = ["expiresAt must be a valid ISO date string"];
      } else {
        expiresAtDate = parsed;
      }
    }
    if (Object.keys(validationErrors).length > 0) {
      throw new ValidationError("Validation failed", validationErrors);
    }

    const rawKey = await apiKeyRepository.createKey(
      organizationId,
      nameStr,
      permissions,
      expiresAtDate ?? undefined
    );

    return NextResponse.json(
      {
        name: nameStr,
        apiKey: rawKey,
        scopes: permissions,
        expiresAt: expiresAtDate ? expiresAtDate.toISOString() : null,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.statusCode,
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    const actor = await getActorFromClerk();
    const organizationId = actor.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID missing" },
        { status: 400 }
      );
    }

    const apiKeys = await apiKeyRepository.listKeys(organizationId);
    return NextResponse.json(apiKeys, { status: 200 });
  } catch (error: unknown) {
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.statusCode,
    });
  }
}
