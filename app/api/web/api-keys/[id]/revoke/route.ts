import { NextRequest, NextResponse } from "next/server";
import { getActorFromClerk } from "@/core/auth";
import { apiKeyRepository } from "@/core/infrastructure/db/repositories";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    // get actor from clerk
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

    // revoke the key
    await apiKeyRepository.revokeKey(params.id);

    // return success response
    return NextResponse.json({ message: "API key revoked successfully" });
}