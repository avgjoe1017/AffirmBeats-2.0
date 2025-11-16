import { useEffect, useState, useCallback } from "react";
import * as InAppPurchases from "expo-in-app-purchases";
import { Platform } from "react-native";
import { 
  initializePurchases, 
  getProducts, 
  purchasePro, 
  getPurchaseHistory,
  hasPurchasedPro,
  PRO_PRODUCT_IDS 
} from "@/lib/payments";

interface PurchaseState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  products: {
    monthly: InAppPurchases.InAppPurchase | null;
    annual: InAppPurchases.InAppPurchase | null;
  };
  hasPurchased: boolean;
}

/**
 * Hook to manage in-app purchases
 * Handles initialization, product loading, and purchase flow
 */
export function useInAppPurchases() {
  const [state, setState] = useState<PurchaseState>({
    isInitialized: false,
    isLoading: false,
    error: null,
    products: {
      monthly: null,
      annual: null,
    },
    hasPurchased: false,
  });

  // Initialize purchases on mount
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Connect to store
        const connected = await initializePurchases();
        if (!connected) {
          throw new Error("Failed to connect to app store");
        }

        if (!mounted) return;

        // Load products
        const products = await getProducts();
        const monthlyProduct = products.find((p) => p.productId === PRO_PRODUCT_IDS.monthly);
        const annualProduct = products.find((p) => p.productId === PRO_PRODUCT_IDS.annual);

        // Check purchase history
        const purchased = await hasPurchasedPro();

        setState({
          isInitialized: true,
          isLoading: false,
          error: null,
          products: {
            monthly: monthlyProduct || null,
            annual: annualProduct || null,
          },
          hasPurchased: purchased,
        });

        // Set up purchase update listener
        InAppPurchases.setPurchaseListener(({ response, error }) => {
          if (error) {
            console.error("[Payments] Purchase error:", error);
            setState((prev) => ({ 
              ...prev, 
              error: error.message || "Purchase failed",
              isLoading: false 
            }));
            return;
          }

          if (response) {
            // Purchase successful
            console.log("[Payments] Purchase successful:", response);
            setState((prev) => ({ 
              ...prev, 
              hasPurchased: true,
              isLoading: false,
              error: null 
            }));
          }
        });
      } catch (error) {
        console.error("[Payments] Initialization error:", error);
        if (mounted) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error.message : "Failed to initialize purchases",
          }));
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  const purchase = useCallback(async (billingPeriod: "monthly" | "annual" = "monthly"): Promise<void> => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Initiate purchase - result will come through purchase listener
      await purchasePro(billingPeriod);
      
      // Don't set loading to false here - wait for purchase listener
      // The purchase listener will update the state when purchase completes
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Purchase failed";
      setState((prev) => ({ 
        ...prev, 
        error: errorMessage,
        isLoading: false 
      }));
      throw error;
    }
  }, []);

  const restore = useCallback(async (): Promise<boolean> => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const purchased = await hasPurchasedPro();
      
      setState((prev) => ({ 
        ...prev, 
        hasPurchased: purchased,
        isLoading: false 
      }));

      return purchased;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Restore failed";
      setState((prev) => ({ 
        ...prev, 
        error: errorMessage,
        isLoading: false 
      }));
      return false;
    }
  }, []);

  return {
    ...state,
    purchase,
    restore,
    isAvailable: Platform.OS === "ios" || Platform.OS === "android",
  };
}

