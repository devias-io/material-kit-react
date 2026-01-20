# Teste de carga (guia rápido)

Este guia mostra como simular 200 usuários simultâneos (com rampa e sustentação)
usando k6 para validar throughput, latência e consumo de dados das rotas públicas.

## Pré-requisitos

- Node 18+ (para rodar o app localmente, se necessário)
- [k6](https://k6.io/) instalado

## Alvo do teste

Você pode apontar o teste para:

- Ambiente local: `http://localhost:3000`
- Ambiente de staging/produção: `https://seu-dominio`

## Cenário sugerido (200 usuários simultâneos)

Este cenário faz rampa até 200 VUs, mantém por 5 minutos e desce suavemente.
As rotas são agrupadas para simular tráfego típico de painéis públicos de mercado.

### Executar

```bash
k6 run -e BASE_URL=https://seu-dominio scripts/k6/public-market.js
```

## Ajustes rápidos

- Para simular 4000 usuários totais (não simultâneos), aumente a duração do teste.
- Para simular 4000 simultâneos, ajuste `target` nos stages (cuidado com limites do ambiente).

## O que observar

- **Latência p95/p99**: sinais de gargalo de CPU, I/O ou rate limit.
- **Erros 429/5xx**: limite de upstream ou saturação do servidor.
- **Cache hit ratio**: aumenta quando `Cache-Control`/CDN estão funcionando.

## Métricas mínimas esperadas

- p95 < 500ms para endpoints cacheados
- taxa de erro < 1%
- throughput estável durante a sustentação
