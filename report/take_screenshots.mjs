import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RES = path.join(__dirname, 'res');
fs.mkdirSync(RES, { recursive: true });

let browser, page;
let screenshotIndex = 0;

async function ss(name) {
  screenshotIndex++;
  const filename = `figure-${String(screenshotIndex).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: path.join(RES, filename), fullPage: false, type: 'png' });
  console.log(`  ${screenshotIndex}. ${filename}`);
  return screenshotIndex;
}

async function go(url) {
  await page.goto('http://localhost:5173' + url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
}

async function setLang(lang) {
  await page.evaluate((l) => localStorage.setItem('i18n_lang', l), lang);
}

function setAuth(token) {
  return page.evaluate((t) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify({
      id: 1, email: 'admin@iset-tozeur.tn', fullName: 'Super Administrator',
      role: 'super_admin', userType: 'staff'
    }));
  }, token);
}

(async () => {
  browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  page = await ctx.newPage();

  // Login to get token
  const resp = await page.request.post('http://localhost:5000/api/auth/login', {
    data: { email: 'admin@iset-tozeur.tn', password: 'Admin@123!' }
  });
  const { token } = await resp.json();
  console.log('Token obtained');

  // ========== PART 1: LANDING & AUTH ==========
  console.log('\n--- Landing & Auth ---');
  await go('/');
  await setLang('en');
  await go('/');
  await ss('landing-page-en');

  await go('/login');
  await ss('login-page-en');

  // French version
  await setLang('fr');
  await go('/');
  await ss('landing-page-fr');

  // ========== PART 2: DASHBOARD & STATS ==========
  console.log('\n--- Dashboard & Stats ---');
  await setAuth(token);
  await setLang('en');
  await page.evaluate(() => {
    localStorage.setItem('obs-theme', 'light');
    localStorage.setItem('obs-color-scheme', 'ocean');
  });
  await go('/dashboard');
  await page.waitForTimeout(3000);
  await ss('admin-dashboard');

  // ========== PART 3: DATA MANAGEMENT ==========
  console.log('\n--- Data Management ---');
  await go('/import');
  await page.waitForTimeout(2000);
  await ss('data-import-upload');

  await go('/explore');
  await page.waitForTimeout(2000);
  await ss('database-explorer');

  // Click first dataset card to open table editor
  const cards = await page.locator('.ant-card').all();
  if (cards.length > 0) {
    await cards[0].click();
    await page.waitForTimeout(3000);
    await ss('table-editor');
  }

  await go('/relations');
  await page.waitForTimeout(2000);
  await ss('foreign-keys-manager');

  await go('/queries');
  await page.waitForTimeout(2000);
  await ss('saved-queries');

  // ========== PART 4: CHARTS & VISUALIZATION ==========
  console.log('\n--- Charts & Visualization ---');
  await go('/charts');
  await page.waitForTimeout(3000);
  await ss('chart-builder');

  // Open chart builder for editing
  const chartItems = await page.locator('.ant-card').all();
  if (chartItems.length > 0) {
    await chartItems[0].click();
    await page.waitForTimeout(2000);
    await ss('chart-editor');
  }

  await go('/dashboards');
  await page.waitForTimeout(3000);
  await ss('dashboard-canvas');

  // Click on first dashboard to open
  const dashItems = await page.locator('.ant-card').all();
  if (dashItems.length > 0) {
    await dashItems[0].click();
    await page.waitForTimeout(4000);
    await ss('dashboard-with-charts');
  }

  // ========== PART 5: AI FEATURES ==========
  console.log('\n--- AI Features ---');
  await go('/ai');
  await page.waitForTimeout(3000);
  await ss('ai-analysis-chat');

  // Type a question in AI
  const chatInput = await page.locator('textarea').first();
  if (await chatInput.isVisible()) {
    await chatInput.fill('Show me the average GPA by department');
    await page.waitForTimeout(500);
    await ss('ai-analysis-typed-query');
  }

  await go('/reports');
  await page.waitForTimeout(2000);
  await ss('reports-page');

  // Click on a report
  const reportCards = await page.locator('.ant-card').all();
  if (reportCards.length > 0) {
    await reportCards[0].click();
    await page.waitForTimeout(2000);
    await ss('report-detail');
  }

  // ========== PART 6: SURVEYS ==========
  console.log('\n--- Surveys ---');
  await go('/surveys');
  await page.waitForTimeout(2000);
  await ss('survey-generator');

  // Open the first survey
  const surveyItems = await page.locator('.ant-card').all();
  if (surveyItems.length > 0) {
    await surveyItems[0].click();
    await page.waitForTimeout(2000);
    await ss('survey-detail');
  }

  // View a public survey (find survey ID from API)
  const surveysResp = await page.request.get('http://localhost:5000/api/surveys', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const surveysData = await surveysResp.json();
  const surveyId = surveysData.data?.[0]?.id;
  if (surveyId) {
    await go(`/public/surveys/${surveyId}`);
    await page.waitForTimeout(2000);
    await ss('public-survey');
  }

  // ========== PART 7: ADMIN FEATURES ==========
  console.log('\n--- Admin Features ---');
  await go('/users');
  await page.waitForTimeout(2000);
  await ss('user-management');

  await go('/roles');
  await page.waitForTimeout(2000);
  await ss('role-management');

  await go('/clients');
  await page.waitForTimeout(2000);
  await ss('client-management');

  // ========== PART 8: SETTINGS & THEMES ==========
  console.log('\n--- Settings & Themes ---');
  await go('/settings');
  await page.waitForTimeout(2000);
  await ss('settings-page');

  // Dark theme showcase
  await page.evaluate(() => {
    localStorage.setItem('obs-theme', 'dark');
    localStorage.setItem('obs-color-scheme', 'forest');
  });
  await go('/dashboard');
  await page.waitForTimeout(3000);
  await ss('theme-dark-forest');

  await page.evaluate(() => {
    localStorage.setItem('obs-color-scheme', 'sunset');
  });
  await go('/dashboard');
  await page.waitForTimeout(2000);
  await ss('theme-dark-sunset');

  await page.evaluate(() => {
    localStorage.setItem('obs-color-scheme', 'ocean');
  });
  await go('/settings');
  await page.waitForTimeout(2000);
  await ss('settings-dark-theme');

  // Back to light
  await page.evaluate(() => {
    localStorage.setItem('obs-theme', 'light');
    localStorage.setItem('obs-color-scheme', 'ocean');
    localStorage.setItem('i18n_lang', 'fr');
  });
  await go('/dashboard');
  await page.waitForTimeout(3000);
  await ss('dashboard-french');

  await go('/settings');
  await page.waitForTimeout(2000);
  await ss('settings-french');

  // ========== PART 9: CLIENT / PUBLIC PORTAL ==========
  console.log('\n--- Client Portal ---');
  await page.evaluate(() => localStorage.clear());
  await setLang('en');

  const clientResp = await page.request.post('http://localhost:5000/api/auth/client-login', {
    data: { username: 'ahmed.benali', password: '12345678' }
  });
  const clientData = await clientResp.json();
  if (clientData.token) {
    await page.evaluate((t) => {
      localStorage.setItem('token', t);
      localStorage.setItem('user', JSON.stringify({
        id: 1, email: 'ahmed@example.com', fullName: 'Ahmed Ben Ali',
        role: 'student', userType: 'client', cin: '12345678', username: 'ahmed.benali'
      }));
      localStorage.setItem('i18n_lang', 'en');
      localStorage.setItem('obs-theme', 'light');
      localStorage.setItem('obs-color-scheme', 'ocean');
    }, clientData.token);
    await go('/portal');
    await page.waitForTimeout(3000);
    await ss('client-portal');
  }

  // Public dashboards
  await page.evaluate(() => localStorage.clear());
  await go('/public');
  await page.waitForTimeout(3000);
  await ss('public-dashboard');

  // ========== PART 10: NOTIFICATIONS ==========
  console.log('\n--- Notifications ---');
  await setAuth(token);
  await setLang('en');
  await page.evaluate(() => {
    localStorage.setItem('obs-theme', 'light');
    localStorage.setItem('obs-color-scheme', 'ocean');
  });
  await go('/dashboard');
  await page.waitForTimeout(2000);

  // Try to open notifications
  const bellBtns = await page.locator('.ant-badge .ant-btn, .ant-btn-icon-only, button[class*="bell"], button[class*="notification"]').all();
  for (const btn of bellBtns) {
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(1500);
      break;
    }
  }
  // Try alternative: click the first button in the header area
  const headerBtns = await page.locator('header button, .ant-layout-header button, nav button').all();
  for (const btn of headerBtns) {
    try {
      await btn.click();
      await page.waitForTimeout(1500);
      break;
    } catch(e) {}
  }
  await ss('notifications-popup');

  // ========== DOCS PAGE ==========
  await go('/docs');
  await page.waitForTimeout(2000);
  await ss('docs-page');

  // ========== DATA PROFILE ==========
  await go('/explore');
  await page.waitForTimeout(2000);
  const exploreCards = await page.locator('.ant-card').all();
  if (exploreCards.length > 1) {
    await exploreCards[1].click();
    await page.waitForTimeout(3000);
    await ss('table-editor-data');
  }

  console.log(`\n=== ALL ${screenshotIndex} SCREENSHOTS COMPLETE ===`);
  await browser.close();
})();
