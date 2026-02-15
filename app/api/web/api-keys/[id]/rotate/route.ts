import { NextRequest, NextResponse } from "next/server";
import { getActorFromClerk } from "@/core/auth";
import { apiKeyRepository } from "@/core/infrastructure/db/repositories";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
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
    // rotate the key
    const newRawKey = await apiKeyRepository.rotateKey(id);
    // return the new raw key
    return NextResponse.json(
        {
            newApiKey: newRawKey
        }
    )
} 