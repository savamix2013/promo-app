const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const BROWSER_ARGUMENTS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--disable-software-rasterizer",
  "--disable-extensions",
  "--js-flags=--max-old-space-size=256",
];

const USER_AGENT_STRING = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function closeBrowserWithTimeout(browserInstance, timeoutMilliseconds) {
  if (timeoutMilliseconds === null || timeoutMilliseconds === undefined) {
    timeoutMilliseconds = 5000;
  }

  let didClose = false;

  async function attemptClose() {
    try {
      await browserInstance.close();
      didClose = true;
    } catch (error) {
      console.warn("Помилка закриття браузера: " + error.message);
    }
  }

  const closeTask = attemptClose();

  const timeoutTask = new Promise(function (resolve) {
    setTimeout(resolve, timeoutMilliseconds);
  });

  await Promise.race([closeTask, timeoutTask]);

  if (!didClose) {
    console.warn("Браузер не відповідає - відключення");
    try {
      browserInstance.disconnect();
    } catch (error) {
    }
  }
}

async function withBrowser(scrapeFunction) {
  let browserInstance;
  try {
    const launchOptions = {
      headless: "new",
      args: BROWSER_ARGUMENTS,
      defaultViewport: {
        width: 1280,
        height: 720,
      },
    };
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }
    browserInstance = await puppeteer.launch(launchOptions);
    const page = await browserInstance.newPage();
    await page.setCacheEnabled(false);
    await page.setUserAgent(USER_AGENT_STRING);
    return await scrapeFunction(page);
  } finally {
    if (browserInstance) {
      await closeBrowserWithTimeout(browserInstance);
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
    } catch (error) {
      lastError = error;
      console.warn("Спроба " + attempt + "/" + maximumRetries + " не вдалась: " + error.message);
      if (attempt < maximumRetries) {
        const delayMilliseconds = Math.pow(2, attempt - 1) * 2000;
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
  withRetry: withRetry,
};
