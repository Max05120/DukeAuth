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
ALTER TABLE "MintUsage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClaimToken" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DO $$ BEGIN
  DROP POLICY IF EXISTS product_isolation ON "Product";
  DROP POLICY IF EXISTS nft_isolation ON "Nft";
  DROP POLICY IF EXISTS order_isolation ON "Order";
  DROP POLICY IF EXISTS subscription_isolation ON "Subscription";
  DROP POLICY IF EXISTS marketplace_isolation ON "Marketplace";
  DROP POLICY IF EXISTS org_membership_isolation ON "OrganizationMembership";
  DROP POLICY IF EXISTS apikey_isolation ON "ApiKey";
  DROP POLICY IF EXISTS mintusage_isolation ON "MintUsage";
  DROP POLICY IF EXISTS orderitem_isolation ON "OrderItem";
  DROP POLICY IF EXISTS claimtoken_isolation ON "ClaimToken";
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

CREATE POLICY mintusage_isolation ON "MintUsage"
  USING ("organizationId" = current_setting('dukeauth.tenant_id', true))
  WITH CHECK ("organizationId" = current_setting('dukeauth.tenant_id', true));

CREATE POLICY orderitem_isolation ON "OrderItem"
  USING ("organizationId" = current_setting('dukeauth.tenant_id', true))
  WITH CHECK ("organizationId" = current_setting('dukeauth.tenant_id', true));

CREATE POLICY claimtoken_isolation ON "ClaimToken"
  USING ("organizationId" = current_setting('dukeauth.tenant_id', true))
  WITH CHECK ("organizationId" = current_setting('dukeauth.tenant_id', true));

-- Safe lookup policies for tenant resolution via controlled GUCs
DO $$ BEGIN
  DROP POLICY IF EXISTS marketplace_lookup_subdomain ON "Marketplace";
  DROP POLICY IF EXISTS apikey_lookup_hash ON "ApiKey";
EXCEPTION WHEN UNDEFINED_OBJECT THEN NULL; END $$;

-- Allow SELECT on Marketplace when subdomain matches session GUC
CREATE POLICY marketplace_lookup_subdomain ON "Marketplace"
  FOR SELECT
  USING ("subdomain" = current_setting('dukeauth.marketplace_subdomain', true));

-- Allow SELECT on ApiKey when keyHash matches session GUC
CREATE POLICY apikey_lookup_hash ON "ApiKey"
  FOR SELECT
  USING ("keyHash" = current_setting('dukeauth.api_key_hash', true));
