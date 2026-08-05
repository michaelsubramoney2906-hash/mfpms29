const puppeteer = require('puppeteer');

async function test() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  await page.goto('http://localhost:3000');
  
  // Set localStorage
  await page.evaluate(() => {
    localStorage.setItem('activeTenantId', 'tenant-229');
    localStorage.setItem('currentUser', JSON.stringify({
      email: 'nsibandenp@nkangaladm.gov.za',
      fullName: 'Nompumelelo P. Nsibande',
      role: 'tenant_user',
      tenantId: 'tenant-229',
      id: 'nsibandenp@nkangaladm.gov.za'
    }));
  });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // Click on Performance Agreements
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text.includes('Performance Agreements')) {
      await b.click();
      console.log('Clicked Performance Agreements');
      break;
    }
  }
  
  await new Promise(r => setTimeout(r, 5000));
  
  console.log('Final text', await page.evaluate(() => document.body.innerText.substring(0, 500)));
  
  await browser.close();
}
test().catch(console.error);
