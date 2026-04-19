const { runScraper } = require("./services/scraper-service");
const atbScraper = require("./scrapers/atb");

(async () => {
  try {
    const stats = await runScraper(atbScraper.scrape);
    console.log("Результат:", JSON.stringify(stats, null, 2));
    process.exit(stats.errors.length > 0 ? 1 : 0);
  } catch (err) {
    console.error("Помилка:", err);
    process.exit(1);
  }
})();
