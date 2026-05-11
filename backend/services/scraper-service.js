const database = require("../db");

async function runScraper(scrapeFunction) {
  const statistics = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  let products;
  try {
    products = await scrapeFunction();
  } catch (error) {
    statistics.errors.push("Помилка скрейпінгу: " + error.message);
    return statistics;
  }

  if (products.length === 0) {
    statistics.errors.push("Товарів не знайдено, сайт недоступний або змінилась структура");
    return statistics;
  }

  console.log("Зібрано " + products.length + " товарів, збереження в транзакції");

  const storeName = products[0].store;

  await database.transaction(async function (transaction) {
    const existingRows = await transaction("promos")
      .where({ store: storeName })
      .select("title", "new_price", "old_price");

    const existingMap = {};
    for (let i = 0; i < existingRows.length; i++) {
      existingMap[existingRows[i].title] = existingRows[i];
    }

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      try {
        await transaction.raw(
          "INSERT INTO promos (title, store, old_price, new_price, discount_percent, image_url, url, category, starts_at, ends_at) " +
          "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
          "ON CONFLICT(title, store) DO UPDATE SET " +
          "old_price = excluded.old_price, " +
          "new_price = excluded.new_price, " +
          "discount_percent = excluded.discount_percent, " +
          "image_url = excluded.image_url, " +
          "url = excluded.url, " +
          "category = excluded.category, " +
          "starts_at = excluded.starts_at, " +
          "ends_at = excluded.ends_at, " +
          "updated_at = datetime('now')",
          [
            product.title,
            product.store,
            product.old_price,
            product.new_price,
            product.discount_percent,
            product.image_url,
            product.url,
            product.category,
            product.starts_at,
            product.ends_at,
          ]
        );

        const existing = existingMap[product.title];
        if (!existing) {
          statistics.inserted++;
        } else if (existing.new_price !== product.new_price || existing.old_price !== product.old_price) {
          statistics.updated++;
        } else {
          statistics.skipped++;
        }
      } catch (saveError) {
        statistics.errors.push("Не вдалося зберегти \"" + product.title + "\": " + saveError.message);
      }
    }
  });

  console.log("Вставлено " + statistics.inserted + ", оновлено " + statistics.updated + ", пропущено " + statistics.skipped);
  return statistics;
}

module.exports = { runScraper: runScraper };
