/**
 * API Client Module
 *
 * This module provides a centralized API client for making HTTP requests to the backend.
 * It handles authentication, request formatting, error handling, and response parsing.
 */

// Use global fetch (available in React Native 0.81.5+ / Expo SDK 54+)
// No need to import from expo/fetch as global fetch is now available

// Import the authentication client to access user session cookies
import { authClient } from "./authClient";

/**
 * Backend URL Configuration
 *
 * The backend URL is set via environment variable.
 * 
 * For local development, use http://localhost:3000
 * For network access from physical devices, use http://[YOUR_LOCAL_IP]:3000
 */
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
if (!BACKEND_URL) {
  throw new Error("Backend URL setup has failed. Please set EXPO_PUBLIC_BACKEND_URL in your .env file.");
}

// Log the backend URL on initialization for debugging
console.log(`[api.ts] Backend URL configured: ${BACKEND_URL}`);

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

type FetchOptions = {
  method: HttpMethod;
  body?: object; // Request body, will be JSON stringified before sending
};

/**
 * Core Fetch Function
 *
 * A generic, type-safe wrapper around the fetch API that handles all HTTP requests.
 *
 * @template T - The expected response type (for type safety)
 * @param path - The API endpoint path (e.g., "/api/posts")
 * @param options - Configuration object containing HTTP method and optional body
 * @returns Promise resolving to the typed response data
 *
 * Features:
 * - Automatic authentication: Attaches session cookies from authClient
 * - JSON handling: Automatically stringifies request bodies and parses responses
 * - Error handling: Throws descriptive errors with status codes and messages
 * - Type safety: Returns strongly-typed responses using TypeScript generics
 *
 * @throws Error if the response is not ok (status code outside 200-299 range)
 */
async function fetchFn<T>(path: string, options: FetchOptions): Promise<T> {
  const { method, body } = options;
  // Step 1: Authentication - Retrieve session cookies from the auth client
  // These cookies are used to identify the user and maintain their session
  const headers = new Map<string, string>();
  const cookies = authClient.getCookie();
  if (cookies) {
    headers.set("Cookie", cookies);
  }

  // Step 2: Make the HTTP request
  try {
    // Construct the full URL by combining the base backend URL with the endpoint path
    const fullUrl = `${BACKEND_URL}${path}`;
    console.log(`[api.ts] Making ${method} request to:`, fullUrl);

    // Add timeout to prevent hanging requests
    // Use AbortController for timeout (60 seconds for generation, 30 seconds for others)
    const timeoutMs = path.includes("/generate") ? 60000 : 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(fullUrl, {
        method,
        headers: {
          // Always send JSON content type since our API uses JSON
          "Content-Type": "application/json",
          // Include authentication cookies if available
          ...(cookies ? { Cookie: cookies } : {}),
        },
        // Stringify the body if present (for POST, PUT, PATCH requests)
        body: body ? JSON.stringify(body) : undefined,
        // Use "omit" to prevent browser from automatically sending credentials
        // We manually handle cookies via the Cookie header for more control
        credentials: "omit",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`[api.ts] Response status: ${response.status} ${response.statusText}`);
      console.log(`[api.ts] Response headers:`, Object.fromEntries(response.headers.entries()));

      // Step 3: Error handling - Check if the response was successful
      if (!response.ok) {
        // Try to parse the error details from the response body
        let errorData;
        const contentType = response.headers.get("content-type");

        try {
          if (contentType?.includes("application/json")) {
            errorData = await response.json();
          } else {
            // If not JSON, get the text response
            const textResponse = await response.text();
            console.error(`[api.ts] Non-JSON error response:`, textResponse.substring(0, 200));
            errorData = { message: textResponse.substring(0, 100) };
          }
        } catch {
          errorData = { message: "Failed to parse error response" };
        }

        // Throw a descriptive error with status code, status text, and server error data
        throw new Error(
          `[api.ts]: ${response.status} ${response.statusText} ${JSON.stringify(errorData)}`,
        );
      }

      // Step 4: Parse and return the successful response as JSON
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        const textResponse = await response.text();
        console.error(`[api.ts] Expected JSON but got:`, textResponse.substring(0, 200));
        throw new Error(`Expected JSON response but got ${contentType}`);
      }

      // The response is cast to the expected type T for type safety
      return (await response.json()) as T;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      // Check if it was a timeout/abort
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        const errorMsg = `Network request timed out after ${timeoutMs}ms. Backend URL: ${BACKEND_URL}. Please ensure the backend server is running.`;
        console.error(`[api.ts] ${errorMsg}`);
        throw new Error(errorMsg);
      }
      // Check for network errors (connection refused, etc.)
      if (fetchError instanceof TypeError && fetchError.message.includes("fetch")) {
        const errorMsg = `Failed to connect to backend at ${BACKEND_URL}. Please ensure the backend server is running. Original error: ${fetchError.message}`;
        console.error(`[api.ts] ${errorMsg}`);
        throw new Error(errorMsg);
      }
      throw fetchError;
    }
  } catch (error) {
    // Only log non-auth errors to avoid cluttering logs with expected 401s
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes("401")) {
      console.log(`[api.ts]: ${error}`);
    }
    // Re-throw the error so the calling code can handle it appropriately
    throw error;
  }
}

/**
 * API Client Object
 *
 * Provides convenient methods for making HTTP requests with different methods.
 * Each method is a thin wrapper around fetchFn with the appropriate HTTP verb.
 *
 * Usage Examples:
 *
 * // GET request - Fetch data
 * const posts = await api.get<Post[]>('/api/posts');
 *
 * // POST request - Create new data
 * const newPost = await api.post<Post>('/api/posts', {
 *   title: 'My Post',
 *   content: 'Hello World'
 * });
 *
 * // PUT request - Replace existing data
 * const updatedPost = await api.put<Post>('/api/posts/123', {
 *   title: 'Updated Title',
 *   content: 'Updated Content'
 * });
 *
 * // PATCH request - Partially update existing data
 * const patchedPost = await api.patch<Post>('/api/posts/123', {
 *   title: 'New Title Only'
 * });
 *
 * // DELETE request - Remove data
 * await api.delete('/api/posts/123');
 */
const api = {
  /**
   * GET - Retrieve data from the server
   * @template T - Expected response type
   * @param path - API endpoint path
   */
  get: <T>(path: string) => fetchFn<T>(path, { method: "GET" }),

  /**
   * POST - Create new data on the server
   * @template T - Expected response type
   * @param path - API endpoint path
   * @param body - Optional request body containing data to create
   */
  post: <T>(path: string, body?: object) => fetchFn<T>(path, { method: "POST", body }),

  /**
   * PUT - Replace existing data on the server
   * @template T - Expected response type
   * @param path - API endpoint path
   * @param body - Optional request body containing data to replace
   */
  put: <T>(path: string, body?: object) => fetchFn<T>(path, { method: "PUT", body }),

  /**
   * PATCH - Partially update existing data on the server
   * @template T - Expected response type
   * @param path - API endpoint path
   * @param body - Optional request body containing partial data to update
   */
  patch: <T>(path: string, body?: object) => fetchFn<T>(path, { method: "PATCH", body }),

  /**
   * DELETE - Remove data from the server
   * @template T - Expected response type
   * @param path - API endpoint path
   */
  delete: <T>(path: string) => fetchFn<T>(path, { method: "DELETE" }),
};

// Export the API client and backend URL to be used in other modules
export { api, BACKEND_URL };
