require("dotenv").config();
const express = require("express");
const checkAuth = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const promosRoutes = require("./routes/promos");
const knex = require("./db");

const app = express();
const port = process.env.PORT || 3111;
const path = require("path")

app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend/dist")));
app.use("/auth", authRoutes);
app.use("/promos", promosRoutes);

app.get("/users", checkAuth, async (req, res) => {
  try {
    const users = await knex("users").select("id", "name", "email", "role");
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/users/:id", checkAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Лише для адміністраторів" });
    }

    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ error: "Не можна видалити себе" });
    }

    const count = await knex("users").where({ id: req.params.id }).del();
    if (count === 0) {
      return res.status(404).json({ error: "Користувача не знайдено" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server started in http://localhost:${port}`);
});
