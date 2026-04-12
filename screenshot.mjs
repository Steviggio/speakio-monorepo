import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1584, height: 396 },
    deviceScaleFactor: 2, 
  });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  
  await page.addStyleTag({ content: 'body { overflow: hidden !important; }' });
  
  await page.screenshot({ path: 'linkedin_banner.png' });
  
  await browser.close();
  console.log('Screenshot saved to linkedin_banner.png');
})();
