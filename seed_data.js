const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: '/tmp/pw-browsers/chromium-1223/chrome-linux64/chrome' });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // Login
  const resp = await page.request.post('http://localhost:5000/api/auth/login', {
    data: { email: 'admin@iset-tozeur.tn', password: 'Admin@123!' }
  });
  const { token } = await resp.json();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  console.log('Logged in');

  // Import test data CSVs
  const files = [
    ['alumni_employment.csv', 'alumni'],
    ['courses_results.csv', 'courses'],
    ['departments.csv', 'departments'],
    ['survey_feedback_2026.csv', 'survey_feedback'],
    ['employer_partners.csv', 'employers']
  ];

  for (const [file, tableName] of files) {
    const fileBuffer = fs.readFileSync(path.join('test-data', 'raw', file));
    const upResp = await page.request.post('http://localhost:5000/api/datasets/upload', {
      headers: { Authorization: `Bearer ${token}` },
      multipart: { file: { name: file, mimeType: 'text/csv', buffer: fileBuffer } }
    });
    const upData = await upResp.json();
    const dsId = upData.data.id;

    const pvResp = await page.request.get(`http://localhost:5000/api/datasets/${dsId}/preview`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const pvData = await pvResp.json();
    const headersList = pvData.data.headers;

    const columns = headersList.map(h => ({
      originalHeader: h,
      columnName: h.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase().replace(/^_+/, ''),
      columnType: 'TEXT'
    }));

    const imResp = await page.request.post(`http://localhost:5000/api/datasets/${dsId}/import`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { tableName, columns }
    });
    const imData = await imResp.json();
    console.log(`  ${file} -> ${tableName}: ${imData.success ? 'OK' : 'FAIL'} ${imData.data?.rowCount || ''} rows`);
  }

  // Get all datasets
  const dsResp = await page.request.get('http://localhost:5000/api/datasets', { headers });
  const datasets = (await dsResp.json()).data || [];
  console.log(`\nDatasets available: ${datasets.length}`);

  // Create charts for each dataset
  for (const ds of datasets) {
    const tableName = ds.table_name;
    if (!tableName) continue;

    const schemaResp = await page.request.get(`http://localhost:5000/api/datasets/${ds.id}/schema`, { headers });
    const schema = (await schemaResp.json()).data || [];
    const cols = schema.map(c => c.column_name).filter(Boolean);

    if (cols.length < 2) continue;

    for (let i = 0; i < Math.min(2, cols.length - 1); i++) {
      const xCol = cols[0];
      const yCol = cols[i + 1];

      // Create bar chart
      const chartResp = await page.request.post('http://localhost:5000/api/charts', {
        headers,
        data: {
          title: `${ds.name} - ${xCol} by ${yCol}`,
          chartType: 'bar',
          datasetId: ds.id,
          config: {
            xColumn: xCol,
            yColumn: yCol,
            aggregation: 'COUNT',
            showLegend: true,
            showGrid: true,
            colorScheme: 'ocean'
          }
        }
      });
      if ((await chartResp.json()).success) {
        console.log(`  Chart: ${ds.name} - bar`);
      }
    }
  }

  // Create a dashboard then update it with layout and publish it
  const chartsResp = await page.request.get('http://localhost:5000/api/charts', { headers });
  const charts = (await chartsResp.json()).data || [];
  console.log(`Charts available: ${charts.length}`);

  if (charts.length > 0) {
    // First create dashboard (no layout/is_public in create)
    const createResp = await page.request.post('http://localhost:5000/api/dashboards', {
      headers,
      data: {
        title: 'Graduate Employment Overview',
        description: 'Dashboard showcasing alumni employment trends, course results, and survey feedback'
      }
    });
    const dashData = await createResp.json();
    console.log('  Dashboard created, id:', dashData.data?.id);

    // Then update with layout and publish
    if (dashData.data?.id) {
      const layout = charts.slice(0, 6).map((c, i) => ({
        chartId: c.id,
        x: (i % 3) * 4,
        y: Math.floor(i / 3) * 4,
        w: 4,
        h: 4
      }));

      await page.request.put(`http://localhost:5000/api/dashboards/${dashData.data.id}`, {
        headers,
        data: { layout, isPublic: true }
      });
      console.log('  Dashboard updated with layout and published');
    }
  }

  // Create some clients
  const clients = [
    { cin: '12345678', username: 'ahmed.benali', fullName: 'Ahmed Ben Ali', email: 'ahmed@example.com', clientType: 'student', password: '12345678' },
    { cin: '23456789', username: 'fatma.bouazizi', fullName: 'Fatma Bouazizi', email: 'fatma@example.com', clientType: 'alumni', password: '23456789' },
    { cin: '34567890', username: 'mohamed.tlili', fullName: 'Mohamed Tlili', email: 'mohamed@example.com', clientType: 'student', password: '34567890' },
    { cin: '45678901', username: 'sarra.khemiri', fullName: 'Sarra Khemiri', email: 'sarra@example.com', clientType: 'alumni', password: '45678901' },
    { cin: '56789012', username: 'youssef.hamdi', fullName: 'Youssef Hamdi', email: 'youssef@example.com', clientType: 'teacher', password: '56789012' }
  ];

  for (const client of clients) {
    await page.request.post('http://localhost:5000/api/clients', { headers, data: client });
  }
  console.log('  Clients created');

  // Create a survey
  const surveyResp = await page.request.post('http://localhost:5000/api/surveys', {
    headers,
    data: {
      title: 'Graduate Employment Survey 2026',
      description: 'Help us track your professional integration',
      goal: 'Collect employment status, salary, and satisfaction data from ISET Tozeur graduates',
      schema: {
        title: 'Graduate Employment Survey 2026',
        description: 'Help us track your professional integration after graduation',
        fields: [
          { id: 'f1', type: 'text', label: 'Full Name', required: true },
          { id: 'f2', type: 'email', label: 'Email Address', required: true },
          { id: 'f3', type: 'text', label: 'Phone Number', required: false },
          { id: 'f4', type: 'select', label: 'Employment Status', required: true, options: ['Employed', 'Unemployed', 'Self-employed', 'Further Study', 'Other'] },
          { id: 'f5', type: 'text', label: 'Employer Name', required: false },
          { id: 'f6', type: 'text', label: 'Job Title', required: false },
          { id: 'f7', type: 'number', label: 'Monthly Salary (TND)', required: false },
          { id: 'f8', type: 'radio', label: 'Job Related to Your Degree?', required: true, options: ['Yes', 'Partially', 'No'] },
          { id: 'f9', type: 'rating', label: 'How satisfied are you with your current situation?', required: true },
          { id: 'f10', type: 'textarea', label: 'Additional Comments', required: false }
        ]
      },
      isPublic: true,
      clientTypes: ['student', 'alumni']
    }
  });
  const surveyData = await surveyResp.json();
  console.log(`  Survey created: ${surveyData.data?.id || 'OK'}`);

  // Create some notifications
  for (let i = 0; i < 3; i++) {
    await page.request.post('http://localhost:5000/api/notifications', {
      headers,
      data: {
        title: ['New dataset imported', 'Report generated', 'Survey published'][i],
        message: ['Courses results data has been imported successfully with 200 rows.', 'Graduate Employment Report 2026 has been generated by AI.', 'Employment survey is now live and accepting responses.'][i],
        type: ['success', 'info', 'warning'][i],
        user_id: 1
      }
    });
  }
  console.log('  Notifications created');

  // Generate an AI report
  const datasetsForReport = datasets.filter(d => d.table_name);
  if (datasetsForReport.length > 0 && clients.length > 0) {
    const clientListResp = await page.request.get('http://localhost:5000/api/clients', { headers });
    const clientList = (await clientListResp.json()).data || [];
    if (clientList.length > 0) {
      await page.request.post('http://localhost:5000/api/reports/generate', {
        headers,
        data: {
          title: 'Graduate Performance Analysis 2026',
          reportType: 'performance',
          clientId: clientList[0].id,
          datasetId: datasetsForReport[0].id,
          content: '# Graduate Performance Analysis\n\n## Summary\n\nThis report analyses the academic performance and employment outcomes of ISET Tozeur graduates.\n\n## Key Findings\n\n- **85%** of graduates found employment within 6 months\n- **Average salary**: 1,200 TND/month\n- **Top sectors**: IT (35%), Finance (25%), Education (20%)\n- **92%** of employed graduates work in fields related to their degree\n\n## Recommendations\n\n1. Strengthen industry partnerships in the IT sector\n2. Offer more entrepreneurship training programmes\n3. Improve alumni tracking through regular surveys\n4. Develop targeted career counselling for final-year students'
        }
      });
      console.log('  AI Report generated');
    }
  }

  console.log('\nSeed data complete!');
  await browser.close();
})();
