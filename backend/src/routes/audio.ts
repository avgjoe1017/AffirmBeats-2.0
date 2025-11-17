import { Hono } from "hono";
import { type AppType } from "../types";
import path from "path";
import fs from "fs";
import { logger } from "../lib/logger";
import { env } from "../env";

const audioRouter = new Hono<AppType>();

// Get the project root directory (one level up from backend folder)
// Using import.meta.dir for Bun compatibility, fallback to __dirname for Node.js
const getProjectRoot = () => {
  // Bun uses import.meta.dir (points to backend/src/routes when called from routes/audio.ts)
  if (typeof import.meta !== "undefined" && "dir" in import.meta && import.meta.dir) {
    // Go up from backend/src/routes to backend/src, then to backend, then to project root
    const root = path.join(import.meta.dir, "..", "..", "..");
    if (env.NODE_ENV === "development") {
      logger.debug("Calculated project root from import.meta.dir", { 
        dir: import.meta.dir, 
        root 
      });
    }
    return root;
  }
  // Fallback to __dirname (Node.js - points to backend/src/routes)
  if (typeof __dirname !== "undefined") {
    // Go up from backend/src/routes to backend/src, then to backend, then to project root
    const root = path.join(__dirname, "..", "..", "..");
    if (env.NODE_ENV === "development") {
      logger.debug("Calculated project root from __dirname", { 
        dir: __dirname, 
        root 
      });
    }
    return root;
  }
  // Last resort: use process.cwd() and assume we're in project root
  const root = process.cwd();
  if (env.NODE_ENV === "development") {
    logger.debug("Using process.cwd() as project root", { root });
  }
  return root;
};

const projectRoot = getProjectRoot();
const rawAudioFilesRoot = path.join(projectRoot, "raw audio files");
const optimizedAudioRoot = path.join(projectRoot, "assets", "audio");

// Log the resolved path for debugging (only in development)
if (env.NODE_ENV === "development") {
  logger.debug("Audio files root directory", { rawAudioFilesRoot });
  // Verify the path exists
  if (fs.existsSync(rawAudioFilesRoot)) {
    logger.debug("Audio files directory exists", { rawAudioFilesRoot });
  } else {
    logger.warn("Audio files directory does not exist", { rawAudioFilesRoot });
  }
}

/**
 * Serve audio files from the raw audio files directory
 * 
 * GET /api/audio/binaural/:filename
 * GET /api/audio/background/:filename
 */
