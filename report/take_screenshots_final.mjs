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

async function importOneCsv(csvName) {
  const filePath = path.join(TEST_DATA, csvName + '.csv');
  console.log(`\n  Importing: ${csvName}`);

  // Upload via Dragger
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null),
    page.locator('.ant-upload-drag').click(),
  ]);
  if (!fileChooser) { console.log('  [FAIL] No file chooser'); return false; }
  await fileChooser.setFiles(filePath);
  await page.waitForTimeout(3000);
  console.log('  Upload complete');

  await ss(`upload-${csvName}`);

  // Wait for the new row to appear (find by file name)
  await page.waitForTimeout(2000);

  // Click the import button (first btn in Actions column of first row with uploaded status)
  const row = page.locator('.ant-table-row').filter({ hasText: csvName }).last();
  const importBtn = row.locator('td:last-child button').first();
  if (!(await importBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
    console.log('  [FAIL] Import button not visible');
    return false;
  }
  await importBtn.click();
  await page.waitForTimeout(3000);
  console.log('  Mapping workspace opened');

  // Navigate 4 steps of the mapping modal
  const modal = page.locator('.ant-modal-content');

  // Step 0: Review -> Next
  await ss(`mapping-${csvName}-step1-review`);
  await modal.locator('.ant-btn-primary').click();
  await page.waitForTimeout(1500);

  // Step 1: Column Types -> Next
  await ss(`mapping-${csvName}-step2-types`);
  await modal.locator('.ant-btn-primary').click();
  await page.waitForTimeout(1500);

  // Step 2: Preview -> Next
  await ss(`mapping-${csvName}-step3-preview`);
  await modal.locator('.ant-btn-primary').click();
  await page.waitForTimeout(1500);

  // Step 3: Import config -> Create & Import
  await ss(`mapping-${csvName}-step4-import`);
  await modal.locator('.ant-btn-primary').click();
  await page.waitForTimeout(3000);

  // Wait for modal to close and success message
  await page.waitForTimeout(2000);
  console.log('  Import done');
  return true;
}

