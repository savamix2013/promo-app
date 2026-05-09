function validateRegistration(request, response, nextFunction) {
  const name = request.body.name;
  const email = request.body.email;
  const password = request.body.password;

  if (!name || name.trim().length === 0) {
    return response.status(400).json({ error: "Ім'я обов'язкове" });
  }

  if (!email || email.indexOf("@") === -1 || email.indexOf(".") === -1) {
    return response.status(400).json({ error: "Невірний формат пошти" });
  }

  if (!password || password.length < 6) {
    return response.status(400).json({ error: "Пароль мінімум 6 символів" });
  }

  nextFunction();
}

function validateLogin(request, response, nextFunction) {
  const email = request.body.email;
  const password = request.body.password;

  if (!email || email.trim().length === 0) {
    return response.status(400).json({ error: "Пошта обов'язкова" });
  }

  if (!password || password.trim().length === 0) {
    return response.status(400).json({ error: "Пароль обов'язковий" });
  }

  nextFunction();
}

function validatePasswordChange(request, response, nextFunction) {
  const oldPassword = request.body.old_password;
  const newPassword = request.body.new_password;

  if (!oldPassword || oldPassword.trim().length === 0) {
    return response.status(400).json({ error: "Старий пароль обов'язковий" });
  }

  if (!newPassword || newPassword.length < 6) {
    return response.status(400).json({ error: "Новий пароль мінімум 6 символів" });
  }

  nextFunction();
}

module.exports = {
  validateRegistration: validateRegistration,
  validateLogin: validateLogin,
  validatePasswordChange: validatePasswordChange,
};
