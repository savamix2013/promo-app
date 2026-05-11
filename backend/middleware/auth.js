const jsonWebToken = require("jsonwebtoken");

function checkAuthentication(request, response, nextFunction) {
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader) {
    return response.status(401).json({ error: "Немає токена" });
  }

  const tokenParts = authorizationHeader.split(" ");
  const token = tokenParts[1];

  if (!token) {
    return response.status(401).json({ error: "Токен порожній" });
  }

  try {
    const decodedToken = jsonWebToken.verify(token, process.env.JWT_SECRET);
    request.user = decodedToken;
    nextFunction();
  } catch (error) {
    return response.status(401).json({ error: "Токен недійсний" });
  }
}

module.exports = checkAuthentication;
