/**
 * Public API: Verify Batch
 * 
 * No authentication required - this is for consumers to verify authenticity
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyBatch } from "@/app/usecases/verification/verifyBatch";
import { toErrorResponse } from "@/app/types/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // No authentication needed for public verification
    const result = await verifyBatch(body);

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
