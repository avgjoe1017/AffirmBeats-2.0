import { describe, it, expect } from "vitest";
import { app } from "../../src/index";

describe("Subscription API (smoke)", () => {
  it("GET /api/subscription returns a response (guest)", async () => {
    const res = await app.request("/api/subscription");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("tier");
  });
});


