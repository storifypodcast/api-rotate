export interface ApiKeyData {
  id: string;
  name: string;
  encryptedKey: string;
  type: string | null;
  keyFingerprint: string | null;
  defaultCooldown: number;
  isActive: boolean;
  availableAt: string;
  lastUsedAt: string | null;
  useCount: number;
  errorCount: number;
  consecutiveErrors: number;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyStats {
  totalKeys: number;
  activeKeys: number;
  availableNow: number;
  totalUses: number;
  totalErrors: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}
