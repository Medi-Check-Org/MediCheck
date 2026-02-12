/**
 * Web API: List Batches
 */

import { NextRequest, NextResponse } from "next/server";
import { getActorFromClerk } from "@/core/auth";
import { listBatches } from "@/core/usecases/batches/listBatches";
import { toErrorResponse } from "@/utils/types/errors";

export async function GET(req: NextRequest) {
  try {
    
    const actor = await getActorFromClerk();

    // Extract query params
    const { searchParams } = new URL(req.url);

    const input = {
      organizationId: searchParams.get("organizationId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      page: searchParams.get("page")
        ? parseInt(searchParams.get("page")!)
        : undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : undefined,
    };

    const result = await listBatches(input, actor);

    return NextResponse.json({ success: true, data: result });

  }
  catch (error: unknown) {
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.statusCode,
    });
  }
}
