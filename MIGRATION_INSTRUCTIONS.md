# Instruções para Aplicar Migration - Sistema de Migração de Planos

## ⚠️ IMPORTANTE: Migration Pendente

A implementação da funcionalidade de migração de planos está completa, mas a migration do Prisma precisa ser aplicada manualmente no banco de dados.

## 🔧 Como Aplicar a Migration

Execute o seguinte comando na raiz do projeto:

```bash
npx prisma migrate dev --name add_payment_fields_and_plan_migrations
```

## 📋 O que será criado no banco de dados:

### 1. **Novos campos na tabela `Purchase`:**
   - `paymentMethod` (String, nullable) - Forma de pagamento normalizada
   - `installments` (Int, default: 1) - Número de parcelas
   - `platform` (String, nullable) - Plataforma de origem (HOTMART, KIWIFY, EDUZZ)

### 2. **Nova tabela `plan_migrations`:**
   - `id` - ID único
   - `userId` - ID do usuário que migrou
   - `planOriginal` - Plano original (LITE)
   - `planNovo` - Novo plano (VIP)
   - `valorOriginal` - Valor do plano original
   - `valorNovo` - Valor do novo plano
   - `mesesRestantes` - Meses restantes do plano original
   - `valorDesconto` - Desconto aplicado
   - `valorFinal` - Valor final da migração
   - `status` - Status da migração (PENDING, COMPLETED, CANCELLED)
   - `observacoes` - Observações adicionais
   - `processadoPor` - ID do admin que processou
   - `dataCriacao` - Data de criação do registro
   - `dataProcessamento` - Data de processamento da migração
   - `createdAt` - Timestamp de criação
   - `updatedAt` - Timestamp de atualização

## 🚀 Após Aplicar a Migration

Execute o seguinte comando para gerar o cliente Prisma atualizado:

```bash
npx prisma generate
```

## 📍 Como Acessar a Página

Após aplicar as migrations, acesse:
- **URL:** `/dashboard/admin/migracao-plano`
- **Requisito:** Permissão de administrador

## 🧪 Como Testar

1. Acesse a página de migração de planos
2. Digite o e-mail de um cliente que está no plano LITE
3. Clique em "Buscar Cliente"
4. Verifique os dados apresentados:
   - Informações do cliente
   - Dados da compra original (com forma de pagamento e parcelas)
   - Cálculo automático da migração
   - Observações importantes
5. Clique em "Processar Migração" para efetivar

## 📦 Arquivos Criados/Modificados

### Novos Arquivos:
1. `/src/lib/payment-normalization.ts` - Funções de normalização de pagamento
2. `/src/app/api/admin/migracao-plano/calcular/route.ts` - API de cálculo
3. `/src/app/api/admin/migracao-plano/processar/route.ts` - API de processamento
4. `/src/app/dashboard/admin/migracao-plano/page.tsx` - Página de interface

### Arquivos Modificados:
1. `/prisma/schema.prisma` - Novos campos e modelo
2. `/src/app/api/webhooks/hotmart/[id]/route.ts` - Captura de dados de pagamento
3. `/src/app/api/webhooks/kiwify/[token]/route.ts` - Captura de dados de pagamento
4. `/src/app/api/webhooks/eduzz/[token]/route.ts` - Captura de dados de pagamento

## 💡 Funcionalidades Implementadas

### ✅ Captura de Dados de Pagamento
- Forma de pagamento (cartão, PIX, boleto, etc.)
- Número de parcelas
- Plataforma de origem

### ✅ Cálculo Automático de Migração
- Meses já utilizados do plano LITE
- Meses restantes até expiração
- Diferença mensal entre planos
- Desconto proporcional
- Valor final da migração

### ✅ Interface Completa
- Busca de cliente por e-mail
- Exibição detalhada dos dados
- Validações completas
- Processamento seguro com transações

### ✅ Histórico de Migrações
- Registro de todas as migrações realizadas
- Rastreabilidade completa
- Status e observações

## 🔐 Segurança

- ✅ Verificação de autenticação
- ✅ Verificação de permissões de admin
- ✅ Validações de dados
- ✅ Transações atômicas no banco

## 📞 Suporte

Se encontrar algum problema, verifique:
1. As migrations foram aplicadas corretamente?
2. O Prisma client foi gerado?
3. O usuário tem permissão de admin?
4. O cliente está realmente no plano LITE?

---

**Implementação concluída!** 🎉
