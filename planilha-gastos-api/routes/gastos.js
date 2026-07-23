const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verificarToken = require('../middleware/auth');

// Todas as rotas de gastos exigem login
router.use(verificarToken);

// ===== Listar todos os gastos do usuário logado =====
router.get('/', async (req, res) => {
  try {
    const [gastos] = await pool.query(
      'SELECT * FROM gastos WHERE usuario_id = ? ORDER BY data DESC',
      [req.usuario.id]
    );
    res.json(gastos);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar gastos' });
  }
});

// ===== Criar um gasto novo =====
// tipo: 'avulso' | 'fixo' | 'parcelado'
// se for parcelado, precisa vir "parcela_total" (ex: 6)
router.post('/', async (req, res) => {
  try {
    const { descricao, valor, categoria, data, tipo, parcela_total } = req.body;

    if (!descricao || !valor || !categoria || !data) {
      return res.status(400).json({ erro: 'Preencha descrição, valor, categoria e data' });
    }

    const tipoFinal = tipo || 'avulso';
    const parcelaAtual = tipoFinal === 'parcelado' ? 1 : null;
    const parcelaTotal = tipoFinal === 'parcelado' ? parcela_total : null;

    if (tipoFinal === 'parcelado' && (!parcelaTotal || parcelaTotal < 2)) {
      return res.status(400).json({ erro: 'Informe em quantas parcelas (mínimo 2)' });
    }

    const [resultado] = await pool.query(
      `INSERT INTO gastos (usuario_id, descricao, valor, categoria, data, tipo, parcela_atual, parcela_total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.usuario.id, descricao, valor, categoria, data, tipoFinal, parcelaAtual, parcelaTotal]
    );

    res.status(201).json({ id: resultado.insertId });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao criar gasto' });
  }
});

// ===== Editar um gasto =====
router.put('/:id', async (req, res) => {
  try {
    const { descricao, valor, categoria, data } = req.body;

    const [resultado] = await pool.query(
      `UPDATE gastos SET descricao = ?, valor = ?, categoria = ?, data = ?
       WHERE id = ? AND usuario_id = ?`,
      [descricao, valor, categoria, data, req.params.id, req.usuario.id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ erro: 'Gasto não encontrado' });
    }

    res.json({ ok: true });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao editar gasto' });
  }
});

// ===== Excluir um gasto =====
router.delete('/:id', async (req, res) => {
  try {
    const [resultado] = await pool.query(
      'DELETE FROM gastos WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.usuario.id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ erro: 'Gasto não encontrado' });
    }

    res.json({ ok: true });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao excluir gasto' });
  }
});

// ===== Marcar a parcela do mês como paga =====
// Chamado quando o usuário aperta "Paguei esse mês" num gasto parcelado.
// Avança parcela_atual e, se bater com parcela_total, fecha o gasto sozinho.
router.post('/:id/pagar', async (req, res) => {
  try {
    const [linhas] = await pool.query(
      'SELECT * FROM gastos WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.usuario.id]
    );

    if (linhas.length === 0) {
      return res.status(404).json({ erro: 'Gasto não encontrado' });
    }

    const gasto = linhas[0];

    if (gasto.tipo !== 'parcelado') {
      return res.status(400).json({ erro: 'Esse gasto não é parcelado' });
    }

    if (gasto.status === 'concluido') {
      return res.status(400).json({ erro: 'Esse parcelamento já foi concluído' });
    }

    const novaParcela = gasto.parcela_atual + 1;
    const novoStatus = novaParcela >= gasto.parcela_total ? 'concluido' : 'ativo';

    await pool.query(
      'UPDATE gastos SET parcela_atual = ?, status = ? WHERE id = ?',
      [novaParcela, novoStatus, gasto.id]
    );

    res.json({ parcela_atual: novaParcela, parcela_total: gasto.parcela_total, status: novoStatus });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao marcar parcela como paga' });
  }
});

module.exports = router;
