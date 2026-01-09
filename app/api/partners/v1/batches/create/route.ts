/**
 * Partner API Route: Create Batch
 *
 * Machine-to-machine endpoint with API key authentication.
 * Uses the SAME business logic as web route, different auth only.
 */

import { NextRequest, NextResponse } from "next/server";
import { getActorFromApiKey, extractApiKeyFromHeaders } from "@/core/auth";
import { createBatch } from "@/core/usecases/batches/createBatch";
import { toErrorResponse, UnauthorizedError } from "@/utils/types/errors";

export async function POST(req: NextRequest) {
  try {
    // 1. Extract and validate API key
    const apiKey = extractApiKeyFromHeaders(req.headers);
    if (!apiKey) {
      throw new UnauthorizedError("Missing API key");
    }

    // 2. Authenticate with API key
    const actor = await getActorFromApiKey(apiKey);

    // 3. Parse request body
    const body = await req.json();

    // 4. Execute use case (SAME as web route)
    const result = await createBatch(body, actor);

    // 5. Return success response
    return NextResponse.json(
      {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          apiVersion: "v1",
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    // Handle errors uniformly
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.statusCode,
    });
  }
}
