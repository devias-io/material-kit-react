# Auditoria de exposição de tokens no cliente

## Mitigações implementadas
- **Tokens carregados apenas no servidor**: os tokens reais agora são resolvidos por variáveis de ambiente em `src/server/integration-secrets.ts` e nunca entram nos bundles client-side.
- **Datasets separados**: `src/data/integrations.ts` expõe apenas metadados públicos (sem tokens) para o front-end, enquanto as rotas de webhook consomem as versões completas geradas no servidor.
- **Interfaces atualizadas**: páginas client-side mostram apenas URLs de webhook com placeholders e não copiam mais tokens para a interface.

## Próximos passos
- Rotacionar os tokens antigos (já que foram expostos previamente) e preenchê-los via variáveis de ambiente documentadas.
- Considerar persistir integrações em banco de dados para reduzir dependência de arquivos estáticos.
