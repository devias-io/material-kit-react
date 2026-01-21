-- Migration Manual: Adicionar campos de pagamento e tabela de migração
-- Execute este SQL diretamente no seu banco de dados PostgreSQL

-- 1. Adicionar novos campos na tabela Purchase
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "installments" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "platform" TEXT;

-- 2. Criar tabela PlanMigration
CREATE TABLE IF NOT EXISTS "plan_migrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planOriginal" TEXT NOT NULL,
    "planNovo" TEXT NOT NULL,
    "valorOriginal" DOUBLE PRECISION NOT NULL,
    "valorNovo" DOUBLE PRECISION NOT NULL,
    "mesesRestantes" INTEGER NOT NULL,
    "valorDesconto" DOUBLE PRECISION NOT NULL,
    "valorFinal" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "observacoes" TEXT,
    "processadoPor" TEXT NOT NULL,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataProcessamento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_migrations_pkey" PRIMARY KEY ("id")
);

-- 3. Exibir confirmação
SELECT 'Migration aplicada com sucesso!' as status;
