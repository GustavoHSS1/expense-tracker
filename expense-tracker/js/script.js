// ===== Endereço da API (rodando localmente via Node) =====
const API_URL = 'http://localhost:3000';

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

// categoria "curinga" pra nunca quebrar se vier algo inesperado do banco
const CATEGORIA_PADRAO = { label: 'Outro', cor: '#6b7280' };

// ===== Estado =====
let gastos = [];
let token = localStorage.getItem('token');
let editandoId = null; // null = criando um gasto novo; caso contrário, é o id do gasto em edição

// ===== Elementos: telas =====
const telaAuth = document.getElementById('telaAuth');
const app = document.getElementById('app');

// ===== Elementos: login/registro =====
const formLogin = document.getElementById('formLogin');
const formRegistro = document.getElementById('formRegistro');
const loginErro = document.getElementById('loginErro');
const registroErro = document.getElementById('registroErro');
const linkRegistro = document.getElementById('linkRegistro');
const linkLogin = document.getElementById('linkLogin');
const linkParaRegistro = document.getElementById('linkParaRegistro');
const linkParaLogin = document.getElementById('linkParaLogin');
const btnLogout = document.getElementById('btnLogout');

// ===== Elementos: app =====
const overlay = document.getElementById('overlay');
const formGasto = document.getElementById('formGasto');
const formErro = document.getElementById('formErro');
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
const campoTipo = document.getElementById('campoTipo');
const tipoSelect = document.getElementById('tipo');
const campoParcelas = document.getElementById('campoParcelas');
const parcelaTotalInput = document.getElementById('parcelaTotal');

const statTotal = document.getElementById('statTotal');
const statQtd = document.getElementById('statQtd');
const statMaiorCategoria = document.getElementById('statMaiorCategoria');
const statMedia = document.getElementById('statMedia');

let grafico = null;

// =========================================
// CHAMADAS À API
// =========================================

// Wrapper do fetch: já manda o token de login e trata erro de sessão expirada
async function apiFetch(caminho, opcoes = {}) {
  const resposta = await fetch(`${API_URL}${caminho}`, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opcoes.headers,
    },
  });

  if (resposta.status === 401 || resposta.status === 403) {
    fazerLogout();
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(dados.erro || 'Algo deu errado. Tente novamente.');
  }

  return dados;
}

// =========================================
// LOGIN / REGISTRO / LOGOUT
// =========================================

function mostrarApp() {
  telaAuth.classList.add('auth-form--oculto');
  app.classList.remove('auth-form--oculto');
  carregarGastos();
}

function mostrarAuth() {
  app.classList.add('auth-form--oculto');
  telaAuth.classList.remove('auth-form--oculto');
}

function fazerLogout() {
  token = null;
  localStorage.removeItem('token');
  mostrarAuth();
}

btnLogout.addEventListener('click', fazerLogout);

// alterna entre os formulários de login e criar conta
linkRegistro.addEventListener('click', (e) => {
  e.preventDefault();
  formLogin.classList.add('auth-form--oculto');
  linkParaRegistro.classList.add('auth-form--oculto');
  formRegistro.classList.remove('auth-form--oculto');
  linkParaLogin.classList.remove('auth-form--oculto');
});

linkLogin.addEventListener('click', (e) => {
  e.preventDefault();
  formRegistro.classList.add('auth-form--oculto');
  linkParaLogin.classList.add('auth-form--oculto');
  formLogin.classList.remove('auth-form--oculto');
  linkParaRegistro.classList.remove('auth-form--oculto');
});

// ===== Login =====
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginErro.textContent = '';

  const email = document.getElementById('loginEmail').value.trim();
  const senha = document.getElementById('loginSenha').value;

  try {
    const dados = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    });

    token = dados.token;
    localStorage.setItem('token', token);
    formLogin.reset();
    mostrarApp();
  } catch (erro) {
    loginErro.textContent = erro.message;
  }
});

