/**
 * Web API: Get Batch Details
 */

import { NextRequest, NextResponse } from "next/server";
import { getActorFromClerk } from "@/app/auth";
import { getBatch } from "@/app/usecases/batches/getBatch";
import { toErrorResponse } from "@/utils/types/errors";

interface RouteParams {
  params: Promise<{
    batchId: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const actor = await getActorFromClerk();
    const { batchId } = await params;

    const result = await getBatch({ batchId }, actor);

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.statusCode,
    });
  }
}
