function authorize(permission) {
  return (req, res, next) => {
    const permissions = req.user.permissions;

    if (!permissions.includes(permission)) {
      return res.status(403).json({
        error: "Acesso negado"
      });
    }

    next();
  };
}

module.exports = authorize;