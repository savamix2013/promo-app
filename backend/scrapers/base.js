const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const BROWSER_ARGUMENTS =[
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
];

const USER_AGENT_STRING = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function withBrowser(scrapeFunction) {
  let browserInstance;
  try {
    browserInstance = await puppeteer.launch({ headless: "new", args: BROWSER_ARGUMENTS });
    const page = await browserInstance.newPage();
    await page.setUserAgent(USER_AGENT_STRING);

    await page.setRequestInterception(true);
    page.on("request", function (request) {
      const resourceType = request.resourceType();
      if (resourceType === "image" || resourceType === "stylesheet" || resourceType === "font" || resourceType === "media") {
        request.abort();
      } else {
        request.continue();
      }
    });

    return await scrapeFunction(page);
  } finally {
    if (browserInstance) {
      await browserInstance.close();
    }
  }
}

async function withRetry(functionToRun, maximumRetries) {
  if (maximumRetries === null || maximumRetries === undefined) {
    maximumRetries = 3;
  }

  let lastError;
  for (let attempt = 1; attempt <= maximumRetries; attempt++) {
    try {
      return await functionToRun();
    } catch (err) {
      lastError = err;
      console.warn("Спроба " + attempt + "/" + maximumRetries + " невдала: " + err.message);
      if (attempt < maximumRetries) {
        const delayMilliseconds = 2000 * Math.pow(2, attempt - 1);
        await new Promise(function (resolve) {
          setTimeout(resolve, delayMilliseconds);
        });
      }
    }
  }
  throw lastError;
}

module.exports = {
  withBrowser: withBrowser,
  withRetry: withRetry
};
