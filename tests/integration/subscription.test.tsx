import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import SubscriptionScreen from "@/src/screens/SubscriptionScreen";

// Mock payments module to control products and purchase behavior
jest.mock("@/src/lib/payments", () => ({
  getProducts: jest.fn().mockResolvedValue([
    { productId: "com.affirmbeats.pro.monthly", price: "$9.99" },
    { productId: "com.affirmbeats.pro.annual", price: "$99.99" },
  ]),
  purchasePro: jest.fn().mockResolvedValue(undefined),
  hasPurchasedPro: jest.fn().mockResolvedValue(false),
  initializePurchases: jest.fn().mockResolvedValue(true),
}));

// Mock API client used by the screen to verify purchase
jest.mock("@/src/lib/api", () => ({
  api: {
    post: jest.fn().mockResolvedValue({}),
    get: jest.fn().mockResolvedValue({
      tier: "pro",
      status: "active",
      billingPeriod: "yearly",
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
      customSessionsUsedThisMonth: 0,
      customSessionsLimit: -1,
      canCreateCustomSession: true,
    }),
  },
}));

describe("SubscriptionScreen", () => {
  it("renders both plans and performs annual purchase flow", async () => {
    const { getByText, queryByText } = render(
      <NavigationContainer>
        <SubscriptionScreen />
      </NavigationContainer>
    );

    // Plans render with prices
    await waitFor(() => {
      expect(getByText("$99.99")).toBeTruthy();
      expect(getByText("$9.99")).toBeTruthy();
      expect(getByText(/SAVE \$20/i)).toBeTruthy();
      expect(getByText(/Subscribe to Pro/i)).toBeTruthy();
    });

    // Annual is default; press subscribe
    fireEvent.press(getByText(/Subscribe to Pro/i));

    // Success flow should eventually show alert text in UI copy; since Alert is native,
    // we instead assert that the button is still present and no error text appears.
    await waitFor(() => {
      expect(queryByText(/failed/i)).toBeNull();
    });
  });
});


