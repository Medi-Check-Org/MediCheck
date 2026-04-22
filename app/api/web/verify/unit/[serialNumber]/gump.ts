import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySignature } from "@/lib/verifySignature";
import { getAllEventLogs } from "@/lib/hedera";
import { runAllUnitAuthenticityChecks } from "@/lib/safetyChecks";
import { auth } from "@clerk/nextjs/server";
import { logBatchEvent } from "@/lib/hedera";
const QR_SECRET = process.env.QR_SECRET || "dev-secret";
import { runUnitOriginChecks } from "@/lib/independentUnitSafetyCheck";
import { logOrgMintedUnitEvent } from "@/lib/hedera";
import { runMLInference } from "@/lib/ml-background";
import { getRegionFromCoords } from "@/lib/geocoding";

export async function GET(req: Request, context: { params: Promise<{ serialNumber: string }> }) {
  const { userId } = await auth();
  const { serialNumber } = await context.params;
  const { searchParams } = new URL(req.url);
  const sig = searchParams.get("sig");
  const latitude = parseFloat(searchParams.get("lat") || "0");
  const longitude = parseFloat(searchParams.get("long") || "0");

  console.log("milkddfdff", latitude, longitude, "milkkdl")

  if (!sig) return NextResponse.json({ valid: false, error: "Missing signature" }, { status: 400 });

  // 1. Fetch unit with ALL possible relations
  const unit = await prisma.medicationUnit.findUnique({
    where: { serialNumber },
    include: {
      batch: {
        include: {
          organization: true
        }
      },
      organization: true
    },
  });

  if (!unit) return NextResponse.json({ valid: false, error: "Unit not found" }, { status: 404 });

  // 2. Determine Registry Context
  // State A: Part of a batch (either born there or joined later)
  // State B: Independent (organization managed)
  const isBatched = !!unit.batchId;
  const topicId = isBatched ? unit.batch?.registryTopicId : unit.organization?.managedRegistry;
  const contextId = isBatched ? unit.batch?.batchId : unit.organization?.id;

  if (!topicId) return NextResponse.json({ valid: false, error: "Registry not found" }, { status: 400 });

  // 3. Cryptographic Signature Check
  // The 'data' string must match exactly how it was signed during minting
  const data = `${unit.serialNumber}|${contextId}|${unit.registrySequence}`;
  let isValidSig = verifySignature(data, sig, QR_SECRET);

  if (!isValidSig) {
    return NextResponse.json({ valid: false, error: "Tampered QR code signature" }, { status: 400 });
  }

  // 4. Fetch Hedera Logs & Run Safety Checks
  const logEntries = await getAllEventLogs(topicId);

  console.log("Fetched log entries", logEntries);

  let eventLogs = logEntries
    .map((e) => {
      try {
        return JSON.parse(e.message.metadata || "");
      } catch {
        return null;
      }
    }).filter((e) => e?.type === "EVENT_LOG");

  if (!isBatched) {
    eventLogs = eventLogs.filter((e) => {

      // Case 1: The event has a direct serialNumber (e.g., UNIT_SCANNED or UNIT_FLAGGED)
      if (e.serialNumber === serialNumber) return true;

      // Case 2: The event has a 'units' array of objects (e.g., UNIT_MINTED)
      // We check if any object in that array matches our serial number
      if (Array.isArray(e.units)) {
        return e.units.some(
          (u: any) =>
            (typeof u === "string" && u === serialNumber) ||
            u?.serialNumber === serialNumber,
        );
      }

      return false;

    });
  }
   
  let safetyResult;

  if (isBatched) {
    safetyResult = await runAllUnitAuthenticityChecks(
      eventLogs, 
      unit.id, 
      unit.batch!.batchId, 
      unit.batch!.organizationId, 
      topicId,
      unit.serialNumber
    );
  }
  else {
    safetyResult = await runUnitOriginChecks(
      eventLogs, unit.serialNumber, latitude, longitude, topicId, unit?.orgId ?? "", unit.id
    );
  }

  const regionName = await getRegionFromCoords(latitude, longitude);

  console.log("regionName regionName", regionName, latitude, longitude);

  // 5. Logging & ML (Only if not a duplicate scan to prevent bot spam)
  if (!safetyResult.duplicateScan) {
    const scanResult = safetyResult.status === "NOT_SAFE" ? "SUSPICIOUS" : "GENUINE";

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId ?? "" },
      include: { consumer: true },
    });

    const consumer = user
      ? await prisma.consumer.findUnique({ where: { userId: user.id } })
      : null;
    
    // Save Scan History
    const savedScan = await prisma.scanHistory.create({
      data: {
        unitId: unit.id,
        consumerId: user ? consumer?.id : null,
        isAnonymous: !user,
        region: regionName,
        scanResult,
        latitude: latitude,
        longitude: longitude,
        timestamp: new Date(),
      },
    });

    const now = new Date();

    // Log to Blockchain Registry
    if (isBatched) {
      await logBatchEvent(
        topicId,
        "UNIT_SCANNED",
        {
          batchId: unit?.batch?.batchId ?? "",
          scanResult,
          serialNumber,
          latitude: latitude,
          longitude: longitude,
          timestamp: now,
        }
      );
    }
    else {
      await logOrgMintedUnitEvent(
        topicId, "UNIT_SCANNED",
        {
          organizationId: unit?.organization?.id ?? "",
          scanResult, 
          serialNumber,
          latitude: latitude,
          longitude: longitude,
          timestamp: now,
        }
      );
    }

    runMLInference(
      savedScan.id,
      regionName,
      latitude ? latitude : 0,
      longitude ? longitude : 0,
      consumer?.id,
    ).catch((err) => console.error("ML Trigger Error", err));

  }

  console.log("safetyResult", safetyResult);

  return NextResponse.json({
    valid: isValidSig && safetyResult.status !== "NOT_SAFE",
    unit,
    batch: unit.batch,
    authenticityResultCheck: safetyResult,
  });

}


