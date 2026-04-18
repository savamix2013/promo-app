const express = require("express");
const knex = require("knex")(require("../knexfile").development);
const checkAuth = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const store = req.query.store;
    const query = knex("promos").orderBy("discount_percent", "desc");

    if (store) {
      query.where("store", store);
    }

    const promos = await query;
    res.json({ success: true, data: promos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", checkAuth, async (req, res) => {
  try {
    const ids = await knex("promos").insert(req.body);
    const promo = await knex("promos").where("id", ids[0]).first();
    res.status(201).json({ success: true, data: promo });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
