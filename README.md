# API Key Rotation System

A secure API key rotation and management system with **zero-knowledge encryption** and **multi-tenancy**. The server never sees or stores your API keys in plaintext - keys are encrypted client-side before storage and decrypted client-side after retrieval. Each user can only access their own keys.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Admin Frontend │     │  Backend API    │     │  Client Package │
│  (Next.js)      │     │  (Hono + Bun)   │     │  (TypeScript)   │
│                 │     │                 │     │                 │
│  Session auth   │────▶│  Multi-tenant   │◀────│  Service key    │
│  Has encryption │     │  Stores only    │     │  authentication │
│  key in memory  │     │  encrypted keys │     │  Has encryption │
│  Manages keys   │     │  Per-user scope │     │  key in config  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
              ┌─────┴─────┐ ┌───┴────┐ ┌────┴─────┐
              │   user    │ │api_key │ │service_  │
              └───────────┘ │+user_id│ │  key     │
                            └────────┘ └──────────┘
```

## Features

- **Zero-Knowledge Encryption**: AES-GCM 256-bit encryption - server never sees plaintext keys
- **Multi-Tenancy**: Each user can only see and manage their own API keys
- **Per-User Service Keys**: Generate unique service keys for programmatic access (replaces global SERVICE_API_KEY)
- **Atomic Key Selection**: PostgreSQL `FOR UPDATE SKIP LOCKED` prevents race conditions
- **Exponential Backoff**: Automatic backoff on errors (30s → 60s → 120s → ... → 4h max)
- **Key Rotation Strategies**: FIFO (first available) or random selection
- **Admin UI**: Web interface to manage keys and service keys with real-time stats
- **TypeScript SDK**: Easy-to-use client library with auto-decryption

## Project Structure

```
api_rotate/
├── apps/
│   ├── server/              # Hono + Bun backend API
│   └── web/                 # Next.js admin frontend
├── packages/
│   ├── db/                  # Drizzle + PostgreSQL schemas
│   ├── crypto/              # AES-GCM encryption utilities
│   ├── client/              # TypeScript client SDK
│   └── auth/                # Better Auth configuration
├── docker/                  # Docker compose for PostgreSQL
└── sample-client.ts         # Example client SDK usage
```

## Prerequisites

- **Node.js** >= 22.21.0
- **pnpm** >= 10.19.0
- **Docker** (for PostgreSQL)
- **Bun** (for backend server)

## Setup Guide

### Step 1: Clone and Install Dependencies

```bash
cd api_rotate
pnpm install
```

### Step 2: Start PostgreSQL Database

```bash
# Start PostgreSQL container
docker compose -f docker/docker-compose.yml up -d

# Verify it's running
docker ps
```

> **Note**: Update `docker/docker-compose.yml` to match your .env DATABASE_URL credentials.

### Step 3: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` with your values:

```bash
# Database - update credentials to match docker-compose.yml
DATABASE_URL="postgresql://user:password@localhost:5432/api_rotate?sslmode=disable"

# Server
PORT=3001
NODE_ENV="development"

# Authentication (Better Auth) - for Admin UI
# Generate with: openssl rand -base64 32
AUTH_SECRET="your-32-char-secret-here"
BETTER_AUTH_SECRET="your-32-char-secret-here"
BETTER_AUTH_URL="http://localhost:3000"

# Note: SERVICE_API_KEY is no longer needed!
# Service keys are now per-user and managed via the Admin UI.
```

### Step 4: Generate Encryption Key

The encryption key is **never stored on the server**. Generate one and keep it secure:

```bash
# Generate a 256-bit encryption key
openssl rand -base64 32
```

Save this key securely - you'll need it for:
- Admin UI: Enter when "unlocking the vault"
- Client SDK: Pass in the `encryptionKey` config option

### Step 5: Initialize Database

```bash
# Push schema and create tables
pnpm db:push
```

This creates:
- `api_key` table (with per-user scoping)
- `service_key` table (per-user service keys for API access)
- `user`, `session`, `account`, `verification` tables (Better Auth)
- PostgreSQL functions for atomic key operations

### Step 6: Start the Application

```bash
# Start both backend and frontend in development mode
pnpm dev

# Or start them individually:
pnpm dev:server   # Backend on http://localhost:3001
pnpm dev:web      # Frontend on http://localhost:3000
```

## Usage

### Admin UI

1. Open http://localhost:3000/admin/keys
2. Sign in with email OTP (check server logs for OTP code in development)
3. **Generate a Service Key**: Click "Generate Service Key" to create a key for API access
4. **Copy the service key immediately** - it won't be shown again!
5. Enter your encryption key to "Unlock Vault"
6. Add, pause, resume, or delete API keys

### Client SDK

Install the client package in your application:

```typescript
import { ApiKeyClient } from '@api_rotate/client';

const client = new ApiKeyClient({
  baseUrl: 'http://localhost:3001',
  // Use your per-user service key (generated in Admin UI)
  serviceKey: process.env.MY_SERVICE_KEY, // e.g., sk_live_abc123...
  encryptionKey: process.env.ENCRYPTION_KEY,
});

// Get an available key (FIFO order)
const { keyId, key, type } = await client.getKey({ type: 'openai' });

// Get a random available key
const result = await client.getKey({
  type: 'openai',
  strategy: 'random'
});

// Override cooldown (default is per-key setting)
const fastKey = await client.getKey({
  type: 'openai',
  cooldownSeconds: 5
});

// Report an error (triggers exponential backoff)
await client.reportError(keyId, 'Rate limit exceeded');

// Convenience wrapper with automatic error reporting
const response = await client.withKey(async (apiKey, keyId) => {
  return fetch('https://api.openai.com/v1/chat/completions', {
    headers: { Authorization: `Bearer ${apiKey}` },
    // ... rest of request
  });
}, { type: 'openai' });
```

