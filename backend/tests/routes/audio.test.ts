/**
 * Audio Route Tests
 * 
 * Tests for the audio API routes (binaural and background audio serving).
 */

import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/index";
import * as fs from "fs";
import * as path from "path";

describe("Audio Routes", () => {
  describe("GET /api/audio/binaural/:filename", () => {
    it("should return 400 for invalid filename (path traversal)", async () => {
      const response = await request(app.fetch)
        .get("/api/audio/binaural/../../../etc/passwd")
        .expect(400);

      expect(response.body).toHaveProperty("error", "INVALID_FILENAME");
    });

    it("should return 404 for non-existent file", async () => {
      const response = await request(app.fetch)
        .get("/api/audio/binaural/nonexistent-file.mp3")
        .expect(404);

      expect(response.body).toHaveProperty("error", "FILE_NOT_FOUND");
    });

    // Note: Actual file serving tests would require test audio files
    // These tests verify the security and error handling logic
  });

  describe("GET /api/audio/background/:filename", () => {
    it("should return 400 for invalid filename (path traversal)", async () => {
      const response = await request(app.fetch)
        .get("/api/audio/background/../../../etc/passwd")
        .expect(400);

      expect(response.body).toHaveProperty("error", "INVALID_FILENAME");
    });

    it("should return 404 for non-existent file", async () => {
      const response = await request(app.fetch)
        .get("/api/audio/background/nonexistent-file.mp3")
        .expect(404);

      expect(response.body).toHaveProperty("error", "FILE_NOT_FOUND");
    });

    // Note: Actual file serving tests would require test audio files
    // These tests verify the security and error handling logic
  });
});

