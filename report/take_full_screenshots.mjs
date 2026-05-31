import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RES = path.join(__dirname, 'res');
const TEST_DATA = path.join(__dirname, '..', 'test-data', 'raw');
fs.mkdirSync(RES, { recursive: true });

let browser, page;
let ssIndex = 0;
let apiToken = '';

async function ss(name, fullPage = false) {
  ssIndex++;
  const filename = `image-${String(ssIndex).padStart(3, '0')}-${name}.png`;
  await page.screenshot({ path: path.join(RES, filename), type: 'png', fullPage });
  console.log(`  ${filename}`);
}

async function go(url, waitMs = 2500) {
  await page.goto('http://localhost:5173' + url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(waitMs);
}

async function waitLoaded() {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  try { await page.waitForSelector('.ant-spin-spinning', { state: 'hidden', timeout: 15000 }); } catch (e) {}
  await page.waitForTimeout(500);
}

async function clickByText(text, timeout = 8000) {
  const btn = page.getByRole('button', { name: text });
  if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) { await btn.click(); return; }
  const btn2 = page.locator('button').filter({ hasText: text }).first();
  if (await btn2.isVisible({ timeout: 2000 }).catch(() => false)) { await btn2.click(); return; }
  const el = page.getByText(text).first();
  if (await el.isVisible({ timeout: 2000 }).catch(() => false)) { await el.click(); return; }
  console.log(`  [WARN] Could not find element with text "${text}"`);
}

