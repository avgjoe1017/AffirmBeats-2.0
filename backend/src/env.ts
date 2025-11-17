import { z } from "zod";

/**
 * Environment variable schema using Zod
 * This ensures all required environment variables are present and valid
 */
const envSchema = z.object({
  // Server Configuration
  PORT: z.string().optional().default("3000"),
  NODE_ENV: z.enum(["development", "staging", "production"]).optional(),

  // Database Configuration
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine(
      (url) => 
        url.startsWith("file:") || 
        url.startsWith("postgresql://") || 
        url.startsWith("postgres://"),
      "DATABASE_URL must be a SQLite file path (file:...) or PostgreSQL connection string (postgresql://...)"
    )
    .default("file:dev.db"),

  // Better Auth Configuration
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),

  // Used for Better Auth and for Expo client access
  BACKEND_URL: z.url("BACKEND_URL must be a valid URL").default("http://localhost:3000"), // Set via the Vibecode enviroment at run-time

  // API Keys (optional for development)
  ELEVENLABS_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),

  // Sentry Configuration (optional)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.enum(["development", "staging", "production"]).optional(),

  // Redis Configuration (optional, for production)
  REDIS_URL: z.string().url().optional(),

  // Logging Configuration
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional(),

  // DataDog Configuration (optional, for production metrics)
  DATADOG_API_KEY: z.string().optional(),
  DATADOG_APP_KEY: z.string().optional(),
  DATADOG_SITE: z.string().optional().default("datadoghq.com"),

  // AWS CloudWatch Configuration (optional, for production metrics)
  AWS_REGION: z.string().optional().default("us-east-1"),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  CLOUDWATCH_NAMESPACE: z.string().optional().default("AffirmBeats"),

  // Google OAuth Configuration
  // GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  // GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),

  // Admin Configuration
  ADMIN_EMAILS: z.string().optional().default(""), // Comma-separated list of admin emails
});

type EnvSchema = typeof envSchema;
type EnvType = z.output<EnvSchema>;

/**
 * Validate and parse environment variables
 */
function validateEnv(): EnvType {
  try {
    const parsed = envSchema.parse(process.env);
    console.log("✅ Environment variables validated successfully");
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Environment variable validation failed:");
      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
      console.error("\nPlease check your .env file and ensure all required variables are set.");
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Validated and typed environment variables
 */
export const env = validateEnv();

/**
 * Type of the validated environment variables
 */
export type Env = EnvType;

/**
 * Extend process.env with our environment variables
 * This allows TypeScript to recognize our custom env vars on process.env
 */
declare global {
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface ProcessEnv extends EnvType {}
  }
}
