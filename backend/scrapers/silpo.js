const https = require("https");
const baseScraper = require("./base");
const withRetry = baseScraper.withRetry;
const zlib = require("zlib");

const SILPO_BASE_URL = "https://silpo.ua";
const SILPO_API_BASE_URL = "https://sf-ecom-api.silpo.ua";
const DEFAULT_BRANCH_ID = "00000000-0000-0000-0000-000000000000";
const IMAGE_BASE_URL = "https://content.silpo.ua/ecom/product";
const PRODUCTS_PER_PAGE = 500;
const DELAY_MILLISECONDS = 1000;
const REQUEST_TIMEOUT_MILLISECONDS = 30000;
const USER_AGENT_STRING = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const HASH_SLUG_LENGTH = 32;
const CONCURRENCY_LIMIT = 3;

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 3,
  maxFreeSockets: 2,
  timeout: REQUEST_TIMEOUT_MILLISECONDS,
});


function makeApiRequest(requestUrl) {
  return new Promise(function (resolve, reject) {
    const parsedUrl = new URL(requestUrl);
    const requestOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "GET",
      agent: httpsAgent,
      headers: {
        "User-Agent": USER_AGENT_STRING,
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
    };
    const request = https.get(requestOptions, function (response) {
      if (response.statusCode === 429) {
        reject(new Error("Обмеження запитів: 429"));
        response.resume();
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error("API повернув статус " + response.statusCode));
        response.resume();
        return;
      }

      let responseStream = response;
      const encoding = response.headers["content-encoding"];

      if (encoding === "gzip") {
        responseStream = response.pipe(zlib.createGunzip());
      } else if (encoding === "deflate") {
        responseStream = response.pipe(zlib.createInflate());
      }

      let responseBody = "";
      responseStream.on("data", function (chunk) {
        responseBody = responseBody + chunk.toString("utf8");
      });

      responseStream.on("end", function () {
        try {
          const parsedData = JSON.parse(responseBody);
          resolve(parsedData);
        } catch (parseError) {
          reject(new Error("Помилка парсингу JSON: " + parseError.message));
        }
      });
    });

    request.on("error", function (requestError) {
      reject(requestError);
    });

    request.setTimeout(REQUEST_TIMEOUT_MILLISECONDS, function () {
      request.destroy(new Error("Час запиту вичерпано"));
    });
  });
}

async function makeApiRequestWithBackoff(requestUrl, maximumRetries) {
  if (maximumRetries === null || maximumRetries === undefined) {
    maximumRetries = 3;
  }
  let lastError;
  for (let attempt = 0; attempt < maximumRetries; attempt++) {
    try {
      return await makeApiRequest(requestUrl);
    } catch (error) {
      lastError = error;
      if (error.message.indexOf("429") === -1) {
        throw error;
      }
      const baseDelay = Math.pow(2, attempt) * 1000;
      const jitter = Math.floor(Math.random() * 500);
      const totalDelay = baseDelay + jitter;
      console.warn("Обмеження запитів, пауза " + totalDelay + "мс (спроба " + (attempt + 1) + ")");
      await new Promise(function (resolve) {
        setTimeout(resolve, totalDelay);
      });
    }
  }
  throw lastError;
}

async function fetchCategoriesTree() {
  const requestUrl = SILPO_API_BASE_URL + "/v1/branches/" + DEFAULT_BRANCH_ID + "/categories/tree?deliveryType=DeliveryHome";
  const responseData = await makeApiRequestWithBackoff(requestUrl);
  return responseData;
}

function collectTopLevelCategories(categoriesData) {
  const topLevelCategories = [];
  if (!categoriesData) {
    return topLevelCategories;
  }
  if (!categoriesData.items) {
    return topLevelCategories;
  }
  for (let i = 0; i < categoriesData.items.length; i++) {
    const item = categoriesData.items[i];
    if (item.slug && item.slug.length === HASH_SLUG_LENGTH) {
      continue;
    }
    let categoryName;
    if (item.name) {
      categoryName = item.name;
    } else if (item.title) {
      categoryName = item.title;
    } else {
      categoryName = item.slug;
    }
    topLevelCategories.push({
      slug: item.slug,
      title: categoryName,
    });
  }
  return topLevelCategories;
}

function buildProductsUrl(categorySlug, offset) {
  return SILPO_API_BASE_URL + "/v1/uk/branches/" + DEFAULT_BRANCH_ID + "/products?limit=" + PRODUCTS_PER_PAGE + "&offset=" + offset + "&deliveryType=DeliveryHome&category=" + categorySlug + "&includeChildCategories=true&inStock=true";
}

async function fetchProductsPage(categorySlug, offset) {
  const requestUrl = buildProductsUrl(categorySlug, offset);
  const responseData = await makeApiRequestWithBackoff(requestUrl);
  return responseData;
}

