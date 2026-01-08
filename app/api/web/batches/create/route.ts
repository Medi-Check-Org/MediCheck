/**
 * Web API Route: Create Batch
 *
 * Frontend-facing endpoint with Clerk authentication.
 * Delegates business logic to use case layer.
 */

import { NextRequest, NextResponse } from "next/server";
import { getActorFromClerk } from "@/app/auth";
import { createBatch } from "@/app/usecases/batches/createBatch";
import { toErrorResponse } from "@/utils/types/errors";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate with Clerk
    const actor = await getActorFromClerk();

    // 2. Parse request body
    const body = await req.json();

    // 3. Execute use case
    const result = await createBatch(body, actor);

    // 4. Return success response
    return NextResponse.json(
      {
        success: true,
        data: result,
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
