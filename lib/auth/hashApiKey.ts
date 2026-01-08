import crypto from "crypto";

const API_KEY_SECRET = process.env.API_KEY_SECRET || "";

export function hashApiKey(rawKey: string): string {
  return crypto
    .createHmac("sha256", API_KEY_SECRET)
    .update(rawKey)
    .digest("hex");
}
