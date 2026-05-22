const { chromium } = require('playwright');
const path = require('path');
const RES = path.join(__dirname, 'report', 'res');
const CHROME = '/tmp/pw-browsers/chromium-1223/chrome-linux64/chrome';

let browser, page;

async function ss(name) {
  await page.screenshot({ path: path.join(RES, name), fullPage: false, type: 'png' });
  console.log(`  ✓ ${name}`);
}

async function go(url) {
  await page.goto('http://localhost:5173' + url, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2000);
}

async function setLang(lang) {
  await page.evaluate((l) => { localStorage.setItem('i18n_lang', l); }, lang);
}

async function setAuth(token) {
  await page.evaluate((t) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify({
      id: 1, email: 'admin@iset-tozeur.tn', fullName: 'Super Administrator',
      role: 'super_admin', userType: 'staff'
    }));
  }, token);
}

(async () => {
  browser = await chromium.launch({ headless: true, executablePath: CHROME });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  page = await ctx.newPage();

  const resp = await page.request.post('http://localhost:5000/api/auth/login', {
    data: { email: 'admin@iset-tozeur.tn', password: 'Admin@123!' }
  });
  const { token } = await resp.json();

  // ============ ENGLISH SCREENSHOTS ============
  console.log('--- English screenshots ---');

  // 1. Landing page
  await go('/');
  await setLang('en');
  await go('/');
  await ss('figure-01-landing-page-en.png');

  // 2. Login page
  await go('/login');
  await ss('figure-02-login-page-en.png');

  // Set auth
  await setAuth(token);
  await setLang('en');

  // 3. Admin dashboard
  await go('/dashboard');
  await ss('figure-03-admin-dashboard-en.png');

  // 4. Data import - upload page
  await go('/import');
  await ss('figure-04-data-import-upload-en.png');

  // 5. Database explorer (list of datasets)
  await go('/explore');
  await ss('figure-05-database-explorer-en.png');

  // 6. Table editor - click first dataset card
  const cards = await page.locator('.ant-card').all();
  if (cards.length > 0) {
    await cards[0].click();
    await page.waitForTimeout(3000);
    await ss('figure-37-table-editor-en.png');
  }

  // 7. AI Analysis
  await go('/ai');
  await ss('figure-06-ai-analysis-en.png');

  // 8. Chart builder
  await go('/charts');
  await ss('figure-07-chart-builder-en.png');

  // 9. Dashboard canvas
  await go('/dashboards');
  await ss('figure-08-dashboard-canvas-en.png');

  // 10. Survey generator
  await go('/surveys');
  await ss('figure-09-survey-generator-en.png');

  // 11. User management
  await go('/users');
  await ss('figure-10-user-management-en.png');

  // 12. Role management
  await go('/roles');
  await ss('figure-11-role-management-en.png');

  // 13. Client management
  await go('/clients');
  await ss('figure-12-client-management-en.png');

  // 14. Reports page
  await go('/reports');
  await ss('figure-13-reports-page-en.png');

  // 15. Foreign key manager
  await go('/relations');
  await ss('figure-14-foreign-keys-en.png');

  // 16. Saved queries
  await go('/queries');
  await ss('figure-15-saved-queries-en.png');

  // 17. Settings
  await go('/settings');
  await ss('figure-16-settings-en.png');

  // 18. Client portal
  await go('/portal');
  await ss('figure-17-client-portal-en.png');

  // 19. Public dashboard
  await go('/public');
  await ss('figure-18-public-dashboard-en.png');

  // 20. Docs page
  await go('/docs');
  await ss('figure-19-docs-page-en.png');

  // ============ THEME SCREENSHOTS ============
  console.log('\n--- Theme screenshots ---');

  await page.evaluate(() => {
    localStorage.setItem('obs-color-scheme', 'forest');
    localStorage.setItem('obs-theme', 'dark');
  });
  await go('/dashboard');
  await ss('figure-20-theme-forest-en.png');

  await page.evaluate(() => { localStorage.setItem('obs-color-scheme', 'sunset'); });
  await go('/dashboard');
  await ss('figure-21-theme-sunset-en.png');

  await page.evaluate(() => { localStorage.setItem('obs-color-scheme', 'lavender'); });
  await go('/dashboard');
  await ss('figure-22-theme-lavender-en.png');

  await page.evaluate(() => { localStorage.setItem('obs-color-scheme', 'crimson'); });
  await go('/dashboard');
  await ss('figure-23-theme-crimson-en.png');

  await page.evaluate(() => {
    localStorage.setItem('obs-theme', 'light');
    localStorage.setItem('obs-color-scheme', 'ocean');
  });
  await go('/');
  await ss('figure-24-landing-light-en.png');

  await go('/settings');
  await ss('figure-25-settings-theme-en.png');

  // ============ FRENCH SCREENSHOTS ============
  console.log('\n--- French screenshots ---');
  await setLang('fr');
  await page.evaluate(() => {
    localStorage.setItem('obs-theme', 'dark');
    localStorage.setItem('obs-color-scheme', 'ocean');
  });

  await go('/dashboard');
  await ss('figure-26-dashboard-fr.png');

  await go('/settings');
  await ss('figure-27-settings-fr.png');

  await go('/');
  await ss('figure-28-landing-fr.png');

  // ============ CLIENT FUNCTIONALITY ============
  console.log('\n--- Client functionality ---');

  await page.evaluate(() => localStorage.clear());
  await go('/login');

  await page.evaluate(() => {
    const seg = document.querySelector('.ant-segmented-item:last-child');
    if (seg) seg.click();
  });
  await page.waitForTimeout(1000);
  await ss('figure-29-login-client-tab-en.png');

  const clientResp = await page.request.post('http://localhost:5000/api/auth/client-login', {
    data: { username: 'ahmed.benali', password: '12345678' }
  });
  const clientData = await clientResp.json();
  if (clientData.token) {
    await setLang('en');
    await page.evaluate((t) => {
      localStorage.setItem('token', t);
      localStorage.setItem('user', JSON.stringify({
        id: 1, email: 'ahmed@example.com', fullName: 'Ahmed Ben Ali',
        role: 'student', userType: 'client', cin: '12345678', username: 'ahmed.benali'
      }));
    }, clientData.token);
    await go('/portal');
    await ss('figure-30-client-portal-auth-en.png');
  }

  // ============ VISUALIZATIONS & GRAPHS ============
  console.log('\n--- Visualizations ---');

  await setAuth(token);
  await setLang('en');

  // Dashboard with charts
  await go('/dashboards');
  await ss('figure-31-dashboard-with-charts-en.png');

  // Charts library
  await go('/charts');
  await ss('figure-32-charts-library-en.png');

  // Foreign keys ER visualization
  await go('/relations');
  await ss('figure-33-foreign-keys-er-en.png');

  // Public survey - find the survey ID
  const surveysResp = await page.request.get('http://localhost:5000/api/surveys', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const surveysData = await surveysResp.json();
  const surveyId = surveysData.data?.[0]?.id;
  if (surveyId) {
    await go(`/public/surveys/${surveyId}`);
    await ss('figure-34-public-survey-en.png');
  } else {
    console.log('  ✗ No survey found for public view');
  }

  // Reports with content
  await go('/reports');
  await ss('figure-35-reports-with-content-en.png');

  // Notifications popover
  await go('/dashboard');
  await page.evaluate(() => {
    const bells = document.querySelectorAll('.ant-btn');
    for (const b of bells) {
      if (b.querySelector('.ant-badge') || b.closest('.ant-badge')) {
        b.click();
        return;
      }
    }
  });
  await page.waitForTimeout(1500);
  await ss('figure-36-notifications-en.png');

  // AI analysis detail with content
  await go('/ai');
  await ss('figure-38-ai-analysis-detail-en.png');

  console.log('\n=== ALL SCREENSHOTS COMPLETE ===');
  await browser.close();
})();
