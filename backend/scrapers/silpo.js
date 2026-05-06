const https = require("https");
const baseScraper = require("./base");
const withRetry = baseScraper.withRetry;

const SILPO_BASE_URL = "https://silpo.ua";
const SILPO_API_BASE_URL = "https://sf-ecom-api.silpo.ua";
const DEFAULT_BRANCH_ID = "00000000-0000-0000-0000-000000000000";
const IMAGE_BASE_URL = "https://content.silpo.ua/ecom/product";
const PRODUCTS_PER_PAGE = 100;
const DELAY_MILLISECONDS = 1000;
const REQUEST_TIMEOUT_MILLISECONDS = 30000;
const USER_AGENT_STRING = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const HASH_SLUG_LENGTH = 32;

function makeApiRequest(requestUrl) {
  return new Promise(function (resolve, reject) {
    const parsedUrl = new URL(requestUrl);
    const requestOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "GET",
      headers: {
        "User-Agent": USER_AGENT_STRING,
        "Accept": "application/json"
      }
    };
    const request = https.get(requestOptions, function (response) {
      if (response.statusCode !== 200) {
        reject(new Error("API повернув статус " + response.statusCode));
        response.resume();
        return;
      }
      let responseBody = "";
      response.on("data", function (chunk) {
        responseBody = responseBody + chunk;
      });
      response.on("end", function () {
        try {
          const parsedData = JSON.parse(responseBody);
          resolve(parsedData);
        } catch (error) {
          reject(error);
        }
      });
    });
    request.on("error", function (error) {
      reject(error);
    });
    request.setTimeout(REQUEST_TIMEOUT_MILLISECONDS, function () {
      request.destroy(new Error("Час запиту вичерпано"));
    });
  });
}

async function fetchCategoriesTree() {
  const requestUrl = SILPO_API_BASE_URL
    + "/v1/branches/" + DEFAULT_BRANCH_ID
    + "/categories/tree?deliveryType=DeliveryHome";
  const responseData = await makeApiRequest(requestUrl);
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
    const categoryEntry = {
      slug: item.slug,
      title: categoryName
    };
    topLevelCategories.push(categoryEntry);
  }
  return topLevelCategories;
}

function buildProductsUrl(categorySlug, offset) {
  return SILPO_API_BASE_URL
    + "/v1/uk/branches/" + DEFAULT_BRANCH_ID
    + "/products?limit=" + PRODUCTS_PER_PAGE
    + "&offset=" + offset
    + "&deliveryType=DeliveryHome"
    + "&category=" + categorySlug
    + "&includeChildCategories=true"
    + "&inStock=true";
}

async function fetchProductsPage(categorySlug, offset) {
  const requestUrl = buildProductsUrl(categorySlug, offset);
  const responseData = await makeApiRequest(requestUrl);
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
    console.warn("Немає відповіді для категорії: " + categoryTitle);
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
    } catch (error) {
      console.warn("Помилка завантаження зміщення " + currentOffset + " для " + categoryTitle + ": " + error.message);
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
  console.log("Завантаження всіх товарів з API Сільпо");

  let categoriesData;
  try {
    categoriesData = await fetchCategoriesTree();
  } catch (error) {
    console.warn("Не вдалося завантажити дерево категорій: " + error.message);
    return [];
  }

  const topLevelCategories = collectTopLevelCategories(categoriesData);
  console.log("Знайдено " + topLevelCategories.length + " категорій верхнього рівня");

  let allProducts = [];

  for (let i = 0; i < topLevelCategories.length; i++) {
    const category = topLevelCategories[i];
    console.log("Скрапінг категорії (" + (i + 1) + "/" + topLevelCategories.length + "): " + category.title);

    try {
      const products = await fetchAllProductsForCategory(category.slug, category.title);
      for (let j = 0; j < products.length; j++) {
        products[j]._categoryTitle = category.title;
      }
      allProducts = allProducts.concat(products);
      console.log(products.length + " товарів у " + category.title);
    } catch (error) {
      console.warn("Помилка скрапінгу " + category.title + ": " + error.message);
    }

    await new Promise(function (resolve) {
      setTimeout(resolve, DELAY_MILLISECONDS);
    });
  }

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
