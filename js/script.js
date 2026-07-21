// ===== Categorias: rótulo e cor de cada motivo =====
const CATEGORIAS = {
  transporte: { label: 'Transporte', cor: '#3b82f6' },
  alimentacao: { label: 'Alimentação', cor: '#f97316' },
  moradia: { label: 'Moradia', cor: '#8b5cf6' },
  assinatura: { label: 'Assinatura', cor: '#ec4899' },
  lazer: { label: 'Lazer', cor: '#eab308' },
  viagem: { label: 'Viagem', cor: '#06b6d4' },
  emergencia: { label: 'Emergência', cor: '#dc2626' },
  investimento: { label: 'Investimento', cor: '#10b981' },
  feira: { label: 'Feira', cor: '#84cc16' },
  saude: { label: 'Saúde', cor: '#14b8a6' },
  desnecessario: { label: 'Gasto desnecessário', cor: '#be123c' },
  outro: { label: 'Outro', cor: '#6b7280' },
};

// ===== Estado (persiste no localStorage do navegador) =====
// O filter descarta gastos salvos com uma categoria que não existe mais
// em CATEGORIAS (ex: teste antigo, categoria renomeada/removida).
let gastos = JSON.parse(localStorage.getItem('gastos') || '[]')
  .filter((g) => CATEGORIAS[g.categoria]);
localStorage.setItem('gastos', JSON.stringify(gastos)); // já regrava sem as entradas inválidas

// ===== Elementos =====
const overlay = document.getElementById('overlay');
const formGasto = document.getElementById('formGasto');
const btnAdicionar = document.getElementById('btnAdicionar');
const btnCancelar = document.getElementById('btnCancelar');
const listaGastos = document.getElementById('listaGastos');
const listaVazia = document.getElementById('listaVazia');
const legenda = document.getElementById('legenda');
const graficoVazio = document.getElementById('graficoVazio');
const ctx = document.getElementById('graficoGastos');
const modalTitulo = document.getElementById('modalTitulo');
const btnSubmeter = document.getElementById('btnSubmeter');
const temaToggle = document.getElementById('temaToggle');

const statTotal = document.getElementById('statTotal');
const statQtd = document.getElementById('statQtd');
const statMaiorCategoria = document.getElementById('statMaiorCategoria');
const statMedia = document.getElementById('statMedia');

let grafico = null;
let editandoId = null; // null = criando um gasto novo; caso contrário, é o id do gasto em edição

// ===== Plugin do Chart.js: escreve o total no centro da rosca =====
// Lê as cores do tema atual (claro ou escuro) direto das variáveis CSS,
// pra não ficar com texto escuro travado num fundo escuro (ou vice-versa).
const centerTextPlugin = {
  id: 'centerText',
  afterDraw(chart) {
    const { ctx, chartArea: { left, right, top, bottom } } = chart;
    const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
    const x = (left + right) / 2;
    const y = (top + bottom) / 2;

    const estilos = getComputedStyle(document.documentElement);
    const corTexto = estilos.getPropertyValue('--ink').trim() || '#16161d';
    const corLabel = estilos.getPropertyValue('--muted').trim() || '#85859a';

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = '700 1.1rem Segoe UI, sans-serif';
    ctx.fillStyle = corTexto;
    ctx.fillText(formatarMoeda(total), x, y - 8);

    ctx.font = '600 0.7rem Segoe UI, sans-serif';
    ctx.fillStyle = corLabel;
    ctx.fillText('Total', x, y + 14);

    ctx.restore();
  },
};

// ===== Abrir modal para criar um gasto novo =====
btnAdicionar.addEventListener('click', () => {
  editandoId = null;
  modalTitulo.textContent = 'Novo gasto';
  btnSubmeter.textContent = 'Adicionar';
  formGasto.reset();
  overlay.classList.add('aberto');
});

// ===== Abrir modal para editar um gasto existente =====
function abrirEdicao(id) {
  const gasto = gastos.find((g) => g.id === id);
  if (!gasto) return;

  editandoId = id;
  modalTitulo.textContent = 'Editar gasto';
  btnSubmeter.textContent = 'Salvar';

  document.getElementById('descricao').value = gasto.descricao;
  document.getElementById('valor').value = gasto.valor;
  document.getElementById('categoria').value = gasto.categoria;

  overlay.classList.add('aberto');
}

btnCancelar.addEventListener('click', fecharModal);

overlay.addEventListener('click', (e) => {
  if (e.target === overlay) fecharModal();
});

function fecharModal() {
  overlay.classList.remove('aberto');
  formGasto.reset();
  editandoId = null;
}

// ===== Tema claro/escuro =====
const temaSalvo = localStorage.getItem('tema');
if (temaSalvo === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
  temaToggle.textContent = '☀️';
}

temaToggle.addEventListener('click', () => {
  const escuroAtivo = document.documentElement.getAttribute('data-theme') === 'dark';

  if (escuroAtivo) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('tema', 'light');
    temaToggle.textContent = '🌙';
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('tema', 'dark');
    temaToggle.textContent = '☀️';
  }

  // redesenha o gráfico pra pegar as cores do texto central no novo tema
  if (grafico) grafico.update();
});

