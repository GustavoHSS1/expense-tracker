// ===== Categorias: rótulo e cor de cada motivo =====
const CATEGORIAS = {
  carro: { label: 'Carro', cor: '#3b82f6' },
  feira: { label: 'Feira', cor: '#22c55e' },
  saude: { label: 'Saúde', cor: '#06b6d4' },
  desnecessario: { label: 'Gasto desnecessário', cor: '#ef4444' },
  outro: { label: 'Outro', cor: '#7c3aed' },
};

// ===== Estado (persiste no localStorage do navegador) =====
let gastos = JSON.parse(localStorage.getItem('gastos') || '[]');

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

const statTotal = document.getElementById('statTotal');
const statQtd = document.getElementById('statQtd');
const statMaiorCategoria = document.getElementById('statMaiorCategoria');
const statMedia = document.getElementById('statMedia');

let grafico = null;

// ===== Plugin do Chart.js: escreve o total no centro da rosca =====
const centerTextPlugin = {
  id: 'centerText',
  afterDraw(chart) {
    const { ctx, chartArea: { left, right, top, bottom } } = chart;
    const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
    const x = (left + right) / 2;
    const y = (top + bottom) / 2;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = '700 1.1rem Segoe UI, sans-serif';
    ctx.fillStyle = '#16161d';
    ctx.fillText(formatarMoeda(total), x, y - 8);

    ctx.font = '600 0.7rem Segoe UI, sans-serif';
    ctx.fillStyle = '#85859a';
    ctx.fillText('Total', x, y + 14);

    ctx.restore();
  },
};

// ===== Abrir/fechar modal =====
btnAdicionar.addEventListener('click', () => {
  overlay.classList.add('aberto');
});

btnCancelar.addEventListener('click', fecharModal);

overlay.addEventListener('click', (e) => {
  if (e.target === overlay) fecharModal();
});

function fecharModal() {
  overlay.classList.remove('aberto');
  formGasto.reset();
}

// ===== Adicionar novo gasto =====
formGasto.addEventListener('submit', (e) => {
  e.preventDefault();

  const descricao = document.getElementById('descricao').value.trim();
  const valor = parseFloat(document.getElementById('valor').value);
  const categoria = document.getElementById('categoria').value;

  if (!descricao || !valor || valor <= 0) return;

  gastos.push({
    id: Date.now(),
    descricao,
    valor,
    categoria,
  });

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
      <button class="item-gasto__excluir" title="Excluir" data-id="${gasto.id}">✕</button>
    `;

    listaGastos.appendChild(li);
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