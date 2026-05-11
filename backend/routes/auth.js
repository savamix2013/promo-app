const express = require("express");
const bcrypt = require("bcrypt");
const jsonWebToken = require("jsonwebtoken");
const checkAuthentication = require("../middleware/auth");
const validateRegistration = require("../middleware/validate").validateRegistration;
const validateLogin = require("../middleware/validate").validateLogin;
const validatePasswordChange = require("../middleware/validate").validatePasswordChange;
const database = require("../db");

const router = express.Router();

router.post("/register", validateRegistration, async function (request, response) {
  try {
    const name = request.body.name;
    const email = request.body.email;
    const password = request.body.password;

    const existingUser = await database("users").where({ email: email }).first();
    if (existingUser) {
      return response.status(400).json({ error: "Така пошта вже є" });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const insertedIds = await database("users").insert({
      name: name,
      email: email,
      password_hash: hash,
      role: "user",
    });

    const newUserId = insertedIds[0];
    const newUser = await database("users").where({ id: newUserId }).first();

    response.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Внутрішня помилка сервера" });
  }
});

router.post("/login", validateLogin, async function (request, response) {
  try {
    const email = request.body.email;
    const password = request.body.password;

    const user = await database("users").where({ email: email }).first();
    if (!user) {
      return response.status(400).json({ error: "Користувача не знайдено" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return response.status(400).json({ error: "Неправильний пароль" });
    }

    const token = jsonWebToken.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    response.json({ success: true, token: token });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Внутрішня помилка сервера" });
  }
});

router.get("/me", checkAuthentication, async function (request, response) {
  try {
    const user = await database("users").where({ id: request.user.id }).first();

    if (!user) {
      return response.status(404).json({ error: "Користувача не знайдено" });
    }

    response.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Внутрішня помилка сервера" });
  }
});

router.put("/profile", checkAuthentication, async function (request, response) {
  try {
    const name = request.body.name;
    const email = request.body.email;

    if (email) {
      if (email.indexOf("@") === -1 || email.indexOf(".") === -1) {
        return response.status(400).json({ error: "Невірний формат пошти" });
      }

      const existingUser = await database("users")
        .where({ email: email })
        .whereNot({ id: request.user.id })
        .first();
      if (existingUser) {
        return response.status(400).json({ error: "Така пошта вже зайнята" });
      }
    }

    const updateData = {};
    if (name) {
      updateData.name = name;
    }
    if (email) {
      updateData.email = email;
    }

    await database("users").where({ id: request.user.id }).update(updateData);
    const user = await database("users").where({ id: request.user.id }).first();

    response.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Внутрішня помилка сервера" });
  }
});

router.put("/password", checkAuthentication, validatePasswordChange, async function (request, response) {
  try {
    const oldPassword = request.body.old_password;
    const newPassword = request.body.new_password;

    const user = await database("users").where({ id: request.user.id }).first();
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isPasswordValid) {
      return response.status(400).json({ error: "Старий пароль невірний" });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await database("users").where({ id: request.user.id }).update({ password_hash: hash });
    response.json({ success: true });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Внутрішня помилка сервера" });
  }
});

router.delete("/account", checkAuthentication, async function (request, response) {
  try {
    await database("users").where({ id: request.user.id }).del();
    response.json({ success: true });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Внутрішня помилка сервера" });
  }
});

module.exports = router;
