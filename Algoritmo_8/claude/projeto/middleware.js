const jwt = require('jsonwebtoken');
const { hasPermission } = require('./roles');

const SECRET = process.env.JWT_SECRET || 'minha-chave-secreta-troque-em-producao';

// Autentica o token JWT e popula req.user
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token ausente ou inválido' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token expirado ou inválido' });
  }
}

// Verifica se o usuário tem a permissão necessária
function authorize(permission) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        error: 'Acesso proibido',
        required: permission,
        yourRole: req.user.role,
      });
    }
    next();
  };
}

module.exports = { authenticate, authorize, SECRET };
