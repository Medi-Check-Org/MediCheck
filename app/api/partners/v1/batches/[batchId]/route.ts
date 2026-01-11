/**
 * Partner API: Get Batch Details
 */

import { NextRequest, NextResponse } from "next/server";
import { getActorFromApiKey, extractApiKeyFromHeaders } from "@/core/auth";
import { getBatch } from "@/core/usecases/batches/getBatch";
import { toErrorResponse, UnauthorizedError } from "@/utils/types/errors";
import { withRateLimit } from "@/lib/rate-limit/withRateLimit";

interface RouteParams {
  params: Promise<{
    batchId: string;
  }>;
}

async function postHandler(req: NextRequest, { params }: RouteParams) {
  try {
    const apiKey = extractApiKeyFromHeaders(req.headers);
    if (!apiKey) {
      throw new UnauthorizedError("Missing API key");
    }
    const actor = await getActorFromApiKey(apiKey);
    const { batchId } = await params;

    const result = await getBatch({ batchId }, actor);

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


export const POST = withRateLimit(postHandler, { strict: true });