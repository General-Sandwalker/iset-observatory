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

async function waitAndClick(selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout, state: 'visible' });
    await page.click(selector);
    await page.waitForTimeout(500);
    return true;
  } catch {
    console.log(`  [WARN] Could not click: ${selector}`);
    return false;
  }
}

async function loginAsAdmin() {
  await go('/login');
  await page.fill('input[type="email"], input[id="email"], input[placeholder*="email" i]', 'admin@iset-tozeur.tn');
  await page.fill('input[type="password"]', 'Admin@123!');
  await waitAndClick('button[type="submit"], .ant-btn-primary');
  await page.waitForTimeout(3000);
}

async function setLang(lang) {
  await page.evaluate((l) => localStorage.setItem('i18n_lang', l), lang);
}

async function setTheme(theme, scheme) {
  await page.evaluate(([t, s]) => {
    localStorage.setItem('obs-theme', t);
    localStorage.setItem('obs-color-scheme', s);
  }, [theme, scheme]);
}

async function navigateAndWait(menuText) {
  // Click menu item by text
  const menuItems = await page.locator('.ant-menu-item, .ant-menu-item a, .ant-layout-sider a').all();
  for (const item of menuItems) {
    const text = await item.textContent();
    if (text.toLowerCase().includes(menuText.toLowerCase())) {
      await item.click();
      await page.waitForTimeout(2500);
      return true;
    }
  }
  // Try broader search
  await page.evaluate((t) => {
    const links = document.querySelectorAll('a, button, span');
    for (const el of links) {
      if (el.textContent?.toLowerCase().includes(t.toLowerCase())) {
        el.click(); break;
      }
    }
  }, menuText);
  await page.waitForTimeout(2500);
}

async function uploadFileViaDragger(filePath) {
  // Setup file chooser before triggering
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null),
    page.click('.ant-upload-drag, .ant-upload-dragger, .ant-upload-select'),
  ]);
  if (fileChooser) {
    await fileChooser.setFiles(filePath);
    await page.waitForTimeout(2000);
    return true;
  }
  return false;
}

async function clickStepButton(text) {
  const buttons = await page.locator('button').all();
  for (const btn of buttons) {
    const t = await btn.textContent();
    if (t.toLowerCase().includes(text.toLowerCase())) {
      await btn.click();
      await page.waitForTimeout(800);
      return true;
    }
  }
  return false;
}

