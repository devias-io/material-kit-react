import { z } from 'zod';

export const cashDividendSchema = z.object({
  assetIssued: z.string(),
  paymentDate: z.string().nullable(),
  rate: z.number(),
  relatedTo: z.string(),
  approvedOn: z.string().nullable(),
  isinCode: z.string(),
  label: z.string(),
  lastDatePrior: z.string(),
  remarks: z.string()
});

export const brapiResponseSchema = z.object({
  results: z.array(z.object({
    symbol: z.string(),
    dividendsData: z.object({
      cashDividends: z.array(cashDividendSchema),
      stockDividends: z.array(z.any()),
      subscriptions: z.array(z.any())
    })
  })),
  requestedAt: z.string(),
  took: z.number()
});

export const syncPayloadSchema = z.object({
  tickers: z.array(z.string()).optional(),
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime().optional(),
  forcarAtualizacao: z.boolean().optional().default(false)
});
