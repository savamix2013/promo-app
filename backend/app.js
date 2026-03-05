const express = require('express');
const app = express();
const port = process.env.PORT || 3111;;

app.get("/", (req, res) => {
  res.send("Promo is running");
});

app.listen(port, () => {
  console.log(`Port ${port}`);
});
