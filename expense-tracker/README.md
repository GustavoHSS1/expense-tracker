# Planilha de Gastos — API

Backend em Node.js + Express + MySQL para a Planilha de Gastos, com login e
suporte a gastos avulsos, fixos e parcelados.

## Pré-requisitos

- [Node.js](https://nodejs.org) instalado
- MySQL instalado e rodando (veja o passo a passo que o Claude te passou no chat)

## Como configurar

1. Instale as dependências:
   ```
   npm install
   ```

2. Rode o script `schema.sql` no MySQL Workbench (ou via terminal) pra criar
   o banco e as tabelas.

3. Copie o arquivo de exemplo de variáveis de ambiente:
   ```
   cp .env.example .env
   ```
   Depois abra o `.env` e preencha `DB_PASSWORD` com a senha do seu MySQL, e
   troque o `JWT_SECRET` por qualquer texto longo e aleatório.

4. Rode o servidor:
   ```
   npm run dev
   ```
   Se aparecer `Servidor rodando em http://localhost:3000`, deu tudo certo.

## Rotas disponíveis

### Autenticação
- `POST /auth/registro` — `{ nome, email, senha }`
- `POST /auth/login` — `{ email, senha }` → retorna um `token`

### Gastos (precisam do token no header `Authorization: Bearer <token>`)
- `GET /gastos` — lista os gastos do usuário logado
- `POST /gastos` — cria um gasto — `{ descricao, valor, categoria, data, tipo, parcela_total }`
  - `tipo`: `"avulso"`, `"fixo"` ou `"parcelado"`
  - `parcela_total` só é necessário se `tipo` for `"parcelado"`
- `PUT /gastos/:id` — edita um gasto
- `DELETE /gastos/:id` — exclui um gasto
- `POST /gastos/:id/pagar` — marca a parcela do mês como paga (só funciona em gastos parcelados; fecha sozinho quando chega na última parcela)

## Estrutura

```
planilha-gastos-api/
├── config/db.js       # conexão com o MySQL
├── middleware/auth.js  # verificação do token de login
├── routes/auth.js      # registro e login
├── routes/gastos.js    # CRUD de gastos + sistema de parcelas
├── schema.sql          # script de criação do banco
├── server.js           # ponto de entrada da API
└── .env.example         # modelo das variáveis de ambiente
```