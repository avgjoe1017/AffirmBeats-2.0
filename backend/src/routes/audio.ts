import { Hono } from "hono";
import { type AppType } from "../types";
import path from "path";
import fs from "fs";

const audioRouter = new Hono<AppType>();

// Get the project root directory (one level up from backend folder)
// Using import.meta.dir for Bun compatibility, fallback to __dirname for Node.js
const getProjectRoot = () => {
  // Bun uses import.meta.dir (points to backend/src/routes when called from routes/audio.ts)
  if (typeof import.meta !== "undefined" && "dir" in import.meta && import.meta.dir) {
    // Go up from backend/src/routes to backend/src, then to backend, then to project root
    const root = path.join(import.meta.dir, "..", "..", "..");
    if (process.env.NODE_ENV === "development") {
      console.log(`🔍 [Audio] import.meta.dir: ${import.meta.dir}`);
      console.log(`🔍 [Audio] Calculated project root: ${root}`);
    }
    return root;
  }
  // Fallback to __dirname (Node.js - points to backend/src/routes)
  if (typeof __dirname !== "undefined") {
    // Go up from backend/src/routes to backend/src, then to backend, then to project root
    const root = path.join(__dirname, "..", "..", "..");
    if (process.env.NODE_ENV === "development") {
      console.log(`🔍 [Audio] __dirname: ${__dirname}`);
      console.log(`🔍 [Audio] Calculated project root: ${root}`);
    }
    return root;
  }
  // Last resort: use process.cwd() and assume we're in project root
  const root = process.cwd();
  if (process.env.NODE_ENV === "development") {
    console.log(`🔍 [Audio] Using process.cwd(): ${root}`);
  }
  return root;
};

const projectRoot = getProjectRoot();
const rawAudioFilesRoot = path.join(projectRoot, "raw audio files");

// Log the resolved path for debugging (only in development)
if (process.env.NODE_ENV === "development") {
  console.log(`🎵 [Audio] Raw audio files root: ${rawAudioFilesRoot}`);
  // Verify the path exists
  if (fs.existsSync(rawAudioFilesRoot)) {
    console.log(`✅ [Audio] Raw audio files directory exists`);
  } else {
    console.log(`❌ [Audio] Raw audio files directory does NOT exist at: ${rawAudioFilesRoot}`);
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
    
    // Security: Prevent path traversal attacks
    if (filename.includes("..") || path.isAbsolute(filename)) {
      return c.json({ error: "Invalid filename" }, 400);
    }

    const filePath = path.join(
      rawAudioFilesRoot,
      "ZENmix - Pure Binaural Beats",
      filename
    );

    // Normalize path to prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    const normalizedRoot = path.normalize(path.join(rawAudioFilesRoot, "ZENmix - Pure Binaural Beats"));
    
    // Ensure the resolved path is within the allowed directory
    if (!normalizedPath.startsWith(normalizedRoot)) {
      return c.json({ error: "Invalid file path" }, 400);
    }

    // Check if file exists
    if (!fs.existsSync(normalizedPath)) {
      console.log(`❌ [Audio] File not found: ${normalizedPath}`);
      return c.json({ error: "File not found" }, 404);
    }

    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const contentType = ext === ".wav" ? "audio/wav" : "audio/mpeg";

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
    c.header("Cache-Control", "public, max-age=31536000"); // Cache for 1 year

    return c.body(arrayBuffer);
  } catch (error) {
    console.error("❌ [Audio] Error serving binaural file:", error);
    return c.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

audioRouter.get("/background/:filename", async (c) => {
  try {
    // Decode the filename from URL encoding
    let filename = decodeURIComponent(c.req.param("filename"));
    
    // Security: Prevent path traversal attacks
    if (filename.includes("..") || path.isAbsolute(filename)) {
      return c.json({ error: "Invalid filename" }, 400);
    }

    // Try different directories for background sounds
    const possibleDirectories = [
      "ZENmix - Roots",
      "ZENmix - Postive Flow",
      "ZENmix - Dreamscape",
      "ZENmix - Ancient Healing",
    ];

    let filePath: string | null = null;
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
        break;
      }
    }

    if (!filePath) {
      console.log(`❌ [Audio] Background file not found: ${filename}`);
      return c.json({ error: "File not found" }, 404);
    }

    // Determine content type
    const ext = path.extname(filename).toLowerCase();
    const contentType = ext === ".wav" ? "audio/wav" : "audio/mpeg";

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
    c.header("Cache-Control", "public, max-age=31536000");

    return c.body(arrayBuffer);
  } catch (error) {
    console.error("❌ [Audio] Error serving background file:", error);
    return c.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

export { audioRouter };

