const baseScraper = require("./base");
const withBrowser = baseScraper.withBrowser;
const withRetry = baseScraper.withRetry;

const ATB_BASE_URL = "https://www.atbmarket.com";
const PROMOTION_URL = ATB_BASE_URL + "/promo/all";

const DELAY_MILLISECONDS = 2000;

async function scrapePromotionList(page) {
  await page.goto(PROMOTION_URL, { waitUntil: "networkidle2", timeout: 30000 });
  await page.waitForSelector(".actions-list__item", { timeout: 15000 });

  const promotions = await page.$$eval(".actions-list__item", function (items) {
    const resultList = [];
    for (let i = 0; i < items.length; i++) {
      const element = items[i];
      const linkElement = element.querySelector("a.actions-list__img");
      const titleElement = element.querySelector(".actions-list__title");

      let titleText;
      if (titleElement) {
        titleText = titleElement.textContent.trim();
      } else {
        titleText = "Без назви";
      }

      let pathText;
      if (linkElement) {
        pathText = linkElement.getAttribute("href");
      } else {
        pathText = null;
      }

      resultList.push({
        title: titleText,
        path: pathText,
      });
    }
    return resultList;
  });

  const filteredPromotions = [];
  for (let i = 0; i < promotions.length; i++) {
    if (promotions[i].path) {
      filteredPromotions.push(promotions[i]);
    }
  }
  return filteredPromotions;
}

async function waitForCloudflare(page) {
  const title = await page.title();
  if (title.indexOf("moment") === -1) {
    if (title.indexOf("Cloudflare") === -1) {
      return true;
    }
  }

  console.warn("Cloudflare заблокував доступ, очікування");

  for (let i = 0; i < 15; i++) {
    await new Promise(function (resolve) {
      setTimeout(resolve, 1000);
    });
    const newTitle = await page.title();
    if (newTitle.indexOf("moment") === -1) {
      if (newTitle.indexOf("Cloudflare") === -1) {
        return true;
      }
    }
  }

  return false;
}

async function scrapePromotionProducts(page, promotionPath, promotionTitle) {
  const fullUrl = ATB_BASE_URL + promotionPath;

  await page.goto(fullUrl, { waitUntil: "networkidle2", timeout: 45000 });

  const passedCloudflare = await waitForCloudflare(page);
  if (!passedCloudflare) {
    console.warn("Cloudflare не пустив: " + fullUrl);
    return [];
  }

  let hasProducts;
  try {
    await page.waitForSelector("article.catalog-item", { timeout: 10000 });
    hasProducts = true;
  } catch (err) {
    hasProducts = false;
  }

  if (!hasProducts) {
    console.warn("Немає товарів в акції: " + promotionTitle);
    return [];
  }

  let endDateValue;
  try {
    endDateValue = await page.$eval(".actionsTimer[data-time]", function (element) {
      return element.getAttribute("data-time");
    });
  } catch (err) {
    endDateValue = null;
  }

  const products = await page.$$eval("article.catalog-item", function (items) {
    const resultList = [];
    for (let i = 0; i < items.length; i++) {
      const element = items[i];
      const titleElement = element.querySelector(".catalog-item__title a");
      const newPriceElement = element.querySelector(".product-price__top");
      const oldPriceElement = element.querySelector(".product-price__bottom");
      const imageElement = element.querySelector("img.catalog-item__img");

      let nameText;
      let pathText;
      if (titleElement) {
        nameText = titleElement.textContent.trim();
        pathText = titleElement.getAttribute("href");
      } else {
        nameText = null;
        pathText = null;
      }

      let newPriceText;
      if (newPriceElement) {
        newPriceText = newPriceElement.getAttribute("value");
      } else {
        newPriceText = null;
      }

      let oldPriceText;
      if (oldPriceElement) {
        oldPriceText = oldPriceElement.getAttribute("value");
      } else {
        oldPriceText = null;
      }

      let imageSource;
      if (imageElement) {
        imageSource = imageElement.getAttribute("src");
      } else {
        imageSource = null;
      }

      resultList.push({
        name: nameText,
        path: pathText,
        newPriceRaw: newPriceText,
        oldPriceRaw: oldPriceText,
        imageSource: imageSource,
      });
    }
    return resultList;
  });

  const productsWithPromotionData = [];
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    product.promotionTitle = promotionTitle;
    product.endDate = endDateValue;
    productsWithPromotionData.push(product);
  }

  return productsWithPromotionData;
}

