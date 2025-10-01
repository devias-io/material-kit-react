# Fatos da Bolsa Hub

Fatos da Bolsa Hub é um painel administrativo desenvolvido para equipes que acompanham dados de mercado, materiais educacionais e relatórios internos sobre a bolsa de valores. O projeto combina Next.js, React e Material UI para oferecer uma base robusta que pode ser facilmente estendida com integrações proprietárias, automações e fluxos de trabalho colaborativos.

## Recursos principais

- **Dashboard personalizável:** visualize KPIs, gráficos e status de campanhas em tempo real.
- **Gestão de membros e clientes:** organize contatos, preferências e permissões com formulários validados.
- **Fluxos de autenticação completos:** telas de login, cadastro, redefinição de senha e convites com layout consistente.
- **Componentes reutilizáveis:** bibliotecas de cartões, tabelas, gráficos e formulários para acelerar novas páginas.
- **Integração com serviços externos:** estrutura preparada para conectar APIs de dados financeiros, automação de e-mail e armazenamento em nuvem.

## Tecnologias

- [Next.js](https://nextjs.org) 14
- [React](https://react.dev)
- [Material UI](https://mui.com)
- [Prisma](https://www.prisma.io)
- [TypeScript](https://www.typescriptlang.org)

## Primeiros passos

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente necessárias na raiz do projeto (`.env.local`).

3. Execute as migrações e gere o cliente Prisma:

   ```bash
   npx prisma migrate deploy
   npm run postinstall
   ```

4. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

5. Acesse [`http://localhost:3000`](http://localhost:3000) para visualizar a aplicação.

## Scripts disponíveis

- `npm run dev` – inicia o ambiente de desenvolvimento com hot reload.
- `npm run build` – gera a versão otimizada para produção após executar `prisma generate`.
- `npm run start` – executa o build gerado.
- `npm run lint` – valida o código com as regras ESLint configuradas para o projeto.
- `npm run typecheck` – garante que não há erros de tipagem TypeScript.
- `npm run format:write` – aplica a formatação consistente definida pelo Prettier.

## Estrutura do projeto

```
┌── prisma
├── public
├── src
│   ├── components
│   ├── layouts
│   ├── lib
│   ├── pages e views protegidas
│   └── styles e temas
├── package.json
└── README.md
```

## Suporte

Este repositório é mantido pela equipe Fatos da Bolsa. Para dúvidas, sugestões ou suporte personalizado, entre em contato pelo e-mail [contato@fatosdabolsa.com.br](mailto:contato@fatosdabolsa.com.br).

## Licença

Distribuído sob a licença MIT. Veja `LICENSE.md` para mais detalhes.
