/**
 * API Key Authentication Adapter
 * 
 * Converts API key authentication into Actor model.
 * Validates API keys and extracts organization and permissions.
 * 
 * This is a placeholder implementation for Phase 3.
 * In production, this would:
 * 1. Hash the provided API key
 * 2. Look up in ApiKey table
 * 3. Verify it's active and not expired
 * 4. Return Actor with scoped permissions
 */

import { Actor } from "@/app/types/actor";
import { UnauthorizedError } from "@/app/types/errors";

/**
 * Get Actor from API Key
 * 
 * @param apiKey - The API key from request header
 * @throws {UnauthorizedError} If API key is invalid
 * 
 * @todo Implement actual API key validation in Phase 3
 */
export async function getActorFromApiKey(apiKey: string): Promise<Actor> {
  // TODO: Phase 3 - Implement API key authentication
  // 1. Hash the API key using crypto
  // 2. Look up in ApiKey table
  // 3. Verify isActive and not expired
  // 4. Load organization
  // 5. Return Actor with scopes from API key
  
  throw new UnauthorizedError("API key authentication not yet implemented");
}

/**
 * Extract API key from request headers
 * 
 * Supports both standard Authorization header and custom X-API-Key header
 */
export function extractApiKeyFromHeaders(headers: Headers): string | null {
  // Check Authorization header (Bearer format)
  const authHeader = headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Check X-API-Key header
  const apiKeyHeader = headers.get("x-api-key");
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  return null;
}

/**
 * Validate API key format (basic check before database lookup)
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  // Example format: mc_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  // Or: mc_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  const pattern = /^mc_(live|test)_[a-zA-Z0-9]{32,}$/;
  return pattern.test(apiKey);
}
