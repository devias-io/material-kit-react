# Cache, deduplicação e observabilidade

Este projeto agora possui uma camada de cache única (`CacheService`) que prioriza Redis da Upstash quando as variáveis de ambiente estão configuradas e faz fallback automático para cache em memória com deduplicação de promessas (request coalescing).

## Como funciona
- **Deduplicação**: requisições iguais em paralelo reaproveitam a mesma `Promise`, evitando stampede.
- **Tags**: rotas podem invalidar grupos específicos com `CacheService.invalidateTags([...])`.
- **TTL por tipo de dado**:
  - Cotações/notificações: 30–60s
  - Financial quotes/market data: 5 min
  - Proventos: 1h
  - Carteiras e meus-ativos: 10 min
- **Logs**: cada rota otimizada envia um log estruturado `[api-metric]` com hit/miss, backend e latência.

## Configuração do Upstash Redis (opção recomendada)
1. Criar database no painel do Upstash.
2. Copiar as credenciais REST e definir no Vercel/ambiente local:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Deploy. O `CacheService` detecta as variáveis e usa Redis automaticamente.

## Fallback em memória (opção gratuita)
- Nenhuma configuração extra. É adequado para desenvolvimento/local, porém não é compartilhado entre instâncias e pode crescer na memória. TTLs curtos ajudam a controlar.

## Rotas otimizadas
- `/api/notifications` e `/api/notifications/[id]` (cache curto + invalidação ao criar/editar/deletar)
- `/api/proventos/[ticker]` (1h)
- `/api/auth/check` (60s por usuário autenticado)
- `/api/carteiras` e `/api/carteiras/minhas` (10 min por usuário/parâmetros)
- `/api/meus-ativos/[carteira]` (cache mestre de 10 min com deduplicação)
- `/api/financial/market-data` e `/api/financial/quotes` (5 min)

## Próximos passos sugeridos
- Conectar um painel de logs/metrics (DataDog/New Relic/Vercel Logs) para consultar os eventos `[api-metric]`.
- Adicionar rate limiting (ex.: `@upstash/ratelimit`) nas rotas que chamam fornecedores externos.
- Incluir invalidação explícita nos fluxos de escrita que alteram carteiras/ativos para derrubar caches relacionados.
