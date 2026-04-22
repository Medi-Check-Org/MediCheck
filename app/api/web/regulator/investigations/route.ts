import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRegulatorContext } from "@/core/auth/regulator";
import { toErrorResponse } from "@/utils/types/errors";

export async function GET(request: NextRequest) {
  try {
    await getRegulatorContext();

    // Get all counterfeit reports (investigations)
    const investigations = await prisma.counterfeitReport.findMany({
      include: {
        batch: {
          select: {
            batchId: true,
            drugName: true,
            organization: {
              select: {
                companyName: true,
                organizationType: true,
                contactEmail: true
              }
            }
          }
        },
        consumers: {
          select: {
            fullName: true,
            phoneNumber: true,
            address: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json({ investigations });

  } catch (error: unknown) {
    console.error("Error fetching investigations:", error);
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.statusCode,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getRegulatorContext();

    const { batchId, reportType, severity, description, location, evidence } = await request.json();

    // Create new investigation (counterfeit report)
    const investigation = await prisma.counterfeitReport.create({
      data: {
        batchId,
        reporterId: user.id,
        reportType,
        severity,
        description,
        location,
        evidence: evidence || [],
        status: "INVESTIGATING",
        investigatorId: user.id
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
        }
      }
    });

    return NextResponse.json({ investigation });

  } catch (error: unknown) {
    console.error("Error creating investigation:", error);
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.statusCode,
    });
  }
}