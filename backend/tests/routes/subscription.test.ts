import { describe, it, expect } from "vitest";
import { app } from "../../src/index";

describe("Subscription API", () => {
  it("GET /api/subscription returns free tier info for guests", async () => {
    const res = await app.request("/api/subscription");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toMatchObject({
      tier: "free",
      status: "active",
      customSessionsUsedThisMonth: 0,
      customSessionsLimit: 3,
      canCreateCustomSession: true,
    });
  });

  it("POST /api/subscription/verify-purchase requires authentication", async () => {
    const res = await app.request("/api/subscription/verify-purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: "com.affirmbeats.pro.monthly",
        platform: "ios",
      }),
    });
    expect(res.status).toBe(401);
  });
});


