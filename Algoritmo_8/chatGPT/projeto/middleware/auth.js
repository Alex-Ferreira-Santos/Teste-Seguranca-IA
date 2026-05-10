const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "Token não informado"
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, "SEGREDO_SUPER_SECRETO");

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      error: "Token inválido"
    });
  }
}

module.exports = auth;