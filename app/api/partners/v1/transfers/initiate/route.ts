/**
 * Partner API: Initiate Transfer
 */

import { NextRequest, NextResponse } from "next/server";
import { getActorFromApiKey, extractApiKeyFromHeaders } from "@/app/auth";
import { initiateTransfer } from "@/app/usecases/transfers/initiateTransfer";
import { toErrorResponse, UnauthorizedError } from "@/utils/types/errors";

export async function POST(req: NextRequest) {
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
