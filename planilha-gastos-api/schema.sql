-- ============================================
-- Banco: Planilha de Gastos
-- Rode este script inteiro no MySQL Workbench
-- (ou via linha de comando: mysql -u root -p < schema.sql)
-- ============================================

CREATE DATABASE IF NOT EXISTS planilha_gastos
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE planilha_gastos;

-- ===== Usuários (login) =====
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== Gastos =====
-- tipo:
--   avulso    -> gasto único, sem repetição
--   fixo      -> se repete todo mês, sem prazo pra acabar (ex: Netflix)
--   parcelado -> se repete por um número definido de meses (ex: 6x)
--
-- parcela_atual / parcela_total só são usados quando tipo = 'parcelado'
-- status vira 'concluido' automaticamente quando parcela_atual atinge parcela_total
CREATE TABLE gastos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  descricao VARCHAR(150) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  data DATE NOT NULL,
  tipo ENUM('avulso', 'fixo', 'parcelado') NOT NULL DEFAULT 'avulso',
  parcela_atual INT DEFAULT NULL,
  parcela_total INT DEFAULT NULL,
  status ENUM('ativo', 'concluido') NOT NULL DEFAULT 'ativo',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
