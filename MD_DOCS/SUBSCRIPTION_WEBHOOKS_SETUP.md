# Subscription Webhooks Setup Guide

**Date:** 2025-11-16  
**Purpose:** Configure server-to-server notifications for subscription renewals

---

## Overview

Subscription webhooks are **critical** for maintaining accurate subscription status. Without them, your database will become stale after the first billing cycle, and users who renew might lose their "Pro" status until they manually "Restore Purchases."

### Current Status

✅ **Webhook endpoints created**: `/api/webhooks/apple` and `/api/webhooks/google`  
⚠️ **Implementation needed**: User lookup by transaction ID, database schema updates

---

## 1. Database Schema Updates

### Add Transaction ID Fields

Update `backend/prisma/schema.prisma`:

```prisma
model UserSubscription {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tier              String   @default("free") // free/pro
  status            String   @default("active") // active/cancelled/expired
  billingPeriod     String?  // monthly/yearly (null for free)
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  cancelAtPeriodEnd Boolean  @default(false)
  customSessionsUsedThisMonth Int @default(0)
  lastResetDate     DateTime @default(now())
  
  // NEW: Transaction tracking for webhooks
  appleTransactionId String?  // Apple original_transaction_id (stable across renewals)
  googlePurchaseToken String? // Google purchase token (unique per subscription)
  platform           String?  // "apple" | "google" | null
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([appleTransactionId]) // For Apple webhook lookups
  @@index([googlePurchaseToken]) // For Google webhook lookups
  @@map("user_subscription")
}
```

**Migration:**
```bash
cd backend
npx prisma migrate dev --name add_subscription_transaction_ids
```

---

## 2. Update Initial Purchase Flow

When a user purchases a subscription, store the transaction ID:

### Update `backend/src/routes/subscription.ts`

In the `/verify-purchase` endpoint, after updating subscription:

```typescript
// After updating subscription to Pro
await db.userSubscription.update({
  where: { userId: session.userId },
  data: {
    tier: "pro",
    status: "active",
    billingPeriod,
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
    // NEW: Store transaction IDs
    appleTransactionId: platform === "apple" ? transactionId : undefined,
    googlePurchaseToken: platform === "google" ? transactionId : undefined,
    platform: platform,
  },
});
```

**Note:** You'll need to extract the transaction ID from the purchase receipt. For Apple, use `original_transaction_id`. For Google, use `purchaseToken`.

---

## 3. Apple App Store Webhook Setup

### Step 1: Configure Webhook URL in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to your app → App Information → App Store Server Notifications
3. Add your webhook URL: `https://your-backend.com/api/webhooks/apple`
4. Save the configuration

### Step 2: Verify Webhook Signature (Production)

Apple sends a signed payload. Verify it using Apple's public key:

```typescript
// Add to backend/src/routes/webhooks.ts
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const appleClient = jwksClient({
  jwksUri: "https://api.appstoreconnect.apple.com/.well-known/jwks.json",
});

async function verifyAppleWebhook(token: string): Promise<boolean> {
  try {
    const decoded = jwt.decode(token, { complete: true });
    const kid = decoded?.header.kid;
    
    const key = await appleClient.getSigningKey(kid);
    const signingKey = key.getPublicKey();
    
    jwt.verify(token, signingKey);
    return true;
  } catch {
    return false;
  }
}
```

### Step 3: Update Webhook Handler

Update `/api/webhooks/apple` to:
1. Verify the signature
2. Look up user by `original_transaction_id`
3. Update subscription status based on notification type

---

## 4. Google Play Webhook Setup

### Step 1: Enable Google Play Developer API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable "Google Play Android Developer API"
3. Create a service account
4. Download the JSON key file

### Step 2: Configure Webhook in Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Navigate to your app → Monetization → Subscriptions
3. Click "Server-to-server notifications"
4. Add your webhook URL: `https://your-backend.com/api/webhooks/google`
5. Upload your service account JSON key

### Step 3: Verify Webhook Signature (Production)

Google signs webhooks with a JWT. Verify it:

```typescript
// Add to backend/src/routes/webhooks.ts
import { GoogleAuth } from "google-auth-library";

const auth = new GoogleAuth({
  keyFile: "path/to/service-account-key.json",
  scopes: ["https://www.googleapis.com/auth/androidpublisher"],
});

async function verifyGoogleWebhook(notification: any): Promise<boolean> {
  // Verify the notification signature
  // Implementation depends on Google's notification format
  return true; // Placeholder
}
```

