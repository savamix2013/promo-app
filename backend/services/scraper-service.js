const knex = require("../db");

async function runScraper(scrapeFn) {
  const stats = { inserted: 0, updated: 0, skipped: 0, errors: [] };

  let products;
  try {
    products = await scrapeFn();
  } catch (err) {
    stats.errors.push("Помилка: " + err.message);
    return stats;
  }

  if (products.length === 0) {
    stats.errors.push("Товарів не знайдено - сайт недоступний або змінилась структура");
    return stats;
  }

  console.log("Зібрано " + products.length + " товарів, зберігаємо");

  for (const product of products) {
    try {
      await upsertProduct(product, stats);
    } catch (err) {
      stats.errors.push('Не вдалося зберегти "' + product.title + '": ' + err.message);
    }
  }

  console.log("Вставлено " + stats.inserted + ", оновлено " + stats.updated + ", пропущено " + stats.skipped);
  return stats;
}

async function upsertProduct(product, stats) {
  const existing = await knex("promos")
    .where({ title: product.title, store: product.store })
    .first();

  if (!existing) {
    await knex("promos").insert(product);
    stats.inserted++;
    return;
  }

  const priceChanged = existing.new_price !== product.new_price || existing.old_price !== product.old_price;

  if (priceChanged) {
    await knex("promos")
      .where({ id: existing.id })
      .update({ ...product, updated_at: knex.fn.now() });
    stats.updated++;
  } else {
    stats.skipped++;
  }
}

module.exports = { runScraper };
