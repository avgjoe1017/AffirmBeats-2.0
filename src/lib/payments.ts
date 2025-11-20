/**
 * Payment Service
 * Handles in-app purchases using expo-in-app-purchases
 * 
 * For subscription purchases (auto-renewable):
 * - iOS: Uses StoreKit subscriptions
 * - Android: Uses Google Play Billing subscriptions
 * - Supports monthly and annual billing periods
 */

import { Platform } from "react-native";

// Lazy-load the native module to avoid crashes in Expo Go (module not included)
let IAPModule: any | null | undefined;
async function getIAPModule(): Promise<any | null> {
  if (IAPModule !== undefined) return IAPModule;
  try {
    // Dynamically import; will fail in environments without native module
    IAPModule = await import("expo-in-app-purchases");
    return IAPModule;
  } catch {
    IAPModule = null;
    return null;
  }
}

// Product IDs for Pro subscriptions
// These must match the product IDs configured in App Store Connect / Google Play Console
export const PRO_PRODUCT_IDS = {
  monthly: Platform.select({
    ios: "com.recenter.pro.monthly",
    android: "com.recenter.pro.monthly",
    default: "com.recenter.pro.monthly",
  }),
  annual: Platform.select({
    ios: "com.recenter.pro.annual",
    android: "com.recenter.pro.annual",
    default: "com.recenter.pro.annual",
  }),
};

// Legacy support - check for any Pro product
export const PRO_PRODUCT_ID = PRO_PRODUCT_IDS.monthly; // Default to monthly for backward compatibility

/**
 * Initialize the in-app purchase connection
 * Must be called before any purchase operations
 */
export async function initializePurchases(): Promise<boolean> {
  const IAP = await getIAPModule();
  if (!IAP || typeof IAP.connectAsync !== "function") return false;
  try {
    const connected = await IAP.connectAsync();
    return connected;
  } catch (error) {
    console.error("[Payments] Failed to connect to store:", error);
    return false;
  }
}

/**
 * Get available products from the store
 */
export async function getProducts(): Promise<any[]> {
  const IAP = await getIAPModule();
  if (!IAP || typeof IAP.getProductsAsync !== "function") return [];
  try {
    const productIds = [PRO_PRODUCT_IDS.monthly, PRO_PRODUCT_IDS.annual];
    const products = await IAP.getProductsAsync(productIds);
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
  const IAP = await getIAPModule();
  if (!IAP || typeof IAP.purchaseItemAsync !== "function") {
    throw new Error("In-app purchases are not available in this environment.");
  }
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
    await IAP.purchaseItemAsync(productId);
  } catch (error) {
    console.error("[Payments] Purchase failed:", error);
    throw error;
  }
}

/**
 * Get purchase history (for restore purchases)
 */
export async function getPurchaseHistory(): Promise<any[]> {
  const IAP = await getIAPModule();
  if (!IAP || typeof IAP.getPurchaseHistoryAsync !== "function") return [];
  try {
    const history = await IAP.getPurchaseHistoryAsync();
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
  const IAP = await getIAPModule();
  if (!IAP || typeof IAP.disconnectAsync !== "function") return;
  try {
    await IAP.disconnectAsync();
  } catch (error) {
    console.error("[Payments] Failed to disconnect:", error);
  }
}

/**
 * Set purchase listener if module is available
 */
export async function setPurchaseListener(
  listener: (event: any) => void
): Promise<boolean> {
  const IAP = await getIAPModule();
  if (!IAP || typeof IAP.setPurchaseListener !== "function") return false;
  try {
    IAP.setPurchaseListener(listener);
  } catch {
    return false;
  }
  return true;
}

