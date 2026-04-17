import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRegulatorContext } from "@/core/auth/regulator";
import { toErrorResponse } from "@/utils/types/errors";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await getRegulatorContext();

    const { isVerified, isActive, notes } = await request.json();
    const { id: entityId } = await params;

    // Update entity verification status
    const updatedEntity = await prisma.organization.update({
      where: { id: entityId },
      data: {
        isVerified,
        isActive,
        updatedAt: new Date()
      }
    });

    // Log the action in audit logs
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: isVerified ? "ENTITY_VERIFIED" : "ENTITY_UNVERIFIED",
        entityType: "ORGANIZATION",
        entityId,
        details: {
          organizationName: updatedEntity.companyName,
          isVerified,
          isActive,
          notes
        }
      }
    });

    return NextResponse.json({ entity: updatedEntity });

  } catch (error: unknown) {
    console.error("Error updating entity:", error);
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.statusCode,
    });
  }
}