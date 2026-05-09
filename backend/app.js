require("dotenv").config();
const express = require("express");
const checkAuthentication = require("./middleware/auth");
const authenticationRoutes = require("./routes/auth");
const promotionsRoutes = require("./routes/promos");
const database = require("./db");
const path = require("path");

const app = express();
let port = process.env.PORT;
if (port === null || port === undefined) {
  port = 3111;
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend/dist")));
app.use("/auth", authenticationRoutes);
app.use("/promos", promotionsRoutes);

app.get("/health", function (req, res) {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.get("/users", checkAuthentication, async function (req, res) {
  try {
    const users = await database("users").select("id", "name", "email", "role");
    res.json({ success: true, data: users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Внутрішня помилка сервера" });
  }
});

app.delete("/users/:id", checkAuthentication, async function (req, res) {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Лише для адміністраторів" });
    }

    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ error: "Не можна видалити себе" });
    }

    const deletedCount = await database("users").where({ id: req.params.id }).del();
    if (deletedCount === 0) {
      return res.status(404).json({ error: "Користувача не знайдено" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Внутрішня помилка сервера" });
  }
});

const server = app.listen(port, function () {
  console.log("Сервер запущено на http://localhost:" + port);
});

let isShuttingDown = false;

function handleShutdown(signal) {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  console.log(signal + " отримано, завершення роботи");
  server.close(function () {
    process.exit(0);
  });
  setTimeout(function () {
    console.error("Таймаут - примусове завершення");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", function () {
  handleShutdown("SIGTERM");
});

process.on("SIGINT", function () {
  handleShutdown("SIGINT");
});
