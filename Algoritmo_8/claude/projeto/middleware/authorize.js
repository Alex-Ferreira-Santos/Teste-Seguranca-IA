// middleware/authorize.js — Verifica se o usuário tem a permissão necessária
const { hasPermission } = require('../roles');

function authorize(permission) {
  return (req, res, next) => {
    const { user } = req;

    if (!user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!hasPermission(user.role, permission)) {
      return res.status(403).json({
        error: 'Acesso proibido',
        detail: `O papel "${user.role}" não tem a permissão "${permission}"`,
      });
    }

    next();
  };
}

module.exports = authorize;
