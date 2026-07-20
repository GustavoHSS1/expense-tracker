# Planilha de Gastos

App simples de controle de gastos pessoais, feito em HTML, CSS e JavaScript puro (com Chart.js para o gráfico).

## Funcionalidades

- Botão para adicionar um novo gasto (descrição, valor e motivo)
- Lista de gastos adicionados, com opção de excluir
- Gráfico de pizza (rosca) mostrando a proporção de gastos por categoria
- Total geral calculado automaticamente
- Dados salvos no navegador (localStorage) — continuam lá mesmo se você fechar a página

## Categorias disponíveis

- Carro
- Feira
- Saúde
- Gasto desnecessário
- Outro

## Como usar

1. Abra o `index.html` no navegador
2. Clique em **"+ Adicionar gasto"**
3. Preencha descrição, valor e motivo
4. Clique em **Adicionar** — o gasto aparece na lista e no gráfico na hora

## Tecnologias

- HTML5
- CSS3
- JavaScript
- [Chart.js](https://www.chartjs.org/) (via CDN, para o gráfico)

## Estrutura

```
expense-tracker/
├── index.html
├── css/style.css
├── js/script.js
├── assets/
└── README.md
```