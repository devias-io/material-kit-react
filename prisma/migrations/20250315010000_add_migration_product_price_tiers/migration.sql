-- Add price tiers to migration products for per-range checkout URLs.
ALTER TABLE "migration_products"
ADD COLUMN "priceTiers" JSONB;
