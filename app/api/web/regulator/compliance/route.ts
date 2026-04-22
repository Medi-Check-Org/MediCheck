import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRegulatorContext } from "@/core/auth/regulator";
import { toErrorResponse } from "@/utils/types/errors";

export async function GET(request: NextRequest) {
  try {
    await getRegulatorContext();

    // Get all ownership transfers for compliance review
    const transfers = await prisma.ownershipTransfer.findMany({
      include: {
        batch: {
          select: {
            batchId: true,
            drugName: true,
            product: {
              select: {
                manufacturingDate: true,
                expiryDate: true,
              },
            },
          },
        },
        fromOrg: {
          select: {
            companyName: true,
            organizationType: true,
            contactEmail: true,
          },
        },
        toOrg: {
          select: {
            companyName: true,
            organizationType: true,
            contactEmail: true,
          },
        },
      },
      orderBy: {
        transferDate: "desc",
      },
    });

    return NextResponse.json({ transfers });
  } catch (error: unknown) {
    console.error("Error fetching transfers:", error);
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.statusCode,
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user } = await getRegulatorContext();

    const { transferId, status, notes } = await request.json();

    // Update transfer status
    const updatedTransfer = await prisma.ownershipTransfer.update({
      where: { id: transferId },
      data: {
        status,
        notes,
        updatedAt: new Date(),
      },
      include: {
        batch: {
          select: {
            batchId: true,
            drugName: true,
          },
        },
        fromOrg: {
          select: {
            companyName: true,
          },
        },
        toOrg: {
          select: {
            companyName: true,
          },
        },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: `TRANSFER_${status}`,
        entityType: "OWNERSHIP_TRANSFER",
        entityId: transferId,
        details: {
          batchId: updatedTransfer.batch.batchId,
          fromOrg: updatedTransfer.fromOrg.companyName,
          toOrg: updatedTransfer.toOrg.companyName,
          status,
          notes,
        },
      },
    });

    return NextResponse.json({ transfer: updatedTransfer });
  } catch (error: unknown) {
    console.error("Error updating transfer:", error);
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.statusCode,
    });
  }
}
