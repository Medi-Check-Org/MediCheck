import { prisma } from "@/lib/prisma";
import * as ort from "onnxruntime-node";
import { encodeFeatures } from "@/lib/formatModelInput";
import { promises as fs } from "fs";
import path from "path";

export async function runMLInference(
  scanId: string,
  region: string,
  lat: number,
  long: number,
  consumerId?: string | null,
) {
  try {
    const now = new Date();

    // 1. Feature Engineering
    const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayOfWeek = dayMap[now.getDay()];
    const hour = now.getHours();
    let timeOfDay =
      hour >= 5 && hour < 12
        ? "morning"
        : hour >= 12 && hour < 17
          ? "afternoon"
          : hour >= 17 && hour < 21
            ? "evening"
            : "night";

    // 2. Fetch Contextual Aggregates
    const [totalScans, suspiciousScans] = await Promise.all([
      prisma.scanHistory.count({
        where: {
          region,
          timestamp: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.scanHistory.count({
        where: {
          region,
          scanResult: "SUSPICIOUS",
          timestamp: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const pastIncidentRate = totalScans > 0 ? suspiciousScans / totalScans : 0;

    // 3. User Risk Profiling
    let baseRisk = consumerId ? 0.3 : 0.6;

    let suspiciousRatio = 0;

    if (consumerId) {
      const totalUserScans = await prisma.scanHistory.count({
        where: { consumerId },
      });

      const suspiciousUserScans = await prisma.scanHistory.count({
        where: {
          consumerId,
          scanResult: "SUSPICIOUS",
        },
      });

      suspiciousRatio =
        totalUserScans > 0 ? suspiciousUserScans / totalUserScans : 0;
    }
    else {
      // For anonymous we could optionally check scans from the same IP/location
      const suspiciousAnonScans = await prisma.scanHistory.count({
        where: {
          isAnonymous: true,
          region,
          scanResult: "SUSPICIOUS",
          timestamp: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      });

      const totalAnonScans = await prisma.scanHistory.count({
        where: {
          isAnonymous: true,
          region,
          timestamp: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      });

      suspiciousRatio =
        totalAnonScans > 0 ? suspiciousAnonScans / totalAnonScans : 0;
    }

    // Simplified ratio calc
    const userFlag = Math.min(baseRisk + suspiciousRatio * 0.5, 1);

    const features = encodeFeatures({
      region,
      latitude: lat,
      longitude: long,
      time_of_day: timeOfDay,
      day_of_week: dayOfWeek,
      past_incident_rate: pastIncidentRate,
      user_flag: userFlag,
    });

    // 4. ONNX Inference
    const modelPath = path.join(
      process.cwd(),
      "models",
      "scan-classifier.onnx",
    );

    const modelBuffer = await fs.readFile(modelPath);

    const modelUint8 = new Uint8Array(modelBuffer);

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

    const predictedLabel = predictedLabelInt === 1;

    // 5. Save Score
    await prisma.predictionScore.create({
      data: {
        scanHistoryId: scanId,
        predictedLabel,
        predictedProbability,
        region,
        scanType: "UNIT",
      },
    });

  }
  catch (error) {
    console.error("Background ML Task Failed:", error);
  }
}
