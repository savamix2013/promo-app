const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const checkAuth = require("../middleware/auth");
const knex = require("../db");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    const oldUser = await knex("users").where({ email }).first();
    if (oldUser) {
      return res.status(400).json({ error: "Така пошта вже є" });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const ids = await knex("users").insert({
      name,
      email,
      password_hash: hash,
      role: "user",
    });

    const newUser = await knex("users").where({ id: ids[0] }).first();
    res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const user = await knex("users").where({ email }).first();
    if (!user) {
      return res.status(400).json({ error: "Користувача не знайдено" });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: "Неправильний пароль" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.json({ success: true, token: token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/me", checkAuth, async (req, res) => {
  try {
    const user = await knex("users").where({ id: req.user.id }).first();

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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/profile", checkAuth, async (req, res) => {
  try {
    const name = req.body.name;
    const email = req.body.email;

    if (email) {
      const existing = await knex("users")
        .where({ email })
        .whereNot({ id: req.user.id })
        .first();
      if (existing) {
        return res.status(400).json({ error: "Така пошта вже зайнята" });
      }
    }

    const data = {};
    if (name) data.name = name;
    if (email) data.email = email;

    await knex("users").where({ id: req.user.id }).update(data);
    const user = await knex("users").where({ id: req.user.id }).first();

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/password", checkAuth, async (req, res) => {
  try {
    const oldPassword = req.body.old_password;
    const newPassword = req.body.new_password;

    const user = await knex("users").where({ id: req.user.id }).first();
    const isValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: "Старий пароль невірний" });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await knex("users").where({ id: req.user.id }).update({ password_hash: hash });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/account", checkAuth, async (req, res) => {
  try {
    await knex("users").where({ id: req.user.id }).del();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
