/**
 * Web API: Initiate Transfer
 */

import { NextRequest, NextResponse } from "next/server";
import { getActorFromClerk } from "@/app/auth";
import { initiateTransfer } from "@/app/usecases/transfers/initiateTransfer";
import { toErrorResponse } from "@/app/types/errors";

export async function POST(req: NextRequest) {
  try {
    const actor = await getActorFromClerk();
    const body = await req.json();

    const result = await initiateTransfer(body, actor);

    return NextResponse.json(
      { success: true, data: result },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
