import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import CreateSessionScreen from "@/src/screens/CreateSessionScreen";
import { useAppStore } from "@/src/state/appStore";

describe("Paywall Flow Integration", () => {
  beforeEach(() => {
    // Reset subscription to free with 0 used
    useAppStore.setState({
      subscription: {
        tier: "free",
        status: "active",
        billingPeriod: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        customSessionsUsedThisMonth: 0,
        customSessionsLimit: 3,
        canCreateCustomSession: true,
      } as any,
    });
  });

  it("allows generation while under free limit, then shows paywall after 3rd", async () => {
    const { getByText, getByPlaceholderText, queryByText, rerender } = render(
      <NavigationContainer>
        <CreateSessionScreen />
      </NavigationContainer>
    );

    // Under limit (0/3) - user can generate
    const intent = getByPlaceholderText(/what do you want to create/i);
    fireEvent.changeText(intent, "Help me sleep");
    const generateBtn = getByText(/generate with ai/i);
    expect(generateBtn).toBeEnabled();

    // Simulate usage rising to 3/3
    useAppStore.setState({
      subscription: {
        tier: "free",
        status: "active",
        billingPeriod: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        customSessionsUsedThisMonth: 3,
        customSessionsLimit: 3,
        canCreateCustomSession: false,
      } as any,
    });
    rerender(
      <NavigationContainer>
        <CreateSessionScreen />
      </NavigationContainer>
    );

    // Try to generate 4th - should surface limit/paywall prompt somewhere in UI
    const intent2 = getByPlaceholderText(/what do you want to create/i);
    fireEvent.changeText(intent2, "Another session");
    fireEvent.press(getByText(/generate with ai/i));

    await waitFor(() => {
      // Expect some upgrade messaging in UI
      expect(queryByText(/monthly limit/i)).toBeTruthy();
      expect(queryByText(/upgrade to pro/i)).toBeTruthy();
    });
  });
});


