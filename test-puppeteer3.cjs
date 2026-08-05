const puppeteer = require('puppeteer');

async function test() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  await page.goto('http://localhost:3000');
  
  // Login as admin first (since we can't easily impersonate without UI)
  // Let's expose a function to React to set the user
  await page.evaluate(() => {
    window.postMessage({ type: 'OAUTH_AUTH_SUCCESS', accessToken: 'dummy' }, '*');
  });
  
  // Wait, mock fetch is needed. Let's just modify App.tsx temporarily to bypass auth for puppeteer.
  await browser.close();
}
test().catch(console.error);
