require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 3111;

app.use(express.json());
app.use(express.static("/frontend"));

app.listen(port, () => {
  console.log(`Server started in http://localhost:${port}`);
});
