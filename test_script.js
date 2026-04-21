const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    page.on('console', msg => {
        console.log(`[PAGE CONSOLE] ${msg.type().toUpperCase()} - ${msg.text()}`);
    });
    
    page.on('pageerror', err => {
        console.log(`[PAGE ERROR] ${err.message}`);
    });
    
    console.log("Navigating to https://pluggedin.studio/app.html (adding timestamp to bypass cache)");
    await page.goto(`https://pluggedin.studio/app.html?t=${Date.now()}`, { waitUntil: 'networkidle2' });
    
    await browser.close();
})();
