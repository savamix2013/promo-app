const express = require("express");
const database = require("../db");
const checkAuthentication = require("../middleware/auth");
const scraperService = require("../services/scraper-service");
const runScraper = scraperService.runScraper;
const atbScraper = require("../scrapers/atb");
const silpoScraper = require("../scrapers/silpo");

const router = express.Router();

router.get("/", async function (req, res) {
  try {
    const store = req.query.store;
    const category = req.query.category;
    const search = req.query.search;

    const query = database("promos").orderBy("discount_percent", "desc");

    if (store) {
      query.where("store", store);
    }

    if (category) {
      query.where("category", category);
    }

    if (search) {
      query.where("title", "like", "%" + search + "%");
    }

    const promotions = await query;
    res.json({ success: true, data: promotions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", checkAuthentication, async function (req, res) {
  try {
    const promotionData = {
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
    const insertedIds = await database("promos").insert(promotionData);
    const newPromotionId = insertedIds[0];
    const promotion = await database("promos").where("id", newPromotionId).first();
    res.status(201).json({ success: true, data: promotion });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/scrape/:store", checkAuthentication, async function (req, res) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Лише для адміністраторів" });
  }

  let scrapeFunction;
  const storeName = req.params.store.toLowerCase();

  if (storeName === "atb") {
    scrapeFunction = atbScraper.scrape;
  } else if (storeName === "silpo") {
    scrapeFunction = silpoScraper.scrape;
  } else {
    return res.status(400).json({ error: "Магазин не підтримується" });
  }

  try {
    const statistics = await runScraper(scrapeFunction);
    let status;
    if (statistics.errors.length > 0) {
      status = 207;
    } else {
      status = 200;
    }
    res.status(status).json({ success: true, data: statistics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/stores", async function (req, res) {
  try {
    const rows = await database("promos").distinct("store");
    const stores = [];
    for (let i = 0; i < rows.length; i++) {
      stores.push(rows[i].store);
    }
    res.json({ success: true, data: stores });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/categories", async function (req, res) {
  try {
    const rows = await database("promos").distinct("category").whereNotNull("category");
    const categories = [];
    for (let i = 0; i < rows.length; i++) {
      categories.push(rows[i].category);
    }
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async function (req, res) {
  try {
    const promotion = await database("promos").where({ id: req.params.id }).first();
    if (!promotion) {
      return res.status(404).json({ error: "Акцію не знайдено" });
    }
    res.json({ success: true, data: promotion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", checkAuthentication, async function (req, res) {
  try {
    const updateData = {
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
    const updatedCount = await database("promos").where({ id: req.params.id }).update(updateData);
    if (updatedCount === 0) {
      return res.status(404).json({ error: "Акцію не знайдено" });
    }
    const promotion = await database("promos").where({ id: req.params.id }).first();
    res.json({ success: true, data: promotion });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", checkAuthentication, async function (req, res) {
  try {
    const deletedCount = await database("promos").where({ id: req.params.id }).del();
    if (deletedCount === 0) {
      return res.status(404).json({ error: "Акцію не знайдено" });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