async function scrape() {
  return withBrowser(async function (page) {
    console.log("Завантаження акцій з " + PROMOTION_URL);
    const promotions = await withRetry(async function () {
      return await scrapePromotionList(page);
    });
    console.log("Знайдено " + promotions.length + " акцій");

    const allProducts = [];

    for (let i = 0; i < promotions.length; i++) {
      const promotion = promotions[i];
      console.log("Збір товарів: " + promotion.title);

      try {
        const products = await withRetry(async function () {
          return await scrapePromotionProducts(page, promotion.path, promotion.title);
        }, 2);
        for (let j = 0; j < products.length; j++) {
          allProducts.push(products[j]);
        }
        console.log(products.length + " товарів");
      } catch (err) {
        console.warn("Помилка: " + err.message);
      }

      await page.goto("about:blank");
      await new Promise(function (resolve) {
        setTimeout(resolve, DELAY_MILLISECONDS);
      });
    }

    const validProducts = [];
    for (let i = 0; i < allProducts.length; i++) {
      const product = allProducts[i];
      if (product.name) {
        if (product.newPriceRaw) {
          validProducts.push(product);
        }
      }
    }

    const seenProducts = {};
    const uniqueProducts = [];
    for (let i = 0; i < validProducts.length; i++) {
      const product = validProducts[i];
      if (!seenProducts[product.name]) {
        seenProducts[product.name] = true;
        uniqueProducts.push(product);
      }
    }

    console.log("Всього валідних: " + validProducts.length + ", унікальних: " + uniqueProducts.length);

    const finalProducts = [];
    for (let i = 0; i < uniqueProducts.length; i++) {
      const product = uniqueProducts[i];
      const newPrice = parsePrice(product.newPriceRaw);
      const oldPrice = parsePrice(product.oldPriceRaw);
      const endsAt = parseEndDate(product.endDate);
      const discountPercent = calculateDiscount(oldPrice, newPrice);

      let urlValue;
      if (product.path) {
        urlValue = ATB_BASE_URL + product.path;
      } else {
        urlValue = null;
      }

      finalProducts.push({
        title: product.name,
        store: "ATB",
        new_price: newPrice,
        old_price: oldPrice,
        discount_percent: discountPercent,
        image_url: makeFullUrl(product.imageSource),
        url: urlValue,
        category: product.promotionTitle,
        starts_at: null,
        ends_at: endsAt,
      });
    }

    return finalProducts;
  });
}

function parsePrice(rawValue) {
  if (!rawValue) {
    return null;
  }
  const cleanedString = rawValue.replace(",", ".").replace(/[^\d.]/g, "");
  const parsedNumber = parseFloat(cleanedString);
  if (isNaN(parsedNumber)) {
    return null;
  } else {
    return parsedNumber;
  }
}

function calculateDiscount(oldPrice, newPrice) {
  if (!oldPrice) {
    return null;
  }
  if (!newPrice) {
    return null;
  }
  if (oldPrice <= newPrice) {
    return null;
  }
  return Math.round(((oldPrice - newPrice) / oldPrice) * 100);
}

function makeFullUrl(sourceUrl) {
  if (!sourceUrl) {
    return null;
  }
  if (sourceUrl.startsWith("http")) {
    return sourceUrl;
  }
  return ATB_BASE_URL + sourceUrl;
}

function parseEndDate(rawValue) {
  if (!rawValue) {
    return null;
  }
  const dateObject = new Date(rawValue);
  if (isNaN(dateObject.getTime())) {
    return null;
  }
  const isoString = dateObject.toISOString();
  const dateParts = isoString.split("T");
  return dateParts[0];
}

module.exports = { scrape: scrape };
