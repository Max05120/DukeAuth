# DukeAuth Backend Monorepo

Monorepo for DukeAuth, a multi-tenant SaaS backend for luxury NFT marketplaces.

## Quickstart

```bash
pnpm install
docker compose -f infra/docker-compose.yml up -d
pnpm -w dlx prisma migrate dev
pnpm --filter @dukeauth/api dev
```

## Structure

```
dukeauth/
  apps/
    api/        # Express REST API
    worker/     # Queue worker (BullMQ)
  packages/
    db/         # Prisma + Postgres schema & client
    core/       # Shared types & utils
    security/   # Auth/security helpers
  infra/
    docker-compose.yml   # Postgres, Redis, LocalStack (S3)
    sql/rls.sql          # Row Level Security policies
  .env.example
  pnpm-workspace.yaml
```

## Notable pieces

- RLS: Infra `infra/sql/rls.sql` sets per-tenant policies using Postgres GUC `dukeauth.tenant_id`.
- DB: `@dukeauth/db` exposes `prisma` and `withTenant(tenantId, cb)` to bind the tenant inside a transaction.
- Security: `@dukeauth/security` provides password hashing, JWT issuance/rotation with jti stored in `Session`, TOTP, and API key generation (hash-only stored).
- API: Express app with Helmet, CORS, rate limiting, Morgan, Zod validation, tenant resolution (subdomain or `x-api-key`).
- Worker: BullMQ queue with a placeholder Polygon mint job using `viem`.

## Environment

Copy `.env.example` to `.env` at repo root and adjust as needed.

## Prisma

The Prisma schema lives in `packages/db/prisma/schema.prisma`. Generate the client and apply migrations via:

```bash
pnpm -w dlx prisma migrate dev
```

## Dev scripts

- API: `pnpm --filter @dukeauth/api dev`
- Worker: `pnpm --filter @dukeauth/worker dev`

