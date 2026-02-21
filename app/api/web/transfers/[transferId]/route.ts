/**
 * Web API: Update Transfer Status
 */

import { NextRequest, NextResponse } from "next/server";
import { getActorFromClerk } from "@/core/auth";
import { updateTransferStatus } from "@/core/usecases/transfers/updateTransferStatus";
import { toErrorResponse } from "@/utils/types/errors";

interface RouteParams {
  params: Promise<{
    transferId: string;
  }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const actor = await getActorFromClerk();

    const { transferId } = await params;

    const body = await req.json();

    const result = await updateTransferStatus({ transferId, ...body }, actor);

    return NextResponse.json({ success: true, data: result });
  }
  catch (error: unknown) {

    const errorResponse = toErrorResponse(error);

    return NextResponse.json(errorResponse, {

      status: errorResponse.statusCode,

    });

  }

}
