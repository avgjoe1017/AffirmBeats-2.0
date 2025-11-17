/**
 * Admin Authentication Middleware
 * 
 * Protects admin routes by requiring:
 * 1. User to be authenticated
 * 2. User to have admin role (check email against ADMIN_EMAILS env var)
 * 
 * Usage:
 *   adminRouter.use("*", adminAuth);
 */

import type { Context, Next } from "hono";
import type { AppType } from "../types";
import { logger } from "../lib/logger";
import { env } from "../env";

/**
 * Admin email addresses (comma-separated in ADMIN_EMAILS env var)
 * Defaults to empty string (no admins) if not set
 */
const ADMIN_EMAILS = (env.ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean);

/**
 * Admin authentication middleware
 * Checks if user is authenticated and has admin privileges
 */
export async function adminAuth(c: Context<AppType>, next: Next) {
  const user = c.get("user");
  const session = c.get("session");

  // Check if user is authenticated
  if (!user || !session) {
    logger.warn("Unauthorized admin access attempt", {
      path: c.req.path,
      ip: c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown",
    });
    
    // If it's a browser request (HTML), redirect to login page
    const acceptHeader = c.req.header("accept") || "";
    if (acceptHeader.includes("text/html")) {
      return c.redirect("/admin/login");
    }
    
    // Otherwise return JSON error
    return c.json(
      {
        error: "UNAUTHORIZED",
        message: "Authentication required. Please sign in at /admin/login",
      },
      401
    );
  }

  // Check if user is admin
  // Option 1: Check against ADMIN_EMAILS env var
  if (ADMIN_EMAILS.length > 0) {
    if (!ADMIN_EMAILS.includes(user.email)) {
      logger.warn("Non-admin user attempted admin access", {
        userId: user.id,
        email: user.email,
        path: c.req.path,
      });
      return c.json(
        {
          error: "FORBIDDEN",
          message: "Admin access required",
        },
        403
      );
    }
  } else {
    // Option 2: Check if user has admin role in database (if you add a role field)
    // For now, if ADMIN_EMAILS is not set, allow any authenticated user (development mode)
    logger.debug("Admin access granted (no ADMIN_EMAILS configured)", {
      userId: user.id,
      email: user.email,
    });
  }

  // User is authenticated and authorized
  await next();
}

/**
 * Optional: Check if user is admin (for conditional logic)
 */
export function isAdmin(user: { email: string } | null): boolean {
  if (!user) return false;
  if (ADMIN_EMAILS.length === 0) return true; // Development mode
  return ADMIN_EMAILS.includes(user.email);
}

