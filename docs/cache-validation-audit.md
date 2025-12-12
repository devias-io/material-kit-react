# Diagnóstico de cache, validação de payload e rate limiting

## Correções aplicadas

- `src/app/api/proventos/route.ts`
  - `GET` agora devolve cabeçalho `Cache-Control: public, s-maxage=120, stale-while-revalidate=60`, alinhado ao TTL do `CacheService`. 【F:src/app/api/proventos/route.ts†L78-L133】
  - `POST` validado via Zod (`proventosUploadSchema`) e protegido com rate limiting de 5 requisições/minuto por IP. 【F:src/app/api/proventos/route.ts†L136-L199】
- `src/app/api/relatorios/route.ts`
  - `GET` responde com caching público (`s-maxage=300, stale-while-revalidate=120`). 【F:src/app/api/relatorios/route.ts†L5-L74】
  - `POST` agora usa schema Zod para todos os campos e rate limiting de 20 requisições/minuto por IP. 【F:src/app/api/relatorios/route.ts†L77-L140】
- `src/app/api/faq/route.ts` — respostas públicas enviam `Cache-Control: public, s-maxage=300, stale-while-revalidate=120`. 【F:src/app/api/faq/route.ts†L1-L26】
- `src/app/api/auth/login/route.ts` — payload validado com Zod e rate limiting de 10 tentativas/minuto por IP, retornando `429` com `Retry-After` quando excedido. 【F:src/app/api/auth/login/route.ts†L1-L57】

## Observações

- Criado utilitário compartilhado `enforceRateLimit` (`src/lib/rate-limit.ts`) reutilizável com Redis/memória para novas rotas. 【F:src/lib/rate-limit.ts†L1-L42】