async function fetchAllProductsForCategory(categorySlug, categoryTitle) {
  let allProducts = [];
  let currentOffset = 0;
  let totalProducts = 0;

  const firstPageData = await withRetry(async function () {
    return await fetchProductsPage(categorySlug, 0);
  });

  if (!firstPageData) {
    console.warn("Категорія " + categoryTitle + " не відповідає");
    return [];
  }

  totalProducts = firstPageData.total;

  if (firstPageData.items) {
    for (let i = 0; i < firstPageData.items.length; i++) {
      allProducts.push(firstPageData.items[i]);
    }
  }

  currentOffset = PRODUCTS_PER_PAGE;

  while (currentOffset < totalProducts) {
    await new Promise(function (resolve) {
      setTimeout(resolve, DELAY_MILLISECONDS);
    });

    try {
      const pageData = await withRetry(async function () {
        return await fetchProductsPage(categorySlug, currentOffset);
      });

      if (!pageData) {
        break;
      }
      if (!pageData.items) {
        break;
      }

      for (let i = 0; i < pageData.items.length; i++) {
        allProducts.push(pageData.items[i]);
      }

      currentOffset = currentOffset + PRODUCTS_PER_PAGE;
    } catch (categoryError) {
      console.warn("Зміщення " + currentOffset + " для " + categoryTitle + " не завантажилось: " + categoryError.message);
      break;
    }
  }

  return allProducts;
}

function parsePrice(rawValue) {
  if (rawValue === null || rawValue === undefined) {
    return null;
  }
  const parsedNumber = parseFloat(rawValue);
  if (isNaN(parsedNumber)) {
    return null;
  }
  return parsedNumber;
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

function makeFullImageUrl(iconFilename) {
  if (!iconFilename) {
    return null;
  }
  if (iconFilename.indexOf("http") === 0) {
    return iconFilename;
  }
  return IMAGE_BASE_URL + "/" + iconFilename;
}

function makeProductUrl(productSlug) {
  if (!productSlug) {
    return null;
  }
  return SILPO_BASE_URL + "/product/" + productSlug;
}

async function scrape() {
  console.log("Завантаження товарів з API Сільпо");

  let categoriesData;
  try {
    categoriesData = await fetchCategoriesTree();
  } catch (fetchError) {
    console.warn("Дерево категорій не завантажилось: " + fetchError.message);
    return [];
  }

  const topLevelCategories = collectTopLevelCategories(categoriesData);
  console.log("Знайдено " + topLevelCategories.length + " категорій верхнього рівня");

  const allProducts = [];
  let nextCategoryIndex = 0;

  async function processCategoryWorker() {
    while (nextCategoryIndex < topLevelCategories.length) {
      const index = nextCategoryIndex++;
      const category = topLevelCategories[index];
      console.log("Обробка категорії (" + (index + 1) + "/" + topLevelCategories.length + "): " + category.title);

      try {
        const products = await fetchAllProductsForCategory(category.slug, category.title);
        for (let j = 0; j < products.length; j++) {
          products[j]._categoryTitle = category.title;
          allProducts.push(products[j]);
        }
        console.log(products.length + " товарів у " + category.title);
      } catch (processingError) {
        console.warn("Помилка обробки категорії " + category.title + ": " + processingError.message);
      }

      await new Promise(function (resolve) {
        setTimeout(resolve, DELAY_MILLISECONDS);
      });
    }
  }

  const workerCount = Math.min(CONCURRENCY_LIMIT, topLevelCategories.length);
  const workers = [];
  for (let i = 0; i < workerCount; i++) {
    workers.push(processCategoryWorker());
  }
  await Promise.all(workers);

  console.log("Зібрано " + allProducts.length + " товарів загалом");

  const seenProducts = {};
  const uniqueProducts = [];
  for (let i = 0; i < allProducts.length; i++) {
    const product = allProducts[i];
    if (!seenProducts[product.title]) {
      seenProducts[product.title] = true;
      uniqueProducts.push(product);
    }
  }

  console.log("Унікальних товарів: " + uniqueProducts.length);

  const finalProducts = [];
  for (let i = 0; i < uniqueProducts.length; i++) {
    const product = uniqueProducts[i];
    let newPrice;
    let oldPrice;

    if (product.displayPrice !== null && product.displayPrice !== undefined) {
      newPrice = parsePrice(product.displayPrice);
    } else {
      newPrice = parsePrice(product.price);
    }

    if (product.displayOldPrice !== null && product.displayOldPrice !== undefined) {
      oldPrice = parsePrice(product.displayOldPrice);
    } else if (product.oldPrice !== null && product.oldPrice !== undefined) {
      oldPrice = parsePrice(product.oldPrice);
    } else {
      oldPrice = null;
    }

    const discountPercent = calculateDiscount(oldPrice, newPrice);
    const imageUrl = makeFullImageUrl(product.icon);
    const productUrl = makeProductUrl(product.slug);

    let categoryValue = "Без категорії";
    if (product._categoryTitle) {
      categoryValue = product._categoryTitle;
    }

    finalProducts.push({
      title: product.title,
      store: "Silpo",
      new_price: newPrice,
      old_price: oldPrice,
      discount_percent: discountPercent,
      image_url: imageUrl,
      url: productUrl,
      category: categoryValue,
      starts_at: null,
      ends_at: null,
    });
  }

  return finalProducts;
}

module.exports = { scrape: scrape };