// ===== Adicionar ou salvar edição de um gasto =====
formGasto.addEventListener('submit', (e) => {
  e.preventDefault();

  const descricao = document.getElementById('descricao').value.trim();
  const valor = parseFloat(document.getElementById('valor').value);
  const categoria = document.getElementById('categoria').value;

  if (!descricao || !valor || valor <= 0) return;

  if (editandoId !== null) {
    // edição: acha o gasto pelo id e atualiza os campos
    const gasto = gastos.find((g) => g.id === editandoId);
    if (gasto) {
      gasto.descricao = descricao;
      gasto.valor = valor;
      gasto.categoria = categoria;
    }
  } else {
    // criação de um gasto novo
    gastos.push({
      id: Date.now(),
      descricao,
      valor,
      categoria,
    });
  }

  salvar();
  renderizarTudo();
  fecharModal();
});

// ===== Excluir gasto =====
function excluirGasto(id) {
  gastos = gastos.filter((g) => g.id !== id);
  salvar();
  renderizarTudo();
}

// ===== Persistência =====
function salvar() {
  localStorage.setItem('gastos', JSON.stringify(gastos));
}

// ===== Formatação de moeda =====
function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ===== Renderização da lista =====
function renderizarLista() {
  listaGastos.innerHTML = '';

  if (gastos.length === 0) {
    listaVazia.style.display = 'block';
    return;
  }
  listaVazia.style.display = 'none';

  gastos.forEach((gasto) => {
    const cat = CATEGORIAS[gasto.categoria];
    const li = document.createElement('li');
    li.className = 'item-gasto';

    li.innerHTML = `
      <span class="item-gasto__ponto" style="background:${cat.cor}"></span>
      <div class="item-gasto__info">
        <span class="item-gasto__descricao">${gasto.descricao}</span>
        <span class="item-gasto__categoria">${cat.label}</span>
      </div>
      <span class="item-gasto__valor">${formatarMoeda(gasto.valor)}</span>
      <div class="item-gasto__acoes">
        <button class="item-gasto__editar" title="Editar" data-id="${gasto.id}">✎</button>
        <button class="item-gasto__excluir" title="Excluir" data-id="${gasto.id}">✕</button>
      </div>
    `;

    listaGastos.appendChild(li);
  });

  document.querySelectorAll('.item-gasto__editar').forEach((btn) => {
    btn.addEventListener('click', () => abrirEdicao(Number(btn.dataset.id)));
  });

  document.querySelectorAll('.item-gasto__excluir').forEach((btn) => {
    btn.addEventListener('click', () => excluirGasto(Number(btn.dataset.id)));
  });
}

// ===== Cálculo dos totais por categoria =====
function calcularTotaisPorCategoria() {
  const totais = {};
  gastos.forEach((g) => {
    totais[g.categoria] = (totais[g.categoria] || 0) + g.valor;
  });
  return totais;
}

// ===== Renderização do gráfico (Chart.js) =====
function renderizarGrafico() {
  const totais = calcularTotaisPorCategoria();
  const categoriasComGasto = Object.keys(totais);

  if (categoriasComGasto.length === 0) {
    graficoVazio.style.display = 'flex';
    if (grafico) {
      grafico.destroy();
      grafico = null;
    }
    return;
  }
  graficoVazio.style.display = 'none';

  const labels = categoriasComGasto.map((c) => CATEGORIAS[c].label);
  const cores = categoriasComGasto.map((c) => CATEGORIAS[c].cor);
  const valores = categoriasComGasto.map((c) => totais[c]);

  if (grafico) {
    grafico.data.labels = labels;
    grafico.data.datasets[0].data = valores;
    grafico.data.datasets[0].backgroundColor = cores;
    grafico.update();
    return;
  }

  grafico = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: valores,
        backgroundColor: cores,
        borderWidth: 3,
        borderColor: '#ffffff',
      }],
    },
    options: {
      responsive: true,
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (item) => `${item.label}: ${formatarMoeda(item.raw)}`,
          },
        },
      },
    },
    plugins: [centerTextPlugin],
  });
}

// ===== Renderização da legenda =====
function renderizarLegenda() {
  const totais = calcularTotaisPorCategoria();
  legenda.innerHTML = '';

  Object.keys(totais).forEach((c) => {
    const cat = CATEGORIAS[c];
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="legenda__cor" style="background:${cat.cor}"></span>
      ${cat.label}
      <span class="legenda__valor">${formatarMoeda(totais[c])}</span>
    `;
    legenda.appendChild(li);
  });
}

// ===== Renderização dos cards de estatística =====
function renderizarStats() {
  const totais = calcularTotaisPorCategoria();
  const total = gastos.reduce((soma, g) => soma + g.valor, 0);

  statTotal.textContent = formatarMoeda(total);
  statQtd.textContent = gastos.length;
  statMedia.textContent = gastos.length ? formatarMoeda(total / gastos.length) : formatarMoeda(0);

  const categorias = Object.keys(totais);
  if (categorias.length === 0) {
    statMaiorCategoria.textContent = '—';
    return;
  }

  const maior = categorias.reduce((a, b) => (totais[a] > totais[b] ? a : b));
  statMaiorCategoria.textContent = CATEGORIAS[maior].label;
  statMaiorCategoria.title = `${CATEGORIAS[maior].label}: ${formatarMoeda(totais[maior])}`;
}

// ===== Renderiza tudo de uma vez =====
function renderizarTudo() {
  renderizarLista();
  renderizarGrafico();
  renderizarLegenda();
  renderizarStats();
}

// ===== Inicialização =====
renderizarTudo();