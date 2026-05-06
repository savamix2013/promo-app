const scraperService = require("./services/scraper-service");
const runScraper = scraperService.runScraper;
const atbScraper = require("./scrapers/atb");
const silpoScraper = require("./scrapers/silpo");

const storeArgument = process.argv[2];

let scrapeFunction;
if (storeArgument === "silpo") {
  scrapeFunction = silpoScraper.scrape;
} else if (storeArgument === "atb") {
  scrapeFunction = atbScraper.scrape;
} else {
  scrapeFunction = atbScraper.scrape;
}

async function executeScraping() {
  try {
    const statistics = await runScraper(scrapeFunction);
    console.log("Результат:", JSON.stringify(statistics, null, 2));
    if (statistics.errors.length > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error("Помилка:", err);
    process.exit(1);
  }
}

executeScraping();
