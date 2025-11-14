/**
 * Error Response Schemas
 * 
 * Standardized error response format for better error handling
 * and user experience across the application.
 */

import { z } from "zod";

/**
 * Standard error response schema
 */
export const errorResponseSchema = z.object({
  error: z.string(),
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.any()).optional(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

/**
 * Predefined error codes
 */
export const ErrorCodes = {
  // Authentication
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  
  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  
  // Resources
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  
  // Limits
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  SUBSCRIPTION_LIMIT_EXCEEDED: "SUBSCRIPTION_LIMIT_EXCEEDED",
  
  // Server
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  
  // External APIs
  TTS_ERROR: "TTS_ERROR",
  OPENAI_ERROR: "OPENAI_ERROR",
} as const;

/**
 * Helper function to create standardized error responses
 */
export function createErrorResponse(
  code: keyof typeof ErrorCodes,
  message: string,
  details?: Record<string, unknown>
): ErrorResponse {
  return {
    error: code,
    code: ErrorCodes[code],
    message,
    ...(details && { details }),
  };
}