### Step 4: Update Webhook Handler

Update `/api/webhooks/google` to:
1. Verify the signature
2. Look up user by `purchaseToken`
3. Update subscription status based on notification type

---

## 5. Complete Webhook Implementation

### Update `backend/src/routes/webhooks.ts`

Replace placeholder `findUserByTransactionId` with actual implementation:

```typescript
async function findUserByTransactionId(
  transactionId: string,
  platform: "apple" | "google"
): Promise<string | null> {
  const subscription = await db.userSubscription.findFirst({
    where: platform === "apple"
      ? { appleTransactionId: transactionId }
      : { googlePurchaseToken: transactionId },
    select: { userId: true },
  });

  return subscription?.userId || null;
}
```

### Update Notification Handlers

For each notification type, update the subscription:

```typescript
// Example: DID_RENEW (Apple) or SUBSCRIPTION_RENEWED (Google)
const userId = await findUserByTransactionId(originalTransactionId, "apple");
if (userId) {
  const periodEnd = new Date(parseInt(expiresDateMs));
  await db.userSubscription.update({
    where: { userId },
    data: {
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
  });
}
```

---

## 6. Testing Webhooks

### Apple Sandbox Testing

1. Use Apple's sandbox environment for testing
2. Test with sandbox user accounts
3. Monitor webhook logs for incoming notifications

### Google Testing

1. Use Google Play Console's test notifications
2. Test with test subscriptions
3. Monitor webhook logs

### Local Testing

Use a tool like [ngrok](https://ngrok.com) to expose your local server:

```bash
ngrok http 3000
# Use the ngrok URL in App Store Connect / Google Play Console
```

---

## 7. Monitoring and Logging

### Add Webhook Logging

Log all webhook events for debugging:

```typescript
logger.info("Webhook received", {
  platform,
  notificationType,
  transactionId,
  userId,
  action: "subscription_renewed",
});
```

### Monitor Webhook Health

Add to health check endpoint:
- Webhook endpoint accessibility
- Recent webhook processing success rate

---

## 8. Security Considerations

### Rate Limiting

Add rate limiting to webhook endpoints to prevent abuse:

```typescript
import { rateLimiters } from "../middleware/rateLimit";

webhooks.post("/apple", rateLimiters.webhook, async (c) => {
  // ...
});
```

### IP Whitelisting (Optional)

Consider whitelisting Apple and Google IP ranges for additional security.

---

## 9. Production Checklist

- [ ] Database migration applied (transaction ID fields added)
- [ ] Initial purchase flow updated to store transaction IDs
- [ ] Apple webhook URL configured in App Store Connect
- [ ] Google webhook URL configured in Google Play Console
- [ ] Webhook signature verification implemented
- [ ] User lookup by transaction ID working
- [ ] Subscription status updates working
- [ ] Webhook logging and monitoring in place
- [ ] Tested with sandbox/test subscriptions
- [ ] Error handling and retry logic implemented

---

## 10. Troubleshooting

### Webhooks Not Receiving

- Check webhook URL is publicly accessible
- Verify URL is correctly configured in App Store Connect / Google Play Console
- Check backend logs for incoming requests
- Verify firewall/security groups allow incoming connections

### Subscription Status Not Updating

- Check webhook logs for errors
- Verify transaction ID lookup is working
- Check database for stored transaction IDs
- Verify subscription update logic

### Signature Verification Failing

- Check Apple/Google public keys are accessible
- Verify JWT library is correctly configured
- Check webhook payload format matches expected structure

---

## Related Documentation

- `PRODUCTION_INSTRUCTIONS.md` - Production deployment guide
- `backend/src/routes/webhooks.ts` - Webhook implementation
- `backend/src/routes/subscription.ts` - Subscription management

---

## Next Steps

1. **Immediate**: Add transaction ID fields to database schema
2. **Short-term**: Update initial purchase flow to store transaction IDs
3. **Before Launch**: Configure webhooks in App Store Connect and Google Play Console
4. **Post-Launch**: Monitor webhook processing and subscription status accuracy

