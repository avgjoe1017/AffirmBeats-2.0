/**
 * Payment Service
 * Handles in-app purchases using expo-in-app-purchases
 * 
 * For subscription purchases (auto-renewable):
 * - iOS: Uses StoreKit subscriptions
 * - Android: Uses Google Play Billing subscriptions
 * - Supports monthly and annual billing periods
 */

import * as InAppPurchases from "expo-in-app-purchases";
import { Platform } from "react-native";

// Product IDs for Pro subscriptions
// These must match the product IDs configured in App Store Connect / Google Play Console
export const PRO_PRODUCT_IDS = {
  monthly: Platform.select({
    ios: "com.affirmbeats.pro.monthly",
    android: "com.affirmbeats.pro.monthly",
    default: "com.affirmbeats.pro.monthly",
  }),
  annual: Platform.select({
    ios: "com.affirmbeats.pro.annual",
    android: "com.affirmbeats.pro.annual",
    default: "com.affirmbeats.pro.annual",
  }),
};

// Legacy support - check for any Pro product
export const PRO_PRODUCT_ID = PRO_PRODUCT_IDS.monthly; // Default to monthly for backward compatibility

/**
 * Initialize the in-app purchase connection
 * Must be called before any purchase operations
 */
export async function initializePurchases(): Promise<boolean> {
  try {
    const connected = await InAppPurchases.connectAsync();
    return connected;
  } catch (error) {
    console.error("[Payments] Failed to connect to store:", error);
    return false;
  }
}

/**
 * Get available products from the store
 */
export async function getProducts(): Promise<InAppPurchases.InAppPurchase[]> {
  try {
    const productIds = [PRO_PRODUCT_IDS.monthly, PRO_PRODUCT_IDS.annual];
    const products = await InAppPurchases.getProductsAsync(productIds);
    return products.results || [];
  } catch (error) {
    console.error("[Payments] Failed to get products:", error);
    throw error;
  }
}

/**
 * Purchase Pro subscription (monthly or annual)
 * Note: The actual purchase result comes through the purchase listener
 * This function initiates the purchase flow
 * 
 * @param billingPeriod - "monthly" or "annual"
 */
export async function purchasePro(billingPeriod: "monthly" | "annual"): Promise<void> {
  try {
    // First, get the products to ensure they're available
    const products = await getProducts();
    const productId = billingPeriod === "monthly" ? PRO_PRODUCT_IDS.monthly : PRO_PRODUCT_IDS.annual;
    const proProduct = products.find((p) => p.productId === productId);

    if (!proProduct) {
      throw new Error(`Pro ${billingPeriod} product not found in store. Please check your product configuration.`);
    }

    // Initiate the purchase
    // The purchase result will come through the purchase listener set up in the hook
    await InAppPurchases.purchaseItemAsync(productId);
  } catch (error) {
    console.error("[Payments] Purchase failed:", error);
    throw error;
  }
}

/**
 * Get purchase history (for restore purchases)
 */
export async function getPurchaseHistory(): Promise<InAppPurchases.InAppPurchase[]> {
  try {
    const history = await InAppPurchases.getPurchaseHistoryAsync();
    return history.results || [];
  } catch (error) {
    console.error("[Payments] Failed to get purchase history:", error);
    throw error;
  }
}

/**
 * Check if user has purchased Pro (by checking purchase history)
 * Returns true if user has either monthly or annual subscription
 */
export async function hasPurchasedPro(): Promise<boolean> {
  try {
    const history = await getPurchaseHistory();
    return history.some((purchase) => 
      purchase.productId === PRO_PRODUCT_IDS.monthly || 
      purchase.productId === PRO_PRODUCT_IDS.annual
    );
  } catch (error) {
    console.error("[Payments] Failed to check purchase status:", error);
    return false;
  }
}

/**
 * Disconnect from the store (cleanup)
 */
export async function disconnectPurchases(): Promise<void> {
  try {
    await InAppPurchases.disconnectAsync();
  } catch (error) {
    console.error("[Payments] Failed to disconnect:", error);
  }
}

