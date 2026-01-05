import crypto from "crypto";

export function generateApiKey(env: "live" | "test" = "live") {
  const random = crypto.randomBytes(32).toString("hex");
  return `mc_${env}_${random}`;
}
