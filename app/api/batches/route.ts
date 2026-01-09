// app/api/batches/route.ts
import { NextResponse } from "next/server";
import { createBatch } from "@/core/usecases/batches";
import { getActorFromClerk } from "@/core/auth/clerk";
import { toErrorResponse } from "@/utils/types/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // Get authenticated actor
    const actor = await getActorFromClerk();

    // Parse request body
    const body = await req.json();

    // Call use case with raw body - validation happens inside the use case
    const result = await createBatch(body, actor);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    // Handle errors uniformly using toErrorResponse
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.statusCode,
    });
  }
}
