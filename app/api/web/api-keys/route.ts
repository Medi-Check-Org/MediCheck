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
    const permissionsArray = Array.isArray(permissions) ? permissions : [];
    const normalizedPermissions = permissionsArray
      .filter((scope: unknown): scope is string => typeof scope === "string")
      .map((scope) => scope.trim())
      .filter((scope) => scope.length > 0);

    if (!Array.isArray(permissions) || normalizedPermissions.length === 0) {
      validationErrors.permissions = ["At least one permission (scope) is required"];
    }
    if (Array.isArray(permissions) && normalizedPermissions.length !== permissions.length) {
      validationErrors.permissions = [
        "Permissions must be non-empty strings (free-form scope values are supported)",
      ];
    }

    let expiresAtDate: Date | null = null;
    if (expiresAt != null && expiresAt !== "") {
      const parsed = new Date(expiresAt);
      if (Number.isNaN(parsed.getTime())) {
        validationErrors.expiresAt = ["expiresAt must be a valid ISO date string"];
      } else if (parsed <= new Date()) {
        validationErrors.expiresAt = ["expiresAt must be a future date"];
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
      [...new Set(normalizedPermissions)],
      expiresAtDate ?? undefined
    );

    return NextResponse.json(
      {
        name: nameStr,
        apiKey: rawKey,
        scopes: [...new Set(normalizedPermissions)],
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
