/**
 * Partner API: Initiate Transfer
 */

import { NextRequest, NextResponse } from "next/server";
import { getActorFromApiKey, extractApiKeyFromHeaders } from "@/core/auth";
import { initiateTransfer } from "@/core/usecases/transfers/initiateTransfer";
import { toErrorResponse, UnauthorizedError } from "@/utils/types/errors";
import { withRateLimit } from "@/lib/rate-limit/withRateLimit";



async function postHandler(req: NextRequest) {
  try {
    const apiKey = extractApiKeyFromHeaders(req.headers);
    if (!apiKey) {
      throw new UnauthorizedError("Missing API key");
    }
    const actor = await getActorFromApiKey(apiKey);
    const body = await req.json();

    const result = await initiateTransfer(body, actor);

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
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.statusCode,
    });
  }
}


export const POST = withRateLimit(postHandler, { strict: true });