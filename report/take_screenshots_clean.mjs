import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RES = path.join(__dirname, 'res');
const TEST_DATA = path.join(__dirname, '..', 'test-data', 'raw');
fs.mkdirSync(RES, { recursive: true });

let browser, page, token;
let ssIndex = 0;

async function ss(name) {
  ssIndex++;
  const filename = `figure-${String(ssIndex).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: path.join(RES, filename), fullPage: false, type: 'png' });
  console.log(`  ${filename}`);
}

async function go(url) {
  await page.goto('http://localhost:5173' + url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1500);
}

async function loginAsAdmin() {
  await page.fill('#email', 'admin@iset-tozeur.tn');
  await page.fill('#password', 'Admin@123!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
}

async function uploadFile(filePath) {
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 10000 }),
    page.locator('.ant-upload-drag').click(),
  ]);
  if (!fileChooser) return false;
  await fileChooser.setFiles(filePath);
  await page.waitForTimeout(4000);
  return true;
}

async function waitForModal() {
  // Wait up to 15s for modal body to appear (preview API call may take time)
  for (let i = 0; i < 15; i++) {
    const visible = await page.locator('.ant-modal.ant-zoom-appear, .ant-modal.ant-zoom-appear-done').isVisible().catch(() => false);
    if (visible) return await page.locator('.ant-modal').isVisible();
    const body = await page.locator('.ant-modal-body').isVisible().catch(() => false);
    if (body) return true;
    await page.waitForTimeout(1000);
  }
  return false;
}

async function clickModalNext(stepIndex, ssLabel) {
  const modal = page.locator('.ant-modal');
  // Wait for primary button
  const primaryBtn = modal.locator('.ant-btn-primary');
  for (let i = 0; i < 10; i++) {
    const v = await primaryBtn.isVisible().catch(() => false);
    if (v) break;
    await page.waitForTimeout(1000);
  }
  await ss(ssLabel);
  const btnText = await primaryBtn.textContent();
  console.log(`    Step ${stepIndex}: clicking "${btnText?.trim()}"`);
  await primaryBtn.click();
  await page.waitForTimeout(2000);
}

async function importOneCsv(csvName) {
  const filePath = path.join(TEST_DATA, csvName + '.csv');
  console.log(`\n  Importing: ${csvName}`);

  // Upload file
  const uploaded = await uploadFile(filePath);
  if (!uploaded) { console.log('  [FAIL] Upload failed'); return false; }
  console.log('  File uploaded');
  await ss(`upload-${csvName}`);

  // Wait for dataset row to appear
  await page.waitForTimeout(2000);

  // Click import button in Actions column of first uploaded row
  // Find the button with import icon (svg[data-icon="import"])
  const importBtns = page.locator('.ant-table-row button').filter({ has: page.locator('svg[data-icon="import"]') });
  const importBtn = importBtns.first();
  if (!(await importBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
    console.log('  [FAIL] Import button not found');
    return false;
  }
  await importBtn.click();
  console.log('  Import button clicked, waiting for modal...');

  // Wait for modal to appear with content
  const modalOpened = await waitForModal();
  if (!modalOpened) {
    console.log('  [FAIL] Modal did not appear');
    return false;
  }
  console.log('  Modal opened');

  // Step 0: Review -> Next
  await clickModalNext(0, `mapping-${csvName}-step1-review`);

  // Step 1: Column Types -> Next
  await clickModalNext(1, `mapping-${csvName}-step2-types`);

  // Step 2: Preview -> Next
  await clickModalNext(2, `mapping-${csvName}-step3-preview`);

  // Step 3: Import config -> Create & Import
  await clickModalNext(3, `mapping-${csvName}-step4-import`);

  // Wait for import to complete and modal to close
  await page.waitForTimeout(3000);
  console.log('  Import complete');
  return true;
}

(async () => {
  console.log('=== FIXED SCREENSHOT SESSION ===\n');

  browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US' });
  page = await ctx.newPage();

  // Set defaults
  await page.addInitScript(() => {
    localStorage.setItem('i18n_lang', 'en');
    localStorage.setItem('obs-theme', 'light');
    localStorage.setItem('obs-color-scheme', 'ocean');
  });

  // ====== 1. LANDING ======
  console.log('--- 1. LANDING ---');
  await go('/');
  await ss('landing-page');

  // ====== 2. LOGIN ======
  console.log('\n--- 2. LOGIN ---');
  await go('/login');
  await ss('login-form');
  await loginAsAdmin();
  await ss('after-login-dashboard');

  // ====== 3. EMPTY DASHBOARD ======
  console.log('\n--- 3. DASHBOARD (empty) ---');
  await go('/dashboard');
  await page.waitForTimeout(2000);
  await ss('admin-dashboard-empty');

  // ====== 4. DATA IMPORT ======
  console.log('\n--- 4. DATA IMPORT ---');
  await go('/import');
  await page.waitForTimeout(2000);
  await ss('data-import-empty');

  const csvFiles = ['students', 'courses_results', 'departments', 'alumni_employment', 'survey_feedback_2026', 'employer_partners'];
  for (const name of csvFiles) {
    const ok = await importOneCsv(name);
    if (!ok) { console.log(`  [FAIL] Stopping at ${name}`); break; }
  }

  await ss('all-imports-complete');

  // ====== 5. DATABASE EXPLORER ======
  console.log('\n--- 5. DB EXPLORER ---');
  await go('/explore');
  await page.waitForTimeout(3000);
  await ss('database-explorer');

  try {
    const firstCard = page.locator('.ant-card, .ant-collapse-header, .explore-card').first();
    if (await firstCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstCard.click();
      await page.waitForTimeout(3000);
      await ss('table-editor');
    }
  } catch (e) { console.log('  [WARN] Could not open table editor'); }

  // ====== 6. RELATIONS ======
  console.log('\n--- 6. RELATIONS ---');
  await go('/relations');
  await page.waitForTimeout(2000);
  await ss('foreign-keys');

  // ====== 7. SAVED QUERIES ======
  console.log('\n--- 7. QUERIES ---');
  await go('/queries');
  await page.waitForTimeout(2000);
  await ss('saved-queries');

  // ====== 8. CHARTS ======
  console.log('\n--- 8. CHARTS ---');
  await go('/charts');
  await page.waitForTimeout(3000);
  await ss('chart-builder');

  try {
    const createBtn = page.locator('button').filter({ hasText: /create|new/i }).first();
    if (await createBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(2000);
      await ss('chart-create-form');
    }
  } catch (e) {}

  // ====== 9. DASHBOARDS ======
  console.log('\n--- 9. DASHBOARDS ---');
  await go('/dashboards');
  await page.waitForTimeout(3000);
  await ss('dashboard-list');

  // ====== 10. AI ANALYSIS ======
  console.log('\n--- 10. AI ---');
  await go('/ai');
  await page.waitForTimeout(3000);
  await ss('ai-analysis');

  const ta = page.locator('textarea').first();
  if (await ta.isVisible({ timeout: 3000 }).catch(() => false)) {
    await ta.fill('Show me the average GPA by department');
    await ss('ai-query-typed');

    const sendBtn = page.locator('button').filter({ has: page.locator('svg[data-icon="send"], svg[data-icon="arrow-up"]') }).first();
    if (await sendBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sendBtn.click();
      await page.waitForTimeout(8000);
      await ss('ai-query-result');
    }
  }

  // ====== 11. SURVEYS ======
  console.log('\n--- 11. SURVEYS ---');
  await go('/surveys');
  await page.waitForTimeout(2000);
  await ss('survey-list');

  try {
    const newBtn = page.locator('button').filter({ hasText: /create|new/i }).first();
    if (await newBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await newBtn.click();
      await page.waitForTimeout(2000);
      await ss('survey-create');
    }
  } catch (e) {}

  // ====== 12. REPORTS ======
  console.log('\n--- 12. REPORTS ---');
  await go('/reports');
  await page.waitForTimeout(2000);
  await ss('reports');

  // ====== 13. USERS ======
  console.log('\n--- 13. USERS ---');
  await go('/users');
  await page.waitForTimeout(2000);
  await ss('user-management');

  // ====== 14. ROLES ======
  console.log('\n--- 14. ROLES ---');
  await go('/roles');
  await page.waitForTimeout(2000);
  await ss('role-management');

  // ====== 15. CLIENTS ======
  console.log('\n--- 15. CLIENTS ---');
  await go('/clients');
  await page.waitForTimeout(2000);
  await ss('client-management');

  // ====== 16. SETTINGS ======
  console.log('\n--- 16. SETTINGS ---');
  await go('/settings');
  await page.waitForTimeout(2000);
  await ss('settings');

  // ====== 17. THEMES ======
  console.log('\n--- 17. THEMES ---');
  await page.evaluate(() => {
    localStorage.setItem('obs-theme', 'dark');
    localStorage.setItem('obs-color-scheme', 'forest');
  });
  await go('/dashboard');
  await page.waitForTimeout(3000);
  await ss('theme-dark-forest');

  await page.evaluate(() => {
    localStorage.setItem('obs-theme', 'dark');
    localStorage.setItem('obs-color-scheme', 'sunset');
  });
  await go('/dashboard');
  await page.waitForTimeout(2000);
  await ss('theme-dark-sunset');

  await page.evaluate(() => {
    localStorage.setItem('obs-theme', 'light');
    localStorage.setItem('obs-color-scheme', 'ocean');
  });

  // ====== 18. FRENCH ======
  console.log('\n--- 18. FRENCH ---');
  await page.evaluate(() => localStorage.setItem('i18n_lang', 'fr'));
  await go('/dashboard');
  await page.waitForTimeout(3000);
  await ss('dashboard-french');

  await go('/settings');
  await page.waitForTimeout(2000);
  await ss('settings-french');

  // ====== 19. NOTIFICATIONS ======
  console.log('\n--- 19. NOTIFICATIONS ---');
  await page.evaluate(() => localStorage.setItem('i18n_lang', 'en'));
  await go('/dashboard');
  await page.waitForTimeout(2000);

  const bellBtns = page.locator('button').filter({ has: page.locator('.ant-badge, .ant-scroll-number') });
  if (await bellBtns.count() > 0) {
    await bellBtns.first().click();
    await page.waitForTimeout(1500);
  }
  await ss('notifications');

  // ====== 20. DOCS ======
  console.log('\n--- 20. DOCS ---');
  await go('/docs');
  await page.waitForTimeout(2000);
  await ss('docs-api');

  // ====== 21. PUBLIC DASHBOARD (no auth) ======
  console.log('\n--- 21. PUBLIC (no auth) ---');
  await page.evaluate(() => localStorage.clear());
  await go('/public');
  await page.waitForTimeout(3000);
  await ss('public-dashboard');

  // ====== 22. PREPARE CHARTS/DASHBOARDS via API ======
  console.log('\n--- 22. PREPARING DATA ---');
  const resp = await page.request.post('http://localhost:5000/api/auth/login', {
    data: { email: 'admin@iset-tozeur.tn', password: 'Admin@123!' }
  });
  token = (await resp.json()).token;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Get datasets
  const dsR = await page.request.get('http://localhost:5000/api/datasets', { headers });
  const datasets = (await dsR.json()).data || [];
  console.log('  Datasets:', datasets.length);

  // Create charts
  const types = ['bar', 'line', 'pie', 'doughnut', 'horizontalBar', 'polarArea', 'radar', 'scatter'];
  for (let i = 0; i < datasets.length; i++) {
    const ds = datasets[i];
    if (!ds.table_name || ds.status !== 'imported') continue;
    try {
      const sR = await page.request.get(`http://localhost:5000/api/datasets/${ds.id}/schema`, { headers });
      const cols = ((await sR.json()).data || []).map(c => c.column_name).filter(Boolean);
      if (cols.length < 2) continue;

      await page.request.post('http://localhost:5000/api/charts', { headers, data: {
        title: `${ds.name} - ${cols[0]} by ${cols[1]}`,
        chartType: types[i % types.length],
        datasetId: ds.id,
        config: { xColumn: cols[0], yColumn: cols[1], aggregation: 'COUNT' }
      }});

      await page.request.post('http://localhost:5000/api/charts', { headers, data: {
        title: `${ds.name} - ${cols[1]} Distribution`,
        chartType: i % 2 === 0 ? 'pie' : 'doughnut',
        datasetId: ds.id,
        config: { xColumn: cols[1], aggregation: 'COUNT' }
      }});
    } catch(e) {}
  }

  // Create dashboards
  const cR = await page.request.get('http://localhost:5000/api/charts', { headers });
  const charts = (await cR.json()).data || [];
  console.log('  Charts:', charts.length);

  if (charts.length > 0) {
    const s1 = charts.slice(0, Math.min(6, charts.length));
    await page.request.post('http://localhost:5000/api/dashboards', { headers, data: {
      title: 'ISET Tozeur Performance Dashboard',
      description: 'Academic performance and institutional KPIs',
      layout: s1.map((c, i) => ({ chartId: c.id, x: (i % 2) * 6, y: Math.floor(i / 2) * 5, w: 6, h: 5 })),
      isPublic: true
    }});

    if (charts.length > 3) {
      const s2 = charts.slice(3, Math.min(9, charts.length));
      await page.request.post('http://localhost:5000/api/dashboards', { headers, data: {
        title: 'Alumni Employment Dashboard',
        description: 'Graduate career outcomes',
        layout: s2.map((c, i) => ({ chartId: c.id, x: (i % 2) * 6, y: Math.floor(i / 2) * 5, w: 6, h: 5 })),
        isPublic: true
      }});
    }
  }

  // Create survey
  await page.request.post('http://localhost:5000/api/surveys', { headers, data: {
    title: 'Graduate Employment Survey 2026',
    description: 'Track professional integration of ISET Tozeur graduates',
    goal: 'Collect employment outcomes data',
    schema: JSON.stringify({
      title: 'Graduate Employment Survey 2026',
      fields: [
        { id: 'f1', type: 'text', label: 'Full Name', required: true },
        { id: 'f2', type: 'email', label: 'Email', required: true },
        { id: 'f3', type: 'select', label: 'Employment Status', required: true, options: ['Employed','Unemployed','Self-employed','Further Study'] },
        { id: 'f4', type: 'text', label: 'Employer', required: false },
        { id: 'f5', type: 'number', label: 'Monthly Salary (TND)', required: false },
        { id: 'f6', type: 'radio', label: 'Job Related to Degree?', required: true, options: ['Yes','Partially','No'] },
        { id: 'f7', type: 'rating', label: 'Overall Satisfaction', required: true },
        { id: 'f8', type: 'textarea', label: 'Comments', required: false }
      ]
    }),
    isPublic: true,
    clientTypes: ['student', 'alumni']
  }});

  // Create report
  await page.request.post('http://localhost:5000/api/reports/generate', { headers, data: {
    title: 'ISET Tozeur Performance Analysis 2026',
    reportType: 'performance',
    content: JSON.stringify({
      sections: [
        { heading: 'Executive Summary', body: 'Analysis of academic performance and graduate employment at ISET Tozeur for 2025-2026.' },
        { heading: 'Academic Performance', body: 'Average GPA of 3.2/4.0 across departments. Computer Science leads with 3.5.' },
        { heading: 'Employment Outcomes', body: '85% employment within 6 months. Average salary 1,200 TND/month. Top sectors: IT (35%), Finance (25%), Education (20%).' },
        { heading: 'Recommendations', body: '1. Strengthen industry partnerships\n2. Expand internships\n3. Entrepreneurship training\n4. Alumni tracking surveys' }
      ]
    })
  }});

  // ====== 23. FINAL (with data) ======
  console.log('\n--- 23. FINAL SCREENSHOTS ---');
  await page.evaluate((t) => {
    localStorage.clear();
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify({
      id: 1, email: 'admin@iset-tozeur.tn', fullName: 'Super Administrator',
      role: 'super_admin', userType: 'staff'
    }));
    localStorage.setItem('i18n_lang', 'en');
    localStorage.setItem('obs-theme', 'light');
    localStorage.setItem('obs-color-scheme', 'ocean');
  }, token);

  await go('/dashboard');
  await page.waitForTimeout(3000);
  await ss('dashboard-with-data');

  await go('/dashboards');
  await page.waitForTimeout(3000);
  await ss('dashboards-gallery');

  try {
    const dc = page.locator('.ant-card').first();
    if (await dc.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dc.click();
      await page.waitForTimeout(5000);
      await ss('dashboard-canvas');
    }
  } catch (e) {}

  await go('/charts');
  await page.waitForTimeout(3000);
  await ss('charts-library');

  await go('/explore');
  await page.waitForTimeout(2000);
  await ss('explorer-tables');

  await go('/ai');
  await page.waitForTimeout(2000);
  await ss('ai-chat-history');

  await go('/surveys');
  await page.waitForTimeout(2000);
  await ss('surveys-list');

  await go('/reports');
  await page.waitForTimeout(2000);
  await ss('reports-list');

  await go('/import');
  await page.waitForTimeout(2000);
  await ss('import-history');

  await go('/users');
  await page.waitForTimeout(2000);
  await ss('users-list');

  // Public dashboard
  await page.evaluate(() => localStorage.clear());
  await go('/public');
  await page.waitForTimeout(3000);
  await ss('public-dashboard-with-data');

  // French with data
  await page.evaluate((t) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify({
      id: 1, email: 'admin@iset-tozeur.tn', fullName: 'Super Administrator',
      role: 'super_admin', userType: 'staff'
    }));
    localStorage.setItem('i18n_lang', 'fr');
    localStorage.setItem('obs-theme', 'light');
    localStorage.setItem('obs-color-scheme', 'ocean');
  }, token);
  await go('/dashboard');
  await page.waitForTimeout(3000);
  await ss('dashboard-french-with-data');

  console.log(`\n=== COMPLETE: ${ssIndex} screenshots ===`);
  await browser.close();
})();
