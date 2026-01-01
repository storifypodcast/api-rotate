# API Key Rotation System

A secure API key rotation and management system with **zero-knowledge encryption**. The server never sees or stores your API keys in plaintext - keys are encrypted client-side before storage and decrypted client-side after retrieval.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Admin Frontend │     │  Backend API    │     │  Client Package │
│  (Next.js)      │     │  (Hono + Bun)   │     │  (TypeScript)   │
│                 │     │                 │     │                 │
│  Has encryption │────▶│  Stores only    │◀────│  Has encryption │
│  key in memory  │     │  encrypted keys │     │  key in config  │
│  Encrypts before│     │  Zero-knowledge │     │  Decrypts after │
│  sending        │     │  storage        │     │  receiving      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Features

- **Zero-Knowledge Encryption**: AES-GCM 256-bit encryption - server never sees plaintext keys
- **Atomic Key Selection**: PostgreSQL `FOR UPDATE SKIP LOCKED` prevents race conditions
- **Exponential Backoff**: Automatic backoff on errors (30s → 60s → 120s → ... → 4h max)
- **Key Rotation Strategies**: FIFO (first available) or random selection
- **Admin UI**: Web interface to manage keys with real-time stats
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
└── docker/                  # Docker compose for PostgreSQL
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

# Service Authentication - for Client SDK
# Generate with: openssl rand -base64 32
SERVICE_API_KEY="sk_your-service-api-key-here"
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
- `api_key` table
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
3. Enter your encryption key to "Unlock Vault"
4. Add, pause, resume, or delete API keys

### Client SDK

Install the client package in your application:

```typescript
import { ApiKeyClient } from '@api_rotate/client';

const client = new ApiKeyClient({
  baseUrl: 'http://localhost:3001',
  serviceKey: process.env.SERVICE_API_KEY,
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

## API Endpoints

### Service Endpoints (Requires `SERVICE_API_KEY`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/keys/next` | Get first available key (FIFO) |
| GET | `/v1/keys/random` | Get random available key |
| POST | `/v1/keys/report-error` | Report error (triggers backoff) |

**Query Parameters:**
- `type` (optional): Filter by key type (e.g., "openai", "anthropic")
- `cooldownSeconds` (optional): Override cooldown (1-14400 seconds)

### Admin Endpoints (Requires Better Auth session)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/keys` | List all keys (without encrypted values) |
| GET | `/v1/keys/stats` | Get aggregated statistics |
| POST | `/v1/keys` | Create new key |
| PATCH | `/v1/keys/:id` | Update key (name, type, isActive) |
| DELETE | `/v1/keys/:id` | Delete key |

## Security Model

### Authentication Modes

| Mode | Use Case | Mechanism |
|------|----------|-----------|
| **Service Key** | Client apps (programmatic) | Bearer token: `SERVICE_API_KEY` |
| **Better Auth** | Admin UI (human users) | Session-based with email OTP |

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

## License

MIT
