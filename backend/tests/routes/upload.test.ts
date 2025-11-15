/**
 * Upload Route Tests
 * 
 * Tests for the upload API routes (image upload).
 */

import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/index";
import { cleanupTestData } from "../utils";

describe("Upload Routes", () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  describe("POST /api/upload/image", () => {
    it("should return 400 if no image is provided", async () => {
      const response = await request(app.fetch)
        .post("/api/upload/image")
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 for invalid file type", async () => {
      // Create a mock file with invalid type
      const response = await request(app.fetch)
        .post("/api/upload/image")
        .attach("image", Buffer.from("fake pdf content"), "test.pdf")
        .expect(400);

      expect(response.body).toHaveProperty("error", "INVALID_FILE_TYPE");
    });

    it("should return 400 for file too large", async () => {
      // Create a mock file larger than 10MB
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      const response = await request(app.fetch)
        .post("/api/upload/image")
        .attach("image", largeBuffer, "large-image.jpg")
        .field("image", largeBuffer)
        .expect(400);

      // Note: This test might need adjustment based on how the form data is parsed
      // The actual implementation validates file size from the uploaded file object
    });

    // Note: Actual file upload tests would require proper multipart/form-data setup
    // These tests verify the validation and error handling logic
  });
});

