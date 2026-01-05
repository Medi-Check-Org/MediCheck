/**
 * Auth Module Index
 * 
 * Central export point for all authentication adapters.
 */

export { getActorFromClerk, getActorFromClerkOptional } from "./clerk";
export { getActorFromApiKey, extractApiKeyFromHeaders, isValidApiKeyFormat } from "./apiKey";
export { normalizeActor, mergePermissions, sanitizeActorForLogging } from "./normalizeActor";
