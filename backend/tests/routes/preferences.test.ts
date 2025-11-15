/**
 * Preferences Route Tests
 * 
 * Tests for the preferences API routes.
 */

import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/index";
import { db } from "../../src/db";
import { createTestUser, createTestPreferences, cleanupTestData } from "../utils";

describe("Preferences Routes", () => {
  let testUser: { id: string; email: string };
  let authToken: string;

  beforeEach(async () => {
    await cleanupTestData();
    testUser = await createTestUser();
    // TODO: Get auth token from Better Auth
    // For now, we'll test without auth
  });

  describe("GET /api/preferences", () => {
    it("should return 401 if user is not authenticated", async () => {
      const response = await request(app.fetch)
        .get("/api/preferences")
        .expect(401);

      expect(response.body).toHaveProperty("error", "UNAUTHORIZED");
    });

    it("should return default preferences if user has no preferences", async () => {
      // This test requires authentication
      // TODO: Add authentication token
      // const response = await request(app.fetch)
      //   .get("/api/preferences")
      //   .set("Authorization", `Bearer ${authToken}`)
      //   .expect(200);
      // 
      // expect(response.body).toMatchObject({
      //   voice: "neutral",
      //   pace: "normal",
      //   noise: "rain",
      //   pronounStyle: "you",
      //   intensity: "gentle",
      // });
    });

    it("should return user preferences if they exist", async () => {
      // Create preferences for test user
      await createTestPreferences(testUser.id, {
        voice: "confident",
        pace: "slow",
        noise: "brown",
        pronounStyle: "i",
        intensity: "assertive",
      });

      // This test requires authentication
      // TODO: Add authentication token
    });
  });

  describe("PATCH /api/preferences", () => {
    it("should return 401 if user is not authenticated", async () => {
      const response = await request(app.fetch)
        .patch("/api/preferences")
        .send({
          voice: "confident",
        })
        .expect(401);

      expect(response.body).toHaveProperty("error", "UNAUTHORIZED");
    });

    it("should update user preferences", async () => {
      // Create preferences for test user
      await createTestPreferences(testUser.id);

      // This test requires authentication
      // TODO: Add authentication token
      // const response = await request(app.fetch)
      //   .patch("/api/preferences")
      //   .set("Authorization", `Bearer ${authToken}`)
      //   .send({
      //     voice: "confident",
      //     pace: "slow",
      //   })
      //   .expect(200);
      // 
      // expect(response.body).toMatchObject({
      //   voice: "confident",
      //   pace: "slow",
      // });
    });

    it("should validate input data", async () => {
      // This test requires authentication
      // TODO: Add authentication token
      // const response = await request(app.fetch)
      //   .patch("/api/preferences")
      //   .set("Authorization", `Bearer ${authToken}`)
      //   .send({
      //     voice: "invalid",
      //   })
      //   .expect(400);
      // 
      // expect(response.body).toHaveProperty("error", "VALIDATION_ERROR");
    });
  });
});

