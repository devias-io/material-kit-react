-- AlterTable
ALTER TABLE "proventos_sincronizacao" ALTER COLUMN "ticker" DROP NOT NULL;
ALTER TABLE "proventos_sincronizacao" ADD COLUMN     "totalErros" INTEGER NOT NULL DEFAULT 0;
