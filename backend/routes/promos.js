const express = require("express");
const knex = require("../db");
const checkAuth = require("../middleware/auth");
const { runScraper } = require("../services/scraper-service");
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
    const data = {
      title: req.body.title,
      store: req.body.store,
      old_price: req.body.old_price,
      new_price: req.body.new_price,
      discount_percent: req.body.discount_percent,
      image_url: req.body.image_url,
      url: req.body.url,
      category: req.body.category,
      starts_at: req.body.starts_at,
      ends_at: req.body.ends_at,
    };
    const ids = await knex("promos").insert(data);
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

router.get("/:id", async (req, res) => {
  try {
    const promo = await knex("promos").where({ id: req.params.id }).first();
    if (!promo) {
      return res.status(404).json({ error: "Акцію не знайдено" });
    }
    res.json({ success: true, data: promo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", checkAuth, async (req, res) => {
  try {
    const data = {
      title: req.body.title,
      store: req.body.store,
      old_price: req.body.old_price,
      new_price: req.body.new_price,
      discount_percent: req.body.discount_percent,
      image_url: req.body.image_url,
      url: req.body.url,
      category: req.body.category,
      starts_at: req.body.starts_at,
      ends_at: req.body.ends_at,
    };
    const count = await knex("promos").where({ id: req.params.id }).update(data);
    if (count === 0) {
      return res.status(404).json({ error: "Акцію не знайдено" });
    }
    const promo = await knex("promos").where({ id: req.params.id }).first();
    res.json({ success: true, data: promo });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/:id", checkAuth, async (req, res) => {
  try {
    const count = await knex("promos").where({ id: req.params.id }).del();
    if (count === 0) {
      return res.status(404).json({ error: "Акцію не знайдено" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
