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

async function ss(name) {
  ssIndex++;
  const filename = `figure-${String(ssIndex).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: path.join(RES, filename), fullPage: false, type: 'png' });
  console.log(`  ${filename}`);
}

async function go(url) {
  await page.goto('http://localhost:5173' + url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
}

async function loginAsAdmin() {
  await page.fill('#email', 'admin@iset-tozeur.tn');
  await page.fill('#password', 'Admin@123!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
}

async function clickPrimaryModalBtn() {
  // Click the primary button inside modal content
  const modal = page.locator('.ant-modal-content');
  const primaryBtn = modal.locator('.ant-btn-primary');
  if (await primaryBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await primaryBtn.click();
    await page.waitForTimeout(1500);
    return true;
  }
  return false;
}

async function importCsvViaUi(filePath, label) {
  console.log(`  Importing: ${label}`);
  
  // 1. Upload via Dragger
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null),
    page.click('.ant-upload-drag'),
  ]);
  if (!fileChooser) { console.log('  [FAIL] No file chooser'); return false; }
  await fileChooser.setFiles(filePath);
  await page.waitForTimeout(3000);
  console.log('  Uploaded, waiting for table row...');

  // 2. Wait for dataset row to appear with status "uploaded"
  await page.waitForTimeout(2000);

  // 3. Find the import button in the Actions column (svg[data-icon="import"])
  const importBtn = page.locator('table tbody tr').first().locator('button').filter({ has: page.locator('svg[data-icon="import"]') });
  if (await importBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await importBtn.click();
    console.log('  Opened mapping workspace');
  } else {
    console.log('  [FAIL] Could not find import button');
    return false;
  }
  await page.waitForTimeout(2000);

  // 4. Navigate through mapping modal steps (0 -> 1 -> 2 -> 3 -> Import)
  // Step 0: Review -> click Next (primary button)
  await ss(`mapping-step1-${label}`);
  await clickPrimaryModalBtn();
  await page.waitForTimeout(1000);
  
  // Step 1: Column Types -> click Next
  await ss(`mapping-step2-${label}`);
  await clickPrimaryModalBtn();
  await page.waitForTimeout(1000);

  // Step 2: Preview -> click Next
  await ss(`mapping-step3-${label}`);
  await clickPrimaryModalBtn();
  await page.waitForTimeout(1000);

  // Step 3: Import summary -> click Create & Import
  await ss(`mapping-step4-${label}`);
  await clickPrimaryModalBtn();
  await page.waitForTimeout(3000);
  console.log('  Import done');

  // Close success notification / wait for modal to close
  await page.waitForTimeout(1000);
  return true;
}

(async () => {
  console.log('Starting comprehensive screenshot session...\n');
  browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US' });
  page = await ctx.newPage();

  // ============ 1. LANDING & LOGIN ============
  console.log('=== 1. LANDING & LOGIN ===');
  // Set English locale
  await page.addInitScript(() => {
    localStorage.setItem('i18n_lang', 'en');
    localStorage.setItem('obs-theme', 'light');
    localStorage.setItem('obs-color-scheme', 'ocean');
  });
  await go('/');
  await page.waitForTimeout(1000);
  await ss('landing-page');

  // Actually login
  await go('/login');
  await page.waitForTimeout(1000);
  await ss('login-page');
  await loginAsAdmin();
  await ss('after-login');

  // ============ 2. EMPTY DASHBOARD ============
  console.log('\n=== 2. EMPTY DASHBOARD ===');
  await go('/dashboard');
  await page.waitForTimeout(3000);
  await ss('admin-dashboard-empty');

  // ============ 3. DATA IMPORT (ALL 6 CSVs VIA UI) ============
  console.log('\n=== 3. DATA IMPORT ===');
  await go('/import');
  await page.waitForTimeout(2000);
  await ss('data-import-page');

  const csvFiles = [
    { file: 'students.csv', name: 'students' },
    { file: 'courses_results.csv', name: 'courses_results' },
    { file: 'departments.csv', name: 'departments' },
    { file: 'alumni_employment.csv', name: 'alumni_employment' },
    { file: 'survey_feedback_2026.csv', name: 'survey_feedback_2026' },
    { file: 'employer_partners.csv', name: 'employer_partners' },
  ];

  for (const csv of csvFiles) {
    const ok = await importCsvViaUi(path.join(TEST_DATA, csv.file), csv.name);
    if (!ok) {
      console.log(`  [FAIL] Could not import ${csv.name}, stopping`);
      break;
    }
    await page.waitForTimeout(1000);
  }

  await ss('all-imports-complete');

  // ============ 4. DATABASE EXPLORER ============
  console.log('\n=== 4. DATABASE EXPLORER ===');
  await go('/explore');
  await page.waitForTimeout(3000);
  await ss('database-explorer');

  // Click first dataset card
  const cards = await page.locator('.ant-card, .ant-table-row').all();
  if (cards.length > 0) {
    try { await cards[0].click(); await page.waitForTimeout(3000); await ss('table-editor'); } catch(e) {}
  }

  // ============ 5. RELATIONS ============
  console.log('\n=== 5. RELATIONS ===');
  await go('/relations');
  await page.waitForTimeout(2000);
  await ss('foreign-keys-page');

  // ============ 6. SAVED QUERIES ============
  console.log('\n=== 6. SAVED QUERIES ===');
  await go('/queries');
  await page.waitForTimeout(2000);
  await ss('saved-queries');

  // ============ 7. CHARTS ============
  console.log('\n=== 7. CHARTS ===');
  await go('/charts');
  await page.waitForTimeout(3000);
  await ss('chart-builder-list');

  // Click "Create Chart"
  const createBtn = page.locator('button').filter({ hasText: /create|new/i }).first();
  if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await createBtn.click();
    await page.waitForTimeout(2000);
    await ss('chart-builder-new');
  }

  // ============ 8. DASHBOARDS ============
  console.log('\n=== 8. DASHBOARDS ===');
  await go('/dashboards');
  await page.waitForTimeout(3000);
  await ss('dashboard-list');

  // ============ 9. AI ANALYSIS ============
  console.log('\n=== 9. AI ANALYSIS ===');
  await go('/ai');
  await page.waitForTimeout(3000);
  await ss('ai-analysis-page');

  // Type a question
  const textarea = page.locator('textarea').first();
  if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
    await textarea.fill('Show me the average GPA by department');
    await page.waitForTimeout(500);
    await ss('ai-analysis-typed');

    // Send
    const sendBtn = page.locator('button[type="submit"], button').filter({ has: page.locator('svg[data-icon="send"], svg[data-icon="arrow-up"]') }).first();
    if (await sendBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sendBtn.click();
      await page.waitForTimeout(8000);
      await ss('ai-analysis-result');
    }
  }

  // ============ 10. SURVEYS ============
  console.log('\n=== 10. SURVEYS ===');
  await go('/surveys');
  await page.waitForTimeout(2000);
  await ss('survey-list');

  // Click Create button
  const newBtn = page.locator('button').filter({ hasText: /create|new/i }).first();
  if (await newBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await newBtn.click();
    await page.waitForTimeout(2000);
    await ss('survey-create');
  }

  // ============ 11. REPORTS ============
  console.log('\n=== 11. REPORTS ===');
  await go('/reports');
  await page.waitForTimeout(2000);
  await ss('reports-page');

  // ============ 12. USER MANAGEMENT ============
  console.log('\n=== 12. USER MANAGEMENT ===');
  await go('/users');
  await page.waitForTimeout(2000);
  await ss('user-management');

  // ============ 13. ROLE MANAGEMENT ============
  console.log('\n=== 13. ROLE MANAGEMENT ===');
  await go('/roles');
  await page.waitForTimeout(2000);
  await ss('role-management');

  // ============ 14. CLIENT MANAGEMENT ============
  console.log('\n=== 14. CLIENT MANAGEMENT ===');
  await go('/clients');
  await page.waitForTimeout(2000);
  await ss('client-management');

  // ============ 15. SETTINGS ============
  console.log('\n=== 15. SETTINGS ===');
  await go('/settings');
  await page.waitForTimeout(2000);
  await ss('settings-page');

  // ============ 16. THEMES ============
  console.log('\n=== 16. THEMES ===');
  await page.evaluate(() => { localStorage.setItem('obs-theme', 'dark'); localStorage.setItem('obs-color-scheme', 'forest'); });
  await go('/dashboard');
  await page.waitForTimeout(3000);
  await ss('theme-dark-forest');

  await page.evaluate(() => { localStorage.setItem('obs-theme', 'dark'); localStorage.setItem('obs-color-scheme', 'sunset'); });
  await go('/dashboard');
  await page.waitForTimeout(2000);
  await ss('theme-dark-sunset');

  await page.evaluate(() => { localStorage.setItem('obs-theme', 'light'); localStorage.setItem('obs-color-scheme', 'ocean'); });
  await go('/settings');
  await page.waitForTimeout(2000);
  await ss('settings-theme-options');

  // ============ 17. FRENCH ============
  console.log('\n=== 17. FRENCH ===');
  await page.evaluate(() => localStorage.setItem('i18n_lang', 'fr'));
  await go('/dashboard');
  await page.waitForTimeout(3000);
  await ss('dashboard-french');

  await go('/');
  await page.waitForTimeout(2000);
  await ss('landing-page-french');

  // ============ 18. NOTIFICATIONS ============
  console.log('\n=== 18. NOTIFICATIONS ===');
  await page.evaluate(() => localStorage.setItem('i18n_lang', 'en'));
  await go('/dashboard');
  await page.waitForTimeout(2000);
  // Click bell icon for notifications
  const bellBtn = page.locator('.ant-badge, [class*="bell"], [class*="notification"]').first();
  if (await bellBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await bellBtn.click();
    await page.waitForTimeout(1500);
    await ss('notifications-popup');
  } else {
    // Try clicking elements that might contain bell
    const maybeBell = page.locator('button').filter({ has: page.locator('svg') }).last();
    if (await maybeBell.isVisible().catch(() => false)) {
      await maybeBell.click();
      await page.waitForTimeout(1000);
    }
    await ss('notifications-popup');
  }

  // ============ 19. DOCS ============
  console.log('\n=== 19. DOCS ===');
  await go('/docs');
  await page.waitForTimeout(2000);
  await ss('docs-page');

  // ============ 20. PUBLIC DASHBOARD ============
  console.log('\n=== 20. PUBLIC DASHBOARD ===');
  await page.evaluate(() => localStorage.clear());
  await go('/public');
  await page.waitForTimeout(3000);
  await ss('public-dashboard');

  // ============ 21. PREPARE CHARTS/DASHBOARDS VIA API ============
  console.log('\n=== 21. PREPARING CHARTS ===');
  // Login as admin via API
  const resp = await page.request.post('http://localhost:5000/api/auth/login', {
    data: { email: 'admin@iset-tozeur.tn', password: 'Admin@123!' }
  });
  const body = await resp.json();
  const token = body.token;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Get list of datasets
  const dsResp = await page.request.get('http://localhost:5000/api/datasets', { headers });
  const dsBody = await dsResp.json();
  const datasets = dsBody.data || [];

  // Create charts for datasets (up to 10)
  const chartTypes = ['bar', 'line', 'pie', 'doughnut', 'horizontalBar', 'polarArea', 'radar', 'scatter', 'bubble', 'stackedBar'];
  for (let i = 0; i < datasets.length && i < chartTypes.length; i++) {
    const ds = datasets[i];
    if (!ds.table_name || ds.status !== 'imported') continue;
    try {
      const schemaR = await page.request.get(`http://localhost:5000/api/datasets/${ds.id}/schema`, { headers });
      const schemaBody = await schemaR.json();
      const schema = schemaBody.data || [];
      const cols = schema.map(c => c.column_name).filter(Boolean);
      if (cols.length < 2) continue;

      await page.request.post('http://localhost:5000/api/charts', { headers, data: {
        title: `${ds.name} - ${cols[0]} vs ${cols[1]}`,
        chartType: chartTypes[i % chartTypes.length],
        datasetId: ds.id,
        config: { xColumn: cols[0], yColumn: cols[1], aggregation: 'COUNT' }
      }});

      // Create a second chart with different config
      if (cols.length >= 2) {
        await page.request.post('http://localhost:5000/api/charts', { headers, data: {
          title: `${ds.name} - ${cols[1]} Distribution`,
          chartType: i % 2 === 0 ? 'pie' : 'doughnut',
          datasetId: ds.id,
          config: { xColumn: cols[1], aggregation: 'COUNT' }
        }});
      }
    } catch(e) { console.log(`  [WARN] Chart creation failed for dataset ${ds.id}:`); }
  }

  // Fetch all charts
  const chartsR = await page.request.get('http://localhost:5000/api/charts', { headers });
  const chartsBody = await chartsR.json();
  const charts = chartsBody.data || [];

  // Create dashboards
  if (charts.length > 0) {
    const layout1 = charts.slice(0, Math.min(8, charts.length)).map((c, i) => ({
      chartId: c.id, x: (i % 2) * 6, y: Math.floor(i / 2) * 5, w: 6, h: 5
    }));
    await page.request.post('http://localhost:5000/api/dashboards', { headers, data: {
      title: 'ISET Tozeur Performance Dashboard',
      description: 'Academic performance tracking, employment outcomes, and institutional KPIs',
      layout: layout1, isPublic: true
    }});

    if (charts.length > 4) {
      const layout2 = charts.slice(4, Math.min(10, charts.length)).map((c, i) => ({
        chartId: c.id, x: (i % 2) * 6, y: Math.floor(i / 2) * 5, w: 6, h: 5
      }));
      await page.request.post('http://localhost:5000/api/dashboards', { headers, data: {
        title: 'Alumni Employment Dashboard',
        description: 'Graduate career outcomes and employer partnerships analysis',
        layout: layout2, isPublic: true
      }});
    }
  }

  // Create a survey
  await page.request.post('http://localhost:5000/api/surveys', { headers, data: {
    title: 'Graduate Employment Survey 2026',
    description: 'Track professional integration of ISET Tozeur graduates',
    goal: 'Collect employment outcomes data from alumni',
    schema: JSON.stringify({
      title: 'Graduate Employment Survey 2026',
      description: 'Help us track your career progress after graduation',
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

  // Generate a report
  await page.request.post('http://localhost:5000/api/reports/generate', { headers, data: {
    title: 'ISET Tozeur Performance Analysis 2026',
    reportType: 'performance',
    content: JSON.stringify({
      sections: [
        { heading: 'Executive Summary', body: 'This report analyses academic performance, graduate employment, and institutional outcomes at ISET Tozeur for the academic year 2025-2026.' },
        { heading: 'Academic Performance', body: 'Students show strong performance across departments with an average GPA of 3.2/4.0. The Computer Science department leads with 3.5 average GPA.' },
        { heading: 'Employment Outcomes', body: '85% of graduates find employment within 6 months. Average starting salary is 1,200 TND/month. Top hiring sectors: IT (35%), Finance (25%), Education (20%).' },
        { heading: 'Recommendations', body: '1. Strengthen industry partnerships\n2. Expand internship programs\n3. Enhance entrepreneurship training\n4. Improve alumni tracking systems' }
      ]
    })
  }});

  // ============ 22. FINAL SCREENSHOTS WITH DATA ============
  console.log('\n=== 22. FINAL SCREENSHOTS ===');
  
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
  await ss('admin-dashboard-with-data');

  await go('/dashboards');
  await page.waitForTimeout(3000);
  await ss('dashboards-with-charts');

  // Open first dashboard
  const dashCard = page.locator('.ant-card').first();
  if (await dashCard.isVisible({ timeout: 3000 }).catch(() => false)) {
    await dashCard.click();
    await page.waitForTimeout(4000);
    await ss('dashboard-canvas-view');
  }

  await go('/charts');
  await page.waitForTimeout(3000);
  await ss('charts-library');

  await go('/explore');
  await page.waitForTimeout(2000);
  await ss('explorer-with-data');

  await go('/ai');
  await page.waitForTimeout(2000);
  await ss('ai-with-history');

  await go('/surveys');
  await page.waitForTimeout(2000);
  await ss('surveys-with-data');

  await go('/reports');
  await page.waitForTimeout(2000);
  await ss('reports-with-data');

  await go('/import');
  await page.waitForTimeout(2000);
  await ss('data-import-with-history');

  // Public dashboard view
  await page.evaluate(() => localStorage.clear());
  await go('/public');
  await page.waitForTimeout(3000);
  await ss('public-dashboard-with-data');

  // Switch to French
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
