import { Hono } from "hono";
import * as fs from "node:fs";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import { type AppType } from "../types";
import { zValidator } from "@hono/zod-validator";
import { uploadImageRequestSchema, type UploadImageResponse } from "@/shared/contracts";
import { logger } from "../lib/logger";

// ============================================
// Uploads directory setup
// ============================================
// Creates uploads/ directory if it doesn't exist
// All uploaded images are stored here and served via /uploads/* endpoint
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  logger.info("Creating uploads directory", { directory: UPLOADS_DIR });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} else {
  logger.debug("Uploads directory exists", { directory: UPLOADS_DIR });
}

const uploadRouter = new Hono<AppType>();

// ============================================
// POST /api/upload/image - Upload an image
// ============================================
// Accepts multipart/form-data with "image" field
// Validates file type and size before saving
// Returns URL to access the uploaded image
uploadRouter.post("/image", zValidator("form", uploadImageRequestSchema), async (c) => {
  const user = c.get("user");
  const { image } = c.req.valid("form");
  
  logger.info("Image upload request received", { 
    userId: user?.id || "anonymous",
    fileName: image?.name,
    fileType: image?.type,
    fileSize: image?.size,
  });

  try {
    // Check if file exists in request
    if (!image) {
      logger.warn("No image file provided in request", { userId: user?.id || "anonymous" });
      return c.json({ 
        error: "NO_FILE_PROVIDED",
        code: "NO_FILE_PROVIDED",
        message: "No image file provided" 
      }, 400);
    }

    logger.debug("File received", { 
      fileName: image.name,
      fileType: image.type,
      fileSize: `${(image.size / 1024).toFixed(2)} KB`,
    });

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(image.type)) {
      logger.warn("Invalid file type", { 
        fileType: image.type, 
        allowedTypes,
        userId: user?.id || "anonymous" 
      });
      return c.json(
        { 
          error: "INVALID_FILE_TYPE",
          code: "INVALID_FILE_TYPE",
          message: "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed" 
        },
        400,
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (image.size > maxSize) {
      logger.warn("File too large", { 
        fileSize: `${(image.size / 1024 / 1024).toFixed(2)} MB`,
        maxSize: "10 MB",
        userId: user?.id || "anonymous" 
      });
      return c.json({ 
        error: "FILE_TOO_LARGE",
        code: "FILE_TOO_LARGE",
        message: "File too large. Maximum size is 10MB" 
      }, 400);
    }

    // Generate unique filename to prevent collisions
    const fileExtension = path.extname(image.name);
    const uniqueFilename = `${randomUUID()}${fileExtension}`;
    const filePath = path.join(UPLOADS_DIR, uniqueFilename);

    logger.debug("Generated unique filename", { uniqueFilename, filePath });

    // Save file to disk
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    logger.info("Image uploaded successfully", { 
      uniqueFilename,
      filePath,
      fileSize: `${(image.size / 1024).toFixed(2)} KB`,
      userId: user?.id || "anonymous",
    });

    // Return the URL to access the uploaded image
    const imageUrl = `/uploads/${uniqueFilename}`;

    return c.json({
      success: true,
      message: "Image uploaded successfully",
      url: imageUrl,
      filename: uniqueFilename,
    } satisfies UploadImageResponse);
  } catch (error) {
    logger.error("Upload error", error, { 
      userId: user?.id || "anonymous",
      fileName: image?.name 
    });
    return c.json({ 
      error: "UPLOAD_FAILED",
      code: "UPLOAD_FAILED",
      message: "Failed to upload image",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

export { uploadRouter };
