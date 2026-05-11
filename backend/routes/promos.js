const express = require("express");
const database = require("../db");
const checkAuthentication = require("../middleware/auth");
const scraperService = require("../services/scraper-service");
const runScraper = scraperService.runScraper;
const atbScraper = require("../scrapers/atb");
const silpoScraper = require("../scrapers/silpo");

const router = express.Router();

router.get("/", async function (request, response) {
  try {
    const store = request.query.store;
    const category = request.query.category;
    const search = request.query.search;

    let currentPage = parseInt(request.query.page, 10);
    if (isNaN(currentPage) || currentPage < 1) {
      currentPage = 1;
    }

    let itemsPerPage = parseInt(request.query.limit, 10);
    if (isNaN(itemsPerPage) || itemsPerPage < 1) {
      itemsPerPage = 50;
    }

    const countQuery = database("promos");
    if (store) {
      countQuery.where("store", store);
    }
    if (category) {
      countQuery.where("category", category);
    }
    if (search) {
      countQuery.where("title", "like", "%" + search + "%");
    }
    const countResult = await countQuery.count("* as count");

    let totalItems = parseInt(countResult[0].count, 10);
    if (isNaN(totalItems)) {
      totalItems = 0;
    }

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const dataQuery = database("promos").orderBy("discount_percent", "desc");
    if (store) {
      dataQuery.where("store", store);
    }
    if (category) {
      dataQuery.where("category", category);
    }
    if (search) {
      dataQuery.where("title", "like", "%" + search + "%");
    }

    const offsetValue = (currentPage - 1) * itemsPerPage;
    dataQuery.limit(itemsPerPage).offset(offsetValue);

    const promotions = await dataQuery;

    response.json({
      success: true,
      data: promotions,
      pagination: {
        total_items: totalItems,
        total_pages: totalPages,
        current_page: currentPage,
        items_per_page: itemsPerPage,
      },
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Внутрішня помилка сервера" });
  }
});

router.post("/", checkAuthentication, async function (request, response) {
  try {
    const promotionData = {
      title: request.body.title,
      store: request.body.store,
      old_price: request.body.old_price,
      new_price: request.body.new_price,
      discount_percent: request.body.discount_percent,
      image_url: request.body.image_url,
      url: request.body.url,
      category: request.body.category,
      starts_at: request.body.starts_at,
      ends_at: request.body.ends_at,
    };
    const insertedIds = await database("promos").insert(promotionData);
    const newPromotionId = insertedIds[0];
    const promotion = await database("promos").where("id", newPromotionId).first();
    response.status(201).json({ success: true, data: promotion });
  } catch (error) {
    console.error(error);
    response.status(400).json({ error: "Не вдалося створити акцію" });
  }
});

router.post("/scrape/:store", checkAuthentication, async function (request, response) {
  if (request.user.role !== "admin") {
    return response.status(403).json({ error: "Лише для адміністраторів" });
  }

  let scrapeFunction;
  const storeName = request.params.store.toLowerCase();

  if (storeName === "atb") {
    scrapeFunction = atbScraper.scrape;
  } else if (storeName === "silpo") {
    scrapeFunction = silpoScraper.scrape;
  } else {
    return response.status(400).json({ error: "Магазин не підтримується" });
  }

  try {
    const statistics = await runScraper(scrapeFunction);
    let status;
    if (statistics.errors.length > 0) {
      status = 207;
    } else {
      status = 200;
    }
    response.status(status).json({ success: true, data: statistics });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Внутрішня помилка сервера" });
  }
});

router.get("/stores", async function (request, response) {
  try {
    const rows = await database("promos").distinct("store");
    const stores = [];
    for (let i = 0; i < rows.length; i++) {
      stores.push(rows[i].store);
    }
    response.json({ success: true, data: stores });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Внутрішня помилка сервера" });
  }
});

router.get("/categories", async function (request, response) {
  try {
    const rows = await database("promos").distinct("category").whereNotNull("category");
    const categories = [];
    for (let i = 0; i < rows.length; i++) {
      categories.push(rows[i].category);
    }
    response.json({ success: true, data: categories });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Внутрішня помилка сервера" });
  }
});

router.get("/:id", async function (request, response) {
  try {
    const promotion = await database("promos").where({ id: request.params.id }).first();
    if (!promotion) {
      return response.status(404).json({ error: "Акцію не знайдено" });
    }
    response.json({ success: true, data: promotion });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Внутрішня помилка сервера" });
  }
});

router.put("/:id", checkAuthentication, async function (request, response) {
  try {
    const updateData = {
      title: request.body.title,
      store: request.body.store,
      old_price: request.body.old_price,
      new_price: request.body.new_price,
      discount_percent: request.body.discount_percent,
      image_url: request.body.image_url,
      url: request.body.url,
      category: request.body.category,
      starts_at: request.body.starts_at,
      ends_at: request.body.ends_at,
    };
    const updatedCount = await database("promos").where({ id: request.params.id }).update(updateData);
    if (updatedCount === 0) {
      return response.status(404).json({ error: "Акцію не знайдено" });
    }
    const promotion = await database("promos").where({ id: request.params.id }).first();
    response.json({ success: true, data: promotion });
  } catch (error) {
    console.error(error);
    response.status(400).json({ error: "Не вдалося оновити акцію" });
  }
});

router.delete("/:id", checkAuthentication, async function (request, response) {
  try {
    const deletedCount = await database("promos").where({ id: request.params.id }).del();
    if (deletedCount === 0) {
      return response.status(404).json({ error: "Акцію не знайдено" });
    }
    response.json({ success: true });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Внутрішня помилка сервера" });
  }
});

module.exports = router;
