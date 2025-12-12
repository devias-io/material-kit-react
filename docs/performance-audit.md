# Auditoria de Performance e Custos

## 🔴 Crítico
- **/api/generate-pdf** abre uma instância completa do Chromium via `puppeteer.launch` a cada requisição sem qualquer autenticação, limitação de taxa ou TTL de cache. Isso consome memória/CPU rapidamente, escala pessimamente sob volume e permite uso abusivo para geração arbitrária de PDFs gravados no S3. Sugere-se proteger com auth/rate limiting, mover o trabalho para fila/background ou serviço dedicado, e reutilizar navegador via pool ou API de renderização (ex.: Playwright service) com timeouts agressivos.【F:src/app/api/generate-pdf/route.ts†L7-L36】
- **/api/instagram-cadastro** faz fallback para buscar qualquer usuário admin quando não há autenticação, o que permite que requisições anônimas façam upsert em `instagram_cadastros` usando um ID de administrador. Além do risco de segurança, a consulta `findFirst` em toda a tabela de usuários é executada em cada chamada sem cache ou rate limiting. Exigir autenticação obrigatória, remover fallback e aplicar limite de requisições são ações imediatas.【F:src/app/api/instagram-cadastro/route.ts†L7-L189】

## 🟠 Alto
- **/api/proventos GET/DELETE** retornam e manipulam todo o dataset sem paginação ou filtros (`findMany` simples) e sem seleção de campos, o que degrada latência, aumenta transferência e risco de timeouts conforme o volume cresce. Implementar paginação/streaming, selects enxutos e cache para leituras; para deleção em massa, mover para job assíncrono em vez de laço síncrono com `deleteMany` + sleeps.【F:src/app/api/proventos/route.ts†L5-L195】
- **/api/proventos POST** processa uploads sequenciais lote a lote com `setTimeout` e, na fase de estatísticas, roda `aggregate` e `upsert` para cada ticker de forma serial. Isso gera N consultas síncronas e bloqueia o route handler; para muitos tickers, a duração pode exceder limites do Vercel. Paralelize com `Promise.allSettled` em lotes controlados, mova o recálculo para worker/cron e armazene progresso/estado em Redis para retentativas.【F:src/app/api/proventos/route.ts†L22-L263】

## 🟡 Médio
- **/api/relatorios GET** não aplica paginação e carrega `reportFiles` (com `take: 1`) para todos os relatórios de uma vez, mesmo quando filtrados por ticker. Em crescimento, isso pressiona memória e I/O e não usa nenhum cache/etag. Adotar paginação + cache (Redis/Next revalidate) e limitar campos retornados reduz custo e latência.【F:src/app/api/relatorios/route.ts†L6-L71】
- **Notificações (POST)** cria notificações para todos os destinatários em uma única transação `prisma.$transaction([...])` sem chunking, validação de limites ou rate limiting. Um broadcast grande pode estourar tempo/consumo de conexão no banco. Quebrar em lotes (ex.: 500 IDs), usar fila/background worker e aplicar limites evita picos de custo.【F:src/app/api/notifications/route.ts†L88-L146】

## 🟢 Observações adicionais
- Muitos handlers não definem headers `Cache-Control` nem TTLs (exceto notificações), perdendo oportunidade de cache em Redis/Edge e aumentando custo de banco.
- Várias operações críticas não validam payloads com schema (ex.: Zod/Yup) e não aplicam rate limiting (ex.: middleware) — risco de abuso e requisições caras.