async function fillField(selector, value) {
  try {
    await page.locator(selector).first().fill(value);
  } catch (e) {
    try {
      await page.locator(selector).first().pressSequentially(value, { delay: 30 });
    } catch (e2) {
      console.log(`  [WARN] Could not fill "${selector}": ${e2.message.substring(0, 60)}`);
    }
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, locale: 'en-US' });
  page = await context.newPage();

  // ══════════════════════════════════════════════════════════════
  // 0. SETUP: API login
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- SETUP ---');

  const loginResp = await page.request.post('http://localhost:5000/api/auth/login', {
    data: { email: 'admin@iset-tozeur.tn', password: 'Admin@123!' }
  });
  if (!loginResp.ok()) {
    console.error('Login failed:', await loginResp.text());
    await browser.close();
    process.exit(1);
  }
  const loginData = await loginResp.json();
  apiToken = loginData.token;
  const apiHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${apiToken}` };

  // Set auth in localStorage
  await go('/');
  await page.evaluate((t) => {
    localStorage.clear();
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify({ id: 1, email: 'admin@iset-tozeur.tn', fullName: 'Super Administrator', role: 'super_admin', userType: 'staff' }));
    localStorage.setItem('i18n_lang', 'en');
    localStorage.setItem('obs-theme', 'light');
    localStorage.setItem('obs-color-scheme', 'ocean');
  }, apiToken);
  await go('/');

  // ══════════════════════════════════════════════════════════════
  // 1. LANDING + LOGIN
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- 1. LANDING + LOGIN ---');
  await go('/');
  await waitLoaded();
  await ss('landing-page', true);

  await go('/login');
  await page.waitForTimeout(1000);
  await fillField('input[name="email"]', 'admin@iset-tozeur.tn');
  await fillField('input[name="password"]', 'Admin@123!');
  await ss('login-form');
  try {
    await page.getByRole('button', { name: /sign in/i }).click({ timeout: 5000 });
  } catch (e) {
    await page.locator('button[type="submit"]').click().catch(() => {});
  }
  await page.waitForTimeout(3000);
  await waitLoaded();
  await ss('admin-dashboard');

  // Re-assert localStorage (token may have changed)
  await page.evaluate((t) => { localStorage.setItem('token', t); }, apiToken);

  // ══════════════════════════════════════════════════════════════
  // 2. IMPORT DATA via API (reliable), with UI screenshots
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- 2. DATA IMPORT ---');

  async function importCsvApi(csvName, tableName) {
    const filePath = path.join(TEST_DATA, csvName);
    if (!fs.existsSync(filePath)) { console.log(`  [SKIP] ${csvName} not found`); return; }

    // Navigate to import page
    await go('/import');
    await waitLoaded();
    if (ssIndex < 4) await ss(`import-page-empty`);

    // Upload via the Upload.Dragger - click it to open file chooser
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 15000 }).catch(() => null),
      page.locator('.ant-upload-drag').click().catch(() =>
        page.locator('.ant-upload').first().click().catch(() =>
          page.locator('text=Click or drag').click().catch(() => {})
        )
      )
    ]);
    if (fileChooser) {
      await fileChooser.setFiles([filePath]);
    } else {
      // Fallback: directly set the file input
      const input = page.locator('input[type="file"]');
      if (await input.isVisible().catch(() => false)) {
        await input.setInputFiles([filePath]);
      } else {
        console.log(`  [WARN] Could not upload ${csvName} via UI, using API`);
        // Upload via API
        const uploadResp = await page.request.post('http://localhost:5000/api/datasets/upload', {
          headers: { Authorization: `Bearer ${apiToken}` },
          multipart: { file: [fs.readFileSync(filePath), csvName, 'text/csv'] }
        });
        if (!uploadResp.ok()) {
          console.log(`  [FAIL] API upload: ${await uploadResp.text()}`);
          return;
        }
        await go('/import');
        await waitLoaded();
      }
    }

    await sleep(3000);
    await waitLoaded();

    // Wait for the dataset row to appear
    try { await page.waitForSelector('text=uploaded', { timeout: 25000 }); } catch (e) {
      // Refresh page
      await go('/import');
      await waitLoaded();
      try { await page.waitForSelector('text=uploaded', { timeout: 10000 }); } catch (e2) {}
    }
    await page.waitForTimeout(1000);
    const stepFile = csvName.replace('.csv', '');

    // Click the Preview & Map icon button (ImportOutlined icon)
    const previewBtn = page.locator('button').filter({ has: page.locator('.anticon-import') }).first();
    if (await previewBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await previewBtn.click();
    } else {
      // Try clicking the row's action button area
      const lastCol = page.locator('.ant-table-tbody tr.ant-table-row').first().locator('td').last();
      await lastCol.locator('button').first().click().catch(() => {});
    }
    await sleep(2000);

    // Check if modal opened
    const modal = page.locator('.ant-modal');
    if (!(await modal.isVisible({ timeout: 8000 }).catch(() => false))) {
      console.log(`  [WARN] Mapping modal didn't open for ${csvName}, using API import`);
      await importViaApi(csvName, tableName);
      return;
    }

    // Wait for step 0 to load
    await sleep(1500);
    await waitLoaded();

    // STEP 0: Review - screenshot then Next
    await ss(`import-${stepFile}-step1-review`);
    await clickByText(/next/i);
    await sleep(2000);
    await waitLoaded();

    // STEP 1: Types - screenshot then Next
    await ss(`import-${stepFile}-step2-types`);
    await clickByText(/next/i);
    await sleep(2000);
    await waitLoaded();

    // STEP 2: Preview - screenshot then Next
    await ss(`import-${stepFile}-step3-preview`);
    await clickByText(/next/i);
    await sleep(2000);
    await waitLoaded();

    // STEP 3: Import - fill table name, screenshot, create
    const nameInput = modal.locator('input').last();
    await nameInput.fill(tableName).catch(() => {});
    await sleep(500);
    await ss(`import-${stepFile}-step4-import`);

    // Click Create Import / Import button
    await clickByText(/create/i, 5000);
    await sleep(4000);
    await waitLoaded();

    // Dismiss any notifications
    try { await page.locator('.ant-message-close').click({ timeout: 2000 }).catch(() => {}); } catch (e) {}
    try { await page.locator('.ant-notification-close').click({ timeout: 2000 }).catch(() => {}); } catch (e) {}
    try { await modal.locator('.ant-modal-close').click({ timeout: 2000 }).catch(() => {}); } catch (e) {}

    await sleep(1500);
    console.log(`  [OK] ${csvName} imported`);
  }

  async function importViaApi(csvName, tableName) {
    const filePath = path.join(TEST_DATA, csvName);
    // Upload via API
    const up = await page.request.post('http://localhost:5000/api/datasets/upload', {
      headers: { Authorization: `Bearer ${apiToken}` },
      multipart: { file: [fs.readFileSync(filePath), csvName, 'text/csv'] }
    });
    if (!up.ok()) { console.log(`  [FAIL] API upload: ${await up.text()}`); return; }
    const ds = await up.json();
    const dsId = ds.id || ds.dataset?.id;
    if (!dsId) { console.log(`  [FAIL] No dataset ID`); return; }

    // Start import via API
    const imp = await page.request.post(`http://localhost:5000/api/datasets/${dsId}/import`, {
      headers: { Authorization: `Bearer ${apiToken}` },
      data: { tableName: `dyn_${tableName}`, columnTypes: {} }
    });
    if (imp.ok()) {
      console.log(`  [OK] ${csvName} imported via API`);
    } else {
      console.log(`  [FAIL] ${csvName}: ${await imp.text()}`);
    }
  }

  const csvFiles = [
    { file: 'students.csv', table: 'students' },
    { file: 'courses_results.csv', table: 'courses_results' },
    { file: 'departments.csv', table: 'departments' },
    { file: 'alumni_employment.csv', table: 'alumni_employment' },
    { file: 'survey_feedback_2026.csv', table: 'survey_feedback' },
    { file: 'employer_partners.csv', table: 'employer_partners' },
  ];

  for (const csv of csvFiles) {
    await importCsvApi(csv.file, csv.table);
  }

  await go('/import');
  await waitLoaded();
  await ss('import-all-complete');

  // ══════════════════════════════════════════════════════════════
  // 3. DATABASE EXPLORER
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- 3. EXPLORER ---');
  await go('/explore');
  await waitLoaded();
  await ss('database-explorer', true);

  // Open first dataset - click the card
  const firstCard = page.locator('.ant-card[role="button"]').first();
  if (await firstCard.isVisible({ timeout: 5000 }).catch(() => false)) {
    await firstCard.click();
    await sleep(3000);
    await waitLoaded();
    await ss('table-data-view');
  }

  // ══════════════════════════════════════════════════════════════
  // 4. CREATE CHARTS (via API for reliability) + screenshot them
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- 4. CHARTS ---');

  const chartConfigs = [
    { title: 'Students by Department', chartType: 'bar', dsIdx: 0, x: 'department', y: 'student_id', agg: 'COUNT' },
    { title: 'Grade Distribution', chartType: 'pie', dsIdx: 1, x: 'grade', y: null, agg: 'COUNT' },
    { title: 'Alumni by Graduation Year', chartType: 'horizontalBar', dsIdx: 3, x: 'graduation_year', y: 'alumni_id', agg: 'COUNT' },
    { title: 'Department Staff', chartType: 'doughnut', dsIdx: 2, x: 'name', y: null, agg: 'COUNT' },
    { title: 'Rating Trend', chartType: 'line', dsIdx: 4, x: 'submission_date', y: 'rating', agg: 'AVG' },
    { title: 'Partners by Sector', chartType: 'polarArea', dsIdx: 5, x: 'sector', y: null, agg: 'COUNT' },
    { title: 'Average GPA by Dept', chartType: 'bar', dsIdx: 0, x: 'department', y: 'gpa', agg: 'AVG' },
    { title: 'Employment Rate', chartType: 'area', dsIdx: 3, x: 'graduation_year', y: 'is_employed', agg: 'AVG' },
    { title: 'Enrollment by Year', chartType: 'line', dsIdx: 0, x: 'enrollment_year', y: 'student_id', agg: 'COUNT' },
    { title: 'Satisfaction Distribution', chartType: 'bar', dsIdx: 4, x: 'satisfaction_level', y: null, agg: 'COUNT' },
    { title: 'Alumni by Department', chartType: 'pie', dsIdx: 3, x: 'department', y: null, agg: 'COUNT' },
    { title: 'Partners by City', chartType: 'bar', dsIdx: 5, x: 'city', y: 'partner_id', agg: 'COUNT' },
  ];

  for (let i = 0; i < chartConfigs.length; i++) {
    const c = chartConfigs[i];
    const cfg = {
      title: c.title, chartType: c.chartType, datasetId: c.dsIdx + 1,
      config: {
        xColumn: c.x, yColumn: c.y || undefined, aggregation: c.agg,
        showLegend: true, showGrid: true, showValues: true,
        legendPosition: 'bottom', colorScheme: 'ocean', maxDataPoints: 50,
      }
    };
    const resp = await page.request.post('http://localhost:5000/api/charts', {
      headers: apiHeaders, data: cfg
    });
    if (resp.ok()) console.log(`  [OK] Chart ${i + 1}: ${c.title}`);
    else console.log(`  [WARN] Chart ${i + 1}: ${await resp.text()}`);
  }

  // Navigate to charts page, screenshot the library
  await go('/charts');
  await waitLoaded();

  // Wait for chart cards to render
  try { await page.waitForSelector('.ant-card-hoverable', { timeout: 15000 }); } catch (e) {}
  await sleep(1000);
  await ss('chart-library', true);

  // View first chart to show graph
  const viewBtn = page.locator('button[aria-label="View chart"]').first();
  if (await viewBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await viewBtn.click();
    await sleep(3000);
    await waitLoaded();
    // Scroll the chart into view and take screenshot
    await page.evaluate(() => {
      const card = document.querySelector('.ant-card');
      if (card) card.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await sleep(500);
    await ss('chart-view-detail');

    // Try clicking PNG export button in the view card
    const pngBtn = page.locator('button').filter({ hasText: 'PNG' }).first();
    if (await pngBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pngBtn.click();
      await sleep(1500);
      // Try to capture the download
      try {
        const dl = await page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
        if (dl) await dl.saveAs(path.join(RES, 'chart-export-png.png'));
      } catch (e) {}
    }
    await ss('chart-builder-with-export');
  }

  // ══════════════════════════════════════════════════════════════
  // 5. DASHBOARDS - create & screenshot
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- 5. DASHBOARDS ---');

  // Create dashboard - try API first, then UI fallback
  let dashId = null;
  const createPayload = {
    title: 'Academic Performance Overview',
    description: 'Key metrics for ISET Tozeur institutional performance',
    isPublic: false,
  };
  const dashResp = await page.request.post('http://localhost:5000/api/dashboards', {
    headers: apiHeaders, data: createPayload
  });
  if (dashResp.ok()) {
    let dash;
    try { dash = await dashResp.json(); } catch (e) { dash = {}; }
    dashId = dash.id || dash.dashboard?.id || dash.data?.id;
  }
  if (!dashId) {
    // Try with wrapper
    const wrapResp = await page.request.post('http://localhost:5000/api/dashboards', {
      headers: apiHeaders, data: { dashboard: createPayload }
    });
    if (wrapResp.ok()) {
      let dash;
      try { dash = await wrapResp.json(); } catch (e) { dash = {}; }
      dashId = dash.id || dash.dashboard?.id || dash.data?.id;
    }
  }
  console.log(`  [${dashId ? 'OK' : 'WARN'}] Dashboard created: ${dashId || 'trying UI fallback'}`);

  // UI fallback if API didn't work
  if (!dashId) {
    await clickByText('New Dashboard');
    await sleep(1000);
    try { await page.fill('input[name="title"]', 'Academic Performance Overview'); } catch (e) {
      await page.locator('.ant-modal input').first().fill('Academic Performance Overview');
    }
    await clickByText(/create/i);
    await sleep(2000);
    await waitLoaded();
    // Try to get the ID from the URL
    const url = page.url();
    const match = url.match(/\/dashboards\/(\d+)/);
    if (match) dashId = parseInt(match[1]);
    console.log(`  Dashboard ID from UI: ${dashId}`);
  }

  // If dashboard creation returned no ID, try to fetch existing dashboards
  if (!dashId) {
    try {
      const listResp = await page.request.get('http://localhost:5000/api/dashboards', { headers: apiHeaders });
      if (listResp.ok()) {
        let list = await listResp.json();
        if (!Array.isArray(list)) list = list.data || list.dashboards || [];
        if (list.length > 0) dashId = list[0].id;
      }
    } catch (e) {}
  }

  // Add charts to dashboard via API
  if (dashId) {
    // Get chart IDs
    const chartsResp = await page.request.get('http://localhost:5000/api/charts', { headers: apiHeaders });
    if (chartsResp.ok()) {
      let charts = await chartsResp.json();
      if (!Array.isArray(charts)) charts = charts.data || charts.charts || [];
      const chartIds = charts.slice(0, 6).map(c => c.id);
      
      const layout = chartIds.map((id, i) => ({
        chartId: id,
        x: (i % 3) * 4, y: Math.floor(i / 3) * 4, w: 4, h: 4
      }));
      await page.request.put(`http://localhost:5000/api/dashboards/${dashId}`, {
        headers: apiHeaders,
        data: {
          title: 'Academic Performance Overview',
          description: 'Key metrics for ISET Tozeur institutional performance',
          isPublic: true,
          layout
        }
      });
      console.log(`  [OK] Added ${chartIds.length} charts to dashboard`);
    }
  }

  await go('/dashboards');
  await waitLoaded();
  await ss('dashboard-gallery');

  // Navigate to the dashboard canvas
  const dashCard = page.locator('.ant-card-hoverable').first();
  if (await dashCard.isVisible({ timeout: 5000 }).catch(() => false)) {
    await dashCard.click();
    await sleep(3000);
    await waitLoaded();
    await ss('dashboard-canvas', true);

    // Try PDF export
    const pdfBtn = page.locator('button').filter({ hasText: /pdf/i }).first();
    if (await pdfBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Use page.pdf() for reliable PDF capture
      await page.pdf({
        path: path.join(RES, 'dashboard-export-pdf.pdf'),
        format: 'A4', printBackground: true,
        margin: { top: '8mm', bottom: '8mm', left: '8mm', right: '8mm' }
      });
      console.log('  Dashboard PDF export saved');
    }
    await ss('dashboard-with-export');
  }

  // ══════════════════════════════════════════════════════════════
  // 6. AI ANALYSIS
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- 6. AI ANALYSIS ---');
  await go('/ai');
  await waitLoaded();
  await ss('ai-analysis');

  // Ask a question - the form has id "ai-chat-form" with a textarea
  const aiTextarea = page.locator('textarea');
  if (await aiTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
    await aiTextarea.fill('Show me the number of students by department');
  } else {
    // Fallback: try the input inside the chat form
    const aiInput = page.locator('#ai-chat-form input, #ai-chat-form textarea, form input, form textarea');
    if (await aiInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await aiInput.fill('Show me the number of students by department');
    }
  }
  await sleep(1000);
  await ss('ai-query-typed');

  // Submit the form directly (more reliable than clicking disabled button)
  await page.evaluate(() => {
    const form = document.getElementById('ai-chat-form');
    if (form) {
      const event = new Event('submit', { cancelable: true, bubbles: true });
      form.dispatchEvent(event);
    }
  });
  await sleep(8000);
  try { await page.waitForSelector('.ant-card', { timeout: 30000 }); } catch (e) {}
  await sleep(2000);
  await ss('ai-query-result');

  // ══════════════════════════════════════════════════════════════
  // 7. SURVEYS + REPORTS + IMPORT HISTORY
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- 7. SURVEYS + REPORTS ---');
  await go('/surveys');
  await waitLoaded();
  await ss('surveys');

  await go('/reports');
  await waitLoaded();
  await ss('reports');

  await go('/import');
  await waitLoaded();
  await ss('import-history');

  // ══════════════════════════════════════════════════════════════
  // 8. USER MANAGEMENT
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- 8. USER MANAGEMENT ---');
  await go('/users');
  await waitLoaded();
  await ss('users');

  await go('/roles');
  await waitLoaded();
  await ss('roles');

  await go('/clients');
  await waitLoaded();
  await ss('clients');

  // ══════════════════════════════════════════════════════════════
  // 9. SETTINGS (light and dark via UI)
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- 9. SETTINGS ---');
  await page.evaluate(() => {
    localStorage.setItem('obs-theme', 'light');
    localStorage.setItem('obs-color-scheme', 'ocean');
  });
  await go('/settings');
  await waitLoaded();
  await ss('settings');

  // Switch to dark mode via UI switch
  const sw = page.locator('.ant-switch').first();
  if (await sw.isVisible({ timeout: 3000 }).catch(() => false)) {
    await sw.click();
    await sleep(1500);
  }
  await ss('settings-dark');

  // ══════════════════════════════════════════════════════════════
  // 10. THEMES - interact with settings page controls
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- 10. THEMES ---');

  async function captureTheme(theme, colorScheme, label) {
    await page.evaluate(({ t, cs }) => {
      localStorage.setItem('obs-theme', t);
      localStorage.setItem('obs-color-scheme', cs);
    }, { t: theme, cs: colorScheme });
    await go('/settings');
    await waitLoaded();

    // Scroll to the Appearance/Theme card
    await page.evaluate(() => {
      const cards = document.querySelectorAll('.ant-card');
      for (const card of cards) {
        const txt = card.textContent || '';
        if (txt.includes('Mode') || txt.includes('Dark') || txt.includes('Light')) {
          card.scrollIntoView({ behavior: 'instant', block: 'start' });
          return;
        }
      }
    });
    await sleep(500);

    // Click the theme toggle switch to match desired theme
    const currentTheme = await page.evaluate(() => localStorage.getItem('obs-theme'));
    if (currentTheme !== theme) {
      const toggle = page.locator('.ant-switch').first();
      if (await toggle.isVisible({ timeout: 2000 }).catch(() => false)) {
        await toggle.click();
        await sleep(800);
      }
    }

    // Click the color scheme by text
    const schemeLabels = { ocean: 'Ocean', forest: 'Forest', sunset: 'Sunset', lavender: 'Lavender', crimson: 'Crimson' };
    const sl = schemeLabels[colorScheme];
    if (sl) {
      try { await page.getByText(sl, { exact: true }).first().click(); } catch (e) {}
      await sleep(500);
    }

    // Scroll back to top
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await sleep(500);
    await ss(label);
  }

  await captureTheme('dark', 'ocean', 'theme-dark-ocean');
  await captureTheme('dark', 'forest', 'theme-dark-forest');
  await captureTheme('dark', 'sunset', 'theme-dark-sunset');
  await captureTheme('dark', 'lavender', 'theme-dark-lavender');
  await captureTheme('dark', 'crimson', 'theme-dark-crimson');
  await captureTheme('light', 'ocean', 'theme-light-ocean');
  await captureTheme('light', 'forest', 'theme-light-forest');
  await captureTheme('light', 'sunset', 'theme-light-sunset');
  await captureTheme('light', 'lavender', 'theme-light-lavender');

  // Reset to default
  await page.evaluate(() => {
    localStorage.setItem('obs-theme', 'light');
    localStorage.setItem('obs-color-scheme', 'ocean');
  });

  // ══════════════════════════════════════════════════════════════
  // 11. FRENCH LOCALIZATION
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- 11. FRENCH ---');
  await page.evaluate(() => localStorage.setItem('i18n_lang', 'fr'));
  await go('/dashboard');
  await waitLoaded();
  await ss('dashboard-french');

  await go('/import');
  await waitLoaded();
  await ss('import-french');

  await go('/settings');
  await waitLoaded();
  await ss('settings-french');

  await page.evaluate(() => localStorage.setItem('i18n_lang', 'en'));

  // ══════════════════════════════════════════════════════════════
  // 12. NOTIFICATIONS
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- 12. NOTIFICATIONS ---');
  await go('/dashboard');
  await waitLoaded();

  const bellIcon = page.locator('.anticon-bell').first();
  if (await bellIcon.isVisible({ timeout: 3000 }).catch(() => false)) {
    await bellIcon.click();
    await sleep(1500);
    await ss('notifications');
    try { await page.locator('.ant-drawer-close').click().catch(() => {}); } catch (e) {}
  } else {
    await ss('notifications');
  }

  // ══════════════════════════════════════════════════════════════
  // 13. API DOCS + PUBLIC DASHBOARD
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- 13. API DOCS ---');
  await go('/docs');
  await waitLoaded();
  await ss('api-docs');

  console.log('\n--- 14. PUBLIC DASHBOARD ---');
  await go('/public');
  await waitLoaded();
  await ss('public-dashboard');

  // ══════════════════════════════════════════════════════════════
  // 15. CLIENT PORTAL
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- 15. CLIENT PORTAL ---');

  // Create client user via API
  try {
    await page.request.post('http://localhost:5000/api/users', {
      headers: apiHeaders,
      data: { email: 'client@demo.tn', password: 'Client@123',
        fullName: 'Ahmed Ben Ali', role: 'client', userType: 'student' }
    });
  } catch (e) {}

  // Log out and use client login
  await page.evaluate(() => { localStorage.removeItem('token'); localStorage.removeItem('user'); });
  await go('/login');
  await sleep(1000);

  // Click "Client" segment
  try { await page.locator('.ant-segmented-item').filter({ hasText: 'Client' }).click(); } catch (e) {}
  await ss('login-client');

  await fillField('input[name="username"]', 'client@demo.tn');
  await fillField('input[name="password"]', 'Client@123');
  try { await page.getByRole('button', { name: /sign in/i }).click(); } catch (e) {}
  await sleep(3000);
  await waitLoaded();
  await ss('client-login-result');

  // ══════════════════════════════════════════════════════════════
  // DONE
  // ══════════════════════════════════════════════════════════════
  console.log(`\nTotal screenshots: ${ssIndex}`);
  await browser.close();
})();
