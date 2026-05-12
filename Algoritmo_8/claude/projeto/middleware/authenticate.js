// middleware/authenticate.js — Verifica e decodifica o JWT
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { userId, role, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

module.exports = authenticate;
