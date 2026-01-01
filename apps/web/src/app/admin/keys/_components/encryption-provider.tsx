"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

import { decrypt, encrypt } from "@api_rotate/crypto";

interface EncryptionContextValue {
  isUnlocked: boolean;
  setEncryptionKey: (key: string) => void;
  clearEncryptionKey: () => void;
  encryptValue: (plaintext: string) => Promise<string>;
  decryptValue: (ciphertext: string) => Promise<string>;
}

const EncryptionContext = createContext<EncryptionContextValue | null>(null);

export function EncryptionProvider({ children }: { children: ReactNode }) {
  const [encryptionKey, setEncryptionKeyState] = useState<string | null>(null);

  const setEncryptionKey = useCallback((key: string) => {
    setEncryptionKeyState(key);
  }, []);

  const clearEncryptionKey = useCallback(() => {
    setEncryptionKeyState(null);
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
      setEncryptionKey,
      clearEncryptionKey,
      encryptValue,
      decryptValue,
    }),
    [
      encryptionKey,
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
