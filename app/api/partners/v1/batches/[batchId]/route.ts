/**
 * Partner API: Get Batch Details
 */

import { NextRequest, NextResponse } from "next/server";
import { getActorFromApiKey, extractApiKeyFromHeaders } from "@/app/auth";
import { getBatch } from "@/app/usecases/batches/getBatch";
import { toErrorResponse, UnauthorizedError } from "@/app/types/errors";

interface RouteParams {
  params: Promise<{
    batchId: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
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
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
