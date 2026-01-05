-- DropIndex
DROP INDEX "unique_provento_ticker_dataCom_tipo";

-- CreateIndex
CREATE UNIQUE INDEX "unique_provento_ticker_dataPagamento_tipo" ON "proventos"("ticker", "dataPagamento", "tipo");
