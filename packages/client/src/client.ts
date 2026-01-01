import { decrypt } from "@api_rotate/crypto";

import type {
  ApiKeyClientConfig,
  ApiResponse,
  GetKeyOptions,
  GetKeyResult,
  RawKeyResponse,
} from "./types";

/**
 * Error thrown when the API returns an error response
 */
export class ApiKeyError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "ApiKeyError";
  }
}

/**
 * Error thrown when no keys are available
 */
export class NoKeysAvailableError extends ApiKeyError {
  constructor() {
    super("No available keys", "NO_KEYS_AVAILABLE", 503);
    this.name = "NoKeysAvailableError";
  }
}

/**
 * Error thrown when decryption fails (wrong encryption key)
 */
export class DecryptionError extends Error {
  constructor(
    message = "Failed to decrypt key. This usually means you are using the wrong encryption key.",
    public readonly keyId?: string,
  ) {
    super(message);
    this.name = "DecryptionError";
  }
}

/**
 * API Key Rotation Client
 *
 * A TypeScript client for managing API key rotation with zero-knowledge encryption.
 * Keys are encrypted on the server and decrypted locally using the provided encryption key.
 *
 * @example
 * ```typescript
 * const client = new ApiKeyClient({
 *   baseUrl: 'https://api.example.com',
 *   serviceKey: 'sk_...',
 *   encryptionKey: 'base64...',
 * });
 *
 * // Get a key
 * const { keyId, key, type } = await client.getKey({ type: 'openai' });
 *
 * // Report an error (triggers exponential backoff)
 * await client.reportError(keyId, 'Rate limit exceeded');
 *
 * // Use withKey for automatic error handling
 * const result = await client.withKey(async (apiKey) => {
 *   return fetch('https://api.openai.com/...', {
 *     headers: { Authorization: `Bearer ${apiKey}` }
 *   });
 * }, { type: 'openai' });
 * ```
 */
export class ApiKeyClient {
  private readonly config: Required<ApiKeyClientConfig>;

  constructor(config: ApiKeyClientConfig) {
    this.config = {
      timeout: 10000,
      retries: 3,
      ...config,
    };
  }

  /**
   * Get an available API key from the rotation pool
   *
   * @param options - Options for key selection
   * @returns The decrypted API key with its metadata
   * @throws {NoKeysAvailableError} When no keys are available
   * @throws {ApiKeyError} When the API returns an error
   */
  async getKey(options: GetKeyOptions = {}): Promise<GetKeyResult> {
    const { type, strategy = "first", cooldownSeconds } = options;

    const endpoint = strategy === "random" ? "/v1/keys/random" : "/v1/keys/next";
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (cooldownSeconds !== undefined)
      params.set("cooldownSeconds", String(cooldownSeconds));

    const url = `${this.config.baseUrl}${endpoint}${params.toString() ? `?${params.toString()}` : ""}`;

    const response = await this.fetchWithRetry(url, {
      method: "GET",
    });

    const data = (await response.json()) as ApiResponse<RawKeyResponse>;

    if (!data.success || !data.data) {
      if (data.error?.code === "NO_KEYS_AVAILABLE") {
        throw new NoKeysAvailableError();
      }
      throw new ApiKeyError(
        data.error?.message ?? "Failed to get key",
        data.error?.code,
        response.status,
      );
    }

    // Decrypt the key locally
    let decryptedKey: string;
    try {
      decryptedKey = await decrypt(
        data.data.encryptedKey,
        this.config.encryptionKey,
      );
    } catch {
      throw new DecryptionError(
        `Failed to decrypt key "${data.data.keyId}". This usually means you are using the wrong encryption key, or the key was encrypted with a different key.`,
        data.data.keyId,
      );
    }

    return {
      keyId: data.data.keyId,
      key: decryptedKey,
      type: data.data.type,
    };
  }

  /**
   * Report an error for a key, triggering exponential backoff
   *
   * @param keyId - The ID of the key that encountered an error
   * @param errorMessage - A description of the error
   * @throws {ApiKeyError} When the API returns an error
   */
  async reportError(keyId: string, errorMessage: string): Promise<void> {
    const url = `${this.config.baseUrl}/v1/keys/report-error`;

    const response = await this.fetchWithRetry(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ keyId, errorMessage }),
    });

    const data = (await response.json()) as ApiResponse<{ success: boolean }>;

    if (!data.success) {
      throw new ApiKeyError(
        data.error?.message ?? "Failed to report error",
        data.error?.code,
        response.status,
      );
    }
  }

  /**
   * Execute a callback with an API key, automatically reporting errors
   *
   * This is a convenience wrapper that:
   * 1. Gets an available key
   * 2. Executes your callback with the decrypted key
   * 3. If the callback throws, reports the error to trigger backoff
   * 4. Re-throws the original error
   *
   * @param callback - The function to execute with the API key
   * @param options - Options for key selection
   * @returns The result of the callback
   * @throws {NoKeysAvailableError} When no keys are available
   * @throws Any error thrown by the callback (after reporting it)
   */
  async withKey<T>(
    callback: (apiKey: string, keyId: string) => Promise<T>,
    options: GetKeyOptions = {},
  ): Promise<T> {
    const { keyId, key } = await this.getKey(options);

    try {
      return await callback(key, keyId);
    } catch (error) {
      // Report the error to trigger backoff
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      await this.reportError(keyId, errorMessage).catch(() => {
        // Ignore errors from reporting - the original error is more important
      });
      throw error;
    }
  }

  /**
   * Internal method to fetch with retry logic
   */
  private async fetchWithRetry(
    url: string,
    init: RequestInit,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.timeout,
    );

    const fetchOptions: RequestInit = {
      ...init,
      signal: controller.signal,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${this.config.serviceKey}`,
      },
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeout);
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on abort (timeout)
        if (controller.signal.aborted) {
          clearTimeout(timeout);
          throw new ApiKeyError("Request timeout", "TIMEOUT", 408);
        }

        // Wait before retrying (exponential backoff)
        if (attempt < this.config.retries) {
          await this.sleep(Math.pow(2, attempt) * 100);
        }
      }
    }

    clearTimeout(timeout);
    throw new ApiKeyError(
      lastError?.message ?? "Request failed",
      "NETWORK_ERROR",
      0,
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
