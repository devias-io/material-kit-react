-- Add isActive flag to migration products for manual enable/disable.
ALTER TABLE "migration_products"
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
