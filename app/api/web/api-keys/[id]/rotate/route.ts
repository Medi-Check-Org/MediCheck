import { NextRequest, NextResponse } from "next/server";
import { getActorFromClerk } from "@/core/auth";
import { apiKeyRepository } from "@/core/infrastructure/db/repositories";
import { toErrorResponse } from "@/utils/types/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actor = await getActorFromClerk();
    const organizationId = actor.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID missing" },
        { status: 400 }
      );
    }

    const key = await apiKeyRepository.findByIdForAuth(id);
    if (!key || key.organizationId !== organizationId) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    const newRawKey = await apiKeyRepository.rotateKey(id);
    return NextResponse.json(
      { newApiKey: newRawKey },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.statusCode,
    });
  }
}
