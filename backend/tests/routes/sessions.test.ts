import { describe, it, expect } from "vitest";
import { app } from "../../src/index";

describe("Sessions API", () => {
  it("GET /api/sessions returns default sessions for guests", async () => {
    const res = await app.request("/api/sessions");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    // Should include some default sessions
    expect(data.length).toBeGreaterThan(0);
    expect(data.some((s: any) => typeof s.id === "string")).toBe(true);
  });
});

/**
 * Sessions Route Tests
 * 
 * Tests for the sessions API endpoints.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { app } from "../../src/index";
import { createCompleteTestUser, createTestSession, cleanupTestData } from "../utils";

describe("POST /api/sessions/generate", () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  it("should generate session for authenticated user", async () => {
    const user = await createCompleteTestUser();

    // Mock authentication - you'll need to implement this based on your auth setup
    // For now, we'll test without authentication
    const response = await app.request("/api/sessions/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add auth headers when authentication is implemented
      },
      body: JSON.stringify({
        goal: "sleep",
        customPrompt: "Help me relax before bed",
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.affirmations).toBeDefined();
    expect(Array.isArray(data.affirmations)).toBe(true);
    expect(data.affirmations.length).toBeGreaterThan(0);
    expect(data.title).toBeDefined();
    expect(data.goal).toBe("sleep");
  });

  it("should validate input schema", async () => {
    const response = await app.request("/api/sessions/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        goal: "invalid-goal",
      }),
    });

    expect(response.status).toBe(400);
  });

  it("should enforce rate limits", async () => {
    // This test will need to be implemented once rate limiting is fully set up
    // For now, we'll skip it
    // TODO: Implement rate limit testing
  });
});

describe("POST /api/sessions/create", () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  it("should create custom session", async () => {
    const user = await createCompleteTestUser();

    const response = await app.request("/api/sessions/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add auth headers when authentication is implemented
      },
      body: JSON.stringify({
        title: "Test Session",
        binauralCategory: "delta",
        binauralHz: "0.5-4",
        affirmations: [
          "I am relaxed",
          "I am calm",
          "I am peaceful",
        ],
        goal: "sleep",
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.sessionId).toBeDefined();
    expect(data.title).toBe("Test Session");
    expect(data.affirmations).toBeDefined();
    expect(Array.isArray(data.affirmations)).toBe(true);
    expect(data.affirmations.length).toBe(3);
  });

  it("should validate input schema", async () => {
    const response = await app.request("/api/sessions/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "", // Empty title should fail
        binauralCategory: "delta",
        binauralHz: "0.5-4",
        affirmations: [],
      }),
    });

    expect(response.status).toBe(400);
  });

  it("should enforce subscription limits for free users", async () => {
    // This test will need to be implemented once subscription limits are fully set up
    // For now, we'll skip it
    // TODO: Implement subscription limit testing
  });
});

describe("GET /api/sessions", () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  it("should get user sessions", async () => {
    const user = await createCompleteTestUser();
    await createTestSession(user.id);
    await createTestSession(user.id);

    const response = await app.request("/api/sessions", {
      method: "GET",
      headers: {
        // Add auth headers when authentication is implemented
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.sessions).toBeDefined();
    expect(Array.isArray(data.sessions)).toBe(true);
    expect(data.sessions.length).toBeGreaterThanOrEqual(2);
  });
});

describe("PATCH /api/sessions/:id/favorite", () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  it("should toggle favorite status", async () => {
    const user = await createCompleteTestUser();
    const session = await createTestSession(user.id);

    const response = await app.request(`/api/sessions/${session.id}/favorite`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        // Add auth headers when authentication is implemented
      },
      body: JSON.stringify({
        isFavorite: true,
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.isFavorite).toBe(true);
  });
});

describe("DELETE /api/sessions/:id", () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  it("should delete session", async () => {
    const { db } = await import("../../src/db");
    const user = await createCompleteTestUser();
    const session = await createTestSession(user.id);

    const response = await app.request(`/api/sessions/${session.id}`, {
      method: "DELETE",
      headers: {
        // Add auth headers when authentication is implemented
      },
    });

    expect(response.status).toBe(200);
    
    // Verify session is deleted
    const deletedSession = await db.affirmationSession.findUnique({
      where: { id: session.id },
    });
    expect(deletedSession).toBeNull();
  });
});
