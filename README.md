# Planilha de Gastos

Aplicação web de controle de gastos pessoais, com login, categorias
personalizadas, gráfico de despesas e modo noturno. Feita com front-end em
HTML/CSS/JS puro e uma API própria em Node.js + MySQL.

## Funcionalidades

- Login e criação de conta (senha criptografada, sessão via JWT)
- Adicionar, editar e excluir gastos
- Categorias: Transporte, Alimentação, Moradia, Assinatura, Lazer, Viagem,
  Emergência, Investimento, Feira, Saúde, Gasto desnecessário e Outro
- Gráfico de rosca com o total gasto por categoria
- Cards de resumo: total gasto, quantidade de gastos, maior categoria e
  média por gasto
- Modo noturno (com preferência salva no navegador)
- Layout responsivo (desktop e mobile)
- Dados salvos em banco de dados MySQL de verdade, não em `localStorage`

## Tecnologias

**Front-end**
- HTML5, CSS3, JavaScript
- [Chart.js](https://www.chartjs.org/) para o gráfico

**Back-end**
- Node.js + Express
- MySQL
- JWT (autenticação) e bcrypt (criptografia de senha)

## Estrutura do repositório

```
expense-tracker/
├── expense-tracker/          → front-end (o que roda no navegador)
│   ├── index.html
│   ├── css/style.css
│   ├── js/script.js
│   └── assets/
│
└── planilha-gastos-api/      → back-end (API em Node.js)
    ├── config/db.js
    ├── middleware/auth.js
    ├── routes/auth.js
    ├── routes/gastos.js
    ├── schema.sql
    ├── server.js
    └── .env.example
```

## Como rodar o projeto

### 1. Banco de dados

- Tenha o MySQL instalado e rodando
- Rode o script `planilha-gastos-api/schema.sql` (pelo MySQL Workbench ou
  linha de comando) — ele cria o banco `planilha_gastos` e as tabelas

### 2. Back-end (API)

```
cd planilha-gastos-api
npm install
```

Copie o `.env.example` para `.env` e preencha com a senha do seu MySQL e um
segredo para o JWT. Depois:

```
npm run dev
```

A API sobe em `http://localhost:3000`.

### 3. Front-end

Com a API rodando, é só abrir `expense-tracker/index.html` no navegador
(recomendado usar a extensão **Live Server** do VS Code). Crie uma conta e
comece a registrar seus gastos.

## Rotas da API

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/registro` | Cria uma conta |
| POST | `/auth/login` | Login, retorna um token |
| GET | `/gastos` | Lista os gastos do usuário logado |
| POST | `/gastos` | Cria um gasto |
| PUT | `/gastos/:id` | Edita um gasto |
| DELETE | `/gastos/:id` | Exclui um gasto |
| POST | `/gastos/:id/pagar` | Marca a parcela do mês como paga (gastos parcelados) |

Todas as rotas de `/gastos` exigem o token no header
`Authorization: Bearer <token>`.

## Próximos passos

- Interface para gastos parcelados (ex: conta em 6x) e fixos recorrentes
- Filtro de gastos por mês
- Metas de gasto por categoria

## Autor

Gustavo Henrique — [GitHub](https://github.com/GustavoHSS1) ·
[LinkedIn](https://www.linkedin.com/in/gustavo-henrique-566435390/)