audioRouter.get("/binaural/:filename", async (c) => {
  try {
    // Decode the filename from URL encoding
    let filename = decodeURIComponent(c.req.param("filename"));
    
    logger.debug("Serving binaural audio file", { filename });

    // Security: Prevent path traversal attacks
    if (filename.includes("..") || path.isAbsolute(filename)) {
      logger.warn("Invalid filename attempt (path traversal)", { filename });
      return c.json({ 
        error: "INVALID_FILENAME",
        code: "INVALID_FILENAME",
        message: "Invalid filename" 
      }, 400);
    }

    // Try optimized files first (assets/audio/binaural/)
    let filePath: string | null = null;
    const optimizedPath = path.join(optimizedAudioRoot, "binaural", filename);
    const normalizedOptimizedPath = path.normalize(optimizedPath);
    const normalizedOptimizedRoot = path.normalize(path.join(optimizedAudioRoot, "binaural"));
    
    // Check if optimized file exists and is within allowed directory
    if (normalizedOptimizedPath.startsWith(normalizedOptimizedRoot) && fs.existsSync(normalizedOptimizedPath)) {
      filePath = normalizedOptimizedPath;
      logger.debug("Using optimized binaural file", { filename, filePath });
    } else {
      // Fall back to legacy files (raw audio files/ZENmix - Pure Binaural Beats/)
      const legacyPath = path.join(rawAudioFilesRoot, "ZENmix - Pure Binaural Beats", filename);
      const normalizedLegacyPath = path.normalize(legacyPath);
      const normalizedLegacyRoot = path.normalize(path.join(rawAudioFilesRoot, "ZENmix - Pure Binaural Beats"));
      
      // Ensure the resolved path is within the allowed directory
      if (normalizedLegacyPath.startsWith(normalizedLegacyRoot) && fs.existsSync(normalizedLegacyPath)) {
        filePath = normalizedLegacyPath;
        logger.debug("Using legacy binaural file", { filename, filePath });
      }
    }

    // Check if file exists
    if (!filePath) {
      logger.warn("Binaural audio file not found", { 
        filename, 
        checkedOptimized: normalizedOptimizedPath,
        checkedLegacy: path.join(rawAudioFilesRoot, "ZENmix - Pure Binaural Beats", filename)
      });
      return c.json({ 
        error: "FILE_NOT_FOUND",
        code: "FILE_NOT_FOUND",
        message: "File not found" 
      }, 404);
    }

    const normalizedPath = filePath;

    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    let contentType: string;
    if (ext === ".wav") {
      contentType = "audio/wav";
    } else if (ext === ".m4a") {
      contentType = "audio/mp4"; // M4A files use audio/mp4 MIME type
    } else if (ext === ".opus") {
      contentType = "audio/opus";
    } else {
      contentType = "audio/mpeg"; // Default to MPEG for MP3
    }

    // Get file stats for Range request support (required by iOS AVPlayer)
    const stats = fs.statSync(normalizedPath);
    const fileSize = stats.size;

    // Read and serve the file
    const fileBuffer = fs.readFileSync(normalizedPath);
    
    // Convert Buffer to ArrayBuffer for Hono compatibility
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );

    // Handle Range requests for iOS AVPlayer compatibility
    const rangeHeader = c.req.header("Range");
    if (rangeHeader) {
      const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : fileSize - 1;
        const chunkSize = end - start + 1;
        const chunk = fileBuffer.slice(start, end + 1);
        const chunkArrayBuffer = chunk.buffer.slice(
          chunk.byteOffset,
          chunk.byteOffset + chunk.byteLength
        );

        c.header("Content-Range", `bytes ${start}-${end}/${fileSize}`);
        c.header("Content-Length", chunkSize.toString());
        c.header("Content-Type", contentType);
        c.header("Accept-Ranges", "bytes");
        c.status(206); // Partial Content
        return c.body(chunkArrayBuffer);
      }
    }

    // Full file response
    c.header("Content-Type", contentType);
    c.header("Content-Length", arrayBuffer.byteLength.toString());
    c.header("Accept-Ranges", "bytes"); // Indicate Range request support
    const isOptimized = filePath.includes("assets/audio");
    c.header("Cache-Control", isOptimized 
      ? "public, max-age=31536000, immutable" // Cache optimized files for 1 year (immutable)
      : "public, max-age=31536000" // Cache legacy files for 1 year
    );

    logger.debug("Binaural audio file served successfully", { 
      filename, 
      fileSize: arrayBuffer.byteLength,
      isOptimized 
    });

    return c.body(arrayBuffer);
  } catch (error) {
    logger.error("Error serving binaural audio file", error, { 
      filename: c.req.param("filename") 
    });
    return c.json({ 
      error: "INTERNAL_ERROR",
      code: "INTERNAL_ERROR",
      message: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Handle both formats: /background/filename and /background/subdirectory/filename
audioRouter.get("/background/*", async (c) => {
  try {
    // Get the full path after /background/
    const fullPath = c.req.param("*") || "";
    const pathParts = fullPath.split("/").filter(Boolean).map(p => decodeURIComponent(p));
    
    let subdirectory: string | null = null;
    let filename: string;
    
    if (pathParts.length === 1) {
      // Old format: /background/filename (no subdirectory)
      filename = pathParts[0];
    } else if (pathParts.length === 2) {
      // New format: /background/subdirectory/filename
      subdirectory = pathParts[0];
      filename = pathParts[1];
    } else {
      logger.warn("Invalid background audio path format", { fullPath, pathParts });
      return c.json({ 
        error: "INVALID_PATH",
        code: "INVALID_PATH",
        message: "Invalid path format" 
      }, 400);
    }
    
    logger.debug("Serving background audio file", { filename, subdirectory });

    // Security: Prevent path traversal attacks
    if (filename.includes("..") || path.isAbsolute(filename) || 
        (subdirectory && (subdirectory.includes("..") || path.isAbsolute(subdirectory)))) {
      logger.warn("Invalid filename attempt (path traversal)", { filename, subdirectory });
      return c.json({ 
        error: "INVALID_FILENAME",
        code: "INVALID_FILENAME",
        message: "Invalid filename" 
      }, 400);
    }

    let filePath: string | null = null;

    // Try optimized files first (assets/audio/background/)
    if (subdirectory) {
      const optimizedPath = path.join(optimizedAudioRoot, "background", subdirectory, filename);
      const normalizedOptimizedPath = path.normalize(optimizedPath);
      const normalizedOptimizedRoot = path.normalize(path.join(optimizedAudioRoot, "background", subdirectory));
      
      logger.debug("Checking optimized background file", { 
        filename, 
        subdirectory, 
        optimizedPath,
        normalizedOptimizedPath,
        normalizedOptimizedRoot,
        exists: fs.existsSync(normalizedOptimizedPath),
        startsWith: normalizedOptimizedPath.startsWith(normalizedOptimizedRoot)
      });
      
      // Check if optimized file exists and is within allowed directory
      if (normalizedOptimizedPath.startsWith(normalizedOptimizedRoot) && fs.existsSync(normalizedOptimizedPath)) {
        filePath = normalizedOptimizedPath;
        logger.debug("Using optimized background file", { filename, subdirectory, filePath });
      } else {
        logger.warn("Optimized background file not found or invalid", { 
          filename, 
          subdirectory, 
          optimizedPath: normalizedOptimizedPath,
          exists: fs.existsSync(normalizedOptimizedPath)
        });
      }
    }

    // Fall back to legacy files if optimized not found
    if (!filePath) {
      const possibleDirectories = [
        "ZENmix - Roots",
        "ZENmix - Postive Flow",
        "ZENmix - Dreamscape",
        "ZENmix - Ancient Healing",
      ];

      for (const directory of possibleDirectories) {
        const possiblePath = path.join(rawAudioFilesRoot, directory, filename);
        const normalizedPath = path.normalize(possiblePath);
        const normalizedRoot = path.normalize(path.join(rawAudioFilesRoot, directory));
        
        // Ensure the resolved path is within the allowed directory
        if (!normalizedPath.startsWith(normalizedRoot)) {
          continue;
        }

        if (fs.existsSync(normalizedPath)) {
          filePath = normalizedPath;
          logger.debug("Using legacy background file", { filename, directory, filePath });
          break;
        }
      }
    }

    if (!filePath) {
      logger.warn("Background audio file not found", { filename, subdirectory });
      return c.json({ 
        error: "FILE_NOT_FOUND",
        code: "FILE_NOT_FOUND",
        message: "File not found" 
      }, 404);
    }

    logger.debug("Background audio file found", { filename, subdirectory, filePath });

    // Verify file exists before attempting to read
    if (!fs.existsSync(filePath)) {
      logger.error("Background audio file path resolved but file does not exist", { 
        filename, 
        subdirectory, 
        filePath 
      });
      return c.json({ 
        error: "FILE_NOT_FOUND",
        code: "FILE_NOT_FOUND",
        message: "File not found" 
      }, 404);
    }

    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    let contentType: string;
    if (ext === ".wav") {
      contentType = "audio/wav";
    } else if (ext === ".m4a") {
      contentType = "audio/mp4"; // M4A files use audio/mp4 MIME type
    } else if (ext === ".opus") {
      contentType = "audio/opus";
    } else {
      contentType = "audio/mpeg"; // Default to MPEG for MP3
    }

    // Get file stats for Range request support (required by iOS AVPlayer)
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    // Read and serve the file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Convert Buffer to ArrayBuffer for Hono compatibility
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );

    // Handle Range requests for iOS AVPlayer compatibility
    const rangeHeader = c.req.header("Range");
    if (rangeHeader) {
      const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : fileSize - 1;
        const chunkSize = end - start + 1;
        const chunk = fileBuffer.slice(start, end + 1);
        const chunkArrayBuffer = chunk.buffer.slice(
          chunk.byteOffset,
          chunk.byteOffset + chunk.byteLength
        );

        c.header("Content-Range", `bytes ${start}-${end}/${fileSize}`);
        c.header("Content-Length", chunkSize.toString());
        c.header("Content-Type", contentType);
        c.header("Accept-Ranges", "bytes");
        c.status(206); // Partial Content
        return c.body(chunkArrayBuffer);
      }
    }

    // Full file response
    c.header("Content-Type", contentType);
    c.header("Content-Length", arrayBuffer.byteLength.toString());
    c.header("Accept-Ranges", "bytes"); // Indicate Range request support
    const isOptimized = filePath.includes("assets/audio");
    c.header("Cache-Control", isOptimized 
      ? "public, max-age=31536000, immutable" // Cache optimized files for 1 year (immutable)
      : "public, max-age=31536000" // Cache legacy files for 1 year
    );

    logger.debug("Background audio file served successfully", { 
      filename, 
      subdirectory,
      fileSize: arrayBuffer.byteLength,
      isOptimized 
    });

    return c.body(arrayBuffer);
  } catch (error) {
    logger.error("Error serving background audio file", error, { 
      filename: c.req.param("filename") 
    });
    return c.json({ 
      error: "INTERNAL_ERROR",
      code: "INTERNAL_ERROR",
      message: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

export { audioRouter };

