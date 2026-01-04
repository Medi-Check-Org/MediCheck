
export function hashApiKey(rawKey: string): string {
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}