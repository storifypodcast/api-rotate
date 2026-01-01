/**
 * Configuration options for the API Key client
 */
export interface ApiKeyClientConfig {
  /**
   * The base URL of the API server
   * @example "https://api.example.com"
   */
  baseUrl: string;

  /**
   * The service API key for authentication
   * This is used as a Bearer token in the Authorization header
   */
  serviceKey: string;

  /**
   * The AES-256 encryption key (base64 encoded) for decrypting API keys
   * The server stores keys encrypted; the client decrypts them locally
   */
  encryptionKey: string;

  /**
   * Optional request timeout in milliseconds
   * @default 10000
   */
  timeout?: number;

  /**
   * Optional number of retries for failed requests
   * @default 3
   */
  retries?: number;
}

/**
 * Options for getting a key
 */
export interface GetKeyOptions {
  /**
   * Optional type filter for the key (e.g., "openai", "gemini")
   */
  type?: string;

  /**
   * Key selection strategy
   * - "first": Get the first available key (FIFO)
   * - "random": Get a random available key
   * @default "first"
   */
  strategy?: "first" | "random";

  /**
   * Optional cooldown override in seconds
   * If omitted, the key's default_cooldown is used
   */
  cooldownSeconds?: number;
}

/**
 * Result from getting a key
 */
export interface GetKeyResult {
  /**
   * The unique identifier of the key (for reporting errors)
   */
  keyId: string;

  /**
   * The decrypted API key (plaintext)
   */
  key: string;

  /**
   * The type of the key (if set)
   */
  type: string | null;
}

/**
 * API response envelope
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * Raw key response from the API
 */
export interface RawKeyResponse {
  keyId: string;
  encryptedKey: string;
  type: string | null;
}
