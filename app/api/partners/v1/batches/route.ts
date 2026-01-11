/**
 * Partner API: List Batches
 */

import { NextRequest, NextResponse } from "next/server";
import { getActorFromApiKey, extractApiKeyFromHeaders } from "@/core/auth";
import { listBatches } from "@/core/usecases/batches/listBatches";
import { toErrorResponse, UnauthorizedError } from "@/utils/types/errors";
import { withRateLimit } from "@/lib/rate-limit/withRateLimit";

async function getHandler(req: NextRequest) {
  try {
    const apiKey = extractApiKeyFromHeaders(req.headers);
    if (!apiKey) {
      throw new UnauthorizedError("Missing API key");
    }
    const actor = await getActorFromApiKey(apiKey);

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

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        apiVersion: "v1",
      },
    });
  } catch (error: unknown) {
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.statusCode,
    });
  }
}


export const GET = withRateLimit(getHandler);