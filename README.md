# DukeAuth Backend Scaffold

Monorepo (pnpm workspaces) for a multi-tenant SaaS backend with Postgres + Prisma (RLS), Express API, BullMQ worker, and local infra.

## Quickstart

1) Install deps

```bash
pnpm i
```

2) Start local infra (Postgres, Redis, LocalStack)

```bash
docker compose -f infra/docker-compose.yml up -d
```

3) Generate Prisma client and run migrations

```bash
pnpm -w dlx prisma generate --schema packages/db/schema.prisma
pnpm -w dlx prisma migrate dev --schema packages/db/schema.prisma --name init
```

4) Apply RLS policies (after DB is created)

```bash
psql "$DATABASE_URL" -f infra/sql/rls.sql
```

5) Run API

```bash
pnpm --filter @dukeauth/api dev
```

## Notes

- Tenant-scoped queries must be run inside `withTenant(orgId, fn)` from `@dukeauth/db`.
- API resolves tenant via `x-api-key` or subdomain on Host. Ensure Marketplace and ApiKey records exist.
- Marketplace is RLS-protected; for subdomain resolution, ensure policies allow lookup (see `infra/sql/rls.sql`).

