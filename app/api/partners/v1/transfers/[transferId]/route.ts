/**
 * Partner API: Update Transfer Status
 */

import { NextRequest, NextResponse } from "next/server";
import { getActorFromApiKey, extractApiKeyFromHeaders } from "@/core/auth";
import { updateTransferStatus } from "@/core/usecases/transfers/updateTransferStatus";
import { toErrorResponse, UnauthorizedError } from "@/utils/types/errors";

interface RouteParams {
  params: Promise<{
    transferId: string;
  }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const apiKey = extractApiKeyFromHeaders(req.headers);
    if (!apiKey) {
      throw new UnauthorizedError("Missing API key");
    }
    const actor = await getActorFromApiKey(apiKey);
    const { transferId } = await params;
    const body = await req.json();

    const result = await updateTransferStatus({ transferId, ...body }, actor);

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
