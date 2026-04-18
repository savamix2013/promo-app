require("dotenv").config();
const express = require("express");
const path = require("path");
const sequelize = require("./config/database");
const User = require("./models/user");
const checkAuth = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const promosRoutes = require("./routes/promos");

const app = express();
const port = process.env.PORT || 3111;

app.use(express.json());
app.use(express.static("/frontend"));
app.use("/auth", authRoutes);
app.use("/promos", promosRoutes);

async function initDatabase() {
  try {
    await sequelize.authenticate();
    console.log("Database connected");
    // await sequelize.sync();
    console.log("Database synchronized");
  } catch (error) {
    console.error("Database error:", error.message);
    process.exit(1);
  }
}

app.get("/users", checkAuth, async (req, res) => {
  try {
    const users = await User.findAll();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/users", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

initDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server started in http://localhost:${port}`);
  });
});