### Running the Sample Client

A sample client script is included to demonstrate the SDK functionality:

```bash
# 1. Start the server
pnpm dev:server

# 2. Set environment variables (or edit sample-client.ts directly)
export SERVICE_KEY="sk_live_your_service_key_here"
export ENCRYPTION_KEY="your_base64_encryption_key_here"

# 3. Run the sample client
bun sample-client.ts
```

The sample script demonstrates:
- Getting an available key with decryption
- Reporting errors (triggers cooldown)
- Handling `NoKeysAvailableError` when keys are on cooldown
- Using the `withKey` convenience wrapper
- Handling invalid service key rejection

### Error Handling

```typescript
import { ApiKeyClient, NoKeysAvailableError, ApiKeyError } from '@api_rotate/client';

try {
  const { key, keyId } = await client.getKey({ type: 'openai' });
  // Use the key...
} catch (error) {
  if (error instanceof NoKeysAvailableError) {
    // All keys are on cooldown - wait and retry
    console.log('No keys available, retrying later...');
  } else if (error instanceof ApiKeyError) {
    // API error (invalid service key, server error, etc.)
    console.error(`API Error: ${error.message} (code: ${error.code})`);
  }
}
```

## API Endpoints

### Service Endpoints (Requires User Service Key)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/keys/next` | Get first available key (FIFO) |
| GET | `/v1/keys/random` | Get random available key |
| POST | `/v1/keys/report-error` | Report error (triggers backoff) |

**Authentication:**
```
Authorization: Bearer sk_live_your_service_key_here
```

**Query Parameters:**
- `type` (optional): Filter by key type (e.g., "openai", "anthropic")
- `cooldownSeconds` (optional): Override cooldown (1-14400 seconds)

### Service Key Management (Requires Better Auth session)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/service-keys` | List your service keys |
| POST | `/v1/service-keys` | Generate new service key |
| DELETE | `/v1/service-keys/:id` | Revoke service key |

### Admin Endpoints (Requires Better Auth session)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/keys` | List your keys (without encrypted values) |
| GET | `/v1/keys/stats` | Get your aggregated statistics |
| POST | `/v1/keys` | Create new key |
| PATCH | `/v1/keys/:id` | Update key (name, type, isActive) |
| DELETE | `/v1/keys/:id` | Delete key |

## Security Model

### Authentication Modes

| Mode | Use Case | Mechanism |
|------|----------|-----------|
| **Service Key** | Client apps (programmatic) | Bearer token: per-user `sk_live_...` key |
| **Better Auth** | Admin UI (human users) | Session-based with email OTP |

### Multi-Tenancy

- Each user's API keys are isolated - users can only access their own keys
- Service keys are per-user and scoped to that user's API keys
- Revoking a service key immediately blocks access

### Zero-Knowledge Architecture

1. **Admin UI Encryption**: Keys are encrypted in the browser before being sent to the server
2. **Server Storage**: Server only stores encrypted ciphertext (AES-GCM with random nonce)
3. **Client Decryption**: SDK decrypts keys locally after receiving from server
4. **Key Security**: Even with database access, keys cannot be decrypted without the encryption key

## Exponential Backoff Formula

When an error is reported, the key becomes unavailable with exponential backoff:

```
backoff = min(default_cooldown * 2^consecutive_errors, max_delay)

Example with default_cooldown = 30s:
- 0 errors: 30s
- 1 error:  60s
- 2 errors: 120s
- 3 errors: 240s
- 5 errors: 960s
- 9+ errors: 14400s (4 hour cap)
```

**Auto-recovery**: On successful use, `consecutive_errors` decrements by 1.

## Development

```bash
# Run type checking
pnpm typecheck

# Run linting
pnpm lint

# Fix lint issues
pnpm lint:fix

# Format code
pnpm format:fix

# Open Drizzle Studio (database viewer)
pnpm db:studio
```

## Troubleshooting

### "Port 3001 in use"

```bash
# Find and kill the process
lsof -ti:3001 | xargs kill -9
```

### Database connection issues

1. Ensure PostgreSQL container is running: `docker ps`
2. Check DATABASE_URL matches docker-compose credentials
3. Verify database exists: `docker exec -it <container> psql -U user -d api_rotate`

### OTP not received

In development, OTP codes are logged to the server console:
```
[Email OTP] Sending sign-in code to user@example.com: 123456
```

### Encryption key issues

- Ensure the key is exactly 32 bytes when base64 decoded
- Use the same key for Admin UI and Client SDK
- Keys encrypted with one key cannot be decrypted with another

### Service key issues

- Service keys start with `sk_live_` prefix
- If a service key doesn't work, generate a new one in the Admin UI
- Each user needs their own service key - keys cannot be shared between users

## License

MIT
