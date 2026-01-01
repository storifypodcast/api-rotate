/**
 * Encryption key fingerprinting utilities
 * Uses SHA-256 to create a unique identifier for encryption keys
 */

/**
 * Ensures crypto.subtle is available (requires HTTPS or localhost)
 */
function requireSecureContext(): void {
  // crypto.subtle is undefined in non-secure contexts (plain HTTP)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!crypto.subtle) {
    throw new Error(
      "Web Crypto API is not available. " +
        "Encryption requires a secure context (HTTPS or localhost). " +
        "Please access this site over HTTPS.",
    );
  }
}

/**
 * Converts a base64 string to Uint8Array
 */
function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Converts Uint8Array to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate a fingerprint (SHA-256 hash) of an encryption key
 * @param keyBase64 - Base64-encoded 256-bit encryption key
 * @returns Hex-encoded SHA-256 hash of the key (64 characters)
 */
export async function generateKeyFingerprint(
  keyBase64: string,
): Promise<string> {
  requireSecureContext();
  const keyBytes = base64ToBytes(keyBase64);
  const hashBuffer = await crypto.subtle.digest("SHA-256", keyBytes.buffer as ArrayBuffer);
  return bytesToHex(new Uint8Array(hashBuffer));
}

/**
 * Generates the first 8 characters of the fingerprint for display
 * @param fingerprint - Full 64-character hex fingerprint
 * @returns First 8 characters for user-friendly display
 */
export function shortenFingerprint(fingerprint: string): string {
  return fingerprint.substring(0, 8);
}
