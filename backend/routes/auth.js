const express = require("express");
const bcrypt = require("bcrypt");
const jsonWebToken = require("jsonwebtoken");
const checkAuthentication = require("../middleware/auth");
const database = require("../db");

const router = express.Router();

router.post("/register", async function (req, res) {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    const existingUser = await database("users").where({ email: email }).first();
    if (existingUser) {
      return res.status(400).json({ error: "Така пошта вже є" });
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

    res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async function (req, res) {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const user = await database("users").where({ email: email }).first();
    if (!user) {
      return res.status(400).json({ error: "Користувача не знайдено" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Неправильний пароль" });
    }

    const token = jsonWebToken.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ success: true, token: token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/me", checkAuthentication, async function (req, res) {
  try {
    const user = await database("users").where({ id: req.user.id }).first();

    if (!user) {
      return res.status(404).json({ error: "Користувача не знайдено" });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/profile", checkAuthentication, async function (req, res) {
  try {
    const name = req.body.name;
    const email = req.body.email;

    if (email) {
      const existingUser = await database("users")
        .where({ email: email })
        .whereNot({ id: req.user.id })
        .first();
      if (existingUser) {
        return res.status(400).json({ error: "Така пошта вже зайнята" });
      }
    }

    const updateData = {};
    if (name) {
      updateData.name = name;
    }
    if (email) {
      updateData.email = email;
    }

    await database("users").where({ id: req.user.id }).update(updateData);
    const user = await database("users").where({ id: req.user.id }).first();

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/password", checkAuthentication, async function (req, res) {
  try {
    const oldPassword = req.body.old_password;
    const newPassword = req.body.new_password;

    const user = await database("users").where({ id: req.user.id }).first();
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Старий пароль невірний" });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await database("users").where({ id: req.user.id }).update({ password_hash: hash });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/account", checkAuthentication, async function (req, res) {
  try {
    await database("users").where({ id: req.user.id }).del();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
