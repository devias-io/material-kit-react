# Auditoria rápida de consumo de dados (Vercel e Redis)

A revisão priorizou pontos que podem gerar consumo excessivo de dados (chamadas externas, logs e operações no Redis) quando a base crescer para ~4.000 usuários.

## 1) Cache de cotações isolado por instância (Brapi)
- **Onde:** `src/lib/brapi-service.ts`
- **Por que consome:** o serviço mantém um `Map` em memória com TTL de 60s. Em Vercel cada função/lâmbda tem memória isolada, então cada instância refaz chamadas à Brapi mesmo para símbolos iguais, multiplicando tráfego externo e latência.
- **Risco:** com muitos usuários pedindo os mesmos tickers, as instâncias vão duplicar downloads e logs para a Brapi.
- **Sugerido:** substituir o `Map` local por `CacheService` (Redis) com TTL >= 5 minutos (alinhado ao revalidate da rota `/api/financial/quotes`). Isso permite cache compartilhado entre instâncias e invalidação por tags quando preciso.
- **Referência de código:** leitura e gravação no `quoteCache` local e TTL de 60s.【F:src/lib/brapi-service.ts†L4-L90】

## 2) Rate-limit gravando estruturas grandes no Redis
- **Onde:** `src/lib/rate-limit.ts` e rotas que reutilizam `CacheService` para contadores (ex.: geração de PDF).
- **Por que consome:** cada requisição faz `get`/`set` de objetos JSON (`{ count, expiresAt }`), aumentando payload e número de operações. Em escala alta, o volume de escrita/leitura cresce e pode estourar limites da Upstash.
- **Sugerido:** usar operações atômicas (`INCR` com `EX`/`PX` ou `SETNX`) no Redis para manter apenas o contador e o TTL, evitando serialização de objetos. Para rotas simples (ex.: `/api/generate-pdf`), uma única chave com `INCR` e `EX` por usuário já resolve.
- **Referência de código:** contador salvo com `CacheService.set` e recálculo de TTL a cada chamada.【F:src/lib/rate-limit.ts†L9-L35】【F:src/app/api/generate-pdf/route.ts†L16-L39】

## 3) Volume de logs em rotas de cotações
- **Onde:** `src/app/api/financial/quotes/route.ts` e `src/lib/brapi-service.ts`.
- **Por que consome:** a rota e o client logam todas as entradas, URLs mascaradas e status. Em Vercel, logs extensos contam como uso de dados e podem crescer rápido com milhares de requisições.
- **Sugerido:** reduzir logs em produção (p.ex., usar `NODE_ENV` para logar apenas erros), agregar métricas via `logApiMetric` e remover `console.log` de sucesso. Também considerar amostrar logs ou limitar detalhes dos símbolos.
- **Referência de código:** múltiplos `console.log` para cada request e resposta.【F:src/app/api/financial/quotes/route.ts†L25-L71】【F:src/lib/brapi-service.ts†L18-L89】

## 4) Padronizar TTLs e tags do `CacheService`
- **Onde:** `src/lib/redis.ts` e rotas que usam cache.
- **Por que consome:** TTL padrão é 5 min; algumas rotas usam valores diferentes sem tags consistentes, o que dificulta invalidação e pode gerar reprocessamento desnecessário (mais leituras/gravações no Redis e recomputo em Vercel).
- **Sugerido:** definir convenção de TTL por tipo de dado (ex.: quotes 5m, proventos 60m) e usar `tags` para invalidar apenas quando houver alteração. Com 4k usuários, evitar `forceRefresh` e aumentar TTL onde dados mudam pouco reduz tráfego.
- **Referência de código:** `DEFAULT_TTL_SECONDS` e construção de chaves/tags no serviço de cache.【F:src/lib/redis.ts†L114-L220】

## 5) Cache em rotas que agregam múltiplas fontes
- **Onde:** `src/app/api/ativo/[ticker]/route.ts`.
- **Por que consome:** a rota consulta três fontes externas em paralelo e só cacheia o resultado final por 3–5 minutos. Sem deduplicação por usuário, várias chamadas simultâneas podem disparar requisições repetidas.
- **Sugerido:** usar `CacheService.withCache` (com chave derivada do ticker) para encapsular o fetch e garantir deduplicação automática via `inflight` map. Ajustar TTL conforme a variabilidade dos dados e considerar tag para invalidação manual.
- **Referência de código:** cache manual com `CacheService.get/set` e TTL curto baseado em qualidade de dados.【F:src/app/api/ativo/[ticker]/route.ts†L6-L44】

### Próximos passos rápidos
1) Migrar caches locais (Brapi) para Redis compartilhado com TTL mais longo.
2) Reescrever rate limits com `INCR` + `EX` no Redis para reduzir payload e chamadas.
3) Enxugar logs informativos em produção; manter métricas estruturadas.
4) Definir uma matriz de TTL + tags por recurso e aplicar nas rotas.
5) Revisar rotas que fazem chamadas paralelas para usar `withCache` e evitar explosão de requisições simultâneas.
