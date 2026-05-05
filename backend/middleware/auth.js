const jsonWebToken = require("jsonwebtoken");

function checkAuthentication(req, res, nextFunction) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return res.status(401).json({ error: "Немає токена" });
  }

  const tokenParts = authorizationHeader.split(" ");
  const token = tokenParts[1];

  if (!token) {
    return res.status(401).json({ error: "Токен порожній" });
  }

  try {
    const decodedToken = jsonWebToken.verify(token, process.env.JWT_SECRET);
    req.user = decodedToken;
    nextFunction();
  } catch (err) {
    return res.status(401).json({ error: "Токен недійсний" });
  }
}

module.exports = checkAuthentication;
