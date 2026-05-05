const database = require("../db");

async function runScraper(scrapeFunction) {
  const statistics = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors:[]
  };

  let products;
  try {
    products = await scrapeFunction();
  } catch (err) {
    statistics.errors.push("Помилка: " + err.message);
    return statistics;
  }

  if (products.length === 0) {
    statistics.errors.push("Товарів не знайдено - сайт недоступний або змінилась структура");
    return statistics;
  }

  console.log("Зібрано " + products.length + " товарів, зберігаємо");

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    try {
      await upsertProduct(product, statistics);
    } catch (err) {
      statistics.errors.push("Не вдалося зберегти \"" + product.title + "\": " + err.message);
    }
  }

  console.log("Вставлено " + statistics.inserted + ", оновлено " + statistics.updated + ", пропущено " + statistics.skipped);
  return statistics;
}

async function upsertProduct(product, statistics) {
  const existingProduct = await database("promos")
    .where({ title: product.title, store: product.store })
    .first();

  if (!existingProduct) {
    await database("promos").insert(product);
    statistics.inserted++;
    return;
  }

  let priceChanged;
  if (existingProduct.new_price !== product.new_price) {
    priceChanged = true;
  } else if (existingProduct.old_price !== product.old_price) {
    priceChanged = true;
  } else {
    priceChanged = false;
  }

  if (priceChanged) {
    const updateData = {
      title: product.title,
      store: product.store,
      old_price: product.old_price,
      new_price: product.new_price,
      discount_percent: product.discount_percent,
      image_url: product.image_url,
      url: product.url,
      category: product.category,
      starts_at: product.starts_at,
      ends_at: product.ends_at,
      updated_at: database.fn.now()
    };
    await database("promos")
      .where({ id: existingProduct.id })
      .update(updateData);
    statistics.updated++;
  } else {
    statistics.skipped++;
  }
}

module.exports = { runScraper: runScraper };
