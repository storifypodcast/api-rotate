/**
 * AES-GCM 256-bit encryption utilities using Web Crypto API
 * Works in both Node.js and browser environments
 */

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const NONCE_LENGTH = 12; // 96 bits, recommended for AES-GCM

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
 * Converts Uint8Array to base64 string
 */
function bytesToBase64(bytes: Uint8Array): string {
  let binaryString = "";
  for (const byte of bytes) {
    binaryString += String.fromCharCode(byte);
  }
  return btoa(binaryString);
}

/**
 * Imports a base64-encoded key for use with Web Crypto API
 */
async function importKey(keyBase64: string): Promise<CryptoKey> {
  requireSecureContext();
  const keyBytes = base64ToBytes(keyBase64);
  if (keyBytes.length !== 32) {
    throw new Error(
      `Invalid key length: expected 32 bytes (256 bits), got ${keyBytes.length}`,
    );
  }
  return crypto.subtle.importKey(
    "raw",
    keyBytes.buffer as ArrayBuffer,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypts plaintext using AES-GCM 256-bit
 *
 * @param plaintext - The string to encrypt
 * @param keyBase64 - Base64-encoded 256-bit encryption key
 * @returns Base64-encoded ciphertext (nonce + ciphertext + auth tag)
 */
export async function encrypt(
  plaintext: string,
  keyBase64: string,
): Promise<string> {
  const key = await importKey(keyBase64);

  // Generate random 12-byte nonce
  const nonce = crypto.getRandomValues(new Uint8Array(NONCE_LENGTH));

  // Encode plaintext to bytes
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  // Encrypt (ciphertext includes auth tag)
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: nonce },
    key,
    plaintextBytes,
  );

  // Combine nonce + ciphertext into single array
  const combined = new Uint8Array(nonce.length + ciphertext.byteLength);
  combined.set(nonce);
  combined.set(new Uint8Array(ciphertext), nonce.length);

  return bytesToBase64(combined);
}

/**
 * Decrypts ciphertext encrypted with AES-GCM 256-bit
 *
 * @param ciphertext - Base64-encoded ciphertext (nonce + ciphertext + auth tag)
 * @param keyBase64 - Base64-encoded 256-bit encryption key
 * @returns Decrypted plaintext string
 */
export async function decrypt(
  ciphertext: string,
  keyBase64: string,
): Promise<string> {
  const key = await importKey(keyBase64);

  // Decode combined data
  const combined = base64ToBytes(ciphertext);

  if (combined.length < NONCE_LENGTH + 16) {
    throw new Error("Invalid ciphertext: too short");
  }

  // Extract nonce and ciphertext
  const nonce = combined.slice(0, NONCE_LENGTH);
  const encryptedData = combined.slice(NONCE_LENGTH);

  // Decrypt
  const plaintextBytes = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: nonce },
    key,
    encryptedData,
  );

  // Decode to string
  const decoder = new TextDecoder();
  return decoder.decode(plaintextBytes);
}

/**
 * Generates a new random 256-bit encryption key
 *
 * @returns Base64-encoded 256-bit key
 */
export async function generateEncryptionKey(): Promise<string> {
  requireSecureContext();
  const key = await crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true, // extractable
    ["encrypt", "decrypt"],
  );

  const rawKey = await crypto.subtle.exportKey("raw", key);
  return bytesToBase64(new Uint8Array(rawKey));
}
