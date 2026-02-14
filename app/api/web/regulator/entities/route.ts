import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {auth} from "@clerk/nextjs/server";

export async function GET() {
  try {
    const entities = await prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ entities });
  } catch (error: unknown) {
    console.error("Error fetching entities:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch entities";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Basic validation
    if (
      !data.companyName ||
      !data.organizationType ||
      !data.contactEmail ||
      !data.address ||
      !data.country
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const entity = await prisma.organization.create({
      data: {
        companyName: data.companyName,
        organizationType: data.organizationType,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        contactPersonName: data.contactPersonName,
        address: data.address,
        country: data.country,
        state: data.state,
        licenseNumber: data.licenseNumber,
        nafdacNumber: data.nafdacNumber,
        businessRegNumber: data.businessRegNumber,
        rcNumber: data.rcNumber,
        pcnNumber: data.pcnNumber,
        agencyName: data.agencyName,
        officialId: data.officialId,
        distributorType: data.distributorType,
        // Add other fields as needed

        users: data.users, // Ensure this is provided and matches the expected type
      },
    });

    return NextResponse.json({ entity }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating entity:", error);
    const message = error instanceof Error ? error.message : "Failed to create entity";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}