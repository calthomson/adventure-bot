const cron = require('node-cron');
const playwright = require('playwright');

module.exports = {
    name: "ready",
    once: true,
    execute(client) {
        console.log(`\n---------------------------\n${client.user.tag} is now online!\n---------------------------`)

        console.log("Starting scraper cron.")

        const channel_id = "1242146394010288229"; // "1207717262870446130";
        const channel = client.channels.cache.get(channel_id);

        // Schedule a task to run at 10:00AM each day.
        // cron.schedule('0 10 * * *', async () => {
        // Test: Run once every minute.
        cron.schedule('* * * * *', async () => {
            console.log("Running scraper cron.")
            await scrape();
        }, {
            scheduled: true,
            timezone: "America/Los_Angeles"
        });

        async function scrape() {
            console.log("Inside scrape")
            try {
                // const browser = await playwright.chromium.launch({ headless: true });
                // console.log("process.env.BROWSER_PLAYWRIGHT_ENDPOINT", process.env.BROWSER_PLAYWRIGHT_ENDPOINT)
                // Error: Unable to connect to browerless endpoint
                const browser = await playwright.chromium.connect(process.env.BROWSER_PLAYWRIGHT_ENDPOINT);
                // Debug: Never reach this
                console.log("Fetching page")
                const page = await browser.newPage();
                await page.goto('https://www.nps.gov/yose/planyourvisit/tioga.htm');
                const bicycle_notice = "In some years, these roads may be open during limited periods to bicycles prior to opening to cars. Any updates regarding pre-opening access on these roads will appear on this webpage. Unless otherwise posted here, both roads are closed to cyclists if they are closed to vehicles.";
                const notice_locator = page.locator('p', { hasText: bicycle_notice });
                const response = await notice_locator.isVisible() ? "[Tioga Pass](https://www.nps.gov/yose/planyourvisit/tioga.htm) is not open to bicycles yet. :(" : "Tioga Pass may be open to bicycles now!";
                console.log("Sending resposne to channel:", channel)
                if (channel) channel.send(response);
            } catch (error) {
                console.error("Failed to scrape due to:", error);
                if (channel) channel.send({ content: "Failed to scrape.", ephemeral: true });
            } finally {
                await browser.close();
            }
        }
    },
};