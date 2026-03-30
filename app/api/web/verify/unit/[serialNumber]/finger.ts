// app/api/verify/unit/[serialNumber]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySignature } from "@/lib/verifySignature";
import { getAllEventLogs } from "@/lib/hedera";
import { runAllUnitAuthenticityChecks } from "@/lib/safetyChecks";
import { auth } from "@clerk/nextjs/server";
import { encodeFeatures } from "@/lib/formatModelInput";
import * as ort from "onnxruntime-node";
import { promises as fs } from "fs";
import path from "path";
import { logBatchEvent } from "@/lib/hedera";
const QR_SECRET = process.env.QR_SECRET || "dev-secret";
import { runUnitOriginChecks } from "@/lib/independentUnitSafetyCheck";
import { logOrgMintedUnitEvent } from "@/lib/hedera";

export async function GET(
  req: Request,
  context: { params: Promise<{ serialNumber: string }> },
) {
  const { userId } = await auth();

  // No need for redundant loggedInUser from currentUser()

  // We'll use the prisma 'user' record fetched later

  const { serialNumber } = await context.params;

  const url = new URL(req.url);

  const sig = url.searchParams.get("sig");

  const longitude = url.searchParams.get("long");

  const latitude = url.searchParams.get("lat");

  const modelPath = path.join(process.cwd(), "models", "scan-classifier.onnx");

  // Load as Buffer
  const modelBuffer = await fs.readFile(modelPath);

  // Convert Buffer to Uint8Array
  const modelUint8 = new Uint8Array(modelBuffer);

  if (!sig) {
    return NextResponse.json(
      { valid: false, error: "Invalid verification url." },
      { status: 400 },
    );
  }

  // 1️⃣ Fetch unit
  const unit = await prisma.medicationUnit.findUnique({
    where: { serialNumber },
    include: {
      batch: true,
      organization: true,
    },
  });

  if (!unit) {
    return NextResponse.json(
      { valid: false, error: "Invalid verification url." },
      { status: 404 },
    );
  }

  // VERIFYING THAT THIS UNIT BELONGS TO A BATCH REGISTERED ON OUR PLATFORM
  const splitSerialNumber = serialNumber.split("-");

  if (splitSerialNumber.includes("BATCH")) {
    // reconstruct the batchid
    const batchIdFromUrl = splitSerialNumber[1] + "-" + splitSerialNumber[2];

    if (
      batchIdFromUrl !== unit?.batch?.batchId ||
      sig !== unit.qrSignature ||
      serialNumber !== unit.serialNumber
    ) {
      return NextResponse.json(
        { valid: false, error: "This verification url is not legitimate." },
        { status: 400 },
      );
    }

    // 2️⃣ Recompute signature
    const data = `${unit.serialNumber}|${unit.batch.batchId}|${unit.registrySequence}`;

    let valid = verifySignature(data, sig, QR_SECRET);

    console.log("validvalidvalid", valid);

    const topicId = unit.batch.registryTopicId ?? "";

    const logEntries = await getAllEventLogs(topicId);

    const logEntriesMessages = logEntries.map((entry) => entry.message);

    const eventLogs = logEntriesMessages
      .map((entry) => {
        try {
          const parsed = JSON.parse(entry.metadata || "");
          return parsed;
        } catch {
          return null;
        }
      })
      .filter((entry) => entry && entry.type === "EVENT_LOG");

    // AUTHENTICITY CHECKS
    const authenticityResultCheck = await runAllUnitAuthenticityChecks(
      eventLogs,
      unit.id,
      unit.batch.batchId,
      unit.batch.organizationId,
      topicId,
    );

    valid = authenticityResultCheck?.status === "NOT_SAFE" ? false : valid;

    console.log("validvalid", valid);

    if (!authenticityResultCheck.duplicateScan) {
      //  Fetch user & consumer (if available)
      const user = await prisma.user.findUnique({
        where: { clerkUserId: userId ?? "" },
        include: { consumer: true },
      });

      // SAVE SCAN HISTORY (we save before notifying org so we can reference savedScan.id)
      const consumer = user
        ? await prisma.consumer.findUnique({ where: { userId: user.id } })
        : null;

      const authenticityScanResult =
        authenticityResultCheck?.status === "NOT_SAFE"
          ? "SUSPICIOUS"
          : "GENUINE";

      const organizationInformation = await prisma.organization.findUnique({
        where: { id: unit.batch.organizationId },
      });

      // ML INTEGRATION FOR PREDICTING SCAN NATURE
      const now = new Date();

      // OFF-CHAIN LOGGING
      const savedScan = await prisma.scanHistory.create({
        data: {
          unitId: unit.id,
          consumerId: user ? consumer?.id : null,
          isAnonymous: !user,
          region: organizationInformation?.state,
          scanResult: authenticityScanResult,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          timestamp: now,
        },
      });

      // ON-CHAIN LOGGING
      const hederaSeq = await logBatchEvent(
        unit.batch.registryTopicId as string,
        "UNIT_SCANNED",
        {
          batchId: unit.batch.batchId,
          scanResult: authenticityScanResult,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          timestamp: now,
        },
      );

      await prisma.batchEvent.create({
        data: {
          batchId: unit.batch.id,
          eventType: "UNIT_SCANNED",
          hederaSeq: hederaSeq ?? 0,
          payload: {
            scanResult: authenticityScanResult,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
          },
          region: organizationInformation?.state ?? "",
        },
      });

      // Day of week
      const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayOfWeek = dayMap[now.getDay()];

      // Time of day
      const hour = now.getHours();
      let timeOfDay;
      if (hour >= 5 && hour < 12) timeOfDay = "morning";
      else if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
      else if (hour >= 17 && hour < 21) timeOfDay = "evening";
      else timeOfDay = "night";

      // total scans in region in last 30 days
      const totalScans = await prisma.scanHistory.count({
        where: {
          region: organizationInformation?.state,
          timestamp: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      });

      // suspicious scans in region in last 30 days
      const suspiciousScans = await prisma.scanHistory.count({
        where: {
          region: organizationInformation?.state,
          scanResult: "SUSPICIOUS",
          timestamp: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      });

      // incident rate
      const pastIncidentRate =
        totalScans > 0 ? suspiciousScans / totalScans : 0;

      // Baseline
      let baseRisk = 0.6; // assume anonymous by default

      let suspiciousRatio = 0;

      // If logged-in consumer
      if (consumer) {
        baseRisk = 0.3; // lower risk for logged-in user

        const totalUserScans = await prisma.scanHistory.count({
          where: { consumerId: consumer.id },
        });

        const suspiciousUserScans = await prisma.scanHistory.count({
          where: {
            consumerId: consumer.id,
            scanResult: "SUSPICIOUS",
          },
        });

        suspiciousRatio =
          totalUserScans > 0 ? suspiciousUserScans / totalUserScans : 0;
      } else {
        // For anonymous we could optionally check scans from the same IP/location
        const suspiciousAnonScans = await prisma.scanHistory.count({
          where: {
            isAnonymous: true,
            region: organizationInformation?.state,
            scanResult: "SUSPICIOUS",
            timestamp: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        });

        const totalAnonScans = await prisma.scanHistory.count({
          where: {
            isAnonymous: true,
            region: organizationInformation?.state,
            timestamp: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        });

        suspiciousRatio =
          totalAnonScans > 0 ? suspiciousAnonScans / totalAnonScans : 0;
      }

      // Combine
      const userFlag = Math.min(baseRisk + suspiciousRatio * 0.5, 1);

      const features = encodeFeatures({
        region: organizationInformation?.state ?? "",
        latitude: latitude ? parseFloat(latitude) : 0,
        longitude: longitude ? parseFloat(longitude) : 0,
        time_of_day: timeOfDay,
        day_of_week: dayOfWeek,
        past_incident_rate: pastIncidentRate,
        user_flag: userFlag,
      });

      // Initialize ONNX Runtime with proper error handling
      try {
        const session = await ort.InferenceSession.create(modelUint8);

        const inputArray = Float32Array.from(features);

        const inputTensor = new ort.Tensor("float32", inputArray, [1, 52]);

        const feeds: Record<string, ort.Tensor> = {
          float_input: inputTensor,
        };

        const results = await session.run(feeds);

        // Get the raw arrays
        const labelArr = results.label.data as BigInt64Array; // int64 -> BigInt64Array

        const probArr = results.probabilities.data as Float32Array; // float32 -> Float32Array

        // Convert safely
        const predictedLabelInt = Number(labelArr[0]); // from BigInt to number

        const predictedProbability = probArr[predictedLabelInt]; // probability of predicted label

        // If you want a boolean:
        const predictedLabel = predictedLabelInt === 1;

        // Then save
        await prisma.predictionScore.create({
          data: {
            scanHistoryId: savedScan.id,
            predictedLabel,
            predictedProbability,
            region: organizationInformation?.state,
            scanType: "UNIT",
          },
        });
      }
      catch (onnxError: unknown) {
        const errorMessage =
          onnxError instanceof Error ? onnxError.message : String(onnxError);
        return NextResponse.json(
          { valid: false, error: "ONNX Runtime Error", message: errorMessage },
          { status: 400 },
        );
      }
    } else {
      console.log("dvdvdvsdvsdvsdvsdd duplicate scan");
    }

    return NextResponse.json({
      valid,
      unit,
      batch: unit.batch,
      authenticityResultCheck: authenticityResultCheck,
    });
  }
  else if (!splitSerialNumber.includes("BATCH")) {
    // reconstruct the batchid
    const organizationIdFromUrl = splitSerialNumber[1];

    const organization = await prisma.organization.findUnique({
      where: { id: organizationIdFromUrl },
    });

    if (!organization) {
      return NextResponse.json(
        { valid: false, error: "Invalid verification url." },
        { status: 404 },
      );
    }

    if (
      organizationIdFromUrl !== organization.id ||
      organizationIdFromUrl !== unit.organization?.id ||
      sig !== unit.qrSignature ||
      serialNumber !== unit.serialNumber
    ) {
      return NextResponse.json(
        { valid: false, error: "This verification url is not legitimate." },
        { status: 400 },
      );
    }

    const data = `${unit.serialNumber}|${organizationIdFromUrl}|${unit.registrySequence}`;

    let valid = verifySignature(data, sig, QR_SECRET);

    const topicId = organization.managedRegistry ?? "";

    const logEntries = await getAllEventLogs(topicId);

    const logEntriesMessages = logEntries.map((entry) => entry.message);

    const eventLogs = logEntriesMessages
      .map((entry) => {
        try {
          const parsed = JSON.parse(entry.metadata || "");
          return parsed;
        } catch {
          return null;
        }
      })
      .filter((entry) => entry && entry.type === "EVENT_LOG");
    
    
    console.log("eventLogseventLogseventLogs", eventLogs)

    const unitValidityChecks = await runUnitOriginChecks(
      eventLogs,
      unit.serialNumber,
      latitude ? parseFloat(latitude) : 0,
      longitude ? parseFloat(longitude) : 0,
      organization.managedRegistry,
      organization.id,
      unit.id
    );

    valid = unitValidityChecks?.status === "NOT_SAFE" ? false : valid;

    if (!unitValidityChecks.duplicateScan) {
      const now = new Date();
      await prisma.scanHistory.create({
        data: {
          unitId: unit.id,
          isAnonymous: true,
          region: organization?.state,
          scanResult: valid ? "GENUINE" : "SUSPICIOUS",
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          timestamp: now,
        },
      });

      await logOrgMintedUnitEvent(
        organization.managedRegistry as string,
        "UNIT_SCANNED",
        {
          organizationId: organization.id,
          serialNumber: unit.serialNumber,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          timestamp: now,
        },
      );
    }

    return NextResponse.json({
      valid,
      unit,
      batch: unit.batch,
      authenticityResultCheck: unitValidityChecks,
    });
    
  }
  else {
    return NextResponse.json(
      { valid: false, error: "Invalid verification url." },
      { status: 400 },
    );
  }
}
