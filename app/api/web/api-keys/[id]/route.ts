import { NextRequest, NextResponse } from "next/server";
import { getActorFromClerk } from "@/app/auth";
import { apiKeyRepository } from "@/app/infrastructure/db/repositories";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
    // 2. get api key by id
    const apiKey = await apiKeyRepository.findById(params.id);
    if (!apiKey) {
        return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }
    return NextResponse.json(apiKey, { status: 200 });
}