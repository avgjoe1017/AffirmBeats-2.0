/**
 * Health Check Route Tests
 * 
 * Tests for the health check endpoint.
 */

import { describe, it, expect } from "vitest";
import { app } from "../../src/index";

describe("GET /health", () => {
  it("should return health status", async () => {
    const response = await app.request("/health", {
      method: "GET",
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBeDefined();
    expect(data.timestamp).toBeDefined();
    expect(data.checks).toBeDefined();
    expect(data.checks.database).toBeDefined();
  });

  it("should include database check", async () => {
    const response = await app.request("/health", {
      method: "GET",
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.checks.database).toBeOneOf(["ok", "error", "unknown"]);
  });
});
