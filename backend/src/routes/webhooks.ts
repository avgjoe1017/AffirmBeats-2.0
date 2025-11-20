/**
 * Subscription Webhook Handlers
 * 
 * Handles server-to-server notifications from Apple App Store and Google Play
 * for subscription renewals, cancellations, and other subscription events.
 * 
 * These webhooks are critical for maintaining accurate subscription status
 * without requiring users to manually "Restore Purchases".
 */

import { Hono } from "hono";
import type { AppType } from "../types";
import { db } from "../db";
import { logger } from "../lib/logger";
import { env } from "../env";
import crypto from "crypto";

const webhooks = new Hono<AppType>();

/**
 * Apple App Store Server-to-Server Notification
 * 
 * POST /api/webhooks/apple
 * 
 * Apple sends notifications for:
 * - INITIAL_BUY: First purchase
 * - DID_RENEW: Subscription renewed
 * - DID_FAIL_TO_RENEW: Payment failed
 * - CANCEL: Subscription cancelled
 * - REFUND: Refund issued
 * 
 * Documentation: https://developer.apple.com/documentation/appstoreservernotifications
 */
webhooks.post("/apple", async (c) => {
  try {
    // Apple sends notifications as JSON
    const notification = await c.req.json();
    
    logger.info("Apple webhook received", {
      notificationType: notification.notification_type,
      unifiedReceipt: notification.unified_receipt?.latest_receipt_info?.[0]?.transaction_id,
    });

    // Verify the notification (in production, verify with Apple's servers)
    // For now, we'll process it - add verification in production
    const notificationType = notification.notification_type;
    const unifiedReceipt = notification.unified_receipt;
    const latestReceiptInfo = unifiedReceipt?.latest_receipt_info?.[0];

    if (!latestReceiptInfo) {
      logger.warn("Apple webhook missing receipt info");
      return c.json({ status: "error", message: "Missing receipt info" }, 400);
    }

    // Extract user identifier from the receipt
    // Apple provides original_transaction_id which is stable across renewals
    const originalTransactionId = latestReceiptInfo.original_transaction_id;
    const productId = latestReceiptInfo.product_id;
    const expiresDateMs = latestReceiptInfo.expires_date_ms;

    // Find user by original transaction ID
    // Note: You'll need to store original_transaction_id when processing initial purchase
    // For now, we'll try to match by product ID and email if available
    const userEmail = unifiedReceipt?.latest_receipt_info?.[0]?.original_transaction_id;
    
    // Determine billing period from product ID
    const billingPeriod: "monthly" | "yearly" = productId.includes("annual") ? "yearly" : "monthly";

    // Handle different notification types
    switch (notificationType) {
      case "INITIAL_BUY":
      case "DID_RENEW": {
        // Subscription active or renewed
        const periodEnd = expiresDateMs ? new Date(parseInt(expiresDateMs)) : new Date();
        
        // Find user by transaction ID (you'll need to store this in UserSubscription)
        // For now, we'll need to update the logic to match users properly
        // This is a simplified version - you may need to store transaction IDs in the database
        
        logger.info("Processing subscription renewal/initial purchase", {
          notificationType,
          productId,
          periodEnd,
        });

        // TODO: Implement proper user lookup by transaction ID
        // For now, log the event for manual processing if needed
        logger.warn("Apple webhook: User lookup by transaction ID not yet implemented", {
          originalTransactionId,
          productId,
        });

        return c.json({ status: "received" }, 200);
      }

      case "DID_FAIL_TO_RENEW": {
        // Payment failed - subscription will expire
        logger.info("Subscription payment failed", {
          originalTransactionId,
          productId,
        });

        // TODO: Update subscription status to "expired" or "past_due"
        // Find user and update subscription

        return c.json({ status: "received" }, 200);
      }

      case "CANCEL": {
        // Subscription cancelled
        logger.info("Subscription cancelled", {
          originalTransactionId,
          productId,
        });

        // TODO: Update subscription to mark for cancellation
        // Find user and set cancelAtPeriodEnd = true

        return c.json({ status: "received" }, 200);
      }

      case "REFUND": {
        // Refund issued - revoke access
        logger.info("Subscription refunded", {
          originalTransactionId,
          productId,
        });

        // TODO: Downgrade user to free tier immediately
        // Find user and update subscription to free tier

        return c.json({ status: "received" }, 200);
      }

      default:
        logger.info("Unhandled Apple notification type", { notificationType });
        return c.json({ status: "received" }, 200);
    }
  } catch (error) {
    logger.error("Error processing Apple webhook", error);
    return c.json({ status: "error", message: "Internal server error" }, 500);
  }
});

