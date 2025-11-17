import { useEffect, useState, useCallback } from "react";
import { Platform } from "react-native";
import { 
  initializePurchases, 
  getProducts, 
  purchasePro, 
  getPurchaseHistory,
  hasPurchasedPro,
  PRO_PRODUCT_IDS,
  setPurchaseListener
} from "@/lib/payments";

interface PurchaseState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  products: {
    monthly: any | null;
    annual: any | null;
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

        // Connect to store (may be unavailable in Expo Go)
        const connected = await initializePurchases();

        if (!mounted) return;

        let monthlyProduct: any | null = null;
        let annualProduct: any | null = null;
        let purchased = false;

        if (connected) {
          // Load products (empty if unavailable)
          const products = await getProducts();
          monthlyProduct = products?.find((p) => p.productId === PRO_PRODUCT_IDS.monthly) || null;
          annualProduct = products?.find((p) => p.productId === PRO_PRODUCT_IDS.annual) || null;

          // Check purchase history
          purchased = await hasPurchasedPro();
        }

        setState({
          isInitialized: connected,
          isLoading: false,
          error: connected ? null : null,
          products: {
            monthly: monthlyProduct || null,
            annual: annualProduct || null,
          },
          hasPurchased: purchased,
        });

        // Set up purchase update listener
        if (connected) {
          await setPurchaseListener(({ response, error }: any) => {
            if (error) {
              console.error("[Payments] Purchase error:", error);
              setState((prev) => ({
                ...prev,
                error: error.message || "Purchase failed",
                isLoading: false,
              }));
              return;
            }
            if (response) {
              setState((prev) => ({
                ...prev,
                hasPurchased: true,
                isLoading: false,
                error: null,
              }));
            }
          });
        }
      } catch (error) {
        console.error("[Payments] Initialization error:", error);
        if (mounted) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            // Don't surface as error in Expo Go; just mark unavailable
            error: null,
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

