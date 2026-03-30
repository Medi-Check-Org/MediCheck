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

export async function GET(req: Request, context: { params: Promise<{ serialNumber: string }> }) {
  const { userId } = await auth();
  const { serialNumber } = await context.params;
  const { searchParams } = new URL(req.url);
  const sig = searchParams.get("sig");
  const lat = parseFloat(searchParams.get("lat") || "0");
  const long = parseFloat(searchParams.get("long") || "0");

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
  const eventLogs = logEntries.map(e => {
    try { return JSON.parse(e.message.metadata || ""); } catch { return null; }
  }).filter(e => e?.type === "EVENT_LOG");

  let safetyResult;
  if (isBatched) {
    safetyResult = await runAllUnitAuthenticityChecks(
      eventLogs, unit.id, unit.batch!.batchId, unit.batch!.organizationId, topicId
    );
  } else {
    safetyResult = await runUnitOriginChecks(
      eventLogs, unit.serialNumber, lat, long, topicId, unit?.orgId ?? "", unit.id
    );
  }

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
        region: unit.organization?.state,
        scanResult,
        latitude: lat,
        longitude: long,
        timestamp: new Date(),
      }
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
          latitude: lat,
          longitude: long,
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
          latitude: lat,
          longitude: long,
          timestamp: now,
        }
      );
    }

    const organizationInfo = isBatched ? unit?.batch?.organization ?? "" : unit.organization;

    runMLInference(
      savedScan.id,
      organizationInfo?.state,
      latitude ? parseFloat(long) : 0,
      longitude ? parseFloat(lat) : 0,
      consumer?.id,
    ).catch((err) => console.error("ML Trigger Error", err));

  }

  return NextResponse.json({
    valid: isValidSig && safetyResult.status !== "NOT_SAFE",
    unit,
    batch: unit.batch,
    safetyResult
  });
}