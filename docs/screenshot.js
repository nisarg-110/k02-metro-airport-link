/**
 * Auto-screenshot all 6 pages of the K02 dashboard.
 * Run: node docs/screenshot.js
 * Requires: npm install puppeteer  (run once from project root)
 */

const puppeteer = require('puppeteer');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const OUT_DIR = path.join(__dirname, 'screenshots');

const pages = [
  { name: '1_dashboard',    url: '/',             title: 'Dashboard' },
  { name: '2_departments',  url: '/departments',  title: 'Departments' },
  { name: '3_budget',       url: '/budget',       title: 'Budget' },
  { name: '4_dependencies', url: '/dependencies', title: 'Dependencies' },
  { name: '5_people',       url: '/people',       title: 'People' },
  { name: '6_anomalies',    url: '/anomalies',    title: 'Anomalies' },
];

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 900 },
  });

  for (const page of pages) {
    const tab = await browser.newPage();
    console.log(`Capturing ${page.title}...`);
    await tab.goto(`${BASE_URL}${page.url}`, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500)); // let charts render
    const file = path.join(OUT_DIR, `${page.name}.png`);
    await tab.screenshot({ path: file, fullPage: true });
    console.log(`  Saved → ${file}`);
    await tab.close();
  }

  await browser.close();
  console.log('\nAll screenshots saved to docs/screenshots/');
})();
