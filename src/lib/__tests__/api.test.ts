/**
 * API Client Tests
 * 
 * Tests for the API client that handles HTTP requests to the backend.
 */

import { api } from "../api";
import { authClient } from "../authClient";

// Mock authClient
jest.mock("../authClient", () => ({
  authClient: {
    getSession: jest.fn(() => Promise.resolve({})),
  },
}));

// Mock global fetch
global.fetch = jest.fn();

describe("API Client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: "test" }),
    });
  });

  it("should make GET request", async () => {
    const result = await api.get<{ data: string }>("/api/test");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/test"),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("should make POST request with body", async () => {
    const body = { test: "data" };
    await api.post("/api/test", { body });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/test"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(body),
      })
    );
  });

  it("should handle errors", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: "Not found" }),
    });

    await expect(api.get("/api/test")).rejects.toThrow();
  });
});

