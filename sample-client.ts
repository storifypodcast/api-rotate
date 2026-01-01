/**
 * Sample script demonstrating the API Key Client SDK with multi-tenancy
 *
 * Prerequisites:
 * 1. Start the server: pnpm dev:server
 * 2. Generate a service key via Admin UI (http://localhost:3000/admin/keys)
 * 3. Update SERVICE_KEY and ENCRYPTION_KEY below with your values
 *
 * Run with: bun sample-client.ts
 */

import { ApiKeyClient, ApiKeyError, DecryptionError, NoKeysAvailableError } from "./packages/client/src/index";

// Replace with your values from the Admin UI
const SERVICE_KEY = process.env.SERVICE_API_KEY || "sk_live_your_service_key_here";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "your_base64_encryption_key_here";
const BASE_URL = process.env.BACKEND_URL || "http://localhost:3001";

async function main() {
  console.log("🧪 Testing API Key Client SDK with Multi-Tenancy\n");

  const client = new ApiKeyClient({
    baseUrl: BASE_URL,
    serviceKey: SERVICE_KEY,
    encryptionKey: ENCRYPTION_KEY,
  });

  // Test 1: Get a key
  console.log("Test 1: Get a key (first available)");
  try {
    const result = await client.getKey({ type: "openai" });
    console.log("  ✅ Success!");
    console.log(`     Key ID: ${result.keyId}`);
    console.log(`     Decrypted Key: ${result.key}`);
    console.log(`     Type: ${result.type}\n`);

    // Test 2: Report an error
    console.log("Test 2: Report an error");
    await client.reportError(result.keyId, "Test error - rate limit simulation");
    console.log("  ✅ Error reported successfully\n");

  } catch (error) {
    if (error instanceof NoKeysAvailableError) {
      console.log("  ⚠️ No keys available (key on cooldown - expected after first use)\n");
    } else if (error instanceof DecryptionError) {
      console.log(`  ❌ Decryption failed: ${error.message}\n`);
      console.log("     This means the encryption key doesn't match the one used to encrypt the stored key.\n");
    } else if (error instanceof ApiKeyError) {
      console.log(`  ❌ API Error: ${error.message} (code: ${error.code})\n`);
    } else {
      throw error;
    }
  }

  // Test 3: Try to get another key (should fail - on cooldown)
  console.log("Test 3: Get key again (should be on cooldown)");
  try {
    await client.getKey({ type: "openai" });
    console.log("  ❌ Unexpected success - key should be on cooldown\n");
  } catch (error) {
    if (error instanceof NoKeysAvailableError) {
      console.log("  ✅ Correctly returned 'No keys available' (cooldown active)\n");
    } else if (error instanceof DecryptionError) {
      console.log(`  ⚠️ Decryption failed (encryption key mismatch)\n`);
    } else {
      throw error;
    }
  }

  // Test 4: withKey wrapper
  console.log("Test 4: Using withKey wrapper (will fail due to cooldown)");
  try {
    await client.withKey(async (key, keyId) => {
      console.log(`  Would use key ${keyId}: ${key}`);
      return "success";
    }, { type: "openai" });
  } catch (error) {
    if (error instanceof NoKeysAvailableError) {
      console.log("  ✅ Correctly caught NoKeysAvailableError in withKey\n");
    } else if (error instanceof DecryptionError) {
      console.log(`  ⚠️ Decryption failed (encryption key mismatch)\n`);
    } else {
      throw error;
    }
  }

  // Test 5: Invalid service key
  console.log("Test 5: Test with invalid service key");
  const badClient = new ApiKeyClient({
    baseUrl: BASE_URL,
    serviceKey: "sk_invalid_key",
    encryptionKey: ENCRYPTION_KEY,
  });

  try {
    await badClient.getKey();
    console.log("  ❌ Should have failed with invalid key\n");
  } catch (error) {
    if (error instanceof ApiKeyError) {
      console.log(`  ✅ Correctly rejected: ${error.message}\n`);
    } else if (error instanceof SyntaxError) {
      // Server returned non-JSON (likely HTML error page) - this is expected for auth failures
      console.log("  ✅ Correctly rejected (non-JSON response from auth failure)\n");
    } else {
      throw error;
    }
  }

  console.log("🎉 All tests completed!");
}

main().catch(console.error);