(async () => {
  console.log('=== COMPREHENSIVE SCREENSHOT SESSION ===\n');

  browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US' });
  page = await ctx.newPage();

  // ========== 1. LANDING PAGE ==========
  console.log('--- 1. LANDING ---');
  await page.addInitScript(() => {
    localStorage.setItem('i18n_lang', 'en');
    localStorage.setItem('obs-theme', 'light');
    localStorage.setItem('obs-color-scheme', 'ocean');
  });
  await go('/');
  await ss('landing-page');

  // ========== 2. LOGIN ==========
  console.log('\n--- 2. LOGIN ---');
  await go('/login');
  await page.waitForTimeout(1000);
  await ss('login-form');
  await loginAsAdmin();
  await ss('after-login-dashboard');

  // ========== 3. EMPTY DASHBOARD ==========
  console.log('\n--- 3. DASHBOARD ---');
  await go('/dashboard');
  await page.waitForTimeout(2000);
  await ss('admin-dashboard-empty');

  // ========== 4. DATA IMPORT ==========
  console.log('\n--- 4. DATA IMPORT ---');
  await go('/import');
  await page.waitForTimeout(2000);
  await ss('data-import-empty');

  const csvFiles = ['students', 'courses_results', 'departments', 'alumni_employment', 'survey_feedback_2026', 'employer_partners'];
  for (const name of csvFiles) {
    const ok = await importOneCsv(name);
    if (!ok) { console.log(`  [FAIL] Stopping at ${name}`); break; }
  }

  await page.waitForTimeout(1000);
  await ss('all-imports-complete');

  // ========== 5. DATABASE EXPLORER ==========
  console.log('\n--- 5. DATABASE EXPLORER ---');
  await go('/explore');
  await page.waitForTimeout(3000);
  await ss('database-explorer');

  // Click first dataset card
  try {
    const firstCard = page.locator('.ant-card, .ant-table-row').first();
    if (await firstCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstCard.click();
      await page.waitForTimeout(3000);
      await ss('table-editor');
    }
  } catch (e) {}

  // ========== 6. RELATIONS ==========
  console.log('\n--- 6. RELATIONS ---');
  await go('/relations');
  await page.waitForTimeout(2000);
  await ss('foreign-keys');

  // ========== 7. SAVED QUERIES ==========
  console.log('\n--- 7. QUERIES ---');
  await go('/queries');
  await page.waitForTimeout(2000);
  await ss('saved-queries');

  // ========== 8. CHARTS ==========
  console.log('\n--- 8. CHARTS ---');
  await go('/charts');
  await page.waitForTimeout(3000);
  await ss('chart-builder');

  // Click Create Chart
  try {
    const createBtn = page.locator('button').filter({ hasText: /create|new/i }).first();
    if (await createBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(2000);
      await ss('chart-create-form');
    }
  } catch (e) {}

  // ========== 9. DASHBOARDS ==========
  console.log('\n--- 9. DASHBOARDS ---');
  await go('/dashboards');
  await page.waitForTimeout(3000);
  await ss('dashboard-list');

  // ========== 10. AI ANALYSIS ==========
  console.log('\n--- 10. AI ANALYSIS ---');
  await go('/ai');
  await page.waitForTimeout(3000);
  await ss('ai-analysis');

  const textarea = page.locator('textarea').first();
  if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
    await textarea.fill('Show me the average GPA by department');
    await ss('ai-query-typed');

    const sendBtn = page.locator('button').filter({ has: page.locator('svg[data-icon="send"], svg[data-icon="arrow-up"]') }).first();
    if (await sendBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sendBtn.click();
      await page.waitForTimeout(8000);
      await ss('ai-query-result');
    }
  }

  // ========== 11. SURVEYS ==========
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

  // ========== 12. REPORTS ==========
  console.log('\n--- 12. REPORTS ---');
  await go('/reports');
  await page.waitForTimeout(2000);
  await ss('reports');

  // ========== 13. USER MANAGEMENT ==========
  console.log('\n--- 13. USERS ---');
  await go('/users');
  await page.waitForTimeout(2000);
  await ss('user-management');

  // ========== 14. ROLE MANAGEMENT ==========
  console.log('\n--- 14. ROLES ---');
  await go('/roles');
  await page.waitForTimeout(2000);
  await ss('role-management');

  // ========== 15. CLIENT MANAGEMENT ==========
  console.log('\n--- 15. CLIENTS ---');
  await go('/clients');
  await page.waitForTimeout(2000);
  await ss('client-management');

  // ========== 16. SETTINGS ==========
  console.log('\n--- 16. SETTINGS ---');
  await go('/settings');
  await page.waitForTimeout(2000);
  await ss('settings');

  // ========== 17. THEMES ==========
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

  // ========== 18. FRENCH ==========
  console.log('\n--- 18. FRENCH ---');
  await page.evaluate(() => localStorage.setItem('i18n_lang', 'fr'));
  await go('/dashboard');
  await page.waitForTimeout(3000);
  await ss('dashboard-french');

  await go('/settings');
  await page.waitForTimeout(2000);
  await ss('settings-french');

  // ========== 19. NOTIFICATIONS ==========
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

  // ========== 20. DOCS ==========
  console.log('\n--- 20. DOCS ---');
  await go('/docs');
  await page.waitForTimeout(2000);
  await ss('docs-api');

  // ========== 21. PUBLIC DASHBOARD ==========
  console.log('\n--- 21. PUBLIC ---');
  await page.evaluate(() => localStorage.clear());
  await go('/public');
  await page.waitForTimeout(3000);
  await ss('public-dashboard');

  // ========== 22. CREATE DATA VIA API ==========
  console.log('\n--- 22. CREATING CHARTS/DASHBOARDS ---');

  // Get admin token
  const resp = await page.request.post('http://localhost:5000/api/auth/login', {
    data: { email: 'admin@iset-tozeur.tn', password: 'Admin@123!' }
  });
  const authBody = await resp.json();
  token = authBody.token;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Create charts for each dataset
  const dsResp = await page.request.get('http://localhost:5000/api/datasets', { headers });
  const datasets = (await dsResp.json()).data || [];
  const chartTypes = ['bar', 'line', 'pie', 'doughnut', 'horizontalBar', 'polarArea', 'radar', 'scatter', 'bubble'];

  for (let i = 0; i < datasets.length; i++) {
    const ds = datasets[i];
    if (!ds.table_name || ds.status !== 'imported') continue;
    try {
      const schemaR = await page.request.get(`http://localhost:5000/api/datasets/${ds.id}/schema`, { headers });
      const schema = (await schemaR.json()).data || [];
      const cols = schema.map(c => c.column_name).filter(Boolean);
      if (cols.length < 2) continue;

      await page.request.post('http://localhost:5000/api/charts', { headers, data: {
        title: `${ds.name} - ${cols[0]} vs ${cols[1]}`,
        chartType: chartTypes[i % chartTypes.length],
        datasetId: ds.id,
        config: { xColumn: cols[0], yColumn: cols[1], aggregation: 'AVG' }
      }});

      await page.request.post('http://localhost:5000/api/charts', { headers, data: {
        title: `${ds.name} - ${cols[1]} Distribution`,
        chartType: i % 2 === 0 ? 'pie' : 'doughnut',
        datasetId: ds.id,
        config: { xColumn: cols[1], aggregation: 'COUNT' }
      }});
    } catch (e) { console.log(`  [WARN] Chart ${i} failed`); }
  }

  // Create dashboards
  const chartsR = await page.request.get('http://localhost:5000/api/charts', { headers });
  const charts = (await chartsR.json()).data || [];
  console.log(`  Created ${charts.length} charts`);

  if (charts.length > 0) {
    const slice1 = charts.slice(0, Math.min(6, charts.length));
    await page.request.post('http://localhost:5000/api/dashboards', { headers, data: {
      title: 'ISET Tozeur Performance Dashboard',
      description: 'Academic performance, employment tracking, and institutional KPIs',
      layout: slice1.map((c, i) => ({ chartId: c.id, x: (i % 2) * 6, y: Math.floor(i / 2) * 5, w: 6, h: 5 })),
      isPublic: true
    }});

    if (charts.length > 3) {
      const slice2 = charts.slice(3, Math.min(9, charts.length));
      await page.request.post('http://localhost:5000/api/dashboards', { headers, data: {
        title: 'Alumni Employment Dashboard',
        description: 'Graduate career outcomes and employer partnerships',
        layout: slice2.map((c, i) => ({ chartId: c.id, x: (i % 2) * 6, y: Math.floor(i / 2) * 5, w: 6, h: 5 })),
        isPublic: true
      }});
    }
  }

  // Create survey
  await page.request.post('http://localhost:5000/api/surveys', { headers, data: {
    title: 'Graduate Employment Survey 2026',
    description: 'Track professional integration of ISET Tozeur graduates',
    goal: 'Collect employment outcomes data from alumni to improve training programs',
    schema: JSON.stringify({
      title: 'Graduate Employment Survey 2026',
      description: 'Help us track your career progress after graduation from ISET Tozeur',
      fields: [
        { id: 'f1', type: 'text', label: 'Full Name', required: true },
        { id: 'f2', type: 'email', label: 'Email', required: true },
        { id: 'f3', type: 'select', label: 'Employment Status', required: true, options: ['Employed','Unemployed','Self-employed','Further Study'] },
        { id: 'f4', type: 'text', label: 'Employer Name', required: false },
        { id: 'f5', type: 'number', label: 'Monthly Salary (TND)', required: false },
        { id: 'f6', type: 'radio', label: 'Job Related to Degree?', required: true, options: ['Yes','Partially','No'] },
        { id: 'f7', type: 'rating', label: 'Overall Satisfaction', required: true },
        { id: 'f8', type: 'textarea', label: 'Additional Comments', required: false }
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
        { heading: 'Executive Summary', body: 'This report analyses academic performance, graduate employment, and institutional outcomes at ISET Tozeur for the academic year 2025-2026.' },
        { heading: 'Academic Performance', body: 'Students show strong performance across departments with an average GPA of 3.2/4.0. The Computer Science department leads with 3.5 average GPA.' },
        { heading: 'Employment Outcomes', body: '85% of graduates find employment within 6 months. Average starting salary is 1,200 TND/month. Top hiring sectors: IT (35%), Finance (25%), Education (20%).' },
        { heading: 'Recommendations', body: '1. Strengthen industry partnerships in IT and Finance\n2. Expand internship programs for 3rd year students\n3. Enhance entrepreneurship training workshops\n4. Improve alumni tracking through regular surveys' }
      ]
    })
  }});

  // ========== 23. FINAL SCREENSHOTS ==========
  console.log('\n--- 23. FINAL SCREENSHOTS ---');

  // Restore admin session
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

  // Open first dashboard
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

  // Public view
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
