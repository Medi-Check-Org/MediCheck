import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRegulatorContext } from "@/core/auth/regulator";
import { toErrorResponse } from "@/utils/types/errors";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await getRegulatorContext();

    const { status, resolution, severity } = await request.json();
    const { id: investigationId } = await params;

    // Update investigation
    const updatedInvestigation = await prisma.counterfeitReport.update({
      where: { id: investigationId },
      data: {
        status,
        resolution,
        investigatorId: user.id,
        ...(severity && { severity }),
        updatedAt: new Date()
      },
      include: {
        batch: {
          select: {
            batchId: true,
            drugName: true,
            organization: {
              select: {
                companyName: true
              }
            }
          }
        },
        consumers: {
          select: {
            fullName: true
          }
        }
      }
    });

    return NextResponse.json({ investigation: updatedInvestigation });

  } catch (error) {
    console.error("Error updating investigation:", error);
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.statusCode,
    });
  }
}