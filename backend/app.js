require("dotenv").config();
const express = require("express");
const checkAuth = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const promosRoutes = require("./routes/promos");
const knex = require("knex")(require("./knexfile").development);

const app = express();
const port = process.env.PORT || 3111;

app.use(express.json());
app.use(express.static("/frontend"));
app.use("/auth", authRoutes);
app.use("/promos", promosRoutes);

app.get("/users", checkAuth, async (req, res) => {
  try {
    const users = await knex("users");
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server started in http://localhost:${port}`);
});
