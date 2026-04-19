const express = require("express");
const knex = require("knex")(require("../knexfile").development);
const checkAuth = require("../middleware/auth");
const { runScrape } = require("../services/scraper-service");
const atbScraper = require("../scrapers/atb");

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

router.post("/scrape/:store", checkAuth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Лише для адміністраторів" });
  }
  let scrapeFn;
  const store = req.params.store.toLowerCase();
  if (store === "atb") {
    scrapeFn = atbScraper.scrape;
  } else {
    return res.status(400).json({ error: "Магазин не підтримується" });
  }
  try {
    const stats = await runScraper(scrapeFn);
    const status = stats.errors.length > 0 ? 207 : 200;
    res.status(status).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
