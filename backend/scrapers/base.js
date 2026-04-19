const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const BROWSER_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
];

const USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function withBrowser(scrapeFn) {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: "new", args: BROWSER_ARGS });
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);

    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (["image", "stylesheet", "font", "media"].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    return await scrapeFn(page);
  } finally {
    if (browser) await browser.close();
  }
}

async function withRetry(fn, maxRetries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.warn(`Спроба ${attempt}/${maxRetries} невдала: ${err.message}`);
      if (attempt < maxRetries) {
        const delay = 2000 * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

module.exports = { withBrowser, withRetry };
