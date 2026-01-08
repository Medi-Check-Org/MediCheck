/**
 * Custom Error Classes
 * 
 * Domain-specific errors for better error handling and debugging.
 * Each error includes a code for API responses and proper typing.
 */

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Authentication & Authorization Errors
export class UnauthorizedError extends DomainError {
  constructor(message: string = "Unauthorized access", details?: unknown) {
    super(message, "UNAUTHORIZED", 401, details);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string = "Forbidden - insufficient permissions", details?: unknown) {
    super(message, "FORBIDDEN", 403, details);
  }
}

// Resource Errors
export class NotFoundError extends DomainError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, "NOT_FOUND", 404, { resource, identifier });
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(message, "CONFLICT", 409, details);
  }
}

// Validation Errors
export class ValidationError extends DomainError {
  constructor(message: string, public readonly errors: Record<string, string[]>) {
    super(message, "VALIDATION_ERROR", 400, errors);
  }
}

// Business Logic Errors
export class BusinessRuleViolationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(message, "BUSINESS_RULE_VIOLATION", 422, details);
  }
}

// External Service Errors
export class ExternalServiceError extends DomainError {
  constructor(
    service: string,
    message: string,
    details?: Record<string, any>
  ) {
    super(
      `${service} error: ${message}`,
      "EXTERNAL_SERVICE_ERROR",
      502,
      details ? { service, ...details } : { service }
    );
  }
}

// Blockchain-specific Errors
export class BlockchainError extends ExternalServiceError {
  constructor(operation: string, message: string, details?: Record<string, unknown>) {
    super("Hedera", `${operation} failed: ${message}`, details);
  }
}

// Rate Limiting
export class RateLimitError extends DomainError {
  constructor(limit: number, windowSeconds: number) {
    super(
      `Rate limit exceeded: ${limit} requests per ${windowSeconds} seconds`,
      "RATE_LIMIT_EXCEEDED",
      429,
      { limit, windowSeconds }
    );
  }
}

/**
 * Error handler utility for converting errors to API responses
 */
export function toErrorResponse(error: unknown): {
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
  statusCode: number;
} {
  if (error instanceof DomainError) {
    return {
      error: {
        message: error.message,
        code: error.code,
        details: error.details,
      },
      statusCode: error.statusCode,
    };
  }

  // Unknown errors
  console.error("Unhandled error:", error);
  return {
    error: {
      message: "An unexpected error occurred",
      code: "INTERNAL_SERVER_ERROR",
    },
    statusCode: 500,
  };
}
