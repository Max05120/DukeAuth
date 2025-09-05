-- Enable Row Level Security for org-scoped tables and bind to dukeauth.tenant_id GUC

-- Create a convenience function to fetch current tenant id
-- Not strictly required, but handy for policies.
-- In Postgres 9.6+, current_setting(..., true) returns null if missing.

-- Policies for each table

ALTER TABLE "Marketplace" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Nft" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApiKey" ENABLE ROW LEVEL SECURITY;

-- Force RLS so even table owners go through policies
ALTER TABLE "Marketplace" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Product" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Nft" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Order" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" FORCE ROW LEVEL SECURITY;
ALTER TABLE "ApiKey" FORCE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'tenant_isolation_select_marketplace') THEN
    DROP POLICY tenant_isolation_select_marketplace ON "Marketplace";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'tenant_isolation_mod_marketplace') THEN
    DROP POLICY tenant_isolation_mod_marketplace ON "Marketplace";
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'tenant_isolation_select_product') THEN
    DROP POLICY tenant_isolation_select_product ON "Product";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'tenant_isolation_mod_product') THEN
    DROP POLICY tenant_isolation_mod_product ON "Product";
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'tenant_isolation_select_nft') THEN
    DROP POLICY tenant_isolation_select_nft ON "Nft";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'tenant_isolation_mod_nft') THEN
    DROP POLICY tenant_isolation_mod_nft ON "Nft";
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'tenant_isolation_select_order') THEN
    DROP POLICY tenant_isolation_select_order ON "Order";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'tenant_isolation_mod_order') THEN
    DROP POLICY tenant_isolation_mod_order ON "Order";
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'tenant_isolation_select_subscription') THEN
    DROP POLICY tenant_isolation_select_subscription ON "Subscription";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'tenant_isolation_mod_subscription') THEN
    DROP POLICY tenant_isolation_mod_subscription ON "Subscription";
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'tenant_isolation_select_apikey') THEN
    DROP POLICY tenant_isolation_select_apikey ON "ApiKey";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'tenant_isolation_mod_apikey') THEN
    DROP POLICY tenant_isolation_mod_apikey ON "ApiKey";
  END IF;
END $$;

-- Policy helper: orgId column must equal current tenant id
CREATE POLICY tenant_isolation_select_marketplace ON "Marketplace"
  FOR SELECT USING ("organization_id" = current_setting('dukeauth.tenant_id', true));
CREATE POLICY tenant_isolation_mod_marketplace ON "Marketplace"
  FOR ALL USING ("organization_id" = current_setting('dukeauth.tenant_id', true))
  WITH CHECK ("organization_id" = current_setting('dukeauth.tenant_id', true));

CREATE POLICY tenant_isolation_select_product ON "Product"
  FOR SELECT USING ("organization_id" = current_setting('dukeauth.tenant_id', true));
CREATE POLICY tenant_isolation_mod_product ON "Product"
  FOR ALL USING ("organization_id" = current_setting('dukeauth.tenant_id', true))
  WITH CHECK ("organization_id" = current_setting('dukeauth.tenant_id', true));

CREATE POLICY tenant_isolation_select_nft ON "Nft"
  FOR SELECT USING ("organization_id" = current_setting('dukeauth.tenant_id', true));
CREATE POLICY tenant_isolation_mod_nft ON "Nft"
  FOR ALL USING ("organization_id" = current_setting('dukeauth.tenant_id', true))
  WITH CHECK ("organization_id" = current_setting('dukeauth.tenant_id', true));

CREATE POLICY tenant_isolation_select_order ON "Order"
  FOR SELECT USING ("organization_id" = current_setting('dukeauth.tenant_id', true));
CREATE POLICY tenant_isolation_mod_order ON "Order"
  FOR ALL USING ("organization_id" = current_setting('dukeauth.tenant_id', true))
  WITH CHECK ("organization_id" = current_setting('dukeauth.tenant_id', true));

CREATE POLICY tenant_isolation_select_subscription ON "Subscription"
  FOR SELECT USING ("organization_id" = current_setting('dukeauth.tenant_id', true));
CREATE POLICY tenant_isolation_mod_subscription ON "Subscription"
  FOR ALL USING ("organization_id" = current_setting('dukeauth.tenant_id', true))
  WITH CHECK ("organization_id" = current_setting('dukeauth.tenant_id', true));

CREATE POLICY tenant_isolation_select_apikey ON "ApiKey"
  FOR SELECT USING ("organization_id" = current_setting('dukeauth.tenant_id', true));
CREATE POLICY tenant_isolation_mod_apikey ON "ApiKey"
  FOR ALL USING ("organization_id" = current_setting('dukeauth.tenant_id', true))
  WITH CHECK ("organization_id" = current_setting('dukeauth.tenant_id', true));

