-- Enable Row Level Security and policies for tenant isolation
-- Assumes a GUC `dukeauth.tenant_id` set via withTenant(orgId, fn)

DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Helper: ensure setting exists (no-op if not)
-- Policies reference current_setting('dukeauth.tenant_id', true)

ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Nft" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Marketplace" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrganizationMembership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApiKey" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DO $$ BEGIN
  DROP POLICY IF EXISTS product_isolation ON "Product";
  DROP POLICY IF EXISTS nft_isolation ON "Nft";
  DROP POLICY IF EXISTS order_isolation ON "Order";
  DROP POLICY IF EXISTS subscription_isolation ON "Subscription";
  DROP POLICY IF EXISTS marketplace_isolation ON "Marketplace";
  DROP POLICY IF EXISTS org_membership_isolation ON "OrganizationMembership";
  DROP POLICY IF EXISTS apikey_isolation ON "ApiKey";
EXCEPTION WHEN UNDEFINED_OBJECT THEN NULL; END $$;

CREATE POLICY product_isolation ON "Product"
  USING ("organizationId" = current_setting('dukeauth.tenant_id', true))
  WITH CHECK ("organizationId" = current_setting('dukeauth.tenant_id', true));

CREATE POLICY nft_isolation ON "Nft"
  USING ("organizationId" = current_setting('dukeauth.tenant_id', true))
  WITH CHECK ("organizationId" = current_setting('dukeauth.tenant_id', true));

CREATE POLICY order_isolation ON "Order"
  USING ("organizationId" = current_setting('dukeauth.tenant_id', true))
  WITH CHECK ("organizationId" = current_setting('dukeauth.tenant_id', true));

CREATE POLICY subscription_isolation ON "Subscription"
  USING ("organizationId" = current_setting('dukeauth.tenant_id', true))
  WITH CHECK ("organizationId" = current_setting('dukeauth.tenant_id', true));

CREATE POLICY marketplace_isolation ON "Marketplace"
  USING ("organizationId" = current_setting('dukeauth.tenant_id', true))
  WITH CHECK ("organizationId" = current_setting('dukeauth.tenant_id', true));

CREATE POLICY org_membership_isolation ON "OrganizationMembership"
  USING ("organizationId" = current_setting('dukeauth.tenant_id', true))
  WITH CHECK ("organizationId" = current_setting('dukeauth.tenant_id', true));

CREATE POLICY apikey_isolation ON "ApiKey"
  USING ("organizationId" = current_setting('dukeauth.tenant_id', true))
  WITH CHECK ("organizationId" = current_setting('dukeauth.tenant_id', true));

-- NOTE: With strict RLS on Marketplace and ApiKey, lookups by subdomain or keyHash
-- will require either (a) setting tenant first, or (b) additional targeted policies.
-- For production, consider adding controlled lookup policies using additional GUCs
-- like `dukeauth.lookup_subdomain` / `dukeauth.lookup_keyhash` and policies that
-- allow SELECT when the column matches those values.

