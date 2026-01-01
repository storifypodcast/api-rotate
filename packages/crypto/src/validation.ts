/**
 * Encryption key validation utilities
 * Used to verify that an encryption key is correct by encrypting/decrypting a known value
 */

import { decrypt, encrypt } from "./aes-gcm";

/**
 * The plaintext value used for validation
 * This is a constant that gets encrypted with the user's key
 */
export const VALIDATION_PLAINTEXT = "API_ROTATE_VALIDATION_V1";

/**
 * Creates a validation token by encrypting a known plaintext
 * Store this token to verify the encryption key later
 *
 * @param keyBase64 - Base64-encoded 256-bit encryption key
 * @returns Encrypted validation token (base64)
 */
export async function createValidationToken(keyBase64: string): Promise<string> {
  return encrypt(VALIDATION_PLAINTEXT, keyBase64);
}

/**
 * Validates an encryption key by attempting to decrypt the validation token
 *
 * @param keyBase64 - Base64-encoded 256-bit encryption key to validate
 * @param validationToken - Previously stored encrypted validation token
 * @returns true if the key successfully decrypts the token to the expected value
 */
export async function validateEncryptionKey(
  keyBase64: string,
  validationToken: string,
): Promise<boolean> {
  try {
    const decrypted = await decrypt(validationToken, keyBase64);
    return decrypted === VALIDATION_PLAINTEXT;
  } catch {
    // AES-GCM will throw on auth tag verification failure
    return false;
  }
}
