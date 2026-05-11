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

app.get("/health", function (request, response) {
  response.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.get("/users", checkAuthentication, async function (request, response) {
  try {
    const users = await database("users").select("id", "name", "email", "role");
    response.json({ success: true, data: users });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Внутрішня помилка сервера" });
  }
});

app.delete("/users/:id", checkAuthentication, async function (request, response) {
  try {
    if (request.user.role !== "admin") {
      return response.status(403).json({ error: "Лише для адміністраторів" });
    }

    if (Number(request.params.id) === request.user.id) {
      return response.status(400).json({ error: "Не можна видалити себе" });
    }

    const deletedCount = await database("users").where({ id: request.params.id }).del();
    if (deletedCount === 0) {
      return response.status(404).json({ error: "Користувача не знайдено" });
    }
    response.json({ success: true });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Внутрішня помилка сервера" });
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
