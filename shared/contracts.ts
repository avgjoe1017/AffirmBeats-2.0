// contracts.ts
// Shared API contracts (schemas and types) used by both the server and the app.
// Import in the app as: `import { type GetSampleResponse } from "@shared/contracts"`
// Import in the server as: `import { postSampleRequestSchema } from "@shared/contracts"`

import { z } from "zod";


// GET /api/sample
export const getSampleResponseSchema = z.object({
  message: z.string(),
});
export type GetSampleResponse = z.infer<typeof getSampleResponseSchema>;

// POST /api/sample
export const postSampleRequestSchema = z.object({
  value: z.string(),
});
export type PostSampleRequest = z.infer<typeof postSampleRequestSchema>;
export const postSampleResponseSchema = z.object({
  message: z.string(),
});
export type PostSampleResponse = z.infer<typeof postSampleResponseSchema>;

// POST /api/upload/image
export const uploadImageRequestSchema = z.object({
  image: z.instanceof(File),
});
export type UploadImageRequest = z.infer<typeof uploadImageRequestSchema>;
export const uploadImageResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  url: z.string(),
  filename: z.string(),
});
export type UploadImageResponse = z.infer<typeof uploadImageResponseSchema>;

// GET /api/preferences
export const getPreferencesResponseSchema = z.object({
  voice: z.enum(["neutral", "confident", "whisper"]),
  pace: z.enum(["slow", "normal"]),
  noise: z.enum(["rain", "brown", "none", "ocean", "forest", "wind", "fire", "thunder"]),
  pronounStyle: z.enum(["you", "i"]),
  intensity: z.enum(["gentle", "assertive"]),
});
export type GetPreferencesResponse = z.infer<typeof getPreferencesResponseSchema>;

// PATCH /api/preferences
export const updatePreferencesRequestSchema = z.object({
  voice: z.enum(["neutral", "confident", "whisper"]).optional(),
  pace: z.enum(["slow", "normal"]).optional(),
  noise: z.enum(["rain", "brown", "none", "ocean", "forest", "wind", "fire", "thunder"]).optional(),
  pronounStyle: z.enum(["you", "i"]).optional(),
  intensity: z.enum(["gentle", "assertive"]).optional(),
});
export type UpdatePreferencesRequest = z.infer<typeof updatePreferencesRequestSchema>;

// POST /api/sessions/generate
export const generateSessionRequestSchema = z.object({
  goal: z.enum(["sleep", "focus", "calm", "manifest"]),
  binauralCategory: z.enum(["delta", "theta", "alpha", "beta", "gamma"]).optional(),
  binauralHz: z.string().optional(),
  customPrompt: z.string()
    .max(500, "Custom prompt must be less than 500 characters")
    .trim()
    .optional(),
});
export type GenerateSessionRequest = z.infer<typeof generateSessionRequestSchema>;
export const generateSessionResponseSchema = z.object({
  sessionId: z.string(),
  title: z.string(),
  affirmations: z.array(z.string()),
  goal: z.string(),
  voiceId: z.string(),
  pace: z.string(),
  noise: z.string(),
  lengthSec: z.number(),
  binauralCategory: z.string().optional(),
  binauralHz: z.string().optional(),
});
export type GenerateSessionResponse = z.infer<typeof generateSessionResponseSchema>;

// GET /api/sessions
export const getSessionsResponseSchema = z.object({
  sessions: z.array(z.object({
    id: z.string(),
    title: z.string(),
    goal: z.string(),
    affirmations: z.array(z.string()),
    voiceId: z.string(),
    pace: z.string(),
    noise: z.string(),
    lengthSec: z.number(),
    isFavorite: z.boolean(),
    createdAt: z.string(),
    binauralCategory: z.string().optional(),
    binauralHz: z.string().optional(),
  })),
});
export type GetSessionsResponse = z.infer<typeof getSessionsResponseSchema>;

// PATCH /api/sessions/:id/favorite
export const toggleFavoriteRequestSchema = z.object({
  isFavorite: z.boolean(),
});
export type ToggleFavoriteRequest = z.infer<typeof toggleFavoriteRequestSchema>;

// POST /api/tts/generate
export const generateTTSRequestSchema = z.object({
  text: z.string().min(1),
  voiceType: z.enum(["neutral", "confident", "whisper"]),
});
export type GenerateTTSRequest = z.infer<typeof generateTTSRequestSchema>;