// ===== Criar conta (já faz login em seguida) =====
formRegistro.addEventListener('submit', async (e) => {
  e.preventDefault();
  registroErro.textContent = '';

  const nome = document.getElementById('registroNome').value.trim();
  const email = document.getElementById('registroEmail').value.trim();
  const senha = document.getElementById('registroSenha').value;

  try {
    await apiFetch('/auth/registro', {
      method: 'POST',
      body: JSON.stringify({ nome, email, senha }),
    });

    // login automático depois de criar a conta
    const dadosLogin = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    });

    token = dadosLogin.token;
    localStorage.setItem('token', token);
    formRegistro.reset();
    mostrarApp();
  } catch (erro) {
    registroErro.textContent = erro.message;
  }
});

// =========================================
// MODAL DE GASTO (abrir/fechar)
// =========================================

// mostra o campo "em quantas vezes?" só quando o tipo é parcelado
tipoSelect.addEventListener('change', () => {
  campoParcelas.classList.toggle('oculto', tipoSelect.value !== 'parcelado');
});

btnAdicionar.addEventListener('click', () => {
  editandoId = null;
  modalTitulo.textContent = 'Novo gasto';
  btnSubmeter.textContent = 'Adicionar';
  formErro.textContent = '';
  formGasto.reset();
  document.getElementById('data').value = new Date().toISOString().slice(0, 10);

  campoTipo.classList.remove('oculto');
  tipoSelect.disabled = false;
  tipoSelect.value = 'avulso';
  campoParcelas.classList.add('oculto');

  overlay.classList.add('aberto');
});

function abrirEdicao(id) {
  const gasto = gastos.find((g) => g.id === id);
  if (!gasto) return;

  editandoId = id;
  modalTitulo.textContent = 'Editar gasto';
  btnSubmeter.textContent = 'Salvar';
  formErro.textContent = '';

  document.getElementById('descricao').value = gasto.descricao;
  document.getElementById('valor').value = gasto.valor;
  document.getElementById('categoria').value = gasto.categoria;
  document.getElementById('data').value = gasto.data.slice(0, 10);

  // tipo (avulso/fixo/parcelado) e número de parcelas não são editáveis depois de criado
  campoTipo.classList.add('oculto');
  campoParcelas.classList.add('oculto');

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

// =========================================
// CRIAR / EDITAR / EXCLUIR GASTO (via API)
// =========================================

formGasto.addEventListener('submit', async (e) => {
  e.preventDefault();
  formErro.textContent = '';

  const descricao = document.getElementById('descricao').value.trim();
  const valor = parseFloat(document.getElementById('valor').value);
  const categoria = document.getElementById('categoria').value;
  const data = document.getElementById('data').value;

  if (!descricao || !valor || valor <= 0 || !data) return;

  const corpo = { descricao, valor, categoria, data };

  // tipo/parcelas só se aplicam na criação (não dá pra editar depois)
  if (editandoId === null) {
    corpo.tipo = tipoSelect.value;

    if (corpo.tipo === 'parcelado') {
      const parcelaTotal = parseInt(parcelaTotalInput.value, 10);
      if (!parcelaTotal || parcelaTotal < 2) {
        formErro.textContent = 'Informe em quantas vezes (mínimo 2)';
        return;
      }
      corpo.parcela_total = parcelaTotal;
    }
  }

  try {
    if (editandoId !== null) {
      await apiFetch(`/gastos/${editandoId}`, {
        method: 'PUT',
        body: JSON.stringify(corpo),
      });
    } else {
      await apiFetch('/gastos', {
        method: 'POST',
        body: JSON.stringify(corpo),
      });
    }

    await carregarGastos();
    fecharModal();
  } catch (erro) {
    formErro.textContent = erro.message;
  }
});

async function excluirGasto(id) {
  try {
    await apiFetch(`/gastos/${id}`, { method: 'DELETE' });
    await carregarGastos();
  } catch (erro) {
    alert(erro.message);
  }
}

// marca a parcela do mês como paga (gastos parcelados)
async function pagarParcela(id) {
  try {
    await apiFetch(`/gastos/${id}/pagar`, { method: 'POST' });
    await carregarGastos();
  } catch (erro) {
    alert(erro.message);
  }
}

// ===== Buscar gastos do usuário logado na API =====
async function carregarGastos() {
  try {
    gastos = await apiFetch('/gastos');
    renderizarTudo();
  } catch (erro) {
    console.error(erro);
  }
}

// =========================================
// TEMA CLARO/ESCURO
// =========================================

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

  if (grafico) grafico.update();
});

