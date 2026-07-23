const jwt = require('jsonwebtoken');

// Protege as rotas: exige um token válido no header
// Authorization: Bearer <token>
function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
    if (err) {
      return res.status(403).json({ erro: 'Token inválido ou expirado' });
    }
    req.usuario = usuario; // fica disponível nas rotas seguintes
    next();
  });
}

module.exports = verificarToken;
