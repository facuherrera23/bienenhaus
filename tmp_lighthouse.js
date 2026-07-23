const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const start = Date.now();
    await page.goto('https://bienenhaus.onrender.com', { waitUntil: 'networkidle', timeout: 60000 });
    const loadTime = Date.now() - start;
    const timing = await page.evaluate(() => JSON.stringify({
        ttfb: performance.timing.responseStart - performance.timing.requestStart,
        domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        load: performance.timing.loadEventEnd - performance.timing.navigationStart
    }));
    console.log('Timing:', timing);
    console.log('Total load (ms):', loadTime);
    const version = await page.evaluate(() => {
        const links = document.querySelectorAll('link[href*="v="]');
        if (links.length > 0) {
            const href = links[0].getAttribute('href');
            return href.match(/v=([^&]+)/)[1];
        }
        return 'none';
    });
    console.log('Version:', version);
    await browser.close();
})();