// =========================================
// PLUGIN DO GRÁFICO: texto no centro da rosca
// =========================================
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

// =========================================
// FORMATAÇÃO
// =========================================

function formatarMoeda(valor) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function categoriaDe(chave) {
  return CATEGORIAS[chave] || CATEGORIA_PADRAO;
}

// =========================================
// RENDERIZAÇÃO
// =========================================

function renderizarLista() {
  listaGastos.innerHTML = '';

  if (gastos.length === 0) {
    listaVazia.style.display = 'block';
    return;
  }
  listaVazia.style.display = 'none';

  gastos.forEach((gasto) => {
    const cat = categoriaDe(gasto.categoria);
    const li = document.createElement('li');
    li.className = 'item-gasto';

    // badge extra: "Fixo", "3/6" (em andamento) ou "Concluído" (parcelamento fechado)
    let badge = '';
    if (gasto.tipo === 'fixo') {
      badge = '<span class="item-gasto__badge">Fixo</span>';
    } else if (gasto.tipo === 'parcelado') {
      if (gasto.status === 'concluido') {
        badge = '<span class="item-gasto__badge item-gasto__badge--concluido">Concluído</span>';
      } else {
        badge = `<span class="item-gasto__badge">${gasto.parcela_atual}/${gasto.parcela_total}</span>`;
      }
    }

    // botão "paguei esse mês" só aparece em parcelado ainda ativo
    const botaoPagar = (gasto.tipo === 'parcelado' && gasto.status === 'ativo')
      ? `<button class="item-gasto__pagar" data-id="${gasto.id}">Paguei esse mês</button>`
      : '';

    li.innerHTML = `
      <span class="item-gasto__ponto" style="background:${cat.cor}"></span>
      <div class="item-gasto__info">
        <span class="item-gasto__descricao">${gasto.descricao}</span>
        <span class="item-gasto__categoria">${cat.label} ${badge}</span>
      </div>
      ${botaoPagar}
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

  document.querySelectorAll('.item-gasto__pagar').forEach((btn) => {
    btn.addEventListener('click', () => pagarParcela(Number(btn.dataset.id)));
  });
}

function calcularTotaisPorCategoria() {
  const totais = {};
  gastos.forEach((g) => {
    totais[g.categoria] = (totais[g.categoria] || 0) + Number(g.valor);
  });
  return totais;
}

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

  const labels = categoriasComGasto.map((c) => categoriaDe(c).label);
  const cores = categoriasComGasto.map((c) => categoriaDe(c).cor);
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

function renderizarLegenda() {
  const totais = calcularTotaisPorCategoria();
  legenda.innerHTML = '';

  Object.keys(totais).forEach((c) => {
    const cat = categoriaDe(c);
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="legenda__cor" style="background:${cat.cor}"></span>
      ${cat.label}
      <span class="legenda__valor">${formatarMoeda(totais[c])}</span>
    `;
    legenda.appendChild(li);
  });
}

function renderizarStats() {
  const totais = calcularTotaisPorCategoria();
  const total = gastos.reduce((soma, g) => soma + Number(g.valor), 0);

  statTotal.textContent = formatarMoeda(total);
  statQtd.textContent = gastos.length;
  statMedia.textContent = gastos.length ? formatarMoeda(total / gastos.length) : formatarMoeda(0);

  const categorias = Object.keys(totais);
  if (categorias.length === 0) {
    statMaiorCategoria.textContent = '—';
    return;
  }

  const maior = categorias.reduce((a, b) => (totais[a] > totais[b] ? a : b));
  statMaiorCategoria.textContent = categoriaDe(maior).label;
  statMaiorCategoria.title = `${categoriaDe(maior).label}: ${formatarMoeda(totais[maior])}`;
}

function renderizarTudo() {
  renderizarLista();
  renderizarGrafico();
  renderizarLegenda();
  renderizarStats();
}

// =========================================
// INICIALIZAÇÃO
// =========================================

if (token) {
  mostrarApp();
} else {
  mostrarAuth();
}