-- CreateEnum
CREATE TYPE "ViesOverride" AS ENUM ('AUTO', 'MANTER');

-- AlterTable
ALTER TABLE "user_micro_caps" ADD COLUMN "viesOverride" "ViesOverride" DEFAULT 'AUTO';
ALTER TABLE "user_small_caps" ADD COLUMN "viesOverride" "ViesOverride" DEFAULT 'AUTO';
ALTER TABLE "user_dividendos" ADD COLUMN "viesOverride" "ViesOverride" DEFAULT 'AUTO';
ALTER TABLE "user_fiis" ADD COLUMN "viesOverride" "ViesOverride" DEFAULT 'AUTO';
ALTER TABLE "user_renda_turbinada" ADD COLUMN "viesOverride" "ViesOverride" DEFAULT 'AUTO';
ALTER TABLE "user_dividendos_internacional" ADD COLUMN "viesOverride" "ViesOverride" DEFAULT 'AUTO';
ALTER TABLE "user_etfs" ADD COLUMN "viesOverride" "ViesOverride" DEFAULT 'AUTO';
ALTER TABLE "user_projeto_america" ADD COLUMN "viesOverride" "ViesOverride" DEFAULT 'AUTO';
ALTER TABLE "user_exterior_stocks" ADD COLUMN "viesOverride" "ViesOverride" DEFAULT 'AUTO';
