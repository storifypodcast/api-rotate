"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

import {
  createValidationToken,
  decrypt,
  encrypt,
  generateKeyFingerprint,
  validateEncryptionKey,
} from "@api_rotate/crypto";

interface EncryptionKeyInfo {
  exists: boolean;
  keyFingerprint?: string;
  validationToken?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message: string };
}

interface EncryptionContextValue {
  isUnlocked: boolean;
  isValidationFailed: boolean;
  currentFingerprint: string | null;
  expectedFingerprint: string | null;
  setEncryptionKey: (key: string) => Promise<{ success: boolean; isValid: boolean }>;
  clearEncryptionKey: () => void;
  encryptValue: (plaintext: string) => Promise<string>;
  decryptValue: (ciphertext: string) => Promise<string>;
}

const EncryptionContext = createContext<EncryptionContextValue | null>(null);

export function EncryptionProvider({ children }: { children: ReactNode }) {
  const [encryptionKey, setEncryptionKeyState] = useState<string | null>(null);
  const [currentFingerprint, setCurrentFingerprint] = useState<string | null>(null);
  const [expectedFingerprint, setExpectedFingerprint] = useState<string | null>(null);
  const [isValidationFailed, setIsValidationFailed] = useState(false);

  const setEncryptionKey = useCallback(async (key: string): Promise<{ success: boolean; isValid: boolean }> => {
    try {
      // Generate fingerprint for the provided key
      const fingerprint = await generateKeyFingerprint(key);

      // Fetch stored encryption key info from server
      const response = await fetch("/api/encryption-key", {
        credentials: "include",
      });

      const data = (await response.json()) as ApiResponse<EncryptionKeyInfo>;

      if (!data.success) {
        // Server error, but still allow unlock
        setEncryptionKeyState(key);
        setCurrentFingerprint(fingerprint);
        return { success: true, isValid: true };
      }

      const info = data.data;

      if (!info?.exists) {
        // First time setup - create validation token and store on server
        const validationToken = await createValidationToken(key);

        const setupResponse = await fetch("/api/encryption-key", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keyFingerprint: fingerprint,
            validationToken,
          }),
        });

        const setupData = (await setupResponse.json()) as ApiResponse<unknown>;

        if (!setupData.success) {
          console.warn("Failed to store encryption key info:", setupData.error?.message);
        }

        // First unlock - always valid
        setEncryptionKeyState(key);
        setCurrentFingerprint(fingerprint);
        setExpectedFingerprint(fingerprint);
        setIsValidationFailed(false);
        return { success: true, isValid: true };
      }

      // Existing setup - validate the key
      setExpectedFingerprint(info.keyFingerprint ?? null);

      // Check if fingerprint matches
      const fingerprintMatches = info.keyFingerprint === fingerprint;

      // Validate using the validation token
      let tokenValid = false;
      if (info.validationToken) {
        tokenValid = await validateEncryptionKey(key, info.validationToken);
      }

      const isValid = fingerprintMatches && tokenValid;

      // Set state - allow unlock even if validation fails (with warning)
      setEncryptionKeyState(key);
      setCurrentFingerprint(fingerprint);
      setIsValidationFailed(!isValid);

      return { success: true, isValid };
    } catch (error) {
      console.error("Error during encryption key validation:", error);
      // On error, still allow unlock but mark as potentially invalid
      setEncryptionKeyState(key);
      return { success: true, isValid: false };
    }
  }, []);

  const clearEncryptionKey = useCallback(() => {
    setEncryptionKeyState(null);
    setCurrentFingerprint(null);
    setIsValidationFailed(false);
  }, []);

  const encryptValue = useCallback(
    async (plaintext: string): Promise<string> => {
      if (!encryptionKey) {
        throw new Error("Encryption key not set");
      }
      return encrypt(plaintext, encryptionKey);
    },
    [encryptionKey],
  );

  const decryptValue = useCallback(
    async (ciphertext: string): Promise<string> => {
      if (!encryptionKey) {
        throw new Error("Encryption key not set");
      }
      return decrypt(ciphertext, encryptionKey);
    },
    [encryptionKey],
  );

  const value = useMemo(
    () => ({
      isUnlocked: encryptionKey !== null,
      isValidationFailed,
      currentFingerprint,
      expectedFingerprint,
      setEncryptionKey,
      clearEncryptionKey,
      encryptValue,
      decryptValue,
    }),
    [
      encryptionKey,
      isValidationFailed,
      currentFingerprint,
      expectedFingerprint,
      setEncryptionKey,
      clearEncryptionKey,
      encryptValue,
      decryptValue,
    ],
  );

  return (
    <EncryptionContext.Provider value={value}>
      {children}
    </EncryptionContext.Provider>
  );
}

export function useEncryption() {
  const context = useContext(EncryptionContext);
  if (!context) {
    throw new Error("useEncryption must be used within an EncryptionProvider");
  }
  return context;
}
