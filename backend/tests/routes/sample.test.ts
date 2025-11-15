/**
 * Sample Route Tests
 * 
 * Tests for the sample API routes (demonstration endpoints).
 */

import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/index";

describe("Sample Routes", () => {
  describe("GET /api/sample", () => {
    it("should return 200 for public endpoint", async () => {
      const response = await request(app.fetch)
        .get("/api/sample")
        .expect(200);

      expect(response.body).toHaveProperty("message", "Hello, world!");
    });
  });

  describe("GET /api/sample/protected", () => {
    it("should return 401 if user is not authenticated", async () => {
      const response = await request(app.fetch)
        .get("/api/sample/protected")
        .expect(401);

      expect(response.body).toHaveProperty("error", "UNAUTHORIZED");
    });

    // Note: Testing authenticated endpoints would require authentication setup
    // This test verifies the authentication check logic
  });

  describe("POST /api/sample", () => {
    it("should return 200 for valid request", async () => {
      const response = await request(app.fetch)
        .post("/api/sample")
        .send({ value: "test" })
        .expect(200);

      expect(response.body).toHaveProperty("message", "Hello, world!");
    });

    it("should return pong for ping value", async () => {
      const response = await request(app.fetch)
        .post("/api/sample")
        .send({ value: "ping" })
        .expect(200);

      expect(response.body).toHaveProperty("message", "pong");
    });

    it("should return 400 for invalid request body", async () => {
      const response = await request(app.fetch)
        .post("/api/sample")
        .send({ invalid: "data" })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });
});