/**
 * Google Play Billing Server-to-Server Notification
 * 
 * POST /api/webhooks/google
 * 
 * Google sends notifications for:
 * - SUBSCRIPTION_PURCHASED: Initial purchase
 * - SUBSCRIPTION_RENEWED: Subscription renewed
 * - SUBSCRIPTION_IN_GRACE_PERIOD: Payment failed, in grace period
 * - SUBSCRIPTION_CANCELED: Subscription cancelled
 * - SUBSCRIPTION_REVOKED: Refunded or revoked
 * 
 * Documentation: https://developer.android.com/google/play/billing/getting-ready#subscriptions
 */
webhooks.post("/google", async (c) => {
  try {
    // Google sends notifications as JSON with signature verification
    const notification = await c.req.json();
    
    logger.info("Google webhook received", {
      message: notification.message,
      subscriptionNotification: notification.subscriptionNotification,
    });

    // Verify the notification signature (in production, verify with Google's public key)
    // For now, we'll process it - add verification in production

    const message = notification.message;
    const subscriptionNotification = notification.subscriptionNotification;
    
    if (!subscriptionNotification) {
      logger.warn("Google webhook missing subscription notification");
      return c.json({ status: "error", message: "Missing subscription notification" }, 400);
    }

    const notificationType = subscriptionNotification.notificationType;
    const purchaseToken = subscriptionNotification.purchaseToken;
    const subscriptionId = subscriptionNotification.subscriptionId;

    // Extract user identifier
    // Google provides purchaseToken which is unique per subscription
    // You'll need to store this when processing initial purchase

    // Determine billing period from subscription ID
    const billingPeriod: "monthly" | "yearly" = subscriptionId.includes("annual") ? "yearly" : "monthly";

    // Handle different notification types
    switch (notificationType) {
      case 1: // SUBSCRIPTION_RECOVERED - User recovered from billing issue
      case 2: // SUBSCRIPTION_RENEWED - Subscription renewed
      case 4: // SUBSCRIPTION_PURCHASED - Initial purchase
      {
        logger.info("Processing subscription purchase/renewal", {
          notificationType,
          subscriptionId,
          purchaseToken,
        });

        // TODO: Implement proper user lookup by purchaseToken
        // Update subscription to active with new period end date
        // Find user and update subscription

        logger.warn("Google webhook: User lookup by purchaseToken not yet implemented", {
          purchaseToken,
          subscriptionId,
        });

        return c.json({ status: "received" }, 200);
      }

      case 3: // SUBSCRIPTION_IN_GRACE_PERIOD - Payment failed, in grace period
      {
        logger.info("Subscription in grace period", {
          subscriptionId,
          purchaseToken,
        });

        // TODO: Update subscription status to "past_due" or similar
        // User still has access but payment failed

        return c.json({ status: "received" }, 200);
      }

      case 12: // SUBSCRIPTION_CANCELED - Subscription cancelled
      {
        logger.info("Subscription cancelled", {
          subscriptionId,
          purchaseToken,
        });

        // TODO: Update subscription to mark for cancellation
        // Find user and set cancelAtPeriodEnd = true

        return c.json({ status: "received" }, 200);
      }

      case 13: // SUBSCRIPTION_REVOKED - Refunded or revoked
      {
        logger.info("Subscription revoked", {
          subscriptionId,
          purchaseToken,
        });

        // TODO: Downgrade user to free tier immediately
        // Find user and update subscription to free tier

        return c.json({ status: "received" }, 200);
      }

      default:
        logger.info("Unhandled Google notification type", { notificationType });
        return c.json({ status: "received" }, 200);
    }
  } catch (error) {
    logger.error("Error processing Google webhook", error);
    return c.json({ status: "error", message: "Internal server error" }, 500);
  }
});

/**
 * Helper function to find user by transaction ID
 * This requires storing transaction IDs in the database
 */
async function findUserByTransactionId(
  transactionId: string,
  platform: "apple" | "google"
): Promise<string | null> {
  // TODO: Add transactionId field to UserSubscription model
  // For now, this is a placeholder
  const subscription = await db.userSubscription.findFirst({
    where: {
      // This will need to be implemented once we add transactionId to schema
    },
  });

  return subscription?.userId || null;
}

export { webhooks };