(async () => {
  console.log('Starting comprehensive screenshot session...\n');
  browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US' });
  page = await ctx.newPage();

  // ============ 1. LOGIN ============
  console.log('=== 1. LOGIN ===');
  await go('/');
  await setLang('en');
  await setTheme('light', 'ocean');
  await go('/');
  await ss('landing-page');

  await loginAsAdmin();
  await ss('login-process');

  // ============ 2. DASHBOARD ============
  console.log('\n=== 2. DASHBOARD ===');
  await go('/dashboard');
  await page.waitForTimeout(3000);
  await ss('admin-dashboard-empty');

  // ============ 3. DATA IMPORT ============
  console.log('\n=== 3. DATA IMPORT ===');
  await go('/import');
  await page.waitForTimeout(2000);
  await ss('data-import-page');

  // Import students.csv
  const studentsFile = path.join(TEST_DATA, 'students.csv');
  console.log(`  Uploading: students.csv`);
  await uploadFileViaDragger(studentsFile);
  await page.waitForTimeout(2000);
  await ss('after-student-upload');

  // Open mapping workspace (click the import/preview button)
  await waitAndClick('.ant-btn:has(svg[data-icon="import"])');
  await page.waitForTimeout(3000);
  await ss('mapping-modal-step1');

  // Step 1 -> Step 2 (Next: Column Types)
  await clickStepButton('Next');
  await page.waitForTimeout(1000);
  await ss('mapping-modal-step2');

  // Step 2 -> Step 3 (Next: Preview)
  await clickStepButton('Next');
  await page.waitForTimeout(1000);
  await ss('mapping-modal-step3');

  // Step 3 -> Step 4 (Next: Import)
  await clickStepButton('Next');
  await page.waitForTimeout(1000);
  await ss('mapping-modal-step4');

  // Click "Create & Import"
  await clickStepButton('Import');
  await page.waitForTimeout(3000);
  await ss('import-complete-students');

  // Import courses_results.csv
  console.log('  Uploading: courses_results.csv');
  await uploadFileViaDragger(path.join(TEST_DATA, 'courses_results.csv'));
  await page.waitForTimeout(2000);
  await waitAndClick('.ant-btn:has(svg[data-icon="import"])');
  await page.waitForTimeout(2000);
  // Quick import (click next 3 times)
  for (const btnText of ['Next', 'Next', 'Next']) {
    await clickStepButton(btnText);
    await page.waitForTimeout(500);
  }
  await clickStepButton('Import');
  await page.waitForTimeout(3000);

  // Import departments.csv
  console.log('  Uploading: departments.csv');
  await uploadFileViaDragger(path.join(TEST_DATA, 'departments.csv'));
  await page.waitForTimeout(2000);
  await waitAndClick('.ant-btn:has(svg[data-icon="import"])');
  await page.waitForTimeout(2000);
  for (const btnText of ['Next', 'Next', 'Next']) {
    await clickStepButton(btnText);
    await page.waitForTimeout(500);
  }
  await clickStepButton('Import');
  await page.waitForTimeout(3000);

  // Import alumni_employment.csv
  console.log('  Uploading: alumni_employment.csv');
  await uploadFileViaDragger(path.join(TEST_DATA, 'alumni_employment.csv'));
  await page.waitForTimeout(2000);
  await waitAndClick('.ant-btn:has(svg[data-icon="import"])');
  await page.waitForTimeout(2000);
  for (const btnText of ['Next', 'Next', 'Next']) {
    await clickStepButton(btnText);
    await page.waitForTimeout(500);
  }
  await clickStepButton('Import');
  await page.waitForTimeout(3000);

  // Import survey_feedback_2026.csv
  console.log('  Uploading: survey_feedback_2026.csv');
  await uploadFileViaDragger(path.join(TEST_DATA, 'survey_feedback_2026.csv'));
  await page.waitForTimeout(2000);
  await waitAndClick('.ant-btn:has(svg[data-icon="import"])');
  await page.waitForTimeout(2000);
  for (const btnText of ['Next', 'Next', 'Next']) {
    await clickStepButton(btnText);
    await page.waitForTimeout(500);
  }
  await clickStepButton('Import');
  await page.waitForTimeout(3000);

  await ss('all-imports-complete');

  // ============ 4. DATABASE EXPLORER ============
  console.log('\n=== 4. DATABASE EXPLORER ===');
  await go('/explore');
  await page.waitForTimeout(3000);
  await ss('database-explorer');

  // Click first dataset card
  const cards = await page.locator('.ant-card, .ant-table-row').all();
  if (cards.length > 0) {
    await cards[0].click();
    await page.waitForTimeout(3000);
    await ss('table-editor');
  }

  // ============ 5. FOREIGN KEYS ============
  console.log('\n=== 5. FOREIGN KEYS ===');
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

  // Create a chart - click "Create Chart" button
  const createBtn = await page.locator('button:has-text("Create"), button:has-text("New"), a:has-text("Create")').first();
  if (await createBtn.isVisible()) {
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
  const textarea = await page.locator('textarea').first();
  if (await textarea.isVisible()) {
    await textarea.fill('Show me the average GPA by department');
    await page.waitForTimeout(500);
    await ss('ai-analysis-typed');

    // Send the question
    const sendBtn = await page.locator('button:has(svg[data-icon="send"]), button:has(svg[data-icon="arrow-up"]), button:has-text("Ask")').first();
    if (await sendBtn.isVisible()) {
      await sendBtn.click();
      await page.waitForTimeout(5000);
      await ss('ai-analysis-result');
    }
  }

  // ============ 10. SURVEYS ============
  console.log('\n=== 10. SURVEYS ===');
  await go('/surveys');
  await page.waitForTimeout(2000);
  await ss('survey-list');

  // Create a survey
  const newSurveyBtn = await page.locator('button:has-text("Create"), button:has-text("New")').first();
  if (await newSurveyBtn.isVisible()) {
    await newSurveyBtn.click();
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

  // Switch to French
  await setLang('fr');
  await go('/settings');
  await page.waitForTimeout(2000);
  await ss('settings-french');

  // ============ 16. THEMES ============
  console.log('\n=== 16. THEMES ===');
  await setTheme('dark', 'forest');
  await setLang('en');
  await go('/dashboard');
  await page.waitForTimeout(3000);
  await ss('theme-dark-forest');

  await setTheme('dark', 'sunset');
  await go('/dashboard');
  await page.waitForTimeout(2000);
  await ss('theme-dark-sunset');

  await setTheme('light', 'ocean');
  await go('/settings');
  await page.waitForTimeout(2000);
  await ss('settings-theme-options');

  // ============ 17. FRENCH VERSION ============
  console.log('\n=== 17. FRENCH ===');
  await setLang('fr');
  await setTheme('light', 'ocean');
  await go('/dashboard');
  await page.waitForTimeout(3000);
  await ss('dashboard-french');

  await go('/');
  await page.waitForTimeout(2000);
  await ss('landing-page-french');

  // ============ 18. NOTIFICATIONS ============
  console.log('\n=== 18. NOTIFICATIONS ===');
  await setLang('en');
  await setTheme('light', 'ocean');
  await go('/dashboard');
  await page.waitForTimeout(2000);
  // Try clicking the bell icon
  const bellBtns = await page.locator('.ant-badge button, .ant-badge span[role="img"], button:has(.ant-badge)').all();
  for (const btn of bellBtns) {
    try {
      await btn.click();
      await page.waitForTimeout(1500);
      break;
    } catch(e) {}
  }
  await ss('notifications-popup');

  // ============ 19. DOCS ============
  console.log('\n=== 19. DOCS ===');
  await go('/docs');
  await page.waitForTimeout(2000);
  await ss('docs-page');

  // ============ 20. CLIENT PORTAL ============
  console.log('\n=== 20. CLIENT PORTAL ===');
  // Login as client
  await page.evaluate(() => localStorage.clear());
  await go('/login');
  await page.waitForTimeout(1000);

  // Switch to client login tab
  const clientTab = await page.locator('.ant-segmented-item:last-child, .ant-tabs-tab:last-child, button:has-text("Client")').first();
  if (await clientTab.isVisible()) {
    await clientTab.click();
    await page.waitForTimeout(1000);
  }
  await ss('login-client-tab');

  // Login
  const usernameInput = await page.locator('input[type="text"], input:not([type="email"]):not([type="password"])').first();
  if (await usernameInput.isVisible()) {
    await usernameInput.fill('ahmed.benali');
    await page.fill('input[type="password"]', '12345678');
    await waitAndClick('button[type="submit"], .ant-btn-primary');
    await page.waitForTimeout(3000);
  }
  await ss('client-portal');

  // ============ 21. PUBLIC DASHBOARD ============
  console.log('\n=== 21. PUBLIC ===');
  await page.evaluate(() => localStorage.clear());
  await go('/public');
  await page.waitForTimeout(3000);
  await ss('public-dashboard');

  // ============ 22. CREATE CHARTS VIA API (for pre-populated dashboards) ============
  console.log('\n=== 22. PREPARING CHARTS ===');
  // Login to get token
  const resp = await page.request.post('http://localhost:5000/api/auth/login', {
    data: { email: 'admin@iset-tozeur.tn', password: 'Admin@123!' }
  });
  const token = (await resp.json()).token;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Get datasets
  const dsResp = await page.request.get('http://localhost:5000/api/datasets', { headers });
  const datasets = (await dsResp.json()).data || [];

  // Create charts for each dataset
  for (const ds of datasets) {
    if (!ds.table_name || ds.status !== 'imported') continue;
    const schemaR = await page.request.get(`http://localhost:5000/api/datasets/${ds.id}/schema`, { headers });
    const schema = (await schemaR.json()).data || [];
    const cols = schema.map(c => c.column_name).filter(Boolean);
    if (cols.length < 2) continue;

    const types = ['bar', 'line', 'pie', 'doughnut', 'horizontalBar', 'polarArea'];
    const chartType = types[Math.min(datasets.indexOf(ds), types.length - 1)];
    await page.request.post('http://localhost:5000/api/charts', { headers, data: {
      title: `${ds.name} - ${cols[0]} by ${cols[1] || 'count'}`,
      chartType, datasetId: ds.id,
      config: { xColumn: cols[0], yColumn: cols[1] || cols[0], aggregation: cols[1] ? 'AVG' : 'COUNT' }
    }});
  }

  // Create a dashboard
  const chartsR = await page.request.get('http://localhost:5000/api/charts', { headers });
  const charts = (await chartsR.json()).data || [];
  if (charts.length > 0) {
    const dashR = await page.request.post('http://localhost:5000/api/dashboards', { headers, data: {
      title: 'ISET Tozeur Performance Dashboard',
      description: 'Academic performance, employment outcomes, and institutional KPIs'
    }});
    const dashData = await dashR.json();
    if (dashData.data?.id) {
      const layout = charts.slice(0, 8).map((c, i) => ({
        chartId: c.id, x: (i % 2) * 6, y: Math.floor(i / 2) * 5, w: 6, h: 5
      }));
      await page.request.put(`http://localhost:5000/api/dashboards/${dashData.data.id}`, { headers, data: { layout, isPublic: true } });

      // Create second dashboard
      const dashR2 = await page.request.post('http://localhost:5000/api/dashboards', { headers, data: {
        title: 'Alumni Employment Dashboard',
        description: 'Graduate career outcomes and employer partnerships'
      }});
      const dashData2 = await dashR2.json();
      if (dashData2.data?.id) {
        const layout2 = charts.slice(4, 10).map((c, i) => ({
          chartId: c.id, x: (i % 2) * 6, y: Math.floor(i / 2) * 5, w: 6, h: 5
        }));
        await page.request.put(`http://localhost:5000/api/dashboards/${dashData2.data.id}`, { headers, data: { layout: layout2, isPublic: true } });
      }
    }
  }

  // Create a survey
  await page.request.post('http://localhost:5000/api/surveys', { headers, data: {
    title: 'Graduate Employment Survey 2026',
    description: 'Help us track your professional integration after graduation',
    goal: 'Collect employment outcomes from ISET Tozeur graduates',
    schema: { title: 'Graduate Employment Survey 2026', description: 'Track professional integration',
      fields: [
        { id: 'f1', type: 'text', label: 'Full Name', required: true },
        { id: 'f2', type: 'email', label: 'Email', required: true },
        { id: 'f3', type: 'select', label: 'Employment Status', required: true, options: ['Employed','Unemployed','Self-employed','Further Study'] },
        { id: 'f4', type: 'text', label: 'Employer', required: false },
        { id: 'f5', type: 'number', label: 'Monthly Salary (TND)', required: false },
        { id: 'f6', type: 'radio', label: 'Job Related to Degree?', required: true, options: ['Yes','Partially','No'] },
        { id: 'f7', type: 'rating', label: 'Overall Satisfaction', required: true },
        { id: 'f8', type: 'textarea', label: 'Additional Comments', required: false }
      ]},
    isPublic: true, clientTypes: ['student','alumni']
  }});

  // Create reports
  await page.request.post('http://localhost:5000/api/reports/generate', { headers, data: {
    title: 'Graduate Performance Analysis 2026',
    reportType: 'performance', datasetId: datasets[0]?.id, clientId: null,
    content: '# Graduate Performance Analysis\n\n## Summary\n\nThis report analyses the academic performance outcomes at ISET Tozeur.\n\n## Key Findings\n\n- **85%** of graduates found employment within 6 months\n- **Average salary**: 1,200 TND/month\n- **Top sectors**: IT (35%), Finance (25%), Education (20%)\n- **92%** work in fields related to their degree\n\n## Recommendations\n\n1. Strengthen industry partnerships in IT\n2. Offer more entrepreneurship training\n3. Improve alumni tracking through regular surveys'
  }});

  // ============ 23. FINAL DASHBOARD WITH CHARTS ============
  console.log('\n=== 23. FINAL SCREENSHOTS ===');
  await page.evaluate(() => localStorage.clear());
  await setLang('en');
  await setTheme('light', 'ocean');

  // Re-login
  const resp2 = await page.request.post('http://localhost:5000/api/auth/login', {
    data: { email: 'admin@iset-tozeur.tn', password: 'Admin@123!' }
  });
  const token2 = (await resp2.json()).token;
  await page.evaluate((t) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify({ id: 1, email: 'admin@iset-tozeur.tn', fullName: 'Super Administrator', role: 'super_admin', userType: 'staff' }));
    localStorage.setItem('i18n_lang', 'en');
    localStorage.setItem('obs-theme', 'light');
    localStorage.setItem('obs-color-scheme', 'ocean');
  }, token2);

  await go('/dashboard');
  await page.waitForTimeout(3000);
  await ss('admin-dashboard-with-data');

  await go('/dashboards');
  await page.waitForTimeout(3000);
  await ss('dashboards-with-charts');

  // Open first dashboard
  const dashCards = await page.locator('.ant-card').all();
  if (dashCards.length > 0) {
    await dashCards[0].click();
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

  // Public dashboard view
  await page.evaluate(() => localStorage.clear());
  await go('/public');
  await page.waitForTimeout(3000);
  await ss('public-dashboard-with-data');

  // French dashboard
  await setLang('fr');
  await page.evaluate((t) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify({ id: 1, email: 'admin@iset-tozeur.tn', fullName: 'Super Administrator', role: 'super_admin', userType: 'staff' }));
    localStorage.setItem('obs-theme', 'light');
    localStorage.setItem('obs-color-scheme', 'ocean');
  }, token2);
  await go('/dashboard');
  await page.waitForTimeout(3000);
  await ss('dashboard-french-with-data');

  console.log(`\n=== COMPLETE: ${ssIndex} screenshots ===`);
  await browser.close();
})();
