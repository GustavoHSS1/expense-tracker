const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const pool = require('../config/db');

// ===== Criar conta =====
router.post('/registro', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Preencha nome, email e senha' });
    }

    const [existente] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existente.length > 0) {
      return res.status(409).json({ erro: 'Esse e-mail já está cadastrado' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const [resultado] = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)',
      [nome, email, senhaHash]
    );

    res.status(201).json({ id: resultado.insertId, nome, email });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao criar conta' });
  }
});

// ===== Login =====
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    const [linhas] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (linhas.length === 0) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos' });
    }

    const usuario = linhas[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos' });
    }

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
});

module.exports = router;
