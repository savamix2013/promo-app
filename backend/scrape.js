const scraperService = require("./services/scraper-service");
const runScraper = scraperService.runScraper;
const atbScraper = require("./scrapers/atb");

async function executeScraping() {
  try {
    const statistics = await runScraper(atbScraper.scrape);
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