// POST /api/tts/generate-session
export const generateSessionAudioRequestSchema = z.object({
  affirmations: z.array(z.string()),
  voiceType: z.enum(["neutral", "confident", "whisper"]),
  pace: z.enum(["slow", "normal"]),
});
export type GenerateSessionAudioRequest = z.infer<typeof generateSessionAudioRequestSchema>;

// POST /api/sessions/create
export const createCustomSessionRequestSchema = z.object({
  title: z.string()
    .min(1, "Title must be at least 1 character")
    .max(50, "Title must be less than 50 characters")
    .trim(),
  binauralCategory: z.enum(["delta", "theta", "alpha", "beta", "gamma"]),
  binauralHz: z.string().min(1, "Binaural frequency is required"),
  affirmations: z.array(
    z.string()
      .min(3, "Each affirmation must be at least 3 characters")
      .max(200, "Each affirmation must be less than 200 characters")
      .trim()
  )
    .min(1, "At least one affirmation is required")
    .max(20, "Maximum 20 affirmations allowed"),
  goal: z.enum(["sleep", "focus", "calm", "manifest"]).optional(), // Inferred from category if not provided
});
export type CreateCustomSessionRequest = z.infer<typeof createCustomSessionRequestSchema>;
export const createCustomSessionResponseSchema = z.object({
  sessionId: z.string(),
  title: z.string(),
  affirmations: z.array(z.string()),
  goal: z.string(),
  voiceId: z.string(),
  pace: z.string(),
  noise: z.string(),
  lengthSec: z.number(),
  binauralCategory: z.string(),
  binauralHz: z.string(),
});
export type CreateCustomSessionResponse = z.infer<typeof createCustomSessionResponseSchema>;

// PATCH /api/sessions/:id
export const updateSessionRequestSchema = z.object({
  title: z.string()
    .min(1, "Title must be at least 1 character")
    .max(50, "Title must be less than 50 characters")
    .trim()
    .optional(),
  binauralCategory: z.enum(["delta", "theta", "alpha", "beta", "gamma"]).optional(),
  binauralHz: z.string().min(1, "Binaural frequency is required").optional(),
  affirmations: z.array(
    z.string()
      .min(3, "Each affirmation must be at least 3 characters")
      .max(200, "Each affirmation must be less than 200 characters")
      .trim()
  )
    .min(1, "At least one affirmation is required")
    .max(20, "Maximum 20 affirmations allowed")
    .optional(),
});
export type UpdateSessionRequest = z.infer<typeof updateSessionRequestSchema>;
export const updateSessionResponseSchema = z.object({
  success: z.boolean(),
});
export type UpdateSessionResponse = z.infer<typeof updateSessionResponseSchema>;

// Subscription types
export const subscriptionTierSchema = z.enum(["free", "pro"]);
export type SubscriptionTier = z.infer<typeof subscriptionTierSchema>;

export const subscriptionStatusSchema = z.enum(["active", "cancelled", "expired"]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

export const billingPeriodSchema = z.enum(["monthly", "yearly"]);
export type BillingPeriod = z.infer<typeof billingPeriodSchema>;

// GET /api/subscription
export const getSubscriptionResponseSchema = z.object({
  tier: subscriptionTierSchema,
  status: subscriptionStatusSchema,
  billingPeriod: billingPeriodSchema.nullable(),
  currentPeriodEnd: z.string().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  customSessionsUsedThisMonth: z.number(),
  customSessionsLimit: z.number(),
  canCreateCustomSession: z.boolean(),
});
export type GetSubscriptionResponse = z.infer<typeof getSubscriptionResponseSchema>;

// POST /api/subscription/upgrade
export const upgradeSubscriptionRequestSchema = z.object({
  billingPeriod: billingPeriodSchema,
});
export type UpgradeSubscriptionRequest = z.infer<typeof upgradeSubscriptionRequestSchema>;
export const upgradeSubscriptionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type UpgradeSubscriptionResponse = z.infer<typeof upgradeSubscriptionResponseSchema>;

// POST /api/subscription/cancel
export const cancelSubscriptionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type CancelSubscriptionResponse = z.infer<typeof cancelSubscriptionResponseSchema>;